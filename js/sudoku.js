/*global Sudoku: true*/
Sudoku =
(function () {
"use strict";

function Sudoku () {
	this.empty();
}

Sudoku.prototype.empty = function () {
	var row, i, j;
	this.grid = [];
	for (i = 1; i <= 9; i++) {
		row = [];
		for (j = 1; j <= 9; j++) {
			row.push('');
		}
		this.grid.push(row);
	}
};

Sudoku.prototype.fromArray = function (grid) {
	this.grid = grid;
};

Sudoku.prototype.fromForm = function (prefix) {
	var row, i, j;
	this.grid = [];
	for (i = 1; i <= 9; i++) {
		row = [];
		for (j = 1; j <= 9; j++) {
			row.push(document.getElementById(prefix + i + j).value);
		}
		this.grid.push(row);
	}
};

Sudoku.prototype.toArray = function () {
	//return a copy
	return JSON.parse(JSON.stringify(this.grid));
};

Sudoku.prototype.toHtml = function (prefix) {
	var html = [], row, i, j;

	function getClasses (i, j) {
		var c = [];
		switch (i % 3) {
		case 0: c.push('t'); break;
		case 2: c.push('b');
		}
		switch (j % 3) {
		case 0: c.push('l'); break;
		case 2: c.push('r');
		}
		return c.join(' ');
	}

	function getInner (i, j, val) {
		return prefix ?
			'<input value="' + val + '" id="' + prefix + i + j + '" maxlength="1" type="number">' :
			val;
	}

	for (i = 1; i <= 9; i++) {
		row = [];
		for (j = 1; j <= 9; j++) {
			row.push('<td class="' + getClasses(i - 1, j - 1) + '">' +
				getInner(i, j, this.grid[i - 1][j - 1]) + '</td>');
		}
		html.push('<tr>' + row.join('') + '</tr>');
	}
	return '<table class="sudoku">' + html.join('') + '</table>';
};

return Sudoku;
})();