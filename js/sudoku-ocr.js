/*global Sudoku, PerspT, numeric*/
(function () {
"use strict";

function median (list) {
	var l = list.length;
	list.sort(function (a, b) {
		return a - b;
	});
	if (l % 2) {
		return list[(l - 1) / 2];
	}
	return (list[l / 2 - 1] + list[l / 2]) / 2;
}

function canvasToGray (imageData) {
	var w = imageData.width, h = imageData.height, x, y, i = 0, out = [], row;
	for (y = 0; y < h; y++) {
		row = [];
		for (x = 0; x < w; x++) {
			//i = (y * w + x) * 4;
			row.push((imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / (3 * 256));
			i += 4;
		}
		out.push(row);
	}
	return out;
}

function accumalate (data) {
	var w = data[0].length, h = data.length, x, y, v, accumalated = [], row;
	for (y = 0; y < h; y++) {
		row = [];
		for (x = 0; x < w; x++) {
			v = data[y][x];
			if (x > 0) {
				v += row[x - 1];
			}
			if (y > 0) {
				v += accumalated[y - 1][x];
				if (x > 0) {
					v -= accumalated[y - 1][x - 1];
				}
			}
			row.push(v);
		}
		accumalated.push(row);
	}
	return accumalated;
}

function getMeanValue (accumalated, x, y, d) {
	var x0 = x - d, x1 = x + d, y0 = y - d, y1 = y + d, v;
	if (x1 >= accumalated[0].length) {
		x1 = accumalated[0].length - 1;
	}
	if (y1 >= accumalated.length) {
		y1 = accumalated.length - 1;
	}
	if (x0 < 0) {
		x0 = 0;
	}
	if (y0 < 0) {
		y0 = 0;
	}
	v = accumalated[y1][x1];
	if (x0 > 0) {
		v -= accumalated[y1][x0 - 1];
	}
	if (y0 > 0) {
		v -= accumalated[y0 - 1][x1];
		if (x0 > 0) {
			v += accumalated[y0 - 1][x0 - 1];
		}
	}
	return v / ((x1 - x0 + 1) * (y1 - y0 + 1));
}

function basedOnMean (data, d, f) {
	var w = data[0].length, h = data.length, x, y, out = [], row,
		accumalated = accumalate(data);
	for (y = 0; y < h; y++) {
		row = [];
		for (x = 0; x < w; x++) {
			row.push(f(
				getMeanValue(accumalated, x, y, d),
				data[y][x]
			));
		}
		out.push(row);
	}
	return out;
}

function grayToMonochrome (gray, d, t) {
	return basedOnMean(gray, d, function (mean, old) {
		return mean > old + t ? 1 : 0;
	});
}

function blur (data, d, p) {
	return basedOnMean(data, d, function (mean) {
		return mean > p ? 1 : 0;
	});
}

function largestComponent (data) {
	var w = data[0].length, h = data.length, x, y, v, v1, v2, i, out = [], row,
		components = [{ids: [0], count: 0}], idToComponent = [0];
	for (y = 0; y < h; y++) {
		row = [];
		for (x = 0; x < w; x++) {
			v = data[y][x];
			if (v) {
				v1 = y === 0 ? 0 : out[y - 1][x];
				v2 = x === 0 ? 0 : row[x - 1];
				if (!v1 && !v2) {
					v = idToComponent.length;
					idToComponent.push(components.length);
					components.push({ids: [v], count: 1});
				} else if (v1 && !v2) {
					v = v1;
					components[idToComponent[v]].count++;
				} else if (v2 && !v1) {
					v = v2;
					components[idToComponent[v]].count++;
				} else {
					v = Math.min(v1, v2);
					components[idToComponent[v]].count++;

					v1 = idToComponent[Math.max(v1, v2)];
					v2 = idToComponent[v];
					if (v1 !== v2) {
						for (i = 0; i < components[v1].ids.length; i++) {
							idToComponent[components[v1].ids[i]] = v2;
							components[v2].ids.push(components[v1].ids[i]);
						}
						components[v2].count += components[v1].count;
						components[v1] = {ids: [], count: 0};
					}
				}
			}
			row.push(v);
		}
		out.push(row);
	}
	v = {ids: [], count: 0};
	for (i = 0; i < components.length; i++) {
		if (components[i].count > v.count) {
			v = components[i];
		}
	}
	for (y = 0; y < h; y++) {
		for (x = 0; x < w; x++) {
			if (v.ids.indexOf(out[y][x]) > -1) {
				out[y][x] = 1;
			} else {
				out[y][x] = 0;
			}
		}
	}
	return out;
}

function filterInterior (data, mask) {
	var w = data[0].length, h = data.length,
		left = [], right = [], top = [], bottom = [],
		x, y, v, out = [], row;

	for (y = 0; y < h; y++) {
		inner0: for (x = 0; x < w; x++) {
			if (mask[y][x]) {
				break inner0;
			}
		}
		left[y] = x;
	}
	for (y = 0; y < h; y++) {
		inner1: for (x = w - 1; x >= 0; x--) {
			if (mask[y][x]) {
				break inner1;
			}
		}
		right[y] = x;
	}
	for (x = 0; x < w; x++) {
		inner2: for (y = 0; y < h; y++) {
			if (mask[y][x]) {
				break inner2;
			}
		}
		top[x] = y;
	}
	for (x = 0; x < w; x++) {
		inner3: for (y = h - 1; y >= 0; y--) {
			if (mask[y][x]) {
				break inner3;
			}
		}
		bottom[x] = y;
	}

	for (y = 0; y < h; y++) {
		row = [];
		for (x = 0; x < w; x++) {
			v = 0;
			if (
				data[y][x] &&
				(
					(left[y] <= x && x <= right[y]) ||
					(top[x] <= y && y <= bottom[x])
				)
			) {
				v = 1;
			}
			row.push(v);
		}
		out.push(row);
	}
	return out;
}

function linesFromData (data, d) {
	var i, j, dPreliminary = [], diff = [], start, lines = [];
	i = -1;
	whiled: while (dPreliminary.length < 10) {
		i++;
		for (j = 0; j < dPreliminary.length; j++) {
			if (Math.abs(dPreliminary[j] - data[i].d) < d) {
				continue whiled;
			}
		}
		dPreliminary.push(data[i].d);
	}
	dPreliminary.sort(function (a, b) {
		return a - b;
	});
	for (i = 0; i < dPreliminary.length - 1; i++) {
		diff.push(dPreliminary[i + 1] - dPreliminary[i]);
	}
	diff = median(diff);
	for (i = 0; i < dPreliminary.length; i++) {
		dPreliminary[i] -= i * diff;
	}
	start = median(dPreliminary);
	for (i = 0; i < 10; i++) {
		j = 0;
		while (Math.abs(data[j].d - start) >= d) {
			j++;
		}
		lines.push({d: data[j].d, a: data[j].a});
		start = data[j].d + diff;
	}
	return lines;
}

function hough (data, angle, diff) {
	var w = data[0].length, h = data.length,
		minA = angle - 10, maxA = angle + 10, aStep = 2, a,
		minD = -(w + h), maxD = w + h, d,
		houghData = [], dummy,
		x, y,
		best = [], v, maxVal, bestA;

	for (a = minA; a < maxA; a += aStep) {
		dummy = [];
		for (d = minD; d < maxD; d++) {
			dummy.push(0);
		}
		houghData.push(dummy);
	}

	for (y = 0; y < h; y++) {
		for (x = 0; x < w; x++) {
			if (data[y][x]) {
				for (a = minA; a < maxA; a += aStep) {
					d = Math.round(x * Math.cos(a * Math.PI / 180) + y * Math.sin(a * Math.PI / 180));
					if (minD <= d && d < maxD) {
						houghData[(a - minA) / aStep][d - minD]++;
					}
				}
			}
		}
	}

	for (d = minD; d < maxD; d++) {
		maxVal = 0;
		bestA = minA;
		for (a = minA; a < maxA; a += aStep) {
			v = houghData[(a - minA) / aStep][d - minD];
			if (v > maxVal) {
				maxVal = v;
				bestA = a;
			}
		}
		best.push({a: bestA, d: d, v: maxVal});
	}
	best.sort(function (a, b) {
		return b.v - a.v;
	});

	return linesFromData(best, diff);
}

function intersect (tb, lr) {
	function intersectOne (d1, a1, d2, a2) {
		var ca1 = Math.cos(a1 * Math.PI / 180), sa1 = Math.sin(a1 * Math.PI / 180),
			ca2 = Math.cos(a2 * Math.PI / 180), sa2 = Math.sin(a2 * Math.PI / 180),
			x, y;
		y = (d1 * ca2 - d2 * ca1) / (sa1 * ca2 - sa2 * ca1);
		x = (d2 - y * sa2) / ca2; //prefer d2, a2 over d1, a1, since a2 is near 0°
		return {x: x, y: y};
	}
	return [
		intersectOne(tb[0].d, tb[0].a, lr[0].d, lr[0].a),
		intersectOne(tb[0].d, tb[0].a, lr[1].d, lr[1].a),
		intersectOne(tb[1].d, tb[1].a, lr[1].d, lr[1].a),
		intersectOne(tb[1].d, tb[1].a, lr[0].d, lr[0].a)
	];
}

function skew (data, corners, d) {
	var out = [], row, x, y, v,
		persp = new PerspT(
			[0, 0, d, 0, d, d, 0, d],
			[corners[0].x, corners[0].y, corners[1].x, corners[1].y,
			corners[2].x, corners[2].y, corners[3].x, corners[3].y]
		);

	function get (x, y) {
		try {
			return data[y][x];
		} catch (e) {
			return 0;
		}
	}

	function interpolate (x, y) {
		var x0 = Math.floor(x), y0 = Math.floor(y), px0 = 1 - (x % 1), py0 = 1 - (y % 1),
			v0, v1, v2, v3;
		v0 = get(x0, y0);
		v1 = get(x0, y0 + 1);
		v2 = get(x0 + 1, y0);
		v3 = get(x0 + 1, y0 + 1);
		return v0 * px0 * py0 + v1 * px0 * (1 - py0) + v2 * (1 - px0) * py0 + v3 * (1 - px0) * (1 - py0);
	}

	for (y = 0; y < d; y++) {
		row = [];
		for (x = 0; x < d; x++) {
			v = persp.transform(x, y);
			v = interpolate(v[0], v[1]);
			v = Math.round(v); //TODO ?
			row.push(v);
		}
		out.push(row);
	}
	return out;
}

function extract (data, x0, y0, w, h) {
	var out = [], row, x, y;
	for (y = 0; y < h; y++) {
		row = [];
		for (x = 0; x < w; x++) {
			row.push(data[y + y0][x + x0]);
		}
		out.push(row);
	}
	return out;
}

function removeGrid (data) {
	var w = data[0].length, h = data.length,
		left = [], right = [], top = [], bottom = [],
		x, y, v, out = [], row;

	for (y = 0; y < h; y++) {
		x = 0;
		//TODO since we rounded to 0 or 1, 0.1 is arbitrary and useless,
		//but if we don't round, we should pay attention to this value
		while (data[y][x] < 0.1 && x < w / 8) {
			x++;
		}
		if (data[y][x] < 0.1) {
			left[y] = 0; //no border
		} else {
			while (data[y][x] > 0.1 && x < w / 4) {
				x++;
			}
			left[y] = x;
		}
	}
	for (y = 0; y < h; y++) {
		x = w - 1;
		while (data[y][x] < 0.1 && x > 7 * w / 8) {
			x--;
		}
		if (data[y][x] < 0.1) {
			right[y] = w - 1;
		} else {
			while (data[y][x] > 0.1 && x > 3 * w / 4) {
				x--;
			}
			right[y] = x;
		}
	}
	for (x = 0; x < w; x++) {
		y = 0;
		while (data[y][x] < 0.1 && y < h / 8) {
			y++;
		}
		if (data[y][x] < 0.1) {
			top[x] = 0;
		} else {
			while (data[y][x] > 0.1 && y < h / 4) {
				y++;
			}
			top[x] = y;
		}
	}
	for (x = 0; x < w; x++) {
		y = h - 1;
		while (data[y][x] < 0.1 && y > 7 * h / 8) {
			y--;
		}
		if (data[y][x] < 0.1) {
			bottom[x] = h - 1;
		} else {
			while (data[y][x] > 0.1 && y > 3 * h / 4) {
				y--;
			}
			bottom[x] = y;
		}
	}

	for (y = 0; y < h; y++) {
		row = [];
		for (x = 0; x < w; x++) {
			v = 0;
			if (
				(left[y] <= x && x <= right[y]) &&
				(top[x] <= y && y <= bottom[x])
			) {
				v = data[y][x];
			}
			if (
				v > 0 &&
				x > 0 && x < w - 1 &&
				y > 0 && y < h - 1 &&
				data[y - 1][x - 1] < 0.1 && data[y - 1][x] < 0.1 && data[y - 1][x + 1] < 0.1 &&
				data[y][x - 1] < 0.1 && data[y][x + 1] < 0.1 &&
				data[y + 1][x - 1] < 0.1 && data[y + 1][x] < 0.1 && data[y + 1][x + 1] < 0.1
			) {
				v = 0;
			}
			row.push(v);
		}
		out.push(row);
	}
	return out;
}

function getCell (data, x, y, horizontal, vertical, d) {
	var points = intersect(
			[horizontal[y], horizontal[y + 1]],
			[vertical[x], vertical[x + 1]
		]);
	return removeGrid(extract(skew(data, points, d), 0, 0, d, d));
}

function moment (data, p, q, xm, ym) {
	var w = data[0].length, h = data.length, x, y, s = 0;
	for (x = 0; x < w; x++) {
		for (y = 0; y < h; y++) {
			s += Math.pow(x - (xm || 0), p) * Math.pow(y - (ym || 0), q) * data[y][x];
		}
	}
	return s;
}

function normCentMom (data, p, q, m00, m10, m01) {
	return moment(data, p, q, m10 / m00, m01 / m00) / Math.pow(m00, 1 + (p + q) / 2);
}

function feature (data) {
	var m00, m10, m01;
	m00 = moment(data, 0, 0);
	if (m00 < 20) {
		return false;
	}
	m10 = moment(data, 1, 0);
	m01 = moment(data, 0, 1);

	return [
		normCentMom(data, 2, 0, m00, m10, m01),
		normCentMom(data, 1, 1, m00, m10, m01),
		normCentMom(data, 0, 2, m00, m10, m01),
		normCentMom(data, 3, 0, m00, m10, m01),
		normCentMom(data, 2, 1, m00, m10, m01),
		normCentMom(data, 1, 2, m00, m10, m01),
		normCentMom(data, 0, 3, m00, m10, m01)
	];
}

function emptyTrainingData () {
	return {
		n: 0,
		N: [0, 0, 0, 0, 0, 0, 0, 0, 0],
		m: [0, 0, 0, 0, 0, 0, 0],
		s: [0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 0],
		f: [
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0]
		]
	};
}

function addToTrainingData (trainingData, vector, result) {
	var i, j;
	trainingData.n++;
	trainingData.N[result - 1]++;
	for (i = 0; i < 7; i++) {
		trainingData.m[i] += vector[i];
		for (j = 0; j < 7; j++) {
			trainingData.s[7 * i + j] += vector[i] * vector[j];
		}
	}
	for (i = 0; i < 7; i++) {
		trainingData.f[result - 1][i] += vector[i];
	}
}

function to7x7 (mat) {
	var mat2 = [], row, i, j;
	for (i = 0; i < 7; i++) {
		row = [];
		for (j = 0; j < 7; j++) {
			row.push(mat[7 * i + j]);
		}
		mat2.push(row);
	}
	return mat2;
}

function from7x7 (mat2) {
	var mat = [], i, j;
	for (i = 0; i < 7; i++) {
		for (j = 0; j < 7; j++) {
			mat[7 * i + j] = mat2[j][i];
		}
	}
	return mat;
}

function getTrainingResults (trainingData) {
	var i, j, m = [], s = [], f = [];
	for (i = 0; i < 7; i++) {
		m[i] = trainingData.m[i] / trainingData.n;
	}
	for (i = 0; i < 49; i++) {
		s[i] = trainingData.s[i] / (trainingData.n - 1);
	}

	for (i = 0; i < 7; i++) {
		for (j = 0; j < 7; j++) {
			s[7 * i + j] = 10000 * (s[7 * i + j] - m[i] * m[j]);
		}
	}
	s = to7x7(s);
	s = numeric.inv(s);
	s = from7x7(s);
	for (i = 0; i < 49; i++) {
		s[i] = Math.round(100 * s[i]) / 10;
	}

	for (i = 0; i < 9; i++) {
		f[i] = [];
		for (j = 0; j < 7; j++) {
			f[i][j] = Math.round(1000 * (trainingData.f[i][j] / trainingData.N[i])) / 1000;
		}
	}
	return {cov: s, f: f};
}

function diff (a, b, cov) {
	var d = 0, i, j;
	for (i = 0; i < 7; i++) {
		for (j = 0; j < 7; j++) {
			d += cov[7 * i + j] * (a[i] - b[i]) * (a[j] - b[j]);
		}
	}
	return d;
}

function ocr (data, log) {
	var f = feature(data), i, d, rec = [],
		F = [
			[0.035, 0.016, 0.292, 0.000, 0.004, -0.004, -0.016],
			[0.062, -0.015, 0.277, -0.003, 0.002, -0.009, -0.014],
			[0.061, -0.004, 0.265, -0.006, 0.003, -0.022, -0.001],
			[0.071, 0.005, 0.133, -0.010, 0.003, 0.014, -0.000],
			[0.065, 0.013, 0.240, 0.000, 0.002, -0.005, 0.002],
			[0.071, 0.008, 0.173, 0.002, 0.004, 0.005, -0.013],
			[0.070, -0.041, 0.269, 0.000, -0.008, -0.029, 0.049],
			[0.067, -0.001, 0.164, 0.000, 0.002, 0.000, 0.000],
			[0.071, 0.008, 0.174, -0.002, -0.004, -0.005, 0.012]
		], COV = [ //10 * inverse of covariance matrix
			7.7, 0.8, 0.8, 4.6, -2.4, 1.5, -1.2,
			0.8, 4.9, -0.0, -0.9, 0.0, -3.7, 0.8,
			0.8, -0.0, 0.6, 0.2, -1.5, 2.5, 0.3,
			4.6, -0.9, 0.2, 37.9, -1.9, 2.7, -1.6,
			-2.4, 0.0, -1.5, -1.9, 85.8, -10.6, 11.8,
			1.5, -3.7, 2.5, 2.7, -10.6, 21.0, 2.2,
			-1.2, 0.8, 0.3, -1.6, 11.8, 2.2, 5.4
		];
	if (!f) {
		return rec;
	}
	for (i = 0; i < F.length; i++) {
		d = diff(F[i], f, COV);
		if (d < 0.25) {
			rec.push({n: i + 1, d: d});
		}
	}
	if (rec.length === 0) {
		return rec;
	}
	rec.sort(function (a, b) {
		return a.d - b.d;
	});

	if (log) {
		log(data, f[0], f[1], f[2], f[3], f[4], f[5], f[6], String(rec[0].n), Math.sqrt(rec[0].d));
	}
	return rec;
}

function drawMono (canvas, mono) {
	var w = mono[0].length, h = mono.length,
		context = canvas.getContext('2d'),
		x, y, i = 0, imageData = context.createImageData(w, h);
	canvas.width = w;
	canvas.height = h;
	for (y = 0; y < h; y++) {
		for (x = 0; x < w; x++) {
			//i = (y * w + x) * 4;
			imageData.data[i] = mono[y][x] ? 0 : 255;
			imageData.data[i + 1] = mono[y][x] ? 0 : 255;
			imageData.data[i + 2] = mono[y][x] ? 0 : 255;
			imageData.data[i + 3] = 255;
			i += 4;
		}
	}
	context.putImageData(imageData, 0, 0);
}

function drawGray (canvas, gray) {
	var w = gray[0].length, h = gray.length,
		context = canvas.getContext('2d'),
		x, y, v, i = 0, imageData = context.createImageData(w, h);
	canvas.width = w;
	canvas.height = h;
	for (y = 0; y < h; y++) {
		for (x = 0; x < w; x++) {
			//i = (y * w + x) * 4;
			v = Math.round((1 - gray[y][x]) * 255);
			imageData.data[i] = v;
			imageData.data[i + 1] = v;
			imageData.data[i + 2] = v;
			imageData.data[i + 3] = 255;
			i += 4;
		}
	}
	context.putImageData(imageData, 0, 0);
}

function showGrid (canvas, horizontal, vertical) {
	var context = canvas.getContext('2d'), i, points;

	context.strokeStyle = 'rgba(0,127,0,0.2)';
	context.lineWidth = 3;

	for (i = 0; i < 10; i += 2) {
		points = intersect([horizontal[i], horizontal[i + 1]], [vertical[0], vertical[9]]);
		context.beginPath();
		context.moveTo(points[0].x, points[0].y);
		context.lineTo(points[1].x, points[1].y);
		context.stroke();
		context.beginPath();
		context.moveTo(points[3].x, points[3].y);
		context.lineTo(points[2].x, points[2].y);
		context.stroke();
	}
	for (i = 0; i < 10; i += 2) {
		points = intersect([horizontal[0], horizontal[9]], [vertical[i], vertical[i + 1]]);
		context.beginPath();
		context.moveTo(points[0].x, points[0].y);
		context.lineTo(points[3].x, points[3].y);
		context.stroke();
		context.beginPath();
		context.moveTo(points[1].x, points[1].y);
		context.lineTo(points[2].x, points[2].y);
		context.stroke();
	}
}

function makeRow (data, m20, m11, m02, m30, m21, m12, m03, result, d, train) {

	function makeCell (content) {
		var td = document.createElement('td');
		switch (typeof content) {
		case 'number':
			content = String(Math.round(1000 * content));
			/*falls through*/
		case 'string':
			content = document.createTextNode(content);
		}
		td.appendChild(content);
		return td;
	}

	function makeInput (val, v) {
		var input = document.createElement('input');
		input.type = 'number';
		input.value = val;
		input.maxLength = 1;
		input.dataset.moments = v;
		return input;
	}

	var row = document.createElement('tr'), canvas = document.createElement('canvas');
	drawGray(canvas, data);
	row.appendChild(makeCell(canvas));
	row.appendChild(makeCell(m20));
	row.appendChild(makeCell(m11));
	row.appendChild(makeCell(m02));
	row.appendChild(makeCell(m30));
	row.appendChild(makeCell(m21));
	row.appendChild(makeCell(m12));
	row.appendChild(makeCell(m03));
	row.appendChild(makeCell(result));
	row.appendChild(makeCell(d));
	row.appendChild(makeCell(train ?
		makeInput(result, JSON.stringify([m20, m11, m02, m30, m21, m12, m03])) :
		''));
	return row;
}

Sudoku.prototype.fromImage = function (canvas0, canvas1, canvas2, canvas3, table, training) {
	var w, h, imageData,
		gray, mono, component,
		horizontal, vertical, digit,
		x, y;

	function log (data, m20, m11, m02, m30, m21, m12, m03, result, d) {
		table.appendChild(makeRow(data, m20, m11, m02, m30, m21, m12, m03, result, d, training));
	}

	this.empty();

	w = canvas0.width;
	h = canvas0.height;

	imageData = canvas0.getContext('2d').getImageData(0, 0, w, h);
	gray = canvasToGray(imageData);
	mono = grayToMonochrome(gray, Math.round(Math.min(w, h) / 40), 0.05);
	if (canvas1) {
		drawMono(canvas1, mono);
	}

	component = largestComponent(blur(mono, 1, 0.3));
	if (canvas2) {
		drawMono(canvas2, component);
	}

	component = filterInterior(mono, component);
	if (canvas3) {
		drawMono(canvas3, component);
	}

	vertical = hough(component, 0, Math.min(w, h) / 30);
	horizontal = hough(component, 90, Math.min(w, h) / 30);
	if (canvas1) {
		showGrid(canvas0, horizontal, vertical);
	}

	for (y = 0; y < 9; y++) {
		for (x = 0; x < 9; x++) {
			digit = getCell(mono, x, y, horizontal, vertical, 32);
			this.grid[y][x] = ocr(digit, table && log);
		}
	}

	this.fixOCR();
};

function countConflicts (grid, x0, y0) {
	var n, x, y, i, j, conflicts = 0;

	function getN (x, y) {
		return grid[y][x].length && grid[y][x][0].n;
	}

	n = getN(x0, y0);
	if (!n) {
		return conflicts;
	}

	for (x = 0; x < 9; x++) {
		if (x !== x0 && getN(x, y0) === n) {
			conflicts++;
		}
	}

	for (y = 0; y < 9; y++) {
		if (y !== y0 && getN(x0, y) === n) {
			conflicts++;
		}
	}

	for (i = 0; i < 3; i++) {
		for (j = 0; j < 3; j++) {
			x = i + 3 * Math.floor(x0 / 3);
			y = j + 3 * Math.floor(y0 / 3);
			if ((x !== x0 || y !== y0) && getN(x, y) === n) {
				conflicts++;
			}
		}
	}

	return conflicts;
}

function strongestConflict (grid) {
	var x, y, c, d, x0, y0, d0 = Infinity;
	for (x = 0; x < 9; x++) {
		for (y = 0; y < 9; y++) {
			c = countConflicts(grid, x, y);
			if (c) {
				d = grid[y][x].length > 1 ? grid[y][x][1].d : 0.3;
				d -= grid[y][x][0].d;
				d /= c;
				if (d < d0) {
					x0 = x;
					y0 = y;
					d0 = d;
				}
			}
		}
	}
	return d0 === Infinity ? false : [x0, y0];
}

Sudoku.prototype.fixOCR = function () {
	/*jshint boss: true*/
	var x, y, conflict, d;

	while (conflict = strongestConflict(this.grid)) {
		this.grid[conflict[1]][conflict[0]].shift();
	}

	for (y = 0; y < 9; y++) {
		for (x = 0; x < 9; x++) {
			d = this.grid[y][x];
			if (d.length) {
				d = d[0].n;
			} else {
				d = '';
			}
			this.grid[y][x] = d;
		}
	}
};

Sudoku.emptyTrainingData = emptyTrainingData;
Sudoku.addToTrainingData = addToTrainingData;
Sudoku.getTrainingResults = getTrainingResults;

})();