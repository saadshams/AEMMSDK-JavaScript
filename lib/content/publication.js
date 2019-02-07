var AEMM = require("../aemm");

/**
 * Publication class constructor
 * @constructor
 */
function Publication() {}

Publication.prototype = Object.create(AEMM.Entity.prototype);
Publication.prototype.constructor = Publication;

Publication.TYPE = "publication";

AEMM.Publication = Publication;