/*global SudokuApp*/
(function () {
"use strict";

var app, debug;

switch (location.search) {
case '?debug=true':
	debug = true;
	break;
case '?debug=false':
/*falls through*/
default:
	debug = false;
}

app = new SudokuApp(debug);
window.addEventListener('localized', function () {
	document.documentElement.lang = document.webL10n.getLanguage();
	document.documentElement.dir = document.webL10n.getDirection();
	app.run();
}, false);

})();