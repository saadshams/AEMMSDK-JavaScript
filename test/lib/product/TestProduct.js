var assert = require('assert');
var AEMM = require('../../../lib/aemm');
var product = new AEMM.Product();
var authentication = AEMM.authentication;
var authorization = new AEMM.Authorization();
var publicationId = '192a7f47-84c1-445e-a615-ff82d92e2eaa';
var productId = 'ag.casa.demo';

before(function(done) {
    AEMM.authentication.requestToken(null)
        .then(function(data) {
            assert.equal(data.access_token, authentication.getToken().access_token);
            done();
        })
        .catch(console.error);
});

describe('#Product()', function() {

    it('should check for permissions', function(done){
        var authorizationData = {schema: {publicationId: publicationId}, permissions: ['product_add', 'product_view']};
        var data = {schema: { id: productId }, entityType: AEMM.Product.TYPE, publicationId: publicationId};
        authorization.verify(authorizationData)
            .then(function(){
                return product.requestMetadata(data);
            })
            .then(function(result){
                assert.ok(result.schema.id == productId);
                done();
            })
            .catch(console.error);
    });

    it('should requestList', function(done){
        var data = {schema: {}, entityType: AEMM.Product.TYPE, publicationId: publicationId};
        product.requestList(data)
            .then(function(data){
                assert.ok(data);
                assert.ok(data.entities);
                done();
            })
            .catch(console.error);
    });

    it('should requestMetadata for a product', function(done){
        var data = {schema: {id: productId}, entityType: AEMM.Product.TYPE, publicationId: publicationId};
        product.requestMetadata(data)
            .then(function(result){
                assert.ok(result.schema.id == productId);
                done();
            })
            .catch(console.error)
    });

    it('should requestMetadata for all products', function(done){
        this.timeout(5000);
        var data = {schema: {}, entityType: AEMM.Product.TYPE, publicationId: publicationId};
        product.requestList(data)
            .then(function(result){
                Promise.all(result.entities.map(function(item){
                    var data = {schema: {id: item.id}, entityType: AEMM.Product.TYPE, publicationId: publicationId};
                    return product.requestMetadata(data);
                })).then(function(data){
                    assert.ok(data.length == result.entities.length);
                    done();
                });
            })
    });

    it('should requestCatalog for all products', function(done){
        var data = {schema: {}, entityType: AEMM.Product.TYPE, publicationId: publicationId};
        product.requestCatalog(data)
            .then(function(result){
                done();
            })
            .catch(console.error);
    });

    it('should update', function(done){
        var data = {schema: {id: productId}, update: {label: "new label"}, entityType: AEMM.Product.TYPE, publicationId: publicationId};
        product.requestMetadata(data)
            .then(product.update)
            .then(function(result){
                assert.ok(result.schema.label == "new label");
                done();
            })
            .catch(console.error);
    });

    it("should get list from both products and bundles", function(done){
        var bundle = new AEMM.Bundle();
        var data = {schema: {id: productId}, entityType: AEMM.Product.TYPE, publicationId: publicationId};
        var data2 = {schema: {id: "subscription1"}, entityType: AEMM.Bundle.TYPE, publicationId: publicationId};

        Promise.all([product.requestList(data), bundle.requestList(data2)])
            .then(function(result){
                if(result[0].entities && result[1].entities)
                    done();
            })
            .catch(console.error);
    });

    it("should generate issue list", function(done){
        this.timeout(0);
        var collection = new AEMM.Collection();
        var product = new AEMM.Product();
        var data = {schema: {entityType: AEMM.Collection.TYPE, publicationId: publicationId}};

        collection.requestList(data) // requestList
            .then(function(result){ // requestMetadata
                return Promise.all(result.entities.map(function(item){
                    var matches = AEMM.matchUrl(item.href);
                    var meta = {schema: {entityName: matches[4], entityType: matches[3], publicationId: publicationId}};
                    return collection.requestMetadata(meta);
                })).then(function(result){
                    data.entities = {};
                    result.forEach(function(item){
                        data.entities[item.schema.entityName] = item.schema;
                    });
                    return data;
                });
            })
            .then(function(data){ // requestStatus
                var promises = [];
                for (var property in data.entities) {
                    var temp = {schema: data.entities[property]};
                    promises.push(collection.requestStatus(temp));
                }
                return Promise.all(promises).then(function(result){
                    result.forEach(function(item){
                        data.entities[item.schema.entityName].isPublished = item.status.length == 2 && item.status[1].eventType == 'success' ? true : false;
                    });
                    return data;
                });
            })
            .then(function(data){ // productList
                var meta = {schema: {}, entityType: AEMM.Product.TYPE, publicationId: publicationId};
                return product.requestList(meta)
                    .then(function(product){
                        for(property in data.entities) {
                            data.entities[property].productIds.forEach(function(productId){
                                data.entities[property].products = {};
                                product.entities.forEach(function(item){
                                    if(productId == item.id) {
                                        delete item.id;
                                        data.entities[property].products[productId] = item;
                                    }
                                });
                            });
                        }
                        return data;
                    });
            })
            .then(function(data){ // download thumbnail
                return Promise.all(function(){
                    var promises = [];
                    Object.keys(data.entities).forEach(function(key){
                        if(data.entities[key]._links.thumbnail) {
                            promises.push(collection.downloadImages({schema: data.entities[key], path: "images/thumbnail"}));
                        }
                    });
                    return promises;
                }()).then(function(result){
                    result.forEach(function(item){
                        data.entities[item.schema.entityName].images = data.entities[item.schema.entityName].images || [];
                        data.entities[item.schema.entityName].images.push(item.images.toString());
                    });
                    return data;
                });
            })
            .then(function(data){ // download background
                return Promise.all(function(){
                    var promises = [];
                    Object.keys(data.entities).forEach(function(key){
                        if(data.entities[key]._links.thumbnail) {
                            promises.push(collection.downloadImages({schema: data.entities[key], path: "images/background"}));
                        }
                    });
                    return promises;
                }()).then(function(result){
                    result.forEach(function(item){
                        data.entities[item.schema.entityName].images = data.entities[item.schema.entityName].images || [];
                        data.entities[item.schema.entityName].images.push(item.images.toString());
                    });
                    return data;
                });
            })
            .then(function(data){
                var fs = require('fs');
                Object.keys(data.entities).forEach(function(item){
                    data.entities[item].images.forEach(function(url){
                        assert.ok(fs.existsSync(url));
                    })
                });
                done();
            })
            .catch(console.error);
    });

    // xit('should create', function(done){
    //     var data = {
    //         schema: {
    //             id: productId,
    //             label: "Product 1",
    //             isFree: false,
    //             isDistributionRestricted: false
    //         },
    //         entityType: AEMM.Product.TYPE,
    //         publicationId: publicationId
    //     };
    //     product.create(data)
    //         .then(function(data){
    //             assert.ok(data);
    //             done()
    //         })
    //         .catch(console.error);
    // });
    //
    // xit('should delete', function(done){
    //     var data = {
    //         schema: {id: productId},
    //         entityType: AEMM.Product.TYPE,
    //         publicationId: publicationId,
    //         permissions: ['product_add', 'product_view'] //permissions to check for
    //     };
    //     authorization.verify(data)
    //         .then(product.delete)
    //         .then(function(data){
    //             done();
    //         })
    //         .catch(console.error);
    // });
});