/*global caches, fetch, Promise */
(function (worker) {
"use strict";

var VERSION = 'v2.6',
	FILES = [
		'app.css',
		'index.html',
		'sudoku.css',
		'sudoku.png',
		'icons/icon-512.png',
		'js/app.js',
		'js/l10n.js',
		'js/perspective-transform.min.js',
		'js/sudoku.js',
		'js/sudoku-app.js',
		'js/sudoku-ocr.js',
		'js/sudoku-solve.js',
		'l10n/de.properties',
		'l10n/en.properties',
		'l10n/locales.ini'
	];

worker.addEventListener('install', function (e) {
	e.waitUntil(
		caches.open(VERSION).then(function (cache) {
			return cache.addAll(FILES);
		})
	);
});

worker.addEventListener('activate', function (e) {
	e.waitUntil(
		caches.keys().then(function (keys) {
			return Promise.all(keys.map(function (key) {
				if (key !== VERSION) {
					return caches.delete(key);
				}
			}));
		})
	);
});

worker.addEventListener('fetch', function (e) {
	e.respondWith(caches.match(e.request, {ignoreSearch: true})
		.then(function (response) {
			return response || fetch(e.request);
		})
	);
});

})(this);