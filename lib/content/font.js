var AEMM = require('../aemm');

var fs = require('fs');
var path = require('path');

function Font() {
    AEMM.Entity.call(this);
}

Font.prototype = Object.create(AEMM.Entity.prototype);
Font.prototype.constructor = Font;

Font.prototype.uploadFonts = function(body) {
    body.uploadId = body.uploadId || AEMM.genUUID();
    return Promise.all(body.fonts.map(function(font){
        var temp = {schema: body.schema, upload: font, uploadId: body.uploadId};
        return AEMM.Entity.prototype.uploadFile.call(null, temp).then(function(meta){
            return meta || {href: "contents/" + font.path.split("/")[1]};
        });
    })).then(function(result){
        for(var i=0; i<result.length; i++) {
            body.schema._links[body.fonts[i].path.split("/")[1] + "Font"] = result[i];
        }
        return body;
    });
};

Font.prototype.downloadFonts = function(data) {
    return new Promise(function(resolve, reject){
        var hrefs = [];
        var types = ["webFont", "deviceFont"];
        Object.keys(data.schema._links).forEach(function(key){
            if(types.indexOf(key) != -1) {
                hrefs.push(data.schema._links[key].href.match(/contents\/(.*)/)[1]);
            }
        });
        data.fonts = [];
        Promise.all(hrefs.map(function(item){
            var temp = {schema: data.schema, path: "fonts/" + item};
            return AEMM.Entity.prototype.downloadFile.call(this, temp);
        })).then(function(result){
            data.fonts = [];
            result.forEach(function(item){
                data.fonts.push(item.file);
            });
            resolve(data);
        });
    });
};

Font.prototype.enableDesktopWebViewer = function(body) {
    return AEMM.Entity.prototype.publish.call(this, body);
};

Font.prototype.disableDesktopWebViewer = function(body) {
    return AEMM.Entity.prototype.unpublish.call(this, body);
};

Font.TYPE = 'font';

AEMM.Font = Font;