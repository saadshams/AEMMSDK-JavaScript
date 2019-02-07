var AEMM = require('../aemm');

function Bundle() {
    AEMM.Product.call(this);
}

Bundle.prototype = Object.create(AEMM.Product.prototype);
Bundle.prototype.constructor = Bundle;

Bundle.TYPE = 'bundle';

AEMM.Bundle = Bundle;