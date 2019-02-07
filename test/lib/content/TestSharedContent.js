var assert = require('assert');
var AEMM = require("../../../lib/aemm");

var path = require('path');
var fs = require('fs');

var sharedContent = new AEMM.SharedContent();
var article = new AEMM.Article();
var publicationId = "192a7f47-84c1-445e-a615-ff82d92e2eaa";

before(function(done){
    AEMM.authentication.requestToken(null)
        .then(function(){done()})
        .catch(console.error);
});

describe('SharedContent', function() {

    it('should be instantiated', function () {
        assert.ok(sharedContent, 'constructor test');
    });

    it('should create', function(done){
        this.timeout(0);
         var data = {
             schema: {entityType: "sharedContent", entityName: "sc_one", publicationId: publicationId},
             sharedContents: path.join(__dirname, '../../resources/shared/js/')
         };

        sharedContent.create(data)
             .then(sharedContent.requestMetadata)
             .then(sharedContent.uploadSharedContent)
             .then(sharedContent.seal)
             .then(sharedContent.requestSharedContent)
             .then(sharedContent.downloadSharedContent)
             .then(sharedContent.delete)
             .then(function(result){
                 done();
             })
             .catch(console.error);
    });

    it("should iterate directory", function(done){
        AEMM.SharedContent.listdir(path.join(__dirname, '../../resources/shared/js/'))
            .then(function(result){
                result.forEach(function(item){
                    assert.ok(item.file);
                    assert.ok(item.path);
                });
                done();
            }).catch(console.error);

    });

    it('should requestList', function(done){
        var datum = {
            query: "pageSize=100&q=entityType==sharedContent",
            schema: {
                publicationId: publicationId
            }
        };
        sharedContent.requestList(datum)
            .then(function(data){
                done();
            })
            .catch(console.error);
    });

    it('should requestList with requestMetadata', function(done){
        this.timeout(0);
        var data = {
            query: "pageSize=100&q=entityType==sharedContent",
            schema: {
                publicationId: publicationId
            }
        };
        sharedContent.requestList(data)
            .then(function(data){
                return Promise.all(data.entities.map(function(item){
                    return sharedContent.requestMetadata(item);
                })).then(function(result){
                    assert.ok(result.length == data.entities.length);
                    done();
                });
            })
            .catch(console.error);
    });

    it('should requestSharedContent', function(done){
        this.timeout(0);
        var datum = {
            query: "pageSize=100&q=entityType==sharedContent",
            schema: {
                publicationId: publicationId
            }
        };
        sharedContent.requestList(datum)
            .then(function(data){ // requestMetadata
                return Promise.all(data.entities.map(function(item){
                    return sharedContent.requestMetadata(item);
                }))
            })
            .then(function(result){ // requestSharedContent
                return Promise.all(result.map(function(item){
                    return sharedContent.requestSharedContent(item);
                })).then(function(result){
                    result.forEach(function(item){
                        assert.ok(item.contentUrl);
                    });
                    return result;
                })
            })
            .then(function(result){ // downloadFiles
                return Promise.all(result.map(function(item){
                    return sharedContent.downloadSharedContent(item);
                })).then(function(data){
                    data.forEach(function(item){
                        item.files.forEach(function(file){
                            fs.existsSync(file) && fs.unlink(file);
                        });
                    })
                })
            })
            .then(function(){
                done();
            })
            .catch(console.error);
    });

});

describe("create linkage", function(){
    var articleData = {
        schema: {entityName: "nodejs", entityType: AEMM.Article.TYPE, title: "article from nodejs", publicationId: publicationId},
        article: { src: path.join(__dirname, "../../resources/shared/sharedHTML")},
        images: [{file: path.join(__dirname, '../../resources/image/thumbnail.png'), path: "images/thumbnail", sizes: '2048, 1020, 1536, 1080, 768, 640, 540, 320'}]
    };

    before(function(done){
        this.timeout(0);
        article.create(articleData)
            .then(article.buildArticle)
            .then(article.uploadArticle)
            .then(article.addStatusObserver)
            .then(article.requestMetadata)
            .then(function(){done()})
            .catch(console.error);
    });

    after(function(done){
        this.timeout(0);
        article.delete(articleData)
            .then(function(){done()})
            .catch(console.error);
    });

    it('should create and link to an article', function(done){
        this.timeout(0);
        var data = {
            schema: {entityName: "sc_one", entityType: "sharedContent", publicationId: publicationId},
            sharedContents: path.join(__dirname, '../../resources/shared/js/')
        };

        sharedContent.create(data)
            .then(sharedContent.requestMetadata)
            .then(sharedContent.uploadSharedContent)
            .then(sharedContent.seal)
            .then(function(result){
                return new Promise(function(resolve, reject){
                    articleData.sharedContent = result.schema._links.contentUrl;
                    article.linkSharedContent(articleData)
                        .then(article.seal)
                        .then(article.requestManifest)
                        .then(function(result2){
                            fs.readFile(result2.contentUrl, "utf8", function(error, contents) {
                                error && reject(error);
                                contents = JSON.parse(contents);
                                var found = false;
                                for(var i=0; i<contents.length; i++) {
                                    if(contents[i].href == data.schema.entityName) {found = true; break}
                                }
                                assert.ok(found);
                                resolve(result);
                            });
                        });
                });
            })
            .then(sharedContent.delete)
            .then(function(){
                // console.log("path for sharedContent: ../" + AEMM.matchContentUrl(articleData.sharedContent.href)[4]);
                done();
            })
            .catch(console.error);
    });
});