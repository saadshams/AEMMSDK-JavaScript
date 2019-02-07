var AEMM = require("../aemm");

/**
 * Layout class constructor
 * @constructor
 */
function Layout() {}

Layout.prototype = Object.create(AEMM.Entity.prototype);
Layout.prototype.constructor = Layout;

Layout.TYPE = "layout";

AEMM.Layout = Layout;