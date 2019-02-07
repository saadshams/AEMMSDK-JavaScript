var assert = require('assert');
var AEMM = require("../../../lib/aemm");
var article = new AEMM.Article();
var publicationId = "192a7f47-84c1-445e-a615-ff82d92e2eaa";
var fs = require("fs");
var path = require("path");

var articles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function(item, index){
//var articles = [0, 1, 2].map(function(item, index){
    return {
        schema: { entityName: "watch_" + index, entityType: AEMM.Article.TYPE, publicationId: publicationId, title: "watch_" + index},
        article: {src: path.join(__dirname, "../../resources/articles/" + index)},
        images: [ {file: path.join(__dirname, "../../resources/articles/thumbnail_" + index + ".jpg"), path: "images/thumbnail"}]
    };
});

before(function(done) {
    AEMM.authentication.requestToken(null)
        .then(function() {
            done();
        })
        .catch(console.error);
});

describe("article", function(){

    it('should build articles', function(done){
        this.timeout(0);
        Promise.all(articles.map(function(data){
            return article.buildArticle(data)
                .catch(console.error);
        })).then(function(){
            done();
        }).catch(console.error);
    });

    it('should build an existing article', function(done){
        this.timeout(0);
        var data = {
            schema: { entityName: "existing", entityType: AEMM.Article.TYPE, publicationId: publicationId, title: "existing"},
            article: {src: path.join(__dirname, "../../resources/articles/existing")},
            images: [{file: path.join(__dirname, "../../resources/articles/existing.jpg"), path: "images/thumbnail"}]
        };
        article.create(data)
            .then(article.uploadImages)
            .then(article.update)
            .then(article.seal)
            .then(article.buildArticle)
            .then(article.uploadArticle)
            .then(article.addStatusObserver)
            .then(function(){done()})
            .catch(console.error);
    });

    it('should create, build and upload article file', function(done){
        this.timeout(0);
        Promise.all(articles.map(function(data){
            return article.create(data)
                .then(article.uploadImages)
                .then(article.update)
                .then(article.seal)
                .then(article.buildArticle)
                .then(article.uploadArticle)
                .then(article.addStatusObserver)
                .then(article.requestMetadata)
                .then(article.queue.publish)
                .catch(function(error){
                    console.log('error', error.message);
                    return error;
                });
        })).then(function(result){
            done();
            article.preflight({schema: {publicationId: articles[0].schema.publicationId}})
                .then(article.addWorkflowObserver)
                .then(function(){
                    done();
                }).catch(console.error);
        });
    });

    it('should delete all using requestList', function(done){
        this.timeout(0);
        var data = {schema: {entityType: AEMM.Article.TYPE, publicationId: publicationId}};

        article.requestList(data)
            .then(function(result){
                return Promise.all(result.entities.map(function(data){
                    return article.requestMetadata(data)
                        .then(article.queue.unpublish)
                        .then(article.delete);
                }))
            })
            .then(function(){
                done();
            })
            .catch(console.error);
    });

});