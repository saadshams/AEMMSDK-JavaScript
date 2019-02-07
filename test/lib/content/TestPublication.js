var assert = require('assert');
var AEMM = require("../../../lib/aemm");
var publication = new AEMM.Publication();
var authorization = new AEMM.Authorization();
var publicationId = "b5bacc1e-7b55-4263-97a5-ca7015e367e0";

before(function(done){
    AEMM.authentication.requestToken()
        .then(function(){done()})
        .catch(console.error);
});

describe('Publication', function() {
    
    it("should construct", function(){
        assert.ok(publication);
    });

    it("should requestStatus", function(done){
        var data = {
            schema: {entityName: publicationId, entityType: AEMM.Publication.TYPE, publicationId: publicationId},
            permissions: ["publication_admin"]
        };

        authorization.verify(data)
            .then(publication.requestStatus)
            .then(function(result){
                assert.ok(result.status);
                done();
            })
            .catch(console.error);
    });

    it("should preflight", function(done){
        this.timeout(10000);
        var body = {
            schema: {
                publicationId: publicationId
            },
            notify: function(result) {
                //console.log(result.status);
            }
        };
        publication.preflight(body)
            .then(publication.addWorkflowObserver)
            .then(function(result){
                done();
            })
            .catch(console.error);
    });

    it("should requestList with metadata", function(done){
        var body = {
            schema: {
                publicationId: publicationId
            },
            permissions: ["publication_admin"]
        };

        authorization.requestPermissions(body)
            .then(authorization.verifyPermissions)
            .then(authorization.verifyRoles)
            .then(function(result){
                var promises = [];
                result.subscriber.masters.forEach(function(item){
                    item.publications.forEach(function(item){
                        var body = {
                            schema: {
                                entityName: item.id,
                                publicationId: item.id,
                                entityType: AEMM.Publication.TYPE
                            }
                        };
                        promises.push(publication.requestMetadata(body));
                    });
                });

                Promise.all(promises).then(function(result){
                    assert.ok(result);
                    assert.ok(result.length);
                    done();
                }).catch(console.error);
            })
            .catch(console.error);
    });

    it("should requestList with status", function(done){
        var body = {
            schema: {
                publicationId: publicationId
            },
            permissions: ["publication_admin"]
        };

        authorization.requestPermissions(body)
            .then(authorization.verifyPermissions)
            .then(authorization.verifyRoles)
            .then(function(result){
                var promises = [];
                result.subscriber.masters.forEach(function(item){
                    item.publications.forEach(function(item){
                        var body = {
                            schema: {
                                entityName: item.name,
                                publicationId: item.id,
                                entityType: AEMM.Publication.TYPE
                            }
                        };
                        promises.push(publication.requestStatus(body));
                    });
                });

                return Promise.all(promises)
                    .then(function(result){
                        result.forEach(function(item){
                            assert.ok(item.status);
                        });
                        done();
                    }).catch(console.error);
            })
            .catch(console.error);
    });
    
});