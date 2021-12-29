// draw using this instead of a canvas and call toSVG() afterward

import { fixed } from "../common/math";
import { text_to_xml } from "../components/elements/text_utils";
import { save_file } from "../store/files";
import { get_state } from "../store/store";
import { Point2D, State, StateKey } from "../types";

/**
 * SVG rendering context.
 * @extends CanvasRenderingContext2D
 */
export class ExportAsSVG {
	public fillStyle: string;
	public strokeStyle: string;
	public lineWidth: number;
	public font: string;
	private _points: Point2D[];
	private _svgData: string;
	private _transX: number;
	private _transY: number;

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
		const dim = get_state('export_dimensions');
		return `<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n\n<svg width="${dim.width}" height="${dim.height}" version="1.1" xmlns="http://www.w3.org/2000/svg">\n' ${this._svgData} </svg>\n`;
	}

	beginPath() {
		this._points = [];
	}

	arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, isReversed: boolean) {
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

	moveTo(x: number, y: number) {
		x += this._transX;
		y += this._transY;
		this._points.push({ 'x': x, 'y': y });
	}

	lineTo(x: number, y: number) {
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

	fillText(text: string, x: number, y: number) {
		x += this._transX;
		y += this._transY;
		if (text.replace(' ', '').length > 0) {
			this._svgData += '\t<text x="' + fixed(x, 3) + '" y="' + fixed(y, 3) + '" font-family="Times New Roman" font-size="20">' + text_to_xml(text) + '</text>\n';
		}
	}

	translate(x: number, y: number) {
		this._transX = x;
		this._transY = y;
	}

	save() { }
	restore() { }
	clearRect() { }
	rect() { }

}

export function export_to_svg(state: State): StateKey[] | undefined {
	const exporter = new ExportAsSVG();

	if (state.selected_object != null) {
		state.selected_object.selected = false;
		state.selected_object = undefined;
	}

	state.canvas.draw_using(exporter);

	save_file(
		exporter.toSVG(),
		`${state.file_name}.svg`,
		'image/svg+xml'
	);

	return ['selected_object'];
}