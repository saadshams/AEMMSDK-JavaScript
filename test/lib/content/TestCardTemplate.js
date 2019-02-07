var assert = require('assert');
var AEMM = require("../../../lib/aemm");
var cardTemplate = new AEMM.CardTemplate();

var publicationId = "192a7f47-84c1-445e-a615-ff82d92e2eaa";

before(function(done){
    AEMM.authentication.requestToken(null)
        .then(function(){done()})
        .catch(console.error);
});

describe('#CardTemplate()', function () {
    it('should be instantiated', function () {
        assert.ok(cardTemplate, "constructor test");
    });

    it('should requestList', function(done){
        var data = {
            schema: {
                entityType: AEMM.CardTemplate.TYPE,
                publicationId: publicationId
            }
        };
        cardTemplate.requestList(data)
            .then(function(result){
                assert.ok(result.entities);
                done();
            })
            .catch(console.error);
    });

    it('should requestList with query', function(done){
        var data = {
            schema: {
                publicationId: publicationId
            },
            query: "pageSize=100&q=entityType==cardTemplate"
        };
        cardTemplate.requestList(data)
            .then(function(result){
                assert.ok(result.entities);
                done();
            })
            .catch(console.error);
    });

    it('should requestList with metadata', function(done){
        this.timeout(0);
        var data = {
            schema: {
                entityType: AEMM.CardTemplate.TYPE,
                publicationId: publicationId
            }
        };
        cardTemplate.requestList(data)
            .then(function(result){
                Promise.all(result.entities.map(function(item){
                    var matches = AEMM.matchUrl(item.href);
                    var body = {
                        schema: {
                            entityType: matches[3],
                            entityName: matches[4],
                            publicationId: publicationId
                        }
                    };
                    return cardTemplate.requestMetadata(body);
                })).then(function(data){
                        assert.ok(result.entities.length == data.length);
                        done();
                    })
                    .catch(console.error);
            })
            .catch(console.error);
    });

    it('should requestList with status', function(done){
        this.timeout(0);
        var data = {
            schema: {
                entityType: AEMM.CardTemplate.TYPE,
                publicationId: publicationId
            }
        };
        cardTemplate.requestList(data)
            .then(function(result){
                Promise.all(result.entities.map(function(item){
                    var matches = AEMM.matchUrl(item.href);
                    var body = {
                        schema: {
                            entityType: matches[3],
                            entityName: matches[4],
                            publicationId: publicationId
                        }
                    };
                    return cardTemplate.requestStatus(body);
                })).then(function(items){
                    items.forEach(function(item){
                        assert.ok(item.status);
                    });
                    assert.ok(items.length, result.entities.length == items.length);
                    done();
                });
            });
    });

    it('should requestMetadata', function(done){
        this.timeout(0);
        var data = {
            schema: {
                entityType: AEMM.CardTemplate.TYPE,
                entityName: "defaultCardTemplate",
                publicationId: publicationId
            }
        };

        cardTemplate.requestMetadata(data)
            .then(function(data){
                assert.ok(data.schema);
                done();
            })
            .catch(console.error);
    });

    it('should requestStatus', function(done){
        var data = {
            schema: {
                entityType: AEMM.CardTemplate.TYPE,
                entityName: "defaultCardTemplate",
                publicationId: publicationId
            }
        };
        cardTemplate.requestStatus(data)
            .then(function(data){
                assert.ok(data.status);
                done();
            })
            .catch(console.error);
    });

});