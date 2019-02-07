var assert = require('assert');
var AEMM = require("../../../lib/aemm");
var bundle = new AEMM.Bundle();
var authentication = AEMM.authentication;
var authorization = new AEMM.Authorization();
var publicationId = '192a7f47-84c1-445e-a615-ff82d92e2eaa';
var bundleId = "subscription1";

before(function(done) {
    authentication.requestToken(null)
        .then(function(data) {
            done();
        })
        .catch(console.error);
});

describe("#Bundle()", function(){

    it("should construct", function(done){
        assert.ok(bundle);
        done();
    });

    // it('should create', function(done){
    //     var body = {
    //         schema: {
    //             id: bundleId,
    //             bundleType: "SUBSCRIPTION",
    //             label: "subscription label",
    //             strategy: '*',
    //             subscriptionType: 'STANDARD'
    //         },
    //         entityType: AEMM.Bundle.TYPE,
    //         publicationId: publicationId
    //     };
    //     bundle.create(body)
    //         .then(function(data){
    //             done();
    //         })
    //         .catch(console.error);
    // });

    it('should verify and requestMetadata', function(done){
        this.timeout(0);
        var body = {
            schema: {publicationId: publicationId},
            permissions: ['product_add', 'product_view'] //permissions to check for
        };

        authorization.verify(body)
            .then(function(result){
                var meta = {
                    schema: {id: bundleId},
                    entityType: AEMM.Bundle.TYPE,
                    publicationId: publicationId
                };
                return bundle.requestMetadata(meta);
            })
            .then(function(result){
                assert.ok(result.schema.id == bundleId);
                done();
            })
            .catch(console.error);
    });

    it('should requestList', function(done){
        var body = {
            schema: {id: bundleId},
            entityType: AEMM.Bundle.TYPE,
            publicationId: publicationId
        };
        bundle.requestList(body)
            .then(function(data){
                assert.ok(data);
                assert.ok(data.entities);
                done();
            })
            .catch(console.error);
    });

    it('should requestList', function(done){
        var body = {
            schema: {
                id: bundleId
            },
            entityType: AEMM.Bundle.TYPE,
            publicationId: publicationId
        };
        bundle.requestList(body)
            .then(function(data){
                assert.ok(data);
                assert.ok(data.entities);
                done();
            })
            .catch(console.error);
    });

    it('should requestMetadata for a bundle', function(done){
        var body = {
            schema: {
                id: bundleId
            },
            entityType: AEMM.Bundle.TYPE,
            publicationId: publicationId
        };
        bundle.requestMetadata(body)
            .then(function(result){
                assert.ok(result.schema.id == bundleId);
                done();
            })
            .catch(console.error)
    });

    it('should requestMetadata for all bundles concurrently', function(done){
        this.timeout(0);
        var data = {schema: {}, entityType: AEMM.Bundle.TYPE, publicationId: publicationId};
        bundle.requestList(data)
            .then(function(data){
                Promise.all(data.entities.map(function(value){
                    var temp = {schema: {id: value.id}, entityType: AEMM.Bundle.TYPE, publicationId: publicationId};
                    return bundle.requestMetadata(temp);
                })).then(function(result){
                    assert.ok(result.length == data.entities.length);
                    done();
                });
            })
    });

    it('should requestCatalog for all bundles', function(done){
        var data = {schema: {}, entityType: AEMM.Bundle.TYPE, publicationId: publicationId};
        bundle.requestCatalog(data)
            .then(function(result){
                assert.ok(result);
                done();
            })
            .catch(console.error);
    })
});


