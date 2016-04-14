/*global SudokuApp: true, Sudoku, _, URL, MozActivity*/
SudokuApp =
(function () {
"use strict";

function SudokuApp (train) {
	this.sudoku = new Sudoku();
	this.addListener('button-edit', this.onEdit);
	this.addListener('button-retry', this.onRetry);
	this.addListener('button-camera', this.onCamera);
	this.addListener('button-photo', this.onPhoto);
	this.addListener('button-training', this.onTraining);
	this.addListener('button-training-clear', this.onTrainingClear);
	this.addListener('button-training-done', this.onTrainingDone);
	this.addListener('button-error-done', this.onErrorDone);
	this.addListener('button-ocr', this.onOCR);
	this.addListener('button-debug', this.onDebug);
	this.addListener('button-debug-done', this.onDebugDone);
	this.addListener('button-solve', this.onSolve);
	if (!train) {
		document.getElementById('train-header').style.display = 'none';
		document.getElementById('button-training').style.display = 'none';
	} else {
		this.getTrainingData();
	}
	document.getElementsByTagName('body')[0].addEventListener('focus', function (e) {
		try {
			e.target.select();
		} catch (e) {
		}
	}, true);
}

SudokuApp.prototype.run = function () {
	document.getElementById('page-loading').hidden = true;
	this.showPageStart(true);
};

SudokuApp.prototype.getTrainingData = function () {
	try {
		this.trainigData = JSON.parse(localStorage.getItem('training')) || Sudoku.emptyTrainingData();
	} catch (e) {
		this.trainigData = Sudoku.emptyTrainingData();
	}
};

SudokuApp.prototype.saveTrainingData = function () {
	try {
		localStorage.setItem('training', JSON.stringify(this.trainigData));
	} catch (e) {
	}
};

SudokuApp.prototype.clearTrainingData = function () {
	try {
		localStorage.removeItem('training');
	} catch (e) {
	}
};

SudokuApp.prototype.initCamera = function () {
	var video, getUserMedia, that = this;
//the defaults are better than the mess required to make it work for all versions
/* ideal = {
	width: 266,
	height: 200,
	facingMode: 'environment'
}*/
	if (!this.initCamera.video) {
		video = document.getElementById('camera-img');
		getUserMedia = navigator.getUserMedia ||
			navigator.mozGetUserMedia ||
			navigator.webkitGetUserMedia ||
			function (_, success, error) {
				error();
			};
		getUserMedia.call(navigator, {video: true}, function (stream) {
			if ('srcObject' in video) {
				video.srcObject = stream;
			} else if ('mozSrcObject' in video) {
				video.mozSrcObject = stream;
			} else if (window.URL) {
				video.src = URL.createObjectURL(stream);
			} else {
				video.src = stream;
			}
			that.initCamera.video = video;
			video.play();
		}, this.showPageError.bind(this));
		return;
	}
	this.initCamera.video.play();
};

SudokuApp.prototype.removeCamera = function () {
	var video = this.initCamera.video;
	if (video) {
		video.pause();
		if ('srcObject' in video) {
			video.srcObject = null;
		} else if ('mozSrcObject' in video) {
			video.mozSrcObject = null;
		} else {
			video.src = '';
		}
		this.initCamera.video = null;
	}
};

SudokuApp.prototype.pickPhoto = function (callback) {
	var pick;
	if (window.MozActivity) {
		pick = new MozActivity({
			name: 'pick',
			data: {
				type: ['image/png', 'image/jpg', 'image/jpeg']
			}
		});

		pick.onsuccess = function () {
			try {
				callback(URL.createObjectURL(this.result.blob));
			} catch (e) {
				callback();
			}
		};

		pick.onerror = function () {
			callback();
		};
	} else {
		pick = document.createElement('input');
		pick.type = 'file';
		pick.style.display = 'none';
		document.getElementsByTagName('body')[0].appendChild(pick);
		pick.addEventListener('change', function () {
			var file = pick.files[0];
			if (file) {
				try {
					callback(URL.createObjectURL(file));
				} catch (e) {
					callback();
				}
			} else {
				callback();
			}
			document.getElementsByTagName('body')[0].removeChild(pick);
		}, false);
		pick.click();
	}
};

SudokuApp.prototype.getImage = function (debug) {
	var source = document.getElementById('camera-img'),
		canvas = debug ? document.getElementById('canvas-img') : document.createElement('canvas'),
		w, h, f, MAX = 250;
	if (source.videoWidth && source.videoHeight) {
		w = source.videoWidth;
		h = source.videoHeight;
	} else if (source.naturalWidth && source.naturalHeight) {
		w = source.naturalWidth;
		h = source.naturalHeight;
	} else {
		w = source.width;
		h = source.height;
	}
	if (w > MAX || h > MAX) {
		f = MAX / Math.max(w, h);
		w = Math.round(w * f);
		h = Math.round(h * f);
	}
	canvas.width = w;
	canvas.height = h;
	canvas.getContext('2d').drawImage(source, 0, 0, w, h);
	this.removeCamera();
	return canvas;
};

SudokuApp.prototype.addListener = function (id, handler) {
	document.getElementById(id).addEventListener('click', handler.bind(this), false);
};

SudokuApp.prototype.hidePages = function () {
	document.getElementById('page-start').hidden = true;
	document.getElementById('page-training').hidden = true;
	document.getElementById('page-error').hidden = true;
	document.getElementById('page-camera').hidden = true;
	document.getElementById('page-debug').hidden = true;
	document.getElementById('page-edit').hidden = true;
};

SudokuApp.prototype.showPage = function (id) {
	this.hidePages();
	document.getElementById(id).hidden = false;
	document.getElementsByTagName('html')[0].scrollTop = 0;
};

//show different pages
SudokuApp.prototype.showPageStart = function (first) {
	var n, html;
	if (!first) {
		n = this.sudoku.solve();
		if (n === 0) {
			html = '<h1>' + _('solution-0') + '</h1>';
		} else {
			html = '<h1>' + (n > 1 ? _('solution-2') : _('solution-1')) + '</h1>';
			html += this.sudoku.toHtml();
		}
		document.getElementById('solution').innerHTML = html;
		document.getElementById('button-retry').style.display = '';
	} else {
		document.getElementById('button-retry').style.display = 'none';
	}
	this.showPage('page-start');
};

SudokuApp.prototype.showPageTraining = function () {
	var result = Sudoku.getTrainingResults(this.trainigData), html = [], i, j;
	html.push('<table>');
	for (i = 0; i < 7; i++) {
		html.push('<tr>');
		for (j = 0; j < 7; j++) {
			html.push('<td>');
			html.push(result.cov[7 * i + j]);
			html.push('</td>');
		}
		html.push('</tr>');
	}
	html.push('</table>');
	html.push('<table>');
	for (i = 0; i < 9; i++) {
		html.push('<tr>');
		html.push('<th>');
		html.push(i + 1);
		html.push('</th>');
		for (j = 0; j < 7; j++) {
			html.push('<td>');
			html.push(result.f[i][j]);
			html.push('</td>');
		}
		html.push('</tr>');
	}
	html.push('</table>');
	document.getElementById('training-result').innerHTML = html.join('');
	this.showPage('page-training');
};

SudokuApp.prototype.showPageError = function () {
	this.showPage('page-error');
};

SudokuApp.prototype.showPageCamera = function (src) {
	var imgvideo = document.getElementsByClassName('camera-img');
	this.showPage('page-camera');
	if (src) {
		document.getElementById('explain-camera').hidden = true;
		document.getElementById('explain-photo').hidden = false;
		imgvideo[0].id = '';
		imgvideo[0].style.display = 'none';
		imgvideo[1].id = 'camera-img';
		imgvideo[1].style.display = '';
		imgvideo[1].src = src;
	} else {
		document.getElementById('explain-camera').hidden = false;
		document.getElementById('explain-photo').hidden = true;
		imgvideo[0].id = 'camera-img';
		imgvideo[0].style.display = '';
		imgvideo[1].id = '';
		imgvideo[1].style.display = 'none';
		this.initCamera();
	}
};

SudokuApp.prototype.showPageDebug = function () {
	var canvas = this.getImage(true), table = document.getElementById('debug-table');
	table.innerHTML = '';
	this.showPage('page-debug');
	this.sudoku.fromImage(canvas,
		document.getElementById('canvas-bw'),
		document.getElementById('canvas-grid'),
		document.getElementById('canvas-sudoku'),
		table,
		!!this.trainigData
	);
	document.getElementById('debug-result').innerHTML = this.sudoku.toHtml();
};

SudokuApp.prototype.showPageEdit = function (fromCamera) {
	this.showPage('page-edit');
	if (fromCamera) {
		document.getElementById('explain-edit-camera').hidden = false;
		document.getElementById('explain-edit-start').hidden = true;
	} else {
		document.getElementById('explain-edit-camera').hidden = true;
		document.getElementById('explain-edit-start').hidden = false;
	}
	document.getElementById('edit-container').innerHTML = this.sudoku.toHtml('c');
};

//event handlers
SudokuApp.prototype.onEdit = function () {
	this.sudoku.empty();
	this.showPageEdit();
};

SudokuApp.prototype.onRetry = function () {
	this.sudoku.fromArray(this.backup);
	this.showPageEdit();
};

SudokuApp.prototype.onCamera = function () {
	this.showPageCamera();
};

SudokuApp.prototype.onPhoto = function () {
	var that = this;
	this.pickPhoto(function (src) {
		if (src) {
			that.showPageCamera(src);
		} else {
			that.onEdit();
		}
	});
};

SudokuApp.prototype.onTraining = function () {
	this.showPageTraining();
};

SudokuApp.prototype.onTrainingClear = function () {
	this.clearTrainingData();
	this.getTrainingData();
	this.onTrainingDone();
};

SudokuApp.prototype.onTrainingDone = function () {
	this.onEdit();
};

SudokuApp.prototype.onErrorDone = function () {
	this.onPhoto();
};

SudokuApp.prototype.onOCR = function () {
	this.sudoku.fromImage(this.getImage());
	this.showPageEdit(true);
};

SudokuApp.prototype.onDebug = function () {
	this.showPageDebug();
};

SudokuApp.prototype.onDebugDone = function () {
	var inputs, i, n, v;
	if (this.trainigData) {
		inputs = document.getElementById('debug-table').getElementsByTagName('input');
		for (i = 0; i < inputs.length; i++) {
			v = JSON.parse(inputs[i].dataset.moments);
			n = Number(inputs[i].value);
			if (n && !isNaN(n)) {
				Sudoku.addToTrainingData(this.trainigData, v, n);
			}
		}
		this.saveTrainingData();
	}
	this.showPageEdit(true);
};

SudokuApp.prototype.onSolve = function () {
	this.sudoku.fromForm('c');
	this.backup = this.sudoku.toArray();
	this.showPageStart();
};

return SudokuApp;
})();