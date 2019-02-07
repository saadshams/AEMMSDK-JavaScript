var AEMM = require('../aemm');

function Banner() {}

Banner.prototype = Object.create(AEMM.Entity.prototype);
Banner.prototype.constructor = Banner;

Banner.TYPE = 'banner';

AEMM.Banner = Banner;