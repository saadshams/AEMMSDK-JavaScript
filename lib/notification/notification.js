var AEMM = require('../aemm');
var https = require('https');

function Notification() {}

Notification.prototype.create = function(data) {
    return new Promise(function(resolve, reject){
        var boundary = '----WebKitFormBoundaryjZ7XLPhzmHBEDier';
        var request = https.request({
            method: 'POST',
            hostname: 'rps.publish.adobe.io',
            path: '/notifications',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'multipart/form-data; boundary=' + boundary,
                'authorization': AEMM.authentication.getToken().token_type + ' ' + AEMM.authentication.getToken().access_token,
                'x-dps-client-request-id': AEMM.genUUID(),
                'x-dps-client-session-id': data.sessionId || (data.sessionId = AEMM.genUUID()),
                'x-dps-api-key': AEMM.authentication.getCredentials().clientId,
                'x-dps-client-version': AEMM.authentication.getCredentials().clientVersion,
                'x-tenant-id': data.schema.tenantId,
                'x-notification-client-id': 'pb'
            }
        }, function(response){
            var buffers = [];
            response.on('data', function(chunk){buffers.push(chunk)});
            response.on('end', function(){
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? resolve(result) : reject(result);
            });
        }).on('error', reject);
        request.write('--' + boundary + '\r\n');
        request.write('Content-Disposition: form-data; name="push"\r\n\r\n');
        request.write(JSON.stringify(data.schema) + '\r\n');
        request.end('--' + boundary + '--');
    });
};

Notification.prototype.healthCheck = function(data) {
    return new Promise(function(resolve, reject){
        var request = https.request({
            method: 'GET',
            hostname: 'rps.publish.adobe.io',
            path: '/healthCheck',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json;charset=UTF-8',
                'authorization': AEMM.authentication.getToken().token_type + ' ' + AEMM.authentication.getToken().access_token,
                'x-dps-client-request-id': AEMM.genUUID(),
                'x-dps-client-session-id': data.sessionId || (data.sessionId = AEMM.genUUID()),
                'x-dps-api-key': AEMM.authentication.getCredentials().clientId,
                'x-dps-client-version': AEMM.authentication.getCredentials().clientVersion,
                'x-notification-client-id': 'pb'
            }
        }, function(response){
            var buffers = [];
            response.on('data', function(chunk){buffers.push(chunk)});
            response.on('end', function(){
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? resolve(result) : reject(result);
            });
        }).on('error', reject);
        request.end();
    });
};

Notification.prototype.deviceCount = function(data) {
    return new Promise(function(resolve, reject){
        var request = https.request({
            method: 'GET',
            hostname: 'rps.publish.adobe.io',
            path: '/devices/' + data.schema.os + '/' + data.schema.appId + '/deviceCount' + (data.schema.query || ''),
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json;charset=UTF-8',
                'authorization': AEMM.authentication.getToken().token_type + ' ' + AEMM.authentication.getToken().access_token,
                'x-dps-client-request-id': AEMM.genUUID(),
                'x-dps-client-session-id': data.sessionId || (data.sessionId = AEMM.genUUID()),
                'x-dps-api-key': AEMM.authentication.getCredentials().clientId,
                'x-dps-client-version': AEMM.authentication.getCredentials().clientVersion,
                'x-tenant-id': data.schema.tenantId,
                'x-notification-client-id': 'pb'
            }
        }, function(response){
            var buffers = [];
            response.on('data', function(chunk){buffers.push(chunk)});
            response.on('end', function(){
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? resolve(result) : reject(result);
            });
        }).on('error', reject);
        request.end();
    });
};

Notification.prototype.requestList = function(data) {
    return new Promise(function(resolve, reject){
        var request = https.request({
            method: 'GET',
            hostname: 'rps.publish.adobe.io',
            path: '/notifications',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json;charset=UTF-8',
                'authorization': AEMM.authentication.getToken().token_type + ' ' + AEMM.authentication.getToken().access_token,
                'x-dps-client-request-id': AEMM.genUUID(),
                'x-dps-client-session-id': data.sessionId || (data.sessionId = AEMM.genUUID()),
                'x-dps-api-key': AEMM.authentication.getCredentials().clientId,
                'x-dps-client-version': AEMM.authentication.getCredentials().clientVersion,
                'x-tenant-id': data.schema.tenantId,
                'x-notification-client-id': 'pb'
            }
        }, function(response){
            var buffers = [];
            response.on('data', function(chunk){buffers.push(chunk)});
            response.on('end', function(){
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? resolve(result) : reject(result);
            });
        }).on('error', reject);
        request.end();
    });
};

Notification.prototype.delete = function(data) {
    return new Promise(function(resolve, reject){
        var request = https.request({
            method: 'DELETE',
            hostname: 'rps.publish.adobe.io',
            path: '/notifications/' + data.schema.notificationId,
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json;charset=UTF-8',
                'authorization': AEMM.authentication.getToken().token_type + ' ' + AEMM.authentication.getToken().access_token,
                'x-dps-client-request-id': AEMM.genUUID(),
                'x-dps-client-session-id': data.sessionId || (data.sessionId = AEMM.genUUID()),
                'x-dps-api-key': AEMM.authentication.getCredentials().clientId,
                'x-dps-client-version': AEMM.authentication.getCredentials().clientVersion,
                'x-tenant-id': data.schema.tenantId,
                'x-notification-client-id': 'pb'
            }
        }, function(response){
            var buffers = [];
            response.on('data', function(chunk){buffers.push(chunk)});
            response.on('end', function(){
                var result = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? resolve(result) : reject(result);
            });
        }).on('error', reject);
        request.end();
    });
};

AEMM.Notification = Notification;