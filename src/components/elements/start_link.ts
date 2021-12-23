import { FSMContext, Point2D } from "../../types";
import { DrawableElement } from "./abstract";
import { HIT_TARGET_PADDING, SNAP_TO_PADDING } from "./constants";
import { StateNode } from "./state_node";
import { draw_arrow, draw_text } from "./text_utils";

/** A link from a textbox to a node. */
export class StartLink extends DrawableElement {
	public node: StateNode;
	public deltaX: number;
	public deltaY: number;
	public text: string;

	constructor(node: StateNode, start?: Point2D) {
		super();
		this.node = node;
		this.deltaX = 0;
		this.deltaY = 0;
		this.text = '';

		if (start) {
			this.set_anchor_point(start.x, start.y);
		}
	}

	set_anchor_point(x: number, y: number) {
		this.deltaX = x - this.node.x;
		this.deltaY = y - this.node.y;

		if (Math.abs(this.deltaX) < SNAP_TO_PADDING) {
			this.deltaX = 0;
		}

		if (Math.abs(this.deltaY) < SNAP_TO_PADDING) {
			this.deltaY = 0;
		}
	};

	get_start_point() {
		return {
			x: this.node.x + this.deltaX,
			y: this.node.y + this.deltaY
		}
	}

	get_endpoints() {
		const startX = this.node.x + this.deltaX;
		const startY = this.node.y + this.deltaY;
		const end = this.node.closest_point_on_circle(startX, startY);
		return {
			'startX': startX,
			'startY': startY,
			'endX': end.x,
			'endY': end.y,
		};
	};

	draw(c: FSMContext, with_caret: boolean = false) {
		const stuff = this.get_endpoints();

		// draw the line
		c.beginPath();
		c.moveTo(stuff.startX, stuff.startY);
		c.lineTo(stuff.endX, stuff.endY);
		c.stroke();

		// draw the text at the end without the arrow
		const textAngle = Math.atan2(stuff.startY - stuff.endY, stuff.startX - stuff.endX);
		draw_text(c, this.text, stuff.startX, stuff.startY, textAngle, this.selected, with_caret);

		// draw the head of the arrow
		draw_arrow(c, stuff.endX, stuff.endY, Math.atan2(-this.deltaY, -this.deltaX));
	};

	contains_point(pos: Point2D) {
		const x = pos.x;
		const y = pos.y;
		const stuff = this.get_endpoints();
		const dx = stuff.endX - stuff.startX;
		const dy = stuff.endY - stuff.startY;
		const length = Math.sqrt(dx * dx + dy * dy);
		const percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
		const distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
		return (percent > 0 && percent < 1 && Math.abs(distance) < HIT_TARGET_PADDING);
	};
}