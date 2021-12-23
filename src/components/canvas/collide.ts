/** 
 * Collision detection of states and nodes.
 */

import { get_state } from "../../store/store";
import { Point2D } from "../../types";
import { DrawableElement } from "../elements/abstract";

export function object_at(pos: Point2D): DrawableElement | undefined {
    const nodes = get_state('nodes');
    const links = get_state('links');

    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].contains_point(pos)) {
            return nodes[i];
        }
    }
    for (let i = 0; i < links.length; i++) {
        if (links[i].contains_point(pos)) {
            return links[i];
        }
    }

    return undefined;
}