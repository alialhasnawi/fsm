// draw using this instead of a canvas and call toSVG() afterward

import { textToXML } from "../main/fsm";
import { fixed } from "../main/math";
import { canvas } from "../main/state";

/**
 * @extends CanvasRenderingContext2D
 */
export class ExportAsSVG {
	constructor() {
		this.fillStyle = 'black';
		this.strokeStyle = 'black';
		this.lineWidth = 1;
		this.font = '12px Arial, sans-serif';
		this._points = [];
		this._svgData = '';
		this._transX = 0;
		this._transY = 0;
	}

	toSVG() {
		return '<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n\n<svg width="800" height="600" version="1.1" xmlns="http://www.w3.org/2000/svg">\n' + this._svgData + '</svg>\n';
	}

	beginPath() {
		this._points = [];
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} radius
	 * @param {number} startAngle Radians.
	 * @param {number} endAngle Radians.
	 * @param {boolean} isReversed
	 */
	arc(x, y, radius, startAngle, endAngle, isReversed) {
		x += this._transX;
		y += this._transY;
		const style = 'stroke="' + this.strokeStyle + '" stroke-width="' + this.lineWidth + '" fill="none"';

		if (endAngle - startAngle == Math.PI * 2) {
			this._svgData += '\t<ellipse ' + style + ' cx="' + fixed(x, 3) + '" cy="' + fixed(y, 3) + '" rx="' + fixed(radius, 3) + '" ry="' + fixed(radius, 3) + '"/>\n';
		} else {
			if (isReversed) {
				const temp = startAngle;
				startAngle = endAngle;
				endAngle = temp;
			}

			if (endAngle < startAngle) {
				endAngle += Math.PI * 2;
			}

			const startX = x + radius * Math.cos(startAngle);
			const startY = y + radius * Math.sin(startAngle);
			const endX = x + radius * Math.cos(endAngle);
			const endY = y + radius * Math.sin(endAngle);
			const useGreaterThan180 = (Math.abs(endAngle - startAngle) > Math.PI);
			const goInPositiveDirection = 1;

			this._svgData += '\t<path ' + style + ' d="';
			this._svgData += 'M ' + fixed(startX, 3) + ',' + fixed(startY, 3) + ' '; // startPoint(startX, startY)
			this._svgData += 'A ' + fixed(radius, 3) + ',' + fixed(radius, 3) + ' '; // radii(radius, radius)
			this._svgData += '0 '; // value of 0 means perfect circle, others mean ellipse
			this._svgData += +useGreaterThan180 + ' ';
			this._svgData += +goInPositiveDirection + ' ';
			this._svgData += fixed(endX, 3) + ',' + fixed(endY, 3); // endPoint(endX, endY)
			this._svgData += '"/>\n';
		}
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	moveTo(x, y) {
		x += this._transX;
		y += this._transY;
		this._points.push({ 'x': x, 'y': y });
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	lineTo(x, y) {
		x += this._transX;
		y += this._transY;
		this._points.push({ 'x': x, 'y': y });
	}

	stroke() {
		if (this._points.length == 0) return;
		this._svgData += '\t<polygon stroke="' + this.strokeStyle + '" stroke-width="' + this.lineWidth + '" points="';
		for (let i = 0; i < this._points.length; i++) {
			this._svgData += (i > 0 ? ' ' : '') + fixed(this._points[i].x, 3) + ',' + fixed(this._points[i].y, 3);
		}
		this._svgData += '"/>\n';
	}

	fill() {
		if (this._points.length == 0) return;
		this._svgData += '\t<polygon fill="' + this.fillStyle + '" stroke-width="' + this.lineWidth + '" points="';
		for (let i = 0; i < this._points.length; i++) {
			this._svgData += (i > 0 ? ' ' : '') + fixed(this._points[i].x, 3) + ',' + fixed(this._points[i].y, 3);
		}
		this._svgData += '"/>\n';
	}

	/**
	 * @param {string} text
	 */
	measureText(text) {
		const c = canvas.getContext('2d');
		c.font = '20px "Times New Romain", serif';
		return c.measureText(text);
	}

	fillText(text, x, y) {
		x += this._transX;
		y += this._transY;
		if (text.replace(' ', '').length > 0) {
			this._svgData += '\t<text x="' + fixed(x, 3) + '" y="' + fixed(y, 3) + '" font-family="Times New Roman" font-size="20">' + textToXML(text) + '</text>\n';
		}
	}

	translate(x, y) {
		this._transX = x;
		this._transY = y;
	}

	save() { }
	restore() { }
	clearRect() { }

}