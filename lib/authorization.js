var AEMM = require('./aemm');
var https = require('https');

/**
 * Authorization class constructor
 * @constructor
 */
function Authorization() {}

/**
 * Get the list of user permissions.
 * @returns {Promise} @resolve permission list @reject credentials or connection errors
 */
Authorization.prototype.requestPermissions = function(data) {
    return new Promise(function(resolve, reject){
        https.request({
            method: 'GET',
            hostname: 'authorization.publish.adobe.io',
            path: '/permissions',
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
                response.statusCode == 200 ? (data.subscriber = result, resolve(data)) : reject(data);
            });
        }).on('error', reject).end(JSON.stringify(data.schema));
    });
};

/**
 * Verify that the user is provisioned for the specified publication.
 * Check if the specified publication is within the user permissions.
 * @param data
 * @returns {*} body with list of permissions for the specified publication.
 */
Authorization.prototype.verifyPermissions = function(data) {
    var accounts = data.subscriber.masters;
    data.authorizations = [];
    for(var i=0; i<accounts.length; i++) { //iterate the list of accounts
        for(var j=0; j<accounts[i].publications.length; j++) { //iterate the list of publications per account
            if(accounts[i].publications[j].id == data.schema.publicationId) { //return account or publication permissions
                data.authorizations = accounts[i].permissions.length ? accounts[i].permissions : accounts[i].publications[j].permissions;
                return data;
            }
        }
    }
    return data;
};

/**
 * Verify that the necessary roles are available.
 * Recommended to be used prior to an API request.
 * Compare the list of given roles with the permissions.
 * @param data
 * @returns {*} body with list of missing permissions
 */
Authorization.prototype.verifyRoles = function(data) {
    for(var i=0; i<data.authorizations.length; i++) {
        if(data.authorizations[i] == 'master_admin') { // check if master account
            data.permissions = []; // no need to check if the user is a "master_admin"
            return data;
        } else {
            var j = data.permissions.length;
            while(j--) {
                if(data.authorizations[i] == data.permissions[j]) {
                    data.permissions.splice(j, 1);
                }
            }
        }
    }
    return data;
};

/**
 * Helper function to verify roles against permissions
 * @param roles
 * @param data
 * @returns {Promise}
 */
Authorization.prototype.verify = function(data) {
    return new Promise(function(resolve, reject){
        Authorization.prototype.requestPermissions.call(null, data)
            .then(Authorization.prototype.verifyPermissions)
            .then(Authorization.prototype.verifyRoles)
            .then(function(result){
                if(result.permissions.length == 0) {
                    delete data.subscriber;
                    resolve(data);
                } else {
                    reject('Missing the following permissions: ' + JSON.stringify(result.permissions));
                }
            });
    });
};

// Administration
Authorization.PUBLICATION_ADMIN = 'publication_admin';

// Application Development
Authorization.APPBUILDER = 'appbuilder';

// Content
Authorization.PRODUCER_CONTENT_ADD = 'producer_content_add';
Authorization.PRODUCER_CONTENT_DELETE = 'producer_content_delete';
Authorization.PRODUCER_CONTENT_VIEW = 'producer_content_view';
Authorization.PRODUCER_CONTENT_PUBLISH = 'producer_content_publish';
Authorization.PRODUCER_LAYOUT_ADD = 'producer_layout_add';
Authorization.PRODUCER_LAYOUT_DELETE = 'producer_layout_delete';
Authorization.PRODUCER_LAYOUT_VIEW = 'producer_layout_view';
Authorization.PRODUCER_LAYOUT_PUBLISH = 'producer_layout_publish';
Authorization.PRODUCER_PREVIEW = 'producer_preview';

// Notifications
Authorization.NOTIFICATIONS_SEND_TEXT = 'notifications_send_text';
Authorization.NOTIFICATIONS_SEND_BACKGROUND = 'notifications_send_background';
Authorization.NOTIFICATIONS_CERTIFICIATE_ADMIN = 'notifications_certificate_admin';
Authorization.NOTIFICATIONS_VIEW_HISTORY = 'notifications_view_history';

// Products & Subscriptions
Authorization.PRODUCT_VIEW = 'product_view';
Authorization.PRODUCT_ADD = 'product_add';

AEMM.Authorization = Authorization;