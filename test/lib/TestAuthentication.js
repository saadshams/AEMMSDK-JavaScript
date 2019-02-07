var assert = require('assert');
var AEMM = require("../../lib/aemm");
var authentication = AEMM.authentication;

it('should return a token', function (done) {
    authentication.requestToken(null)
        .then(function(result){
            assert.ok(result);
            assert.ok(result.access_token);
            done();
        })
        .catch(console.error);
});

it('should return a cached token', function (done) {
    this.timeout(0);
    var access_token;
    authentication.requestToken(null)
        .then(function(result){
            access_token = result.access_token;
            assert.equal(result.userId, '2DF0006E54F9C5230A0550B6@AdobeID');
            assert.ok(access_token);
        })
        .then(function(){
            assert.equal(authentication.getToken().access_token, access_token);
            done();
        })
        .catch(console.error);
});

it('should add observer', function(done){
    authentication.addTokenObserver(null)
        .then(function(result){
            assert.ok(result);
            assert.ok(result.access_token);
            done();
        })
        .catch(console.error);
});
