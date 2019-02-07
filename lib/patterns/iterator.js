var AEMM = require('../aemm');

function Iterator(asyncfunc) {
    this.asyncfunc = asyncfunc;
}

Iterator.prototype.next = function(data) {
    return this.asyncfunc(data);
};

Iterator.prototype.asyncfunc;

AEMM.Iterator = Iterator;