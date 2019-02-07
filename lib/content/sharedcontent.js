var AEMM = require("../aemm");

var fs = require('fs');
var path = require('path');
var fsobject = require('../../lib/api/fsobject');

/**
 * SharedContent class constructor
 * @constructor
 */
function SharedContent() {}

SharedContent.prototype = Object.create(AEMM.Entity.prototype);
SharedContent.prototype.constructor = SharedContent;

SharedContent.prototype.requestSharedContent = function(data) {
    return new Promise(function(resolve, reject){
        AEMM.Entity.prototype.requestEntity.call(this, data)
            .then(function(response){
                var buffers = [];
                response.on('data', buffers.push.bind(buffers));
                response.on('end', function(){
                    data.contentUrl = JSON.parse(Buffer.concat(buffers).toString());
                    resolve(data);
                });
            }).catch(reject);
    });
};

/**
 * Upload Shared Content assets
 * @param data Expects sharedContents property pointing to full path to the resources directory
 * @returns {Promise}
 */
SharedContent.prototype.uploadSharedContent = function(data) {
    return new Promise(function(resolve, reject){
        SharedContent.listdir.call(null, data.sharedContents)
            .then(function(result){
                Promise.all(result.map(function(sharedContent){
                    var temp = {schema: data.schema, upload: sharedContent, sessionId: data.sessionId, uploadId: data.uploadId || (data.uploadId = AEMM.genUUID())};
                    return AEMM.Entity.prototype.uploadFile.call(null, temp);
                })).then(function(){
                    resolve(data);
                }).catch(reject);
            }).catch(reject);
    });
};

/**
 * Download files for sharedContent resources
 * @param data Expects contentUrl property as an array on the parameter, each having href property as the subpath
 * @returns {Promise} Resolves to an object with files property having full paths to the temp location
 */
SharedContent.prototype.downloadSharedContent = function(data) {
    return new Promise(function(resolve, reject){
        data.files = [];
        Promise.all(data.contentUrl.map(function(item) {
            var temp = {schema: data.schema, path: item.href};
            return AEMM.Entity.prototype.requestEntity.call(null, temp)
                .then(function(response){
                    return new Promise(function(resolve, reject){
                        var matches = AEMM.matchContentUrlPath(response.req.path); // 1 pubId, 3, entityType , 4, entityName 5. version 6. subpath 7. filename
                        var tmp = AEMM.tmpDir(path.join(matches[1], matches[3], matches[4], matches[6])); // pubId/entityType/entityName/subpath
                        var url = path.join(tmp, matches[7]);
                        var writeStream = fs.createWriteStream(url);
                        response.pipe(writeStream);
                        writeStream.on('error', reject);
                        response.on('end', function(){writeStream.end()});
                        writeStream.on('finish', function(){
                            data.files.push(url);
                            resolve(url);
                        });
                    });
                })
        })).then(function(){
            resolve(data);
        }).catch(reject);
    });
};

/**
 * returns {file: path-to-file, path: subpath} for each file
 * @param dir
 * @returns {Promise.<TResult>|*}
 */
SharedContent.listdir = function(dir) {
    return fsobject.listdir(dir)
        .then(function(data){
            var parent = path.join(dir, "../");
            return data.map(function(file){
                return {file: file, path: path.relative(parent, file)};
            });
        });
};

SharedContent.TYPE = "SharedContent";

AEMM.SharedContent = SharedContent;