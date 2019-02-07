var AEMM = require('../aemm');
var assert = require('assert');

var fs = require('fs');
var fsobject = require('../api/fsobject');
var path = require('path');
var child_process = require('child_process');
var https = require('https');

/**
 * CardTemplate class constructor
 * @constructor
 */
function Article() {}

Article.prototype = Object.create(AEMM.Entity.prototype);
Article.prototype.constructor = Article;

Article.prototype.buildArticle = function(body) {
    return new Promise(function(resolve, reject){
        iterateArticleDirectory(body.article.src)
            .then(function(files){
                return new Promise(function(resolve, reject){
                    if(body.article.generateManifest == undefined || body.article.generateManifest == true) {
                        var writeStream = fs.createWriteStream(path.join(body.article.src, 'manifest.xml'));
                        writeStream.on('error', reject);
                        writeStream.on('close', resolve);
                        writeStream.on('finish', function(){});

                        writeStream.write('<manifest version="' + (body.article.viewerVersion || '3.0.0') + '" targetViewer="' + (body.article.targetViewer || '33.0.0') + '" dateModified="' + new Date().toISOString() + '">\n');
                        fsobject.stat(path.join(body.article.src, "index.html"))
                            .then(writeStream.write.bind(writeStream, '\t<index type="text/html" href="index.html"></index>\n'))
                            .catch(function(error){
                                return fsobject.stat(path.join(body.article.src, "article.xml"))
                                    .then(function(){writeStream.write('\t<index type="text/xml" href="article.xml"></index>\n')})
                                    .catch(reject);
                            })
                            .then(function(){
                                writeStream.write('\t<resources>\n');
                                files.forEach(function(file){
                                    writeStream.write('\t\t<resource type="' + file['type'] + '" href="' + path.relative(body.article.src, file['href']) + '" length="' + file['length'] + '" md5="' + file['md5'] + '"></resource>\n');
                                });
                                writeStream.end("\t</resources>\n</manifest>");
                            });
                    }
                });
            })
            .then(function(){
                var folder = path.relative(path.join(body.article.src, "../"), body.article.src);
                var command = 'zip -FSr ../' + folder + '.article .';
                if(body.article.deleteSourceDir) command += " && rm -rf ../" + folder; // delete source directory
                return execute(command, {cwd: body.article.src, maxBuffer: 1024 * 500});
            })
            .then(function(stdout){
                if(!body.article.deleteSourceDir && (body.article.generateManifest == undefined || body.article.generateManifest == true)) { // delete manifest
                    fsobject.unlink(path.join(body.article.src, "manifest.xml"));
                }
                body.article.path = path.join(body.article.src, '../', path.relative(path.join(body.article.src, "../"), body.article.src) + '.article');
                resolve(body);
            })
            .catch(reject);
    });
};

Article.prototype.requestManifest = function(data) {
    return new Promise(function(resolve, reject){
        AEMM.Entity.prototype.requestEntity.call(null, data)
            .then(function(response){
                var matches = AEMM.matchContentUrl(response.req.path);
                var tmp = AEMM.tmpDir(path.join(matches[1], matches[3], matches[4]));
                var url = path.join(tmp, 'manifest.json');
                var writeStream = fs.createWriteStream(url);
                response.pipe(writeStream);
                writeStream.on('error', reject);
                response.on('end', function(){writeStream.end()});
                writeStream.on('finish', function(){
                    data['contentUrl'] = url;
                    resolve(data);
                });
            }).catch(reject);
    });
};

Article.prototype.uploadArticle = function(data) {
    return new Promise(function(resolve, reject){
        var request = https.request({
            hostname: 'ings.publish.adobe.io',
            path: '/publication/' + data.schema.publicationId + '/article/' + data.schema.entityName + ';version=' + data.schema.version + '/contents/' + (data.article.rendition || 'folio'),
            method: 'PUT',
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/vnd.adobe.article+zip',
                'authorization': AEMM.authentication.getToken().token_type + ' ' + AEMM.authentication.getToken().access_token,
                'x-dps-client-request-id': AEMM.genUUID(),
                'x-dps-client-session-id': data.sessionId || (data.sessionId = AEMM.genUUID()),
                'x-dps-api-key': AEMM.authentication.getCredentials().clientId,
                'x-dps-client-version': AEMM.authentication.getCredentials().clientVersion
            }
        }, function(response){
            var buffers = [];
            response.on('data', buffers.push.bind(buffers));
            response.on('end', function(){
                data.aspect = "ingestion";
                data.workflow = JSON.parse(Buffer.concat(buffers).toString());
                resolve(data);
            });
        }).on('error', reject);
        var readStream = fs.ReadStream(data.article.path);
        readStream.on('error', reject);
        readStream.on('close', function(){request.end()});
        readStream.pipe(request);
    });
};

/**
 * path for sharedContent: ../sharedContentEntityName
 * @param data Expects sharedContent property on the parameter, and is obatined by updated contentUrl from sealed sharedContent entity (part of the response)
 * @returns {Promise}
 */
Article.prototype.linkSharedContent = function(data) {
    return new Promise(function(resolve, reject){
        https.request({
            method: 'PUT',
            hostname: 'pecs.publish.adobe.io',
            path: data.schema._links.contentUrl.href + AEMM.matchContentUrl(data.sharedContent.href)[4], // contentUrl + sharedContent entityName
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/vnd.adobe.symboliclink+json',
                'authorization': AEMM.authentication.getToken().token_type + ' ' + AEMM.authentication.getToken().access_token,
                'x-dps-client-request-id': AEMM.genUUID(),
                'x-dps-client-session-id': data.sessionId || (data.sessionId = AEMM.genUUID()),
                'x-dps-upload-id': data.uploadId || (data.uploadId = AEMM.genUUID()),
                'x-dps-api-key': AEMM.authentication.getCredentials().clientId,
                'x-dps-client-version': AEMM.authentication.getCredentials().clientVersion
            }
        }, function(response){
            var buffers = [];
            response.on('data', buffers.push.bind(buffers));
            response.on('end', function(){
                response.statusCode == 200 ? resolve(data) : reject(JSON.parse(Buffer.concat(buffers).toString()));
            });
        }).on('error', reject).end(JSON.stringify(data.sharedContent));
    });
};

/**
 * Monitor upload progress for the article zip file
 * @param data
 */
Article.prototype.addStatusObserver = function(data) {
    return AEMM.observer.addStatusObserver(data);
};

/**
 * Iterate a directory and determining md5, type, path and size for each file
 * @param dir path to the directory
 * @returns [{md5: String, type: String, href: String, length: Number}]
 */
function iterateArticleDirectory(dir) {
    return fsobject.listdir(dir)
        .then(function(files){ // excludes hidden, no-extension, user provided manifest.xml, .zip, .article
            var i = files.length;
            while(i--) {
                if((/(^|\/)\.[^\/\.]/g).test(files[i]) || /[^.]+$/.exec(files[i]).index == 0 || path.relative(dir, files[i]).toLowerCase() == "manifest.xml") {
                    files.splice(i, 1);
                    if((/(^|\/)\.[^\/\.]/g).test(files[i])) fs.unlink(files[i]); // delete hidden
                }
            }
            return Promise.all(files.map(function(file){
                return parseFile(file);
            }));
        });
}

function parseFile(file) {
    return new Promise(function(resolve, reject){
        Promise.all([fsobject.md5(file), fsobject.stat(file)]).then(function(result){
            resolve({md5: result[0], type: AEMM.mimetypes[path.extname(file).substr(1)], href: file, length: result[1].size});
        });
    });
}

function execute(command, options) {
    return new Promise(function(resolve, reject){
        child_process.exec(command, options, function(error, stdout, stderr){
            error ? reject(error) : (stderr != '' ? reject(stderr) : resolve(stdout.trim()));
        });
    });
}

Article.TYPE = 'article';

AEMM.Article = Article;