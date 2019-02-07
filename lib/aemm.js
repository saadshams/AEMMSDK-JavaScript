const os = require('os');
const fs = require('fs');
const fsobject = require('./api/fsobject');
const path = require('path');
const crypto = require('crypto');

var AEMM = {};

AEMM.mimetypes = require('./api/mimetypes.json');
AEMM.magicnumbers = require('./api/magicnumbers.json');

/**
 * Generate the UUID (alphanumeric).
 * https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_.28random.29
 * @returns {string} The UUID of the following length: 8-4-4-4-12
 */
AEMM.genUUID = function() {
    var randomBytes = crypto.randomBytes(16);
    randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40;
    randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80;
    randomBytes = randomBytes.toString('hex').match(/(.{8})(.{4})(.{4})(.{4})(.{12})/);
    randomBytes.shift();
    return randomBytes.join('-');
};

AEMM.tmpDir = function(dir) { // create temp directories/subdirectories
    var tmp = path.join(os.tmpDir(), "com.adobe.aemmobile", dir);
    var segments = tmp.split(path.sep);
    for(var i=os.tmpDir().split(path.sep).length; i<segments.length; i++) {
        var segment = segments.slice(0, i+1).join(path.sep);
        if(!fs.existsSync(segment)) fs.mkdirSync(segment);
    }
    return tmp;
};

AEMM.matchUrl = function(href) {
    return href.match(/(([a-f0-9]+\-)+[a-f0-9]+)\/(.*?)\/(.*?);version=(\d*)/);
};

AEMM.matchContentUrl = function(href) {
    return href.match(/(([a-f0-9]+\-)+[a-f0-9]+)\/(.*?)\/(.*?)\/contents;contentVersion=(\d*)\//);
};

/**
 * 1 pubId, 3, entityType , 4, entityName 5. version 6. subpath 7. filename
 * @param href
 * @returns {Array|{index: number, input: string}|*}
 */
AEMM.matchContentUrlPath = function(href) { // contentUrl with path
    return href.match(/(([a-f0-9]+\-)+[a-f0-9]+)\/(.*?)\/(.*?)\/contents;contentVersion=(\d*)\/(.*)\/(.*)/);
};

AEMM.getMimeType = function(bytes) {
    return AEMM.mimetypes[AEMM.getExtension(bytes)];
};

AEMM.getExtension = function(bytes) {
    return AEMM.magicnumbers[bytes];
};

module.exports = AEMM;

require('./patterns/iterator');
require('./patterns/observer');
require('./patterns/queue');
require('./authentication');
require('./authorization');
require('./content/entity');
require('./product/product');
require('./notification/notification');
require('./notification/certificate');

AEMM.authentication = new AEMM.Authentication();
AEMM.observer = new AEMM.Observer();