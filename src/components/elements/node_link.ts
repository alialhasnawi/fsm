import { circleFromThreePoints } from "../../common/math";
import { FSMContext, NodeLinkEndPointsAndCircle, Point2D } from "../../types";
import { DrawableElement } from "./abstract";
import { HIT_TARGET_PADDING, NODE_RADIUS, SNAP_TO_PADDING } from "./constants";
import { StateNode } from "./state_node";
import { draw_arrow, draw_text } from "./text_utils";

/** A link connecting 2 nodes. */
export class NodeLink extends DrawableElement {
	public nodeA: StateNode;
	public nodeB: StateNode;
	public text: string;
	public lineAngleAdjust: number;
	public parallelPart: number;
	public perpendicularPart: number;

	constructor(a: StateNode, b: StateNode) {
		super();
		this.nodeA = a;
		this.nodeB = b;
		this.text = '';
		this.lineAngleAdjust = 0; // value to add to textAngle when link is straight line

		// make anchor point relative to the locations of nodeA and nodeB
		this.parallelPart = 0.5; // percentage from nodeA to nodeB
		this.perpendicularPart = 0; // pixels from line between nodeA and nodeB
	}

	get_anchor_point(): Point2D {
		const dx = this.nodeB.x - this.nodeA.x;
		const dy = this.nodeB.y - this.nodeA.y;
		const scale = Math.sqrt(dx * dx + dy * dy);
		return {
			'x': this.nodeA.x + dx * this.parallelPart - dy * this.perpendicularPart / scale,
			'y': this.nodeA.y + dy * this.parallelPart + dx * this.perpendicularPart / scale
		};
	};

	set_anchor_point(x: number, y: number) {
		const dx = this.nodeB.x - this.nodeA.x;
		const dy = this.nodeB.y - this.nodeA.y;
		const scale = Math.sqrt(dx * dx + dy * dy);
		this.parallelPart = (dx * (x - this.nodeA.x) + dy * (y - this.nodeA.y)) / (scale * scale);
		this.perpendicularPart = (dx * (y - this.nodeA.y) - dy * (x - this.nodeA.x)) / scale;
		// snap to a straight line
		if (this.parallelPart > 0 && this.parallelPart < 1 && Math.abs(this.perpendicularPart) < SNAP_TO_PADDING) {
			this.lineAngleAdjust = +(this.perpendicularPart < 0) * Math.PI;
			this.perpendicularPart = 0;
		}
	};

	private get_endpoints_and_circle(): NodeLinkEndPointsAndCircle {
		if (this.perpendicularPart == 0) {
			const midX = (this.nodeA.x + this.nodeB.x) / 2;
			const midY = (this.nodeA.y + this.nodeB.y) / 2;
			const start = this.nodeA.closest_point_on_circle(midX, midY);
			const end = this.nodeB.closest_point_on_circle(midX, midY);
			return {
				'hasCircle': false,
				'startX': start.x,
				'startY': start.y,
				'endX': end.x,
				'endY': end.y,
			};
		}
		const anchor = this.get_anchor_point();
		const circle = circleFromThreePoints(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y, anchor.x, anchor.y);
		const isReversed = (this.perpendicularPart > 0);
		const reverseScale = isReversed ? 1 : -1;
		const startAngle = Math.atan2(this.nodeA.y - circle.y, this.nodeA.x - circle.x) - reverseScale * NODE_RADIUS / circle.radius;
		const endAngle = Math.atan2(this.nodeB.y - circle.y, this.nodeB.x - circle.x) + reverseScale * NODE_RADIUS / circle.radius;
		const startX = circle.x + circle.radius * Math.cos(startAngle);
		const startY = circle.y + circle.radius * Math.sin(startAngle);
		const endX = circle.x + circle.radius * Math.cos(endAngle);
		const endY = circle.y + circle.radius * Math.sin(endAngle);
		return {
			hasCircle: true,
			startX: startX,
			startY: startY,
			endX: endX,
			endY: endY,
			startAngle: startAngle,
			endAngle: endAngle,
			circleX: circle.x,
			circleY: circle.y,
			circleRadius: circle.radius,
			reverseScale: reverseScale,
			isReversed: isReversed,
		};
	};

	draw(c: FSMContext, with_caret: boolean = false) {
		
		const stuff = this.get_endpoints_and_circle();
		// draw arc
		c.beginPath();
		if (stuff.hasCircle) {
			c.arc(stuff.circleX, stuff.circleY, stuff.circleRadius, stuff.startAngle, stuff.endAngle, stuff.isReversed);
		} else {
			c.moveTo(stuff.startX, stuff.startY);
			c.lineTo(stuff.endX, stuff.endY);
		}
		c.stroke();
		// draw the head of the arrow
		if (stuff.hasCircle) {
			draw_arrow(c, stuff.endX, stuff.endY, stuff.endAngle - stuff.reverseScale * (Math.PI / 2));
		} else {
			draw_arrow(c, stuff.endX, stuff.endY, Math.atan2(stuff.endY - stuff.startY, stuff.endX - stuff.startX));
		}
		// draw the text
		if (stuff.hasCircle) {
			let startAngle = stuff.startAngle;
			let endAngle = stuff.endAngle;
			if (endAngle < startAngle) {
				endAngle += Math.PI * 2;
			}
			const textAngle = (startAngle + endAngle) / 2 + +stuff.isReversed * Math.PI;
			const textX = stuff.circleX + stuff.circleRadius * Math.cos(textAngle);
			const textY = stuff.circleY + stuff.circleRadius * Math.sin(textAngle);
			draw_text(c, this.text, textX, textY, textAngle, this.selected, with_caret);
		} else {
			const textX = (stuff.startX + stuff.endX) / 2;
			const textY = (stuff.startY + stuff.endY) / 2;
			const textAngle = Math.atan2(stuff.endX - stuff.startX, stuff.startY - stuff.endY);
			draw_text(c, this.text, textX, textY, textAngle + this.lineAngleAdjust, this.selected, with_caret);
		}
	};

	contains_point(pos: Point2D) {
		const x = pos.x;
		const y = pos.y;
		const stuff = this.get_endpoints_and_circle();
		if (stuff.hasCircle) {
			const dx = x - stuff.circleX;
			const dy = y - stuff.circleY;
			const distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
			if (Math.abs(distance) < HIT_TARGET_PADDING) {
				let angle = Math.atan2(dy, dx);
				let startAngle = stuff.startAngle;
				let endAngle = stuff.endAngle;
				if (stuff.isReversed) {
					const temp = startAngle;
					startAngle = endAngle;
					endAngle = temp;
				}
				if (endAngle < startAngle) {
					endAngle += Math.PI * 2;
				}
				if (angle < startAngle) {
					angle += Math.PI * 2;
				} else if (angle > endAngle) {
					angle -= Math.PI * 2;
				}
				return (angle > startAngle && angle < endAngle);
			}
		} else {
			const dx = stuff.endX - stuff.startX;
			const dy = stuff.endY - stuff.startY;
			const length = Math.sqrt(dx * dx + dy * dy);
			const percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
			const distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
			return (percent > 0 && percent < 1 && Math.abs(distance) < HIT_TARGET_PADDING);
		}
		return false;
	};
}