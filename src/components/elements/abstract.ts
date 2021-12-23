/**
 * Parent class and types of nodes and links.
 */

import { FSMContext, Point2D } from "../../types";
import { ACTIVE_COLOUR, SELECTED_COLOUR, STANDARD_COLOUR } from "./constants";
import { NodeLink } from "./node_link";
import { SelfLink } from "./self_link";
import { StartLink } from "./start_link";
import { StateNode } from "./state_node";
import { TemporaryLink } from "./temporary_link";

/**
 * A canvas element which can be drawn using a canvas context.
 */
export abstract class DrawableElement {
    public selected: boolean = false;
    public active: boolean = false;
    public text: string = '';

    abstract draw(ctx: FSMContext, with_caret: boolean): void;

    public curr_colour(): string {
        if (this.selected)
            return SELECTED_COLOUR;
        if (this.active)
            return ACTIVE_COLOUR;
        return STANDARD_COLOUR;
    }

    abstract contains_point(pos: Point2D): boolean;
    abstract set_anchor_point(x: number, y: number): void;
}

export type FSMLink = NodeLink | SelfLink | StartLink;
export type AnyLink = FSMLink | TemporaryLink;
export type FSMStringableElement = StateNode | FSMLink;
export type FSMElementString = string;
