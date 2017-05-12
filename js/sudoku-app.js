/*global SudokuApp: true, Sudoku, _, URL, performance, MozActivity*/
SudokuApp =
(function () {
"use strict";

function SudokuApp (debug) {
	this.sudoku = new Sudoku();
	this.addListener('button-edit', this.onEdit);
	this.addListener('button-retry', this.onRetry);
	this.addListener('button-camera', this.onCamera);
	this.addListener('button-photo', this.onPhoto);
	this.addListener('button-test-image', this.onTestImage);
	this.addListener('button-training', this.onTraining);
	this.addListener('button-debug-on', this.onDebugOn);
	this.addListener('button-debug-off', this.onDebugOff);
	this.addListener('button-training-clear', this.onTrainingClear);
	this.addListener('button-training-done', this.onTrainingDone);
	this.addListener('button-error-done', this.onErrorDone);
	this.addListener('button-ocr', this.onOCR);
	this.addListener('button-debug', this.onDebug);
	this.addListener('button-debug-done', this.onDebugDone);
	this.addListener('button-solve', this.onSolve);
	if (!debug) {
		document.getElementById('train-explain').style.display = 'none';
		document.getElementById('train-header').style.display = 'none';
		document.getElementById('train-add').style.display = 'none';
		document.getElementById('button-test-image').style.display = 'none';
		document.getElementById('button-training').style.display = 'none';
		document.getElementById('button-debug-off').style.display = 'none';
	} else {
		document.getElementById('button-debug-on').style.display = 'none';
		this.getTrainingData();
	}
	document.getElementById('button-retry').style.display = 'none';
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
		this.trainigData = JSON.parse(localStorage.getItem('sudoku-training')) || Sudoku.emptyTrainingData();
	} catch (e) {
		this.trainigData = Sudoku.emptyTrainingData();
	}
};

SudokuApp.prototype.saveTrainingData = function () {
	try {
		localStorage.setItem('sudoku-training', JSON.stringify(this.trainigData));
	} catch (e) {
	}
};

SudokuApp.prototype.clearTrainingData = function () {
	try {
		localStorage.removeItem('sudoku-training');
	} catch (e) {
	}
};

SudokuApp.prototype.getTimer = function () {
	var data = {}, now = Date.now;
	if (window.performance && performance.now) {
		now = performance.now.bind(performance);
	}

	function startStop (id) {
		if (id in data) {
			data[id] = now() - data[id];
		} else {
			data[id] = now();
		}
	}

	function get (id) {
		return data[id];
	}

	return {
		startStop: startStop,
		get: get
	};
};

SudokuApp.prototype.showTimerData = function (ids, get) {
	var i, id;
	for (i = 0; i < ids.length; i++) {
		id = ids[i];
		document.getElementById('timer-' + id).innerHTML = Math.round(get(id));
	}
};

//NOTE: constraints isn't converted for different versions,
//so only use what's common for all implementations
//(the defaults are better than the mess required to make it work for all versions)
//use old syntax to avoid requiring promises
SudokuApp.prototype.getUserMedia = function (constraints, success, error) {
	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices.getUserMedia(constraints).then(success, error);
	} else if (navigator.getUserMedia) {
		navigator.getUserMedia(constraints, success, error);
	} else if (navigator.mozGetUserMedia) {
		navigator.mozGetUserMedia(constraints, success, error);
	} else if (navigator.webkitGetUserMedia) {
		navigator.webkitGetUserMedia(constraints, success, error);
	} else {
		error();
	}
};

SudokuApp.prototype.initCamera = function () {
	var video;
/* ideal = {
	width: 266,
	height: 200,
	facingMode: 'environment'
}*/
	if (!this.initCamera.video) {
		video = document.getElementById('camera-img');
		this.getUserMedia({video: true}, function (stream) {
			if ('srcObject' in video) {
				video.srcObject = stream;
			} else if ('mozSrcObject' in video) {
				video.mozSrcObject = stream;
			} else if (window.URL) {
				video.src = URL.createObjectURL(stream);
			} else {
				video.src = stream;
			}
			this.initCamera.video = video;
			video.play();
		}.bind(this), this.showPageError.bind(this));
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
	}
	this.showPage('page-start');
};

SudokuApp.prototype.showPageTraining = function () {
	var result = Sudoku.getTrainingResults(this.trainigData), html = [], i, j;
	if (result) {
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
	} else {
		html.push(_('no-training-data'));
	}
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
	var canvas = this.getImage(true), table = document.getElementById('debug-table'), timer = this.getTimer();
	table.innerHTML = '';
	this.sudoku.fromImage(canvas,
		document.getElementById('canvas-bw'),
		document.getElementById('canvas-grid'),
		document.getElementById('canvas-sudoku'),
		table,
		!!this.trainigData,
		timer.startStop
	);
	this.showTimerData(['all', 'read-data', 'gray', 'mono', 'component', 'interior', 'hough', 'ocr', 'fix'], timer.get);
	document.getElementById('debug-result').innerHTML = this.sudoku.toHtml();
	this.showPage('page-debug');
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
	this.pickPhoto(function (src) {
		if (src) {
			this.showPageCamera(src);
		} else {
			this.onEdit();
		}
	}.bind(this));
};

SudokuApp.prototype.onTestImage = function () {
	this.showPageCamera('sudoku.png');
};

SudokuApp.prototype.onTraining = function () {
	this.showPageTraining();
};

SudokuApp.prototype.onDebugOn = function () {
	location.href = 'index.html?debug=true';
};

SudokuApp.prototype.onDebugOff = function () {
	location.href = 'index.html?debug=false';
};

SudokuApp.prototype.onTrainingClear = function () {
	this.clearTrainingData();
	this.getTrainingData();
	this.onTrainingDone();
};

SudokuApp.prototype.onTrainingDone = function () {
	this.showPageStart(true);
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
	if (this.trainigData && document.getElementById('check-train-add').checked) {
		inputs = document.getElementById('debug-table').getElementsByTagName('input');
		for (i = 0; i < inputs.length; i++) {
			v = JSON.parse(inputs[i].dataset.moments);
			n = Sudoku.validateNumber(inputs[i].value);
			if (n) {
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