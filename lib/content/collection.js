var AEMM = require("../aemm");
const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Collection constructor
 * @constructor
 */
function Collection() {
    AEMM.Entity.call(this);
}

Collection.prototype = Object.create(AEMM.Entity.prototype);
Collection.prototype.constructor = Collection;

Collection.prototype.addEntity = function(data) {
    var exists = false;
    data.contentElements = data.contentElements || [];
    for(var i=0; i<data.contentElements.length; i++) {
        if(data.contentElements[i].href == data.contentElement.href) {
            exists = true;
            break;
        }
    }
    if(!exists) {
        data.isLatestFirst ? data.contentElements.unshift(data.contentElement) : data.contentElements.push(data.contentElement);
    }
    return data;
};

Collection.prototype.removeEntity = function(data) {
    for(var i=0; i<data.contentElements.length; i++) {
        if(data.contentElements[i].href == data.contentElement.href) {
            data.contentElements.splice(i, 1);
            break;
        }
    }
    return data;
};

Collection.prototype.requestContentElements = function(data) {
    return new Promise(function(resolve, reject){
        https.request({
            method: "GET",
            hostname: 'pecs.publish.adobe.io',
            path: data.schema._links.contentElements.href,
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
                response.statusCode == 200 ? (data.contentElements = result, resolve(data)) : reject(result);
            });
        }).on('error', reject).end(JSON.stringify(data.schema));
    });
};

Collection.prototype.updateContentElements = function(data) {
    return new Promise(function(resolve, reject){
        var schema = data.contentElements.map(function(item){return {href: item.href.split(";version=")[0]}});
        https.request({
            method: "PUT",
            hostname: 'pecs.publish.adobe.io',
            path: data.schema._links.contentElements.href,
            headers: {
                'Accept': 'application/json;charset=UTF-8',
                'Content-Type': 'application/json;charset=UTF-8',
                'Authorization': AEMM.authentication.getToken().token_type + ' ' + AEMM.authentication.getToken().access_token,
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
        }).on('error', reject).end(JSON.stringify(schema));
    });
};

Collection.TYPE = "collection";

AEMM.Collection = Collection;