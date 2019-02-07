var fsobject = require('../../../lib/api/fsobject');
var path = require('path');
var assert = require('assert');

describe("fs tests", function() {

    it('should retruns stat', function(done){
        fsobject.stat(__filename)
            .then(function(stat){
                assert.ok(stat.dev);
                assert.ok(stat.mode);
                done()
            }).catch(console.error);
    });

    it('should reject', function(done){
        fsobject.stat("abc")
            .then(function(stat){})
            .catch(function(){
                done();
            });
    });

    it('should readdir', function(done){
        fsobject.readdir(path.join(__dirname, '../'))
            .then(function(list){
                assert.ok(list.length);
                done();
            }).catch(console.error);
    });

    it('should create hash', function(done){
        fsobject.md5(__filename)
            .then(function(data){
                assert.ok(data);
                done();
            }).catch(console.error)
    });

    it('should check for existence', function(done){
        fsobject.stat(__dirname)
            .then(function(data){
                done();
            }).catch(console.error);
    });

    it('should create and delete directory', function(done){
        fsobject.mkdir(path.join(__dirname, "temp"))
            .then(fsobject.rmdir)
            .then(function(){done()})
            .catch(console.error);
    });

    it('should throw error while deleting non existing file', function(done){
        fsobject.unlink(path.join(__dirname, "temp.js"))
            .catch(function(){done()})
    });

    it('should listdir', function(done){
        this.timeout(0);
        fsobject.listdir(path.join(__dirname, "../"))
            .then(function(result){
                done();
            })
            .catch(console.error);
    });

});