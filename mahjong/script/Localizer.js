/* global I18N:true */

// Augment String with a simple format method: only replaces {xx} words
String.prototype.format = function() {
    "use strict";

    var result = this;
    for (var i = 0; i < arguments.length; i++) {
	var reg = new RegExp("\\{" + (i+1) + "\\}", "gm");
	result = result.replace(reg, String(arguments[i]));
    }
    return result;
};

I18N = {};
I18N._currentResources = {};

I18N.loadAllTransationTables = function (base, lang, country) {
    "use strict";
    // FIXME
};

/*!
  Global utility method to access localized resources.
 */
function strRes(str) {
    "use strict";

	var resourceDB = I18N._currentResources;
	if (resourceDB.hasOwnProperty(str)) {
	    return resourceDB[str];
	}
    return str;
}
