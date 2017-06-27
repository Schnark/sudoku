/*global SudokuApp*/
(function () {
"use strict";

var app, debug;

debug = /.*[&?]debug=([^&]*)/.exec(location.search || '');
debug = debug ? decodeURIComponent(debug[1]) : '';
if (debug === 'true') {
	debug = true;
} else {
	debug = false;
}

app = new SudokuApp(debug);
window.addEventListener('localized', function () {
	document.documentElement.lang = document.webL10n.getLanguage();
	document.documentElement.dir = document.webL10n.getDirection();
	app.run();
}, false);

})();