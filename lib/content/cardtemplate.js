var AEMM = require("../aemm");

/**
 * CardTemplate class constructor
 * @constructor
 */
function CardTemplate() {}

CardTemplate.prototype = Object.create(AEMM.Entity.prototype);
CardTemplate.prototype.constructor = CardTemplate;

CardTemplate.TYPE = "cardTemplate";

AEMM.CardTemplate = CardTemplate;