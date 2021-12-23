import { FSMContext, Point2D } from "../../types";
import { DrawableElement } from "./abstract";
import { NODE_RADIUS } from "./constants";
import { draw_text } from "./text_utils";

/** A circular node representing a state in the finite automaton. */
export class StateNode extends DrawableElement {
	public x: number;
	public y: number;
	private mouseOffsetX: number;
	private mouseOffsetY: number;
	public isAcceptState: boolean;
	public text: string;

	constructor(x: number, y: number) {
		super();
		this.x = x;
		this.y = y;
		this.mouseOffsetX = 0;
		this.mouseOffsetY = 0;
		this.isAcceptState = false;
		this.text = '';
	}

	set_mouse_start(x: number, y: number) {
		this.mouseOffsetX = this.x - x;
		this.mouseOffsetY = this.y - y;
	};

	set_anchor_point(x: number, y: number) {
		this.x = x + this.mouseOffsetX;
		this.y = y + this.mouseOffsetY;
	};

	draw(c: FSMContext, with_caret: boolean = false) {
		// draw the circle
		c.beginPath();
		c.arc(this.x, this.y, NODE_RADIUS, 0, 2 * Math.PI, false);
		c.stroke();

		// draw the text
		draw_text(c, this.text, this.x, this.y, null, this.selected, with_caret);

		// draw a double circle for an accept state
		if (this.isAcceptState) {
			c.beginPath();
			c.arc(this.x, this.y, NODE_RADIUS - 6, 0, 2 * Math.PI, false);
			c.stroke();
		}
	};

	closest_point_on_circle(x: number, y: number): Point2D {
		const dx = x - this.x;
		const dy = y - this.y;
		const scale = Math.sqrt(dx * dx + dy * dy);
		return {
			'x': this.x + dx * NODE_RADIUS / scale,
			'y': this.y + dy * NODE_RADIUS / scale,
		};
	};

	contains_point(pos: Point2D) {
		return (pos.x - this.x) * (pos.x - this.x) + (pos.y - this.y) * (pos.y - this.y) < NODE_RADIUS * NODE_RADIUS;
	};
}