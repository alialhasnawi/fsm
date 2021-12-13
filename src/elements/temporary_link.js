import { drawArrow } from "../main/fsm";

export class TemporaryLink {
	/**
	 * @param {{ x: number; y: number; }} from
	 * @param {{ x: number; y: number; }} to
	 */
	constructor(from, to) {
		this.from = from;
		this.to = to;
	}

	/**
	 * @param {CanvasRenderingContext2D} c
	 */
	draw(c) {
		// draw the line
		c.beginPath();
		c.moveTo(this.to.x, this.to.y);
		c.lineTo(this.from.x, this.from.y);
		c.stroke();

		// draw the head of the arrow
		drawArrow(c, this.to.x, this.to.y, Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x));
	};
}