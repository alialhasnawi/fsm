import { fixed } from "../common/math";
import { measure_text } from "../components/elements/text_utils";
import { Point2D, State, StateKey } from "../types";

// draw using this instead of a canvas and call toLaTeX() afterward
/**
 * LaTeX rendering context.
 * @extends CanvasRenderingContext2D
 */
export class ExportAsLaTeX {
	private _points: Point2D[];
	private _texData: string;
	private _scale: number;
	public strokeStyle: string = "black";
	public fillStyle: string = "black";
	public lineWidth: number = 1;
	public font: string = '';

	constructor() {
		this._points = [];
		this._texData = '';
		this._scale = 0.1; // to convert pixels to document space (TikZ breaks if the numbers get too big, above 500?)
	}

	toLaTeX() {
		return '\\documentclass[12pt]{article}\n' +
			'\\usepackage{tikz}\n' +
			'\n' +
			'\\begin{document}\n' +
			'\n' +
			'\\begin{center}\n' +
			'\\begin{tikzpicture}[scale=0.2]\n' +
			'\\tikzstyle{every node}+=[inner sep=0pt]\n' +
			this._texData +
			'\\end{tikzpicture}\n' +
			'\\end{center}\n' +
			'\n' +
			'\\end{document}\n';
	}

	beginPath() {
		this._points = [];
	}

	arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, isReversed: boolean) {
		x *= this._scale;
		y *= this._scale;
		radius *= this._scale;
		if (endAngle - startAngle == Math.PI * 2) {
			this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x, 3) + ',' + fixed(-y, 3) + ') circle (' + fixed(radius, 3) + ');\n';
		} else {
			if (isReversed) {
				const temp = startAngle;
				startAngle = endAngle;
				endAngle = temp;
			}
			if (endAngle < startAngle) {
				endAngle += Math.PI * 2;
			}
			// TikZ needs the angles to be in between -2pi and 2pi or it breaks
			if (Math.min(startAngle, endAngle) < -2 * Math.PI) {
				startAngle += 2 * Math.PI;
				endAngle += 2 * Math.PI;
			} else if (Math.max(startAngle, endAngle) > 2 * Math.PI) {
				startAngle -= 2 * Math.PI;
				endAngle -= 2 * Math.PI;
			}
			startAngle = -startAngle;
			endAngle = -endAngle;
			this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x + radius * Math.cos(startAngle), 3) + ',' + fixed(-y + radius * Math.sin(startAngle), 3) + ') arc (' + fixed(startAngle * 180 / Math.PI, 5) + ':' + fixed(endAngle * 180 / Math.PI, 5) + ':' + fixed(radius, 3) + ');\n';
		}
	}

	moveTo(x: number, y: number) {
		x *= this._scale;
		y *= this._scale;
		this._points.push({ 'x': x, 'y': y });
	}

	lineTo(x: number, y: number) {
		x *= this._scale;
		y *= this._scale;
		this._points.push({ 'x': x, 'y': y });
	}

	stroke() {
		if (this._points.length == 0) return;
		this._texData += '\\draw [' + this.strokeStyle + ']';
		for (let i = 0; i < this._points.length; i++) {
			const p = this._points[i];
			this._texData += (i > 0 ? ' --' : '') + ' (' + fixed(p.x, 2) + ',' + fixed(-p.y, 2) + ')';
		}
		this._texData += ';\n';
	}

	fill() {
		if (this._points.length == 0) return;
		this._texData += '\\fill [' + this.strokeStyle + ']';
		for (let i = 0; i < this._points.length; i++) {
			const p = this._points[i];
			this._texData += (i > 0 ? ' --' : '') + ' (' + fixed(p.x, 2) + ',' + fixed(-p.y, 2) + ')';
		}
		this._texData += ';\n';
	}

	advancedFillText(text: string, originalText: string, x: number, y: number, angleOrNull: number | undefined) {
		if (text.replace(' ', '').length > 0) {
			let nodeParams = '';
			// x and y start off as the center of the text, but will be moved to one side of the box when angleOrNull != null
			if (angleOrNull != null) {
				const width = measure_text(text);
				const dx = Math.cos(angleOrNull);
				const dy = Math.sin(angleOrNull);
				if (Math.abs(dx) > Math.abs(dy)) {
					if (dx > 0) nodeParams = '[right] ', x -= width / 2;
					else nodeParams = '[left] ', x += width / 2;
				} else {
					if (dy > 0) nodeParams = '[below] ', y -= 10;
					else nodeParams = '[above] ', y += 10;
				}
			}
			x *= this._scale;
			y *= this._scale;
			this._texData += '\\draw (' + fixed(x, 2) + ',' + fixed(-y, 2) + ') node ' + nodeParams + '{$' + originalText.replace(/ /g, '\\mbox{ }') + '$};\n';
		}
	}

	translate() { }
	save() { }
	restore() { }
	clearRect() { }
	rect() { }
}

export function export_to_latex(state: State): StateKey[] | undefined {
	const exporter = new ExportAsLaTeX();

	if (state.selected_object != null) {
		state.selected_object.selected = false;
		state.selected_object = undefined;
	}

	state.canvas.draw_using(exporter);

	navigator.clipboard.writeText(exporter.toLaTeX());

	return ['selected_object'];
}