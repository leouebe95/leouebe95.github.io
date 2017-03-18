// For eslint
/* exported strRes I18N */

/**
   Augment String with a simple format method: only replaces {xx}
   words.
   @return {String} The formatted string.
*/
String.prototype.format = function() {
    'use strict';

    var result = this;
    for (var i = 0; i < arguments.length; i++) {
	    var reg = new RegExp('\\{' + (i+1) + '\\}', 'gm');
	    result = result.replace(reg, String(arguments[i]));
    }
    return result;
};

/**
   Define internationalization methods.
 */
class I18N {
    static loadAllTransationTables(base, lang, country) {
        // FIXME
    }
}

I18N._currentResources = {};

// FIXME: Should be moved as a String method
/*!
  Global utility method to access localized resources.
 */
function strRes(str) {
    'use strict';

	var resourceDB = I18N._currentResources;
	if (resourceDB.hasOwnProperty(str)) {
	    return resourceDB[str];
	}
    return str;
}
