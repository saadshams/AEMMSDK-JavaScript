var AEMM = require("../../../lib/aemm");
var collection = new AEMM.Collection();
var authentication = new AEMM.Authentication();
var assert = require('assert');
var path = require("path");
var publicationId = "192a7f47-84c1-445e-a615-ff82d92e2eaa";

var datums = [0,1,2,3,4,5,6,7,8,9].map(function(item, index){
    return {
        schema: { entityName: "collection_" + index, entityType: AEMM.Collection.TYPE, publicationId: publicationId, title: "collection_" + index, productIds: ["ag.casa.demo"]},
        images: [ {file: path.join(__dirname, "../../resources/articles/thumbnail_" + index + ".jpg"), path: "images/thumbnail"}, {file: path.join(__dirname, "../../resources/articles/thumbnail_" + index + ".jpg"), path: "images/background"} ]
    };
});

before(function(done) {
    authentication.requestToken(null)
        .then(function(data) {
            done();
        })
        .catch(console.error);
});

describe("Collections", function(){

    it("should create collections and publish via enqueue", function(done){
        this.timeout(0);
        Promise.all(datums.map(function(data){
            return collection.create(data)
                .then(collection.uploadImages)
                .then(collection.update)
                .then(collection.seal)
                .then(collection.queue.publish) // publish enqueue
                .catch(console.error);
        })).then(function(result){
            done();
        })
    });

    it("should create collections with existing articles", function(done){
        this.timeout(0);
        var article = new AEMM.Article();
        var index = 0;
        article.requestList({schema: {entityType: AEMM.Article.TYPE, publicationId: publicationId}})
            .then(function(result){
                return Promise.all(datums.splice(0, 5).map(function(data){
                    data.contentElements = result.entities.splice(0, 2);
                    return collection.create(data)
                        .then(collection.updateContentElements)
                        .then(collection.uploadImages)
                        .then(collection.update)
                        .then(collection.seal)
                        .then(collection.queue.publish)
                        .catch(console.error);
                }));
            })
            .then(function(){done()})
    });

    it("should publish all", function(done){
        this.timeout(0);
        var datum = {schema:{entityType: AEMM.Collection.TYPE, publicationId: publicationId}};
        collection.requestList(datum)
            .then(function(result){
                return Promise.all(result.entities.map(function(data){
                    return collection.requestMetadata(data)
                        .then(collection.queue.publish)
                        .catch(function(){})
                }));
            })
            .then(function(){done()})
            .catch(console.error);
    });

    it("should delete collections using requestList", function(done){
        this.timeout(0);
        var datum = {schema:{entityType: AEMM.Collection.TYPE, publicationId: publicationId}};
        collection.requestList(datum)
            .then(function(result){
                return Promise.all(result.entities.map(function(data){
                    return collection.requestMetadata(data)
                        .then(collection.queue.unpublish)
                        .then(collection.delete)
                        .catch(console.error);
                }));
            })
            .then(function(){done()})
            .catch(console.error);
    });

});

