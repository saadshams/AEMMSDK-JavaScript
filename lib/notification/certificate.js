var AEMM = require('../aemm');
var https = require('https');
var path = require('path');
var fsobject = require('../api/fsobject');

function Certificate() {}

Certificate.prototype.uploadCertificate = function(data) {
    return new Promise(function(resolve, reject){
        Promise.all([fsobject.readFile(data.schema.iOSProductionCertificateFile), fsobject.readFile(data.schema.iOSSandboxCertificateFile)])
            .then(function(result){
                var boundary = '----WebKitFormBoundarySLwZDkT8JvQWJlKA';
                var request = https.request({
                    method: 'POST',
                    hostname: 'rps.publish.adobe.io',
                    path: '/certificate/' + data.schema.os,
                    headers: {
                        'accept': 'application/json, text/plain, */*',
                        'content-type': 'multipart/form-data; boundary=' + boundary,
                        'authorization': AEMM.authentication.getToken().token_type + ' ' + AEMM.authentication.getToken().access_token,
                        'x-tenant-id': data.schema.tenantId,
                        'x-notification-client-id': 'pb',
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
                        response.statusCode == 200 ? resolve(result) : reject(result);
                    });
                });
                request.write('--' + boundary + '\r\n');
                request.write('Content-Disposition: form-data; name="iOSProductionCertificateFile"; filename="' + path.basename(data.schema.iOSProductionCertificateFile) + '"\r\n');
                request.write('content-type: application/x-pkcs12\r\n\r\n');
                request.write(result[0]);
                request.write('\r\n');
                request.write('--' + boundary + '\r\n');
                request.write('Content-Disposition: form-data; name="iOSSandboxCertificateFile"; filename="' + path.basename(data.schema.iOSSandboxCertificateFile) + '"\r\n');
                request.write('content-type: application/x-pkcs12\r\n\r\n');
                request.write(result[1]);
                request.write('\r\n');
                request.write('--' + boundary + '\r\n');
                request.write('Content-Disposition: form-data; name="certificate"\r\n\r\n');
                request.write(JSON.stringify({iOSBundleId: data.schema.iOSBundleId, iOSProductionCertificatePassword: data.schema.iOSProductionCertificatePassword, iOSSandboxCertificatePassword: data.schema.iOSSandboxCertificatePassword}));
                request.write('\r\n');
                request.end('--' + boundary + '--');
            }).catch(reject);
        });
};

Certificate.prototype.requestList = function(data) {
    return new Promise(function(resolve, reject){
        var request = https.request({
            method: 'GET',
            hostname: 'rps.publish.adobe.io',
            path: '/certificate',
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/json;charset=UTF-8',
                'authorization': AEMM.authentication.getToken().token_type + ' ' + AEMM.authentication.getToken().access_token,
                'x-tenant-id': data.schema.tenantId,
                'x-notification-client-id': 'pb',
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
                response.statusCode == 200 ? resolve(result) : reject(result);
            });
        }).on('error', reject);
        request.end(JSON.stringify(data.schema));
    })
};

Certificate.prototype.requestMetadata = function(data) {
    return new Promise(function(resolve, reject){
        var request = https.request({
            method: 'GET',
            hostname: 'rps.publish.adobe.io',
            path: '/certificate/' + data.os + '/' + data.bundleId,
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/json;charset=UTF-8',
                'authorization': AEMM.authentication.getToken().token_type + ' ' + AEMM.authentication.getToken().access_token,
                'x-tenant-id': data.tenantId,
                'x-notification-client-id': 'pb',
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
                response.statusCode == 200 ? resolve(result) : reject(result);
            });
        }).on('error', reject);
        request.end();
    });
};

Certificate.prototype.isRevoked = function(data) {
    return new Promise(function(resolve, reject){
        var request = https.request({
            method: 'GET',
            hostname: 'rps.publish.adobe.io',
            path: '/certificate/' + data.schema.os + '/' + data.schema.appId + '/isRevoked',
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

AEMM.Certificate = Certificate;