var assert = require('assert');
var AEMM = require("../../../lib/aemm");
var authentication = new AEMM.Authentication();
var entity = new AEMM.Entity();

describe('Entity', function() {

    it('should be instantiated', function () {
        assert.ok(entity, "constructor test");
    });

});