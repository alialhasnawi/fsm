import { ExportAsLaTeX } from "../export_as/latex";
import { ExportAsSVG } from "../export_as/svg";
import { snapToPadding } from "./constants";
import { saveBackup } from "./save";
import { canvas, links, nodes, state } from "./state";

const greekLetterNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'];

/**
 * Replace all LaTeX greek letter shortcuts with their characters.
 * @param {string} text 
 * @returns Converted string.
 */
export function convertLatexShortcuts(text) {
	// html greek characters
	for (let i = 0; i < greekLetterNames.length; i++) {
		const name = greekLetterNames[i];
		text = text.replace(new RegExp('\\\\' + name, 'g'), String.fromCharCode(913 + i + +(i > 16)));
		text = text.replace(new RegExp('\\\\' + name.toLowerCase(), 'g'), String.fromCharCode(945 + i + +(i > 16)));
	}

	// subscripts
	for (let i = 0; i < 10; i++) {
		text = text.replace(new RegExp('_' + i, 'g'), String.fromCharCode(8320 + i));
	}

	return text;
}

/**
 * Convert text string to XML safe text.
 * @param {string} text 
 * @returns XML string.
 */
export function textToXML(text) {
	text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	let result = '';
	for (let i = 0; i < text.length; i++) {
		let c = text.charCodeAt(i);
		if (c >= 0x20 && c <= 0x7E) {
			result += text[i];
		} else {
			result += '&#' + c + ';';
		}
	}
	return result;
}

/**
 * Draw an arrow at (x, y).
 * @param {CanvasRenderingContext2D} c 
 * @param {number} x 
 * @param {number} y 
 * @param {number} angle Degree in radians.
 */
export function drawArrow(c, x, y, angle) {
	const dx = Math.cos(angle);
	const dy = Math.sin(angle);
	c.beginPath();
	c.moveTo(x, y);
	c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
	c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
	c.fill();
}

/**
 * Return true if the canvas has focus.
 */
export function canvasHasFocus() {
	return (document.activeElement || document.body) == document.body;
}

/**
 * Draw text at (x, y).
 * @param {CanvasRenderingContext2D} c 
 * @param {string} originalText 
 * @param {number} x 
 * @param {number} y 
 * @param {number|null} angleOrNull Angle in radians by which to slide the text.
 * @param {boolean} isSelected 
 */
export function drawText(c, originalText, x, y, angleOrNull, isSelected) {
	const text = convertLatexShortcuts(originalText);
	c.font = '20px "Times New Roman", serif';
	const width = c.measureText(text).width;

	// center the text
	x -= width / 2;

	// position the text intelligently if given an angle
	if (angleOrNull != null) {
		const cos = Math.cos(angleOrNull);
		const sin = Math.sin(angleOrNull);
		const cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
		const cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
		const slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
		x += cornerPointX - sin * slide;
		y += cornerPointY + cos * slide;
	}

	// draw text and caret (round the coordinates so the caret falls on a pixel)
	if ('advancedFillText' in c) {
		// @ts-ignore
		c.advancedFillText(text, originalText, x + width / 2, y, angleOrNull);
	} else {
		x = Math.round(x);
		y = Math.round(y);
		c.fillText(text, x, y + 6);
		if (isSelected && caretVisible && canvasHasFocus() && document.hasFocus()) {
			x += width;
			c.beginPath();
			c.moveTo(x, y - 10);
			c.lineTo(x, y + 10);
			c.stroke();
		}
	}
}

let caretTimer;
let caretVisible = true;

/**
 * Reset the flashing caret cursor's timer.
 */
export function resetCaret() {
	clearInterval(caretTimer);
	caretTimer = setInterval(function () {
		caretVisible = !caretVisible; draw();
	}, 500);
	caretVisible = true;
}

/**
 * Draw the canvas using the given context.
 * @param {CanvasRenderingContext2D} c 
 */
function drawUsing(c) {
	c.clearRect(0, 0, canvas.width, canvas.height);
	c.save();
	c.translate(0.5, 0.5);

	for (let i = 0; i < nodes.length; i++) {
		c.lineWidth = 1;
		c.fillStyle = c.strokeStyle = (nodes[i] == state.selectedObject) ? 'blue' : 'black';
		nodes[i].draw(c);
	}
	for (let i = 0; i < links.length; i++) {
		c.lineWidth = 1;
		c.fillStyle = c.strokeStyle = (links[i] == state.selectedObject) ? 'blue' : 'black';
		links[i].draw(c);
	}
	if (state.currentLink != null) {
		c.lineWidth = 1;
		c.fillStyle = c.strokeStyle = 'black';
		state.currentLink.draw(c);
	}

	c.restore();
}

export function draw() {
	drawUsing(canvas.getContext('2d'));
	saveBackup();
}

export function selectObject(x, y) {
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i].containsPoint(x, y)) {
			return nodes[i];
		}
	}
	for (let i = 0; i < links.length; i++) {
		if (links[i].containsPoint(x, y)) {
			return links[i];
		}
	}
	return null;
}

export function snapNode(node) {
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i] == node) continue;

		if (Math.abs(node.x - nodes[i].x) < snapToPadding) {
			node.x = nodes[i].x;
		}

		if (Math.abs(node.y - nodes[i].y) < snapToPadding) {
			node.y = nodes[i].y;
		}
	}
}

/**
 * @param {KeyboardEvent} e
 */
export function crossBrowserKey(e) {
	return e.key;
}

/**
 * @param {Event} e
 */
function crossBrowserElementPos(e) {
	e = e || window.event;
	/** @type {HTMLElement} */
	// @ts-ignore
	let obj = e.target;
	let x = 0, y = 0;
	while (obj.offsetParent) {
		x += obj.offsetLeft;
		y += obj.offsetTop;
		// @ts-ignore
		obj = obj.offsetParent;
	}
	return { 'x': x, 'y': y };
}

function crossBrowserMousePos(e) {
	e = e || window.event;
	return {
		'x': e.pageX || e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
		'y': e.pageY || e.clientY + document.body.scrollTop + document.documentElement.scrollTop,
	};
}

/**
 * @param {any} e
 */
export function crossBrowserRelativeMousePos(e) {
	const element = crossBrowserElementPos(e);
	const mouse = crossBrowserMousePos(e);
	return {
		'x': mouse.x - element.x,
		'y': mouse.y - element.y
	};
}

/**
 * @param {string} text
 */
function output(text) {
	const element = document.getElementById('output');
	element.style.display = 'block';
	// @ts-ignore
	element.value = text;
}

export function saveAsPNG() {
	const oldSelectedObject = state.selectedObject;
	state.selectedObject = null;
	drawUsing(canvas.getContext('2d'));
	state.selectedObject = oldSelectedObject;
	const pngData = canvas.toDataURL('image/png');
	document.location.href = pngData;
}

export function saveAsSVG() {
	const exporter = new ExportAsSVG();
	const oldSelectedObject = state.selectedObject;
	state.selectedObject = null;
	// @ts-ignore
	drawUsing(exporter);
	state.selectedObject = oldSelectedObject;
	const svgData = exporter.toSVG();
	output(svgData);
	// Chrome isn't ready for this yet, the 'Save As' menu item is disabled
	// document.location.href = 'data:image/svg+xml;base64,' + btoa(svgData);
}

export function saveAsLaTeX() {
	const exporter = new ExportAsLaTeX();
	const oldSelectedObject = state.selectedObject;
	state.selectedObject = null;
	// @ts-ignore
	drawUsing(exporter);
	state.selectedObject = oldSelectedObject;
	const texData = exporter.toLaTeX();
	output(texData);
}
