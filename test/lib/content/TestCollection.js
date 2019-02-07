var assert = require('assert');
var AEMM = require("../../../lib/aemm");

var collection = new AEMM.Collection();
var article = new AEMM.Article();
var authentication = new AEMM.Authentication();
var authorization = new AEMM.Authorization();
var fs = require('fs');
var path = require("path");

var publicationId = '192a7f47-84c1-445e-a615-ff82d92e2eaa';
var entity = {
    entityName: "collection_test",
    entityType: AEMM.Collection.TYPE,
    publicationId: publicationId,
    title: "collection test",
    shortTitle: "test",
    productIds: ["product_collection_demo"]
};

var thumbnail = {file: path.join(__dirname, '../../resources/image/thumbnail.png'), path: "images/thumbnail", sizes: '2048, 1020, 1536, 1080, 768, 640, 540, 320'};
var background = {file: path.join(__dirname, '../../resources/image/background.png'), path: "images/background", sizes: '2048, 1020, 1536, 1080, 768, 640, 540, 320'};
var socialSharing = {file: path.join(__dirname, '../../resources/image/socialSharing.png'), path: "images/socialSharing", sizes: '2048, 1020, 1536, 1080, 768, 640, 540, 320'};

before(function(done) {
    authentication.requestToken(null)
        .then(function(data) {
            done();
        })
        .catch(console.error);
});

describe('#Collection()', function () {
    it('should be instantiated', function () {
        assert.ok(collection, 'constructor test');
    });
});

describe('#create()', function () {
    var data = {
        schema: entity,
        permissions: [AEMM.Authorization.PRODUCER_CONTENT_ADD, AEMM.Authorization.PRODUCER_CONTENT_DELETE] // permissions to check for
    };

    it('should create', function(done){
        collection.create(data)
            .then(collection.delete)
            .then(function(){done()})
            .catch(console.error);
    });

    it('should create after authorization', function (done) {
        authorization.verify(data)
            .then(collection.create)
            .then(collection.delete)
            .then(function(){
                done();
            })
            .catch(console.error);
    });
});

describe('#update()', function () {
    this.timeout(0);
    var data = {
        schema: entity
    };
    it('should update', function (done) {
        collection.create(data)
            .then(function(data){
                data.schema.title = "newtitle",
                data.schema.shortTitle = "new short title";
                return data;
            })
            .then(collection.update)
            .then(function(result) {
                assert.equal(result.schema.title, "newtitle");
                assert.ok(result.schema.shortTitle == "new short title");
                return result;
            })
            .then(collection.delete)
            .then(function(){done()})
            .catch(console.error);
    });
});

describe('#uploadImage()', function () {

    it('should upload thumbnail', function (done) {
        this.timeout(0);
        var data = {
            schema: entity,
            images: [thumbnail]
        };
        collection.create(data)
            .then(collection.uploadImages)
            .then(collection.update)
            .then(collection.seal)
            .then(collection.delete)
            .then(function(){done()})
            .catch(console.error)
    });

    it('should upload background', function (done) {
        this.timeout(0);
        var data = {schema: entity, images: [background]};
        collection.create(data)
            .then(collection.uploadImages)
            .then(collection.update)
            .then(collection.seal)
            .then(collection.delete)
            .then(function(){done()})
            .catch(console.error);
    });

    it('should upload thumbnail, background and socialSharing', function (done) {
        this.timeout(0);
        var data = {
            schema: entity,
            images: [thumbnail, background, socialSharing]
        };
        collection.create(data)
            .then(collection.uploadImages)
            .then(collection.update)
            .then(collection.seal)
            .then(collection.delete)
            .then(function(){done()})
            .catch(console.error);
    });

    it("should download images", function(done){
        this.timeout(0);
        var data = {
            schema: entity,
            images: [thumbnail, background, socialSharing], // required for initial setup
            downSamples: true
        };
        collection.create(data)
            .then(collection.uploadImages)
            .then(collection.update)
            .then(collection.seal)
            .then(collection.downloadImages)
            .then(function(result){
                assert.ok(result.images.length);
                var isDownloaded = false;
                result.images.forEach(function(image){
                    isDownloaded = true;
                    assert.ok(fs.existsSync(image));
                });
                assert.ok(isDownloaded);
                return result;
            })
            .then(collection.delete)
            .then(function(){
                done();
            })
            .catch(console.error)
    });
});

describe("#publish() collection", function(){
    this.timeout(0);
    it("should publish and then unpublish the collection", function(done){
        var body = {
            schema: entity,
            images: [thumbnail],
            notify: function(status){
                console.log(status);
            }
        };
        collection.create(body)
            .then(collection.uploadImages)
            .then(collection.update)
            .then(collection.seal)
            .then(collection.publish)
            .then(collection.addWorkflowObserver)
            .then(collection.unpublish)
            .then(collection.addWorkflowObserver)
            .then(collection.delete)
            .then(function(data){done()})
            .catch(console.error)
    });
});

describe("#maintain sessionId throughout", function(){
    this.timeout(0);
    var sessionId;
    var data = {
          schema: {entityName: "demo", entityType: AEMM.Collection.TYPE, publicationId: publicationId, title: "demo", productIds:["product_collection_demo"]},
          images: [thumbnail, background]
    };
    it("should maintain same sessionId throughout", function(done){
        collection.create(data)
            .then(function(result){
                assert.ok(result.sessionId);
                sessionId = result.sessionId;
                return result;
            })
            .then(collection.uploadImages)
            .then(function(result){
                assert.equal(sessionId, result.sessionId);
                return result;
            })
            .then(collection.update)
            .then(function(result){
                assert.equal(sessionId, result.sessionId);
                return result;
            })
            .then(collection.seal)
            .then(function(result){
                assert.equal(sessionId, result.sessionId);
                return result;
            })
            .then(collection.publish)
            .then(function(result){
                assert.equal(sessionId, result.sessionId);
                return collection.addWorkflowObserver(result)
                    .then(function(status){
                        return result;
                    })
            })
            .then(collection.unpublish)
            .then(function(result){
                assert.equal(sessionId, result.sessionId);
                return collection.addWorkflowObserver(result)
                    .then(function(status){
                        return result;
                    });
            })
            .then(collection.delete)
            .then(function(){
                done();
            })
            .catch(console.error);
    })
});

describe("#topLevelPhoneContent unpublish", function(){
    var data = {
        schema: {
            entityType: AEMM.Collection.TYPE,
            publicationId: publicationId
        }
    };

    it("should not unpublish", function(done){
        data.entityName = "topLevelPhoneContent";
        collection.requestMetadata(data)
            .then(collection.unpublish)
            .then(function(){
                assert.ok(false, "should not be able to unpublish");
            })
            .catch(function(error){
                delete data.entityName; // reset
                done();
            });
    });

    it("publish all", function(done){
        this.timeout(0);
        collection.requestList(data)
            .then(collection.publish)
            .then(collection.addWorkflowObserver)
            .then(function(){
                done();
            })
            .catch(console.error);
    });

    it("unpublish all", function(done){
        this.timeout(0);
        collection.requestList(data)
            .then(collection.unpublish)
            .then(collection.addWorkflowObserver)
            .then(function(){
                done();
            })
            .catch(function(error){
                error.code == 'TopLevelCollectionUnpublishException' ? done() : console.error(error);
            });
    })
});

describe("#requestList()", function(){

    it("should list", function(done){
        var body2 = {
            query: "page=0&pageSize=5&q=entityType==collection&sortField=modified&descending=true",
            schema: {
                publicationId: entity.publicationId
            }
        };
        collection.requestList(body2)
            .then(function(data){
                assert.ok(data.entities);
                done();
            })
            .catch(console.error);
    });

    it('should request for all collection elements', function(done){
        this.timeout(15000);
        var body = {
            query: "pageSize=5&q=entityType==collection",
            schema: {
                publicationId: entity.publicationId
            }
        };

        collection.requestList(body)
            .then(function(data){
                return new Promise(function(resolve, reject){
                    var promises = [];
                    for(var i=0; i<data.entities.length; i++) {
                        var matches = data.entities[i].href.match(/\/([article|banner|cardTemplate|collection|font|layout|publication]*)\/([a-zA-Z0-9\_\-\.]*)\;version/);
                        var body2 = JSON.parse(JSON.stringify(body));
                        body2.schema = {
                            entityName: matches[2],
                            entityType: matches[1],
                            publicationId: publicationId
                        };
                        promises.push(collection.requestMetadata(body2))
                    }
                    Promise.all(promises).then(resolve, reject);
                });
            })
            .then(function(data){
                assert.ok(data);
                data.forEach(function(value){
                    assert.ok(value);
                });
            })
            .then(function(){done()})
            .catch(console.error);
    });

    it('should requestList with shortcut metadata', function(done){
        this.timeout(0);
        var body = {
            query: "pageSize=100&q=entityType==collection",
            schema: {
                publicationId: entity.publicationId
            }
        };
        collection.requestList(body)
            .then(function(result){
                return Promise.all(result.entities.map(function(entity){
                    entity.authentication = body.authentication;
                    return collection.requestMetadata(entity);
                }))
            })
            .then(function(result){
                done();
            })
            .catch(console.error);
    })
});

describe('#requestMetadata()', function () {
    var body = {
        schema: entity
    };

    it("should requestMetadata", function(done){
        collection.create(body)
            .then(collection.requestMetadata)
            .then(collection.delete)
            .then(function(){done()})
            .catch(console.error);
    });
});

describe("#requestContentElements()", function(){
    var body = {
        schema: entity,
        contentElements: null
    };
    it("should getContentElements", function(done){
        collection.create(body)
            .then(collection.requestMetadata)
            .then(collection.requestContentElements)
            .then(function(data){
                assert.ok(data.contentElements.length == 0);
                return data;
            })
            .then(collection.delete)
            .then(function(){done()})
            .catch(console.error);
    });
});

describe("#updateContentElements()", function(){
    this.timeout(0);
    var contentElements;
    before(function(done){
        Promise.all([0, 1].map(function(item){
            return article.create({schema: {entityName: 'test_' + item, title: 'test_' + item, entityType: 'article', publicationId: publicationId}})
        })).then(function(result){
            contentElements = result.map(function(item){
                return {href: '/publication/' + item.schema.publicationId + '/' + item.schema.entityType + '/' + item.schema.entityName + ';version=' + item.schema.version};
            });
            done();
        }).catch(console.error);
    });

    after(function(done){
        Promise.all(contentElements.map(function(item){
            return article.delete(item);
        })).then(function(){
            done();
        }).catch(console.error);
    });

    it("should updateContentElements", function(done){
        var data = {
            schema: entity,
            contentElements: contentElements
        };

        return collection.create(data)
            .then(collection.updateContentElements)
            .then(collection.requestContentElements)
            .then(function(result){
                assert.ok(result.contentElements.length == 2);
                return result;
            })
            .then(collection.requestMetadata)
            .then(collection.delete)
            .then(function(){
                done();
            });
    });

    it("should updateContentElements and requestReferencing", function(done){
        var data = {
            schema: entity,
            contentElements: contentElements
        };

        collection.create(data)
            .then(collection.updateContentElements)
            .then(function(collectionMetadata){
                var matches = AEMM.matchUrl(contentElements[0].href);
                var temp = {schema: {publicationId: publicationId, entityName: matches[4], entityType: matches[3], version: matches[5]}, referencingEntityType: 'collection'};
                return article.requestReferencing(temp)
                    .then(function(result){
                        assert.ok(result.referencingEntities.length);
                    })
                    .then(function(){
                        return collection.requestMetadata(collectionMetadata);
                    });
            })
            .then(collection.delete)
            .then(function(){done()})
            .catch(console.error);
    });

});

describe("#addEntity()", function(){
    this.timeout(0);
    var contentElements;
    before(function(done){
        Promise.all([0, 1].map(function(item){
            return article.create({schema: {entityName: 'test_' + item, title: 'test_' + item, entityType: 'article', publicationId: publicationId}})
        })).then(function(result){
            contentElements = result.map(function(item){
                return {href: '/publication/' + item.schema.publicationId + '/' + item.schema.entityType + '/' + item.schema.entityName + ';version=' + item.schema.version};
            });
            done();
        }).catch(console.error);
    });

    after(function(done){
        Promise.all(contentElements.map(function(item){
            return article.delete(item);
        })).then(function(){
            done();
        }).catch(console.error);
    });

    it("should addEntity", function(done){
        var body = {
            schema: entity,
            contentElement: contentElements[0],
            isLatestFirst: false
        };
        collection.create(body)
            .then(collection.addEntity)
            .then(collection.updateContentElements)
            .then(collection.requestContentElements)
            .then(function(data){
                assert.ok(data.contentElements.length == 1);
                return data;
            })
            .then(collection.delete)
            .then(function(){done()})
            .catch(console.error)
    });

    it("should add two entities one at a time", function(done){
        this.timeout(0);
        var body = {
            schema: entity,
            contentElement: contentElements[0]
        };

        collection.create(body)
            .then(collection.requestContentElements)
            .then(collection.addEntity)
            .then(function(data){
                assert.ok(data.contentElements.length == 1);
                return data;
            })
            .then(collection.updateContentElements)
            .then(collection.requestContentElements)
            .then(function(data){
                assert.ok(data.contentElements.length == 1);
                assert.ok(data.contentElements[0].href = contentElements[0].href);
                return data;
            })
            .then(function(data){
                data.contentElement = contentElements[1];
                data.isLatestFirst = true;
                return data;
            })
            .then(collection.addEntity)
            .then(function(data){
                assert.ok(data.contentElements.length == 2);
                return data;
            })
            .then(collection.updateContentElements)
            .then(collection.requestContentElements)
            .then(function(data){
                assert.ok(data.contentElements.length == 2);
                assert.ok(data.contentElements[0].href = contentElements[1].href);
                return data;
            })
            .then(collection.delete)
            .then(function(){done()})
            .catch(console.error)
    });

    it("should not add same collection twice", function(done){
        var body = {
            schema: entity,
            contentElement: contentElements[0],
            isLatestFirst: false
        };
        collection.create(body)
            .then(collection.addEntity)
            .then(collection.addEntity)
            .then(function(data){
                assert.ok(data.contentElements.length == 1);
                return data;
            })
            .then(collection.delete)
            .then(function(){done()})
    });
});

describe("#removeEntity", function(){
    this.timeout(0);
    var contentElements;
    before(function(done){
        Promise.all([0, 1].map(function(item){
            return article.create({schema: {entityName: 'test_' + item, title: 'test_' + item, entityType: 'article', publicationId: publicationId}})
        })).then(function(result){
            contentElements = result.map(function(item){
                return {href: '/publication/' + item.schema.publicationId + '/' + item.schema.entityType + '/' + item.schema.entityName + ';version=' + item.schema.version};
            });
            done();
        }).catch(console.error);
    });

    after(function(done){
        Promise.all(contentElements.map(function(item){
            return article.delete(item);
        })).then(function(){
            done();
        }).catch(console.error);
    });

    it("should removeEntity one at a time", function(done){
        this.timeout(5000);
        var body = {
            schema: entity,
            contentElements: contentElements
        };

        collection.create(body)
            .then(collection.updateContentElements)
            .then(collection.requestContentElements)
            .then(function(data){
                assert.ok(data.contentElements.length == 2);
                return data;
            })
            .then(function(data){
                data.contentElement = contentElements[1];
                return data;
            })
            .then(collection.removeEntity)
            .then(collection.updateContentElements)
            .then(collection.requestContentElements)
            .then(function(data){
                assert.ok(data.contentElements.length == 1);
                assert.ok(data.contentElements[0].href == contentElements[0].href);
                return data;
            })
            .then(collection.delete)
            .then(function(){done()})
            .catch(console.error);
    });

    it("should work without contentElement specified", function(done){
        var body = {
            schema: entity
        };

        collection.create(body)
            .then(collection.requestContentElements)
            .then(collection.removeEntity)
            .then(collection.updateContentElements)
            .then(collection.delete)
            .then(function(){done()})
            .catch(console.error);
    });

    it("should not remove an invalid article", function(done){
        this.timeout(10000);
        var body = {
            schema: entity
        };

        collection.create(body)
            .then(collection.requestContentElements)
            .then(function(data){
                assert.ok(data.contentElements.length == 0);
                return data;
            })
            .then(function(data){ //specify an invalid article
                data.contentElement = {href: "/publication/b5bacc1e-7b55-4263-97a5-ca7015e367e0/article/invalid"};
                return data;
            })
            .then(collection.removeEntity)
            .then(collection.updateContentElements)
            .then(collection.requestContentElements)
            .then(function(data){
                assert.ok(data.contentElements.length == 0);
                return data;
            })
            .then(collection.delete)
            .catch(console.error)
            .then(function(){done()})
    });

    it("should add two and remove one", function(done){
        this.timeout(7000);
        var body = {
            schema: entity,
            contentElements: JSON.parse(JSON.stringify(contentElements)),
            contentElement: contentElements[0] //collection to remove
        };

        collection.create(body)
            .then(collection.updateContentElements)
            .then(collection.removeEntity)
            .then(collection.updateContentElements)
            .then(collection.requestContentElements)
            .then(function(data){
                assert.ok(data.contentElements.length == 1);
                assert.ok(data.contentElements[0].href == contentElements[1].href);
                return data;
            })
            .then(collection.delete)
            .then(function(){done()})
            .catch(console.error);
    });
});