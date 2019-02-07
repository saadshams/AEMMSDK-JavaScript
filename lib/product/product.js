var AEMM = require('../aemm');
var https = require('https');

function Product() {}

/**
 * Get a list of products or product bundles.
 * @param data
 * @returns {Promise}
 */
Product.prototype.requestList = function(data) {
    return new Promise(function(resolve, reject){
        https.request({
            method: 'GET',
            hostname: 'ps.publish.adobe.io',
            path: '/applications/' + data.publicationId + '/' + data.entityType + 's',
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

/**
 * Get the product or product bundle metadata.
 * @param data
 * @returns {Promise}
 */
Product.prototype.requestMetadata = function(data) {
    return new Promise(function(resolve, reject){
         https.request({
            method: 'GET',
            hostname: 'ps.publish.adobe.io',
            path: '/applications/' + data.publicationId + '/' + data.entityType + 's/' + data.schema.id,
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
 * Request Catalog for Products
 * @param data
 * @returns {Promise}
 */
Product.prototype.requestCatalog = function(data) {
    return new Promise(function(resolve, reject){
        data.sessionId = data.sessionId || AEMM.genUUID();
        Product.prototype.requestList.call(null, data)
            .then(function(result){
                return Promise.all(result.entities.map(function(item){
                    var temp = {schema: {id: item.id}, entityType: data.entityType, publicationId: data.publicationId, sessionId: data.sessionId};
                    return Product.prototype.requestMetadata(temp);
                }));
            })
            .then(resolve, reject);
    });
};

/**
 * Create (or update) the product or product bundle.
 * @param data
 * @returns {*}
 */
Product.prototype.create = function(data) {
    return new Promise(function(resolve, reject){
        var request = https.request({
            method: 'PUT',
            hostname: 'ps.publish.adobe.io',
            path: '/applications/' + data.publicationId + '/' + data.entityType + 's/' + data.schema.id,
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
            response.on('data', function(chunk){buffers.push(chunk)});
            response.on('end', function(){
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? (data.schema = result, resolve(data)) : reject(result);
            });
        }).on('error', reject);
        request.end(JSON.stringify(data.schema));
    });
};

/**
 * Update the product or product bundle
 * @param data
 */
Product.prototype.update = function(data) {
    for(var key in data.update) {data.schema[key] = data.update[key]}
    return Product.prototype.create.call(null, data);
};

/**
 * Delete the product or product bundle.
 * @param data
 * @returns {Promise}
 */
Product.prototype.delete = function(data) {
    return new Promise(function(resolve, reject){
        var request = https.request({
            method: 'DELETE',
            hostname: 'ps.publish.adobe.io',
            path: '/applications/' + data.publicationId + '/' + data.entityType + 's/' + data.schema.id,
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
            response.on('data', function(chunk) {buffers.push(chunk)});
            response.on('end', function(){
                var result = JSON.parse(buffers.length ? Buffer.concat(buffers).toString(): '""');
                response.statusCode == 204 ? resolve() : reject(result);
            });
        }).on('error', reject);
        request.end(JSON.stringify(data.schema));
    });
};

Product.TYPE = "product";

AEMM.Product = Product;

require('./bundle');