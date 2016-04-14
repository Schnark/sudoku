/*global SudokuApp*/
(function () {
"use strict";

var app = new SudokuApp(); //use new SudokuApp(true) for training
window.addEventListener('localized', function () {
	document.documentElement.lang = document.webL10n.getLanguage();
	document.documentElement.dir = document.webL10n.getDirection();
	app.run();
}, false);

})();