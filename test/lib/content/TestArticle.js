var assert = require('assert');
var AEMM = require("../../../lib/aemm");
var article = new AEMM.Article();
var authentication = new AEMM.Authentication();

var fs = require("fs");
var path = require("path");
var data = {
    schema: {
        entityName: "nodejs",
        entityType: AEMM.Article.TYPE,
        title: "article from nodejs",
        publicationId: "192a7f47-84c1-445e-a615-ff82d92e2eaa"
    },
    article: {
        src: path.join(__dirname, "../../resources/html/article"),
        rendition: 'folio', // default is folio
        targetViewer: "33.0.0", // default is 33.0.0
        viewerVersion: "3.0.0", // default is 3.0.0
        generateManifest: true, // default is true
        deleteSourceDir: false // default is false
    },
    images: [
        {file: path.join(__dirname, '../../resources/image/thumbnail.png'), path: "images/thumbnail", sizes: '2048, 1020, 1536, 1080, 768, 640, 540, 320'},
        {file: path.join(__dirname, '../../resources/image/socialSharing.png'), path: "images/socialSharing"}
    ]
};

before(function(done) {
    authentication.requestToken(null)
        .then(function(data) {
            done();
        })
        .catch(console.error);
});

describe('#Article()', function () {

    it('should be instantiated', function () {
        assert.ok(article, "constructor test");
    });

    it('should requestList with metadata and manifest', function(done){
        this.timeout(0);
        var datum = {
            query: "pageSize=100&q=entityType==article",
            schema: {
                publicationId: "b5bacc1e-7b55-4263-97a5-ca7015e367e0"
            }
        };
        article.requestList(datum)
            .then(function(result){
                return Promise.all(result.entities.map(function(item){
                    return article.requestMetadata(item);
                }));
            })
            .then(function(result){
                return Promise.all(result.map(function(item){
                    return article.requestManifest(item);
                }));
            })
            .then(function(result){
                result.forEach(function(item){
                    assert.ok(item.contentUrl);
                });
                done();
            }).catch(console.error);
    });

    it('should requestMetadata', function(done){
        article.create(data)
            .then(article.requestMetadata)
            .then(function(result){
                assert.ok(result.schema);
                return result;
            })
            .then(article.delete)
            .then(function(){done()})
            .catch(console.error);
    });

    it('should requestManifest', function(done){
        this.timeout(0);
        article.create(data)
            .then(article.buildArticle)
            .then(article.uploadArticle)
            .then(article.addStatusObserver)
            .then(article.requestMetadata)
            .then(article.requestManifest)
            .then(function(result){
                assert.ok(result.contentUrl);
                return result;
            })
            .then(article.delete)
            .then(function(){done()})
            .catch(console.error);
    });

    it('should request referencing', function(done){
        var data = {
            schema: {
                entityName: "test1-a",
                entityType: AEMM.Article.TYPE,
                publicationId: "b5bacc1e-7b55-4263-97a5-ca7015e367e0"
            },
            referencingEntityType: AEMM.Collection.TYPE
        };
        article.requestMetadata(data)
            .then(article.requestReferencing)
            .then(function(result){
                assert.ok(result.referencingEntities);
                done();
            })
            .catch(console.error);
    });

    it('should requestStatus', function(done){
        article.create(data)
            .then(article.requestStatus)
            .then(function(result){
                assert.ok(result.status);
                return result;
            })
            .then(article.delete)
            .then(function(){done()})
            .catch(console.error);
    });

    it('should build an article file', function(done){
        article.buildArticle(data)
            .then(function(result){
                assert.ok(fs.existsSync(result.article.path)); // archive exists
                assert.ok(fs.existsSync(data.article.src) != data.article.deleteSourceDir); // if deleteSourceDirectory folder got deleted
                assert.ok(fs.existsSync(path.join(data.article.src, "/manifest.xml")) != data.article.generateManifest); //if generated, it's deleted
                fs.unlinkSync(result.article.path);
                done();
            })
            .catch(console.error)
    });

    it('should create, build and upload article file', function(done){
        this.timeout(0);
        article.create(data)
            .then(article.buildArticle)
            .then(article.uploadArticle)
            .then(article.addStatusObserver)
            .then(article.requestMetadata)
            .then(article.delete)
            .then(function(){done()})
            .catch(console.error)
    });

    it('should upload an image and delete', function(done){
        this.timeout(0);
        article.create(data)
            .then(article.uploadImages)
            .then(article.update)
            .then(article.seal)
            .then(article.delete)
            .then(function(result){
                done();
            })
            .catch(console.error);
    });

    it('should upload an image and article, publish, unpublish, delete', function(done){
        this.timeout(0);
        article.create(data)
            .then(article.uploadImages)
            .then(article.update)
            .then(article.seal)
            .then(article.buildArticle)
            .then(article.uploadArticle)
            .then(article.addStatusObserver) // uploadArticle progress observer (Ingestion)
            .then(article.requestMetadata) // request latest schema version
            .then(article.publish)
            .then(article.addWorkflowObserver) // publish workflow observer
            .then(article.unpublish)
            .then(article.addWorkflowObserver) // unpublish workflow observer
            .then(article.delete)
            .then(function(){done()})
            .catch(console.error);
    });

    it('should requestList', function(done){
        article.requestList(data)
            .then(function(result){
                assert.ok(result);
                assert.ok(result.schema);
                assert.ok(result.entities);
                done();
            })
            .catch(console.error);
    });

    it('should requestList with query', function(done){
        data.query = "pageSize=100&q=entityType==article";
        article.requestList(data)
            .then(function(result){
                assert.ok(result.entities);
                done();
            })
            .catch(console.error);
    });

    it('should requestList with metadata', function(done){
        article.requestList(data)
            .then(function(result){
                Promise.all(result.entities.map(function(item){
                    var matches = AEMM.matchUrl(item.href);
                    var data = {schema: {entityType: matches[3], entityName: matches[4], publicationId: result.schema.publicationId}};
                    return article.requestMetadata(data);
                })).then(function(data){
                        assert.ok(result.entities.length == data.length);
                        done();
                    }).catch(console.error);
            })
            .catch(console.error);
    });

    it('should request catalog', function(done){
        article.requestCatalog(data)
            .then(function(result){
                done();
            }).catch(console.error);
    });

    it('should requestList with status', function(done){
        article.requestList(data)
            .then(function(result){
                Promise.all(result.entities.map(function(item){
                    var matches = AEMM.matchUrl(item.href);
                    var data = {schema: {entityType: matches[3], entityName: matches[4], publicationId: result.schema.publicationId}};
                    return article.requestStatus(data);
                })).then(function(data){
                    assert.ok(result.entities.length == data.length);
                    data.forEach(function(item){
                        assert.ok(item.status);
                    });
                }).then(function(){done()}).catch(console.error);
            })
            .catch(console.error);
    });

});