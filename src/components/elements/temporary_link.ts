import { FSMContext, Point2D } from "../../types";
import { DrawableElement } from "./abstract";
import { draw_arrow } from "./text_utils";

/** An arbitrary link in space. */
export class TemporaryLink extends DrawableElement {
	from: Point2D;
	to: Point2D;

	constructor(from: Point2D, to: Point2D) {
		super();
		this.from = from;
		this.to = to;
	}

	draw(c: FSMContext, selected: boolean = false) {
		// draw the line
		c.beginPath();
		c.moveTo(this.to.x, this.to.y);
		c.lineTo(this.from.x, this.from.y);
		c.stroke();

		// draw the head of the arrow
		draw_arrow(c, this.to.x, this.to.y, Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x));
	};

	contains_point(pos: Point2D): boolean {
		return false;
	}

	set_anchor_point(x: number, y: number): void { }
}