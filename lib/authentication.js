var AEMM = require("./aemm");
const https = require('https');

var token;

var credentials = {
    clientId: process.env.AEMM_CLIENT_ID, clientSecret: process.env.AEMM_CLIENT_SECRET,
    clientVersion: process.env.AEMM_CLIENT_VERSION,
    deviceId: process.env.AEMM_DEVICE_ID, deviceToken: process.env.AEMM_DEVICE_TOKEN
};

/**
 * Authentication class constructor
 * @constructor
 */
function Authentication() {}

/**
 * Request the access token.
 * @param data
 * @returns {Promise}
 */
Authentication.prototype.requestToken = function(key) {
    return new Promise(function(resolve, reject){
        credentials = key || credentials;
        https.request({
            method: 'POST',
            hostname: 'ims-na1.adobelogin.com',
            path: '/ims/token/v1?grant_type=device&scope=AdobeID,openid' +
                '&client_id=' + credentials.clientId +
                '&client_secret=' + credentials.clientSecret +
                '&device_id=' + credentials.deviceId +
                '&device_token=' + credentials.deviceToken,
            headers: {
                'accept': 'application/json;charset=UTF-8',
                'content-type': 'application/x-www-form-urlencoded'
            }
        }, function(response) {
            var buffers = [];
            response.on('data', buffers.push.bind(buffers));
            response.on('end', function(){
                token = JSON.parse(Buffer.concat(buffers).toString());
                response.statusCode == 200 ? resolve(token) : reject(token);
            });
        }).on('error', reject).end();
    });
};

/**
 * Add Iterator to auto refresh access token
 * @param key
 * @returns {*}
 */
Authentication.prototype.addTokenObserver = function(key) {
    return AEMM.observer.addTokenObserver(key);
};

/**
 * Returns cached token
 * @returns {*}
 */
Authentication.prototype.getToken = function() {
    return token;
};

/**
 * Return credentials
 * @returns {{clientId: *, clientSecret: *, clientVersion: *, deviceId: *, deviceToken: *}}
 */
Authentication.prototype.getCredentials = function() {
    return credentials;
};

AEMM.Authentication = Authentication;