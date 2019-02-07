var assert = require('assert');
var AEMM = require("../../../lib/aemm");
var authentication = new AEMM.Authentication();
var font = new AEMM.Font();
var publicationId = '192a7f47-84c1-445e-a615-ff82d92e2eaa';

var fs = require("fs");
var path = require("path");

before(function(done){
    authentication.requestToken(null)
        .then(function(){done()})
        .catch(console.error);
});

describe("#Font()", function(){

    it("should construct", function(){
        assert.ok(font);
    });

    it("should requestList", function(done){
        var data = {schema: {entityType: AEMM.Font.TYPE, publicationId: "b5bacc1e-7b55-4263-97a5-ca7015e367e0"}};
        font.requestList(data)
            .then(function(data){
                assert.ok(data);
                done();
            })
            .catch(console.error);
    });

    it("should uploadFonts, publish, unpublish and delete", function(done){
        this.timeout(0);
        var data = {
            schema: {
                entityName: "fontEntity",
                title: "font title",
                postscriptName: "font.otf",
                entityType: AEMM.Font.TYPE,
                publicationId: publicationId
            },
            fonts: [
                {file: path.join(__dirname, "../../resources/font/font.otf"), path: "fonts/device"},
                {file: path.join(__dirname, "../../resources/font/font.woff"), path: "fonts/web"}
            ]
        };

        font.create(data)
            .then(font.uploadFonts)
            .then(font.update)
            .then(font.seal)
            .then(font.enableDesktopWebViewer)
            .then(font.addWorkflowObserver)
            .then(font.disableDesktopWebViewer)
            .then(font.addWorkflowObserver)
            .then(font.delete)
            .then(function(data){
                done();
            })
            .catch(console.error);
    });

    it("should create, upload and download fonts", function(done){
        this.timeout(0);
        var data = {
            schema: {
                entityName: "fontEntity",
                title: "font title",
                postscriptName: "font.otf",
                entityType: AEMM.Font.TYPE,
                publicationId: publicationId
            },
            fonts: [
                {file: path.join(__dirname, "../../resources/font/font.otf"), path: "fonts/device"},
                {file: path.join(__dirname, "../../resources/font/font.woff"), path: "fonts/web"}
            ]
        };

        font.create(data)
            .then(font.uploadFonts)
            .then(font.update)
            .then(font.seal)
            .then(font.downloadFonts)
            .then(function(data){
                assert.ok(data.fonts.length == 2);
                var isDownloaded = false;
                data.fonts.forEach(function(item){
                    isDownloaded = true;
                    assert.ok(fs.existsSync(item));
                });
                assert.ok(isDownloaded);
                return data;
            })
            .then(font.delete)
            .then(function(){
                done();
            })
            .catch(console.error);
    });

    it("should match font", function(){
        var urls = [
            "/publication/192a7f47-84c1-445e-a615-ff82d92e2eaa/font/fontEntity/contents;contentVersion=1468627103814/fonts/web",
            "/publication/192a7f47-84c1-445e-a615-ff82d92e2eaa/font/newFont001/contents;contentVersion=1468627103814/fonts/device"
        ];
        var matches = AEMM.matchContentUrlPath(urls[0]);
        assert.equal(matches[1], publicationId);
        assert.equal(matches[3], "font");
        assert.equal(matches[4], 'fontEntity');
        assert.equal(matches[7], 'web');

        matches = AEMM.matchContentUrlPath(urls[1]);
        assert.equal(matches[7], 'device');
    });

});