var assert = require('assert');
var AEMM = require("../../lib/aemm");
var authorization = new AEMM.Authorization();
var publicationId = "b5bacc1e-7b55-4263-97a5-ca7015e367e0";

before(function(done){
    AEMM.authentication.requestToken(null)
        .then(function(){
            done();
        }).catch(console.error);
});

describe('#requestPermissions()', function() {
    it('should return list of permissions for all publications', function (done) {
        authorization.requestPermissions({})
            .then(function(data){
                assert.ok(data, "error");
                assert.ok(data.subscriber, "client's permissions not returned");
                done();
            }).catch(console.error);
    });
});

describe('#verifyPermissions()', function() {
    it('should return permissions for a publication', function (done) {
        var data = {schema: {publicationId: publicationId}};
        authorization.requestPermissions(data)
            .then(authorization.verifyPermissions)
            .then(function(data){
                assert.notEqual(data.length, 0, "permissions denied");
                done();
            })
            .catch(console.error);
    });
});

describe('#verifyRoles()', function () {

    it('should verify roles', function () {
        var body = {
            authorizations: [AEMM.Authorization.PRODUCT_VIEW, AEMM.Authorization.PRODUCER_PREVIEW, AEMM.Authorization.PRODUCT_ADD],
            permissions: [AEMM.Authorization.PRODUCT_VIEW]
        };
        authorization.verifyRoles(body);
        assert.equal(body.permissions.length, 0, "roles not zero");
    });

    it('another test', function(){
        var body = {
            authorizations: ["product_view", "product_add", "analytics_view"],
            permissions: ["product_view", "producer_preview"]
        };
        authorization.verifyRoles(body);
        assert.equal(body.permissions.length, 1, "roles not 1");
        assert.equal(body.permissions[0], 'producer_preview', "roles not equal to producer_preview");
    });

    it('check for master_admin', function(){
        var body = {
            authorizations: ["master_admin"],
            permissions: ["product_view", "producer_preview", "product_add"]
        };
        authorization.verifyRoles(body);
        assert.equal(body.permissions.length, 0, "roles not zero");
    });

    it('should verify roles', function () {
        var body = {
            authorizations: ["product_view", "producer_preview", "product_add"],
            permissions: ["product_add", "producer_preview"]
        };
        authorization.verifyRoles(body);
        assert.equal(body.permissions.length, 0, "roles not zero");
    });

    it('should verify roles', function () {
        var body = {
            authorizations: ["product_view", "producer_preview", "product_add"],
            permissions: ["abc", "product_add"]
        };
        authorization.verifyRoles(body);
        assert.equal(body.permissions.length, 1, "roles not 1");
    });
});

describe('#verify()', function () {
    this.timeout(0);
    it("should verify in one go", function(done){
        var data = {
            schema: {publicationId: publicationId},
            permissions: ["producer_content_add"]
        };
        authorization.verify(data)
            .then(function(){done()})
            .catch(console.error);

    })
});
