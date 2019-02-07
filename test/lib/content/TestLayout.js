var assert = require('assert');
var AEMM = require("../../../lib/aemm");

var layout = new AEMM.Layout();
var publicationId = "192a7f47-84c1-445e-a615-ff82d92e2eaa";

before(function(done){
    AEMM.authentication.requestToken(null)
        .then(function(){done()})
        .catch(console.error);
});

describe('Layout', function() {

    it('should be instantiated', function () {
        assert.ok(layout, 'constructor test');
    });

    it('should create and delete', function(done){
        var data = {schema: {entityType: "layout", entityName: "mylayout", title: "layout title", publicationId: publicationId}};
        layout.create(data)
            .then(function(result){
                assert.ok(result.schema.entityName == "mylayout");
                assert.ok(result.schema.entityType == "layout");
                return result;
            })
            .then(layout.delete)
            .then(function(){done()})
            .catch(console.error);
    });

    it('should requestList', function(done){
        var data = {schema: {entityType: AEMM.Layout.TYPE, publicationId: publicationId}};
        layout.requestList(data)
            .then(function(result){
                assert.ok(result);
                assert.ok(result.entities);
                assert.ok(result.entities.length);
                done();
            })
            .catch(console.error);
    });

    it('should requestList with metadata', function(done){
        this.timeout(0);
        var data = {schema: {entityType: AEMM.Layout.TYPE, publicationId: publicationId}};
        layout.requestList(data)
            .then(function(result){
                return Promise.all(result.entities.map(function(item){
                    var matches = AEMM.matchUrl(item.href);
                    return layout.requestMetadata({schema: {entityType: matches[3], entityName: matches[4], publicationId: publicationId}});
                }));
            })
            .then(function(result){
                done();
            })
            .catch(console.error);
    });

    it('should requestList with status', function(done){
        this.timeout(0);
        var data = {schema: {entityType: AEMM.Layout.TYPE, publicationId: publicationId}};
        layout.requestList(data)
            .then(function(result){
                return Promise.all(result.entities.map(function(item){
                    var matches = AEMM.matchUrl(item.href);
                    var body = {schema: { entityType: matches[3], entityName: matches[4], publicationId: publicationId}};
                    return layout.requestStatus(body);
                })).then(function(result){
                    result.forEach(function(item, index){
                        assert.ok(item.status);
                        assert.ok(item.status.length);
                    });
                    done();
                });
            })
    });

});