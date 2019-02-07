var AEMM = require('../aemm');
const https = require('https');
const fs = require('fs');
const path = require('path');

const topLevel = ['defaultCardTemplate', 'defaultLayout', 'topLevelContent', 'topLevelPhoneContent', 'topLevelTabletContent'];

/**
 * Entity constructor
 * @constructor
 */
function Entity() {}

/**
 * requestList and then requestMetadata for each item
 * @param data
 * @returns {Promise<T>|Promise}
 */
Entity.prototype.requestCatalog = function(data) {
    return new Promise(function(resolve, reject){
        data.sessionId = data.sessionId || AEMM.genUUID();
        Entity.prototype.requestList.call(null, data)
            .then(function(result){
                return Promise.all(result.entities.map(function(item){
                    item.sessionId = data.sessionId;
                    return Entity.prototype.requestMetadata.call(null, item);
                }));
            })
            .then(resolve, reject);
    });
};

/**
 * Request for a list of entities of the same collection type.
 * The list (pageSize) is limited to 25 entities, unless otherwise specified.
 * @param data
 * @returns {Promise}
 */
Entity.prototype.requestList = function(data) {
    return new Promise(function(resolve, reject){
        https.request({
            method: 'GET',
            hostname: 'pecs.publish.adobe.io',
            path: '/publication/' + data.schema.publicationId + '/' + (data.query ? 'entity?' + data.query : data.schema.entityType),
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/json;charset=UTF-8',
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
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? (data.entities = result, resolve(data)) : reject(result);
            });
        }).on('error', reject).end(JSON.stringify(data.schema));
    });
};

Entity.prototype.requestMetadata = function(data) {
    return new Promise(function(resolve, reject){
        https.request({
            method: 'GET',
            hostname: 'pecs.publish.adobe.io',
            path: data.href ? data.href.split(';')[0] : '/publication/' + data.schema.publicationId + '/' + data.schema.entityType + '/' + data.schema.entityName,
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/json;charset=UTF-8',
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
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? (data.schema = result, resolve(data)) : reject(result);
            });
        }).on('error', reject).end(JSON.stringify(data.schema));
    });
};

Entity.prototype.requestEntity = function(data) {
    return new Promise(function(resolve, reject){
        https.request({
            method: 'GET',
            hostname: 'pecs.publish.adobe.io',
            path: data.schema._links.contentUrl.href + (data.path || ''),
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/json;charset=UTF-8',
                'authorization': AEMM.authentication.getToken().token_type + ' ' + AEMM.authentication.getToken().access_token,
                'x-dps-client-request-id': AEMM.genUUID(),
                'x-dps-client-session-id': data.sessionId || (data.sessionId = AEMM.genUUID()),
                'x-dps-api-key': AEMM.authentication.getCredentials().clientId,
                'x-dps-client-version': AEMM.authentication.getCredentials().clientVersion
            }
        }, function(response){
            if(response.statusCode == 200) {
                resolve(response);
            } else {
                var buffers = [];
                response.on('data', buffers.push.bind(buffers));
                response.on('end', function(){reject(JSON.parse(Buffer.concat(buffers).toString()))});
            }
        }).on('error', reject).end();
    });
};

/**
 * Create (or update) the article, banner, or collection entity.
 * @param data Expects schema property on the data
 * @returns {Promise} Resolves to an object with updated property schema on successful creation
 */
Entity.prototype.create = function(data) {
    return new Promise(function(resolve, reject){
        https.request({
            method: 'PUT',
            hostname: 'pecs.publish.adobe.io',
            path: '/publication/' + data.schema.publicationId + '/' + data.schema.entityType + '/' + data.schema.entityName,
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/json;charset=UTF-8',
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
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 201 ? (data.schema = result, resolve(data)) : reject(result);
            });
        }).on('error', reject).end(JSON.stringify(data.schema));
    });
};

/**
 * Update the article, banner, or collection entity.
 * @param data all the values from the update field are posted to update the entity's schema
 * @returns {Promise}
 */
Entity.prototype.update = function(data) {
    return new Promise(function(resolve, reject){
        https.request({
            method: 'PUT',
            hostname: 'pecs.publish.adobe.io',
            path: '/publication/' + data.schema.publicationId + '/' + data.schema.entityType + '/' + data.schema.entityName + ';version=' + data.schema.version,
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/json;charset=UTF-8',
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
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? (data.schema = result, resolve(data)) : reject(result);
            });
        }).on('error', reject).end(JSON.stringify(data.schema));
    });
};

/**
 * Delete the article, banner, or collection entity.
 * @param data
 * @returns {Promise}
 */
Entity.prototype.delete = function(data) {
    return new Promise(function(resolve, reject){
        if(data.schema && topLevel.indexOf(data.schema.entityName) != -1) {resolve(data); return};
        https.request({
            method: 'DELETE',
            hostname: 'pecs.publish.adobe.io',
            path: data.href ? data.href : '/publication/' + data.schema.publicationId + '/' + data.schema.entityType + '/' + data.schema.entityName + ';version=' + data.schema.version,
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/json;charset=UTF-8',
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
                response.statusCode == 204 ? resolve() : reject(JSON.parse(Buffer.concat(buffers).toString()));
            });
        }).on('error', reject).end(JSON.stringify(data.schema));
    });
};

/**
 * Upload an file to the article, banner, or collection entity.
 * Must perform an update() with reference to this file, follow by a seal() to commit the file change.
 * @param data Expects property upload:{file: '', path: '', sizes: ''}, sizes is an optional comma separated list specifying thumbnail sizes
 * @returns {Promise} resolves empty or rejects with error
 */
Entity.prototype.uploadFile = function(data) {
    return new Promise(function(resolve, reject){
        var request = https.request({
            method: 'PUT',
            hostname: 'pecs.publish.adobe.io',
            path: data.schema._links.contentUrl.href + data.upload.path,
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'authorization': AEMM.authentication.getToken().token_type + ' ' + AEMM.authentication.getToken().access_token,
                'x-dps-client-request-id': AEMM.genUUID(),
                'x-dps-client-session-id': data.sessionId || (data.sessionId = AEMM.genUUID()),
                'x-dps-upload-id': data.uploadId || (data.uploadId = AEMM.genUUID()),
                'x-dps-image-sizes': data.upload.sizes || [],
                'x-dps-api-key': AEMM.authentication.getCredentials().clientId,
                'x-dps-client-version': AEMM.authentication.getCredentials().clientVersion
            }
        }, function(response){
            var buffers = [];
            response.on('data', buffers.push.bind(buffers));
            response.on('end', function(){
                response.statusCode == 200 ? resolve() : reject(JSON.parse(Buffer.concat(buffers).toString()));
            });
        }).on('error', reject);
        fs.createReadStream(data.upload.file)
            .on('data', function(chunk){
                if(!request._headerSent){
                    if(!AEMM.getMimeType(chunk.toString('hex', 0, 4))) {
                        console.log('magicnumber missing', data.upload.file, chunk.toString('hex', 0, 4));
                    }
                    request._headers['content-type'] = AEMM.getMimeType(chunk.toString('hex', 0, 4));
                }
                request.write(chunk);
            })
            .on('error', reject)
            .on('close', function(){request.end()});
    });
};

/**
 * Upload images specified by images array to the datum to the article, banner, or collection entity.
 * Must perform an update() with reference to this image, follow by a seal() to commit the image change.
 * Relies on uploadFile() to upload the image file.
 * @param data
 * @returns {Promise}
 */
Entity.prototype.uploadImages = function(data) {
    return new Promise(function(resolve, reject){
        Promise.all(data.images.map(function(image){ // create temp object while retaining sessionId, uploadId values for concurrent requests to uploadFile
            var temp = {schema: data.schema, upload: image, sessionId: data.sessionId, uploadId: data.uploadId || (data.uploadId = AEMM.genUUID())};
            return Entity.prototype.uploadFile.call(null, temp).then(function(meta){
                return meta || {href: 'contents/' + image.path};
            })
        })).then(function(result){
            for(var i=0; i<result.length; i++) {
                data.schema._links[data.images[i].path.split('/')[1]] = result[i];
            }
            resolve(data);
        }).catch(reject);
    });
};

Entity.prototype.downloadImages = function(data) {
    return new Promise(function(resolve, reject){
        var hrefs = [];
        Object.keys(data.schema._links).forEach(function(key){
            var types = data.schema.entityType == AEMM.Collection.TYPE ? ["thumbnail", "background", "socialSharing"] : ["thumbnail", "socialSharing"];
            if(types.indexOf(key) != -1) {
                hrefs.push(data.schema._links[key].href.match(/contents\/(.*)/)[1]);
                if(data.downSamples && data.schema._links[key].downSamples) {
                    data.schema._links[key].downSamples.forEach(function(item){
                        hrefs.push(item.href.match(/contents\/(.*)/)[1]);
                    });
                }
            }
        });
        data.images = [];
        Promise.all(hrefs.map(function(item){
            var temp = {schema: data.schema, path: item, sessionId: data.sessionId};
            return AEMM.Entity.prototype.downloadFile.call(null, temp);
        })).then(function(result){
            data.images = [];
            result.forEach(function(item){
                data.images.push(item.file);
            });
            resolve(data);
        }).catch(reject);
    });
};

Entity.prototype.downloadFile = function(data) {
    return new Promise(function(resolve, reject){
        AEMM.Entity.prototype.requestEntity.call(this, data)
            .then(function(response){
                var matches = AEMM.matchContentUrlPath(response.req.path); // 1. pubId, 3. entityType, 4. entityName 5. version 6. subpath 7. filename
                var tmp = AEMM.tmpDir(path.join(matches[1], matches[3], matches[4], matches[6]));
                var url = path.join(tmp, matches[7].replace('?', '_'));
                var writeStream;
                response.on('data', function(chunk){
                    if(writeStream == null) {
                        url += '.' + AEMM.getExtension(chunk.toString('hex', 0, 4));
                        writeStream = fs.createWriteStream(url);
                        writeStream.on('error', reject);
                        writeStream.on('finish', function(){
                            data.file = url;
                            resolve(data);
                        });
                    }
                    writeStream.write(chunk);
                });
                response.on('end', function(){writeStream.end()});
            })
            .catch(reject);
    });
};

Entity.prototype.fileExists = function(data) {
    return new Promise(function(resolve, reject){
        var url = path.join(AEMM.tmpDir(), data.schema.publicationId, data.schema.entityType, data.schema.entityName, data.path.replace('?', '_'));
        fsobject.stat(url).then(function(){
            resolve(url);
        }, reject);
    });
};

/**
 * Seal the article, banner, or collection entity.
 * This is necessary after an image file upload, to commit the changes.
 * @param data
 * @returns {Promise}
 */
Entity.prototype.seal = function(data) {
    return new Promise(function(resolve, reject){
        https.request({
            method: 'PUT',
            hostname: 'pecs.publish.adobe.io',
            path: '/publication/' + data.schema.publicationId + '/' + data.schema.entityType + '/' + data.schema.entityName + ';version=' + data.schema.version + '/contents',
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/json;charset=UTF-8',
                'authorization': AEMM.authentication.getToken().token_type + ' ' + AEMM.authentication.getToken().access_token,
                'x-dps-client-request-id': AEMM.genUUID(),
                'x-dps-client-session-id': data.sessionId || (data.sessionId = AEMM.genUUID()),
                'x-dps-upload-id': data.uploadId,
                'x-dps-api-key': AEMM.authentication.getCredentials().clientId,
                'x-dps-client-version': AEMM.authentication.getCredentials().clientVersion
            }
        }, function(response){
            var buffers = [];
            response.on('data', buffers.push.bind(buffers));
            response.on('end', function(){
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? (data.schema = result, resolve(data)) : reject(result);
            });
        }).on('error', reject).end(JSON.stringify(data.schema));
    });
};

/**
 * Triggers the publishing job for entities
 * Article only: will prevent publishing if article is not ingested successfully.
 * Collection only: publish all immediate children entities.
 * Publication only: preview all contents.
 * @param data
 * @returns {Promise} workflow
 */
var job = function(data) {
    return new Promise(function(resolve, reject){
        https.request({
            method: 'POST',
            hostname: 'pecs.publish.adobe.io',
            path: '/job',
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/json;charset=UTF-8',
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
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? resolve(result) : reject(result);
            });
        }).on('error', reject).end(JSON.stringify(data.schema));
    });
};

/**
 * Relies on the job() method to publish the entity.
 * @param data publish a single job or group them via entities array from requestList
 * @returns {Promise}
 */
Entity.prototype.publish = function(data) {
    return new Promise(function(resolve, reject){
        var task = {
            schema: {
                workflowType: 'publish',
                entities: data.entities ?
                    data.entities.map(function(item){return item.href})
                    : ['/publication/' + data.schema.publicationId + '/' + data.schema.entityType + '/' + data.schema.entityName + ';version=' + data.schema.version]
            },
            sessionId: data.sessionId || AEMM.genUUID()
        };
        job(task).then(function(workflow){
            data.workflow = workflow;
            resolve(data);
        }).catch(reject);
    });
};

/**
 * Relies on the job() method to publish the entity.
 * @param data publish a single job or group them via entities array from requestList
 * @returns {Promise}
 */
Entity.prototype.unpublish = function(data) {
    return new Promise(function(resolve, reject){
        var temp = {
            schema: {
                workflowType: 'unpublish',
                entities: data.entities ?
                    data.entities.filter(function(item){return topLevel.indexOf(AEMM.matchUrl(item.href)[2]) == -1}).map(function(value){return value.href}) // filter topLevel entities
                    : ['/publication/' + data.schema.publicationId + '/' + data.schema.entityType + '/' + data.schema.entityName + ';version=' + data.schema.version] // if publishing self
            },
            sessionId: data.sessionId || AEMM.genUUID()
        };
        if(!data.entities && topLevel.indexOf(data.schema.entityName) != -1) {resolve(data); return} // if publish self is topLevel entity, Top-level entities cannot be unpublished.
        return job(temp).then(function(workflow){
            data.aspect = 'unpublishing';
            data.workflow = workflow;
            resolve(data);
        }).catch(reject);
    });
};

/**
 * Rely on the _job() method to trigger the Preflight for the publication
 * @param data
 * @returns {Promise}
 */
Entity.prototype.preflight = function(data) {
    return new Promise(function(resolve, reject){
        var task = {schema: {workflowType: 'preview', publicationId: data.schema.publicationId}};
        return job(task).then(function(workflow){
            data.aspect = 'preview';
            data.workflow = workflow;
            resolve(data);
        }).catch(reject);
    });
};

/**
 * Get the status on a workflow
 * @param data
 * @returns {Promise} resolved with an object populated with workflowStatus having a status field with values (RUNNING, COMPLETED, NOT_FOUND)
 */
Entity.prototype.requestWorkflow = function(data) {
    return new Promise(function(resolve, reject){
        https.request({
            method: 'GET',
            hostname: 'pecs.publish.adobe.io',
            path: '/status/' + data.schema.publicationId + '/workflow/' + data.workflow.workflowId,
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/json;charset=UTF-8',
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
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? (data.workflowStatus = result, resolve(data)) : reject(result);
            });
        }).on('error', reject).end(JSON.stringify(data.schema));
    });
};

Entity.prototype.requestReferencing = function(data) {
    return new Promise(function(resolve, reject){
        https.request({
            method: 'GET',
            hostname: 'pecs.publish.adobe.io',
            path: '/publication/' + data.schema.publicationId + '/' + data.schema.entityType + '/' + data.schema.entityName + ';version=' + data.schema.version + '/' + data.referencingEntityType,
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/json;charset=UTF-8',
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
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? (data.referencingEntities = result, resolve(data)) : reject(result);
            });
        }).on('error', reject).end(JSON.stringify(data.schema));
    });
};

Entity.prototype.requestStatus = function(data) {
    return new Promise(function(resolve, reject){
        https.request({
            method: 'GET',
            hostname: 'pecs.publish.adobe.io',
            path: '/status/' + data.schema.publicationId + '/' + data.schema.entityType + '/' + data.schema.entityName,
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/json;charset=UTF-8',
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
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? (data.status = result, resolve(data)) : reject(result);
            });
        }).on('error', reject).end(JSON.stringify(data.schema));
    });
};

Entity.prototype.addWorkflowObserver = function(data) {
    return AEMM.observer.addWorkflowObserver(data);
};

var p = new AEMM.Queue(Entity.prototype.publish);
var u = new AEMM.Queue(Entity.prototype.unpublish);

Entity.prototype.queue = {
    publish: function(data){
        return p.push(data);
    },
    unpublish: function(data){
        return u.push(data);
    }
};

Entity.TYPE = 'entity';

AEMM.Entity = Entity;

require('./article');
require('./collection');
require('./banner');
require('./font');
require('./layout');
require('./cardtemplate');
require('./publication');
require('./sharedcontent');