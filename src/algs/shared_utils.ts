/**
 * General purpose utilities for managing node data.
 */

import { FSMElementString, FSMStringableElement } from "../components/elements/abstract";
import { StateNode } from "../components/elements/state_node";
import { NodeLink } from "../components/elements/node_link";
import { StartLink } from "../components/elements/start_link";
import { get_canvas } from "../store/store";
import { Point2D } from "../types";
import { CANVAS_PADDING } from "../components/elements/constants";

/**
 * Return the union of A and B.
 */
export function union<T>(a: T[], b: T[]) {
    const set: T[] = [];

    inplace_union(set, a);
    inplace_union(set, b);

    return set;
}

/**
 * Add B's elements to A, as a set.
 * Mutates A.
 */
export function inplace_union<T>(a: T[], b: T[]) {
    for (const el of b)
        if (!a.includes(el)) a.push(el);
}

/**
 * Return a unique string for each node or link.
 */
export function to_symbol(node: FSMStringableElement): FSMElementString {
    if (node instanceof StateNode)
        return `${node.text}:${node.x},${node.y}`;
    else if (node instanceof NodeLink)
        return `${to_symbol(node.nodeA)}->${to_symbol(node.nodeB)}:${node.text}${node.get_anchor_point().x},${node.get_anchor_point().y}`;
    else if (node instanceof StartLink)
        return `${to_symbol(node.node)}:${node.get_start_point().x},${node.get_start_point().y}`;
    return JSON.stringify(node);
}

/**
 * Get a random position object.
 */
export function rand_pos(): Point2D {
    const canvas = get_canvas();
    if (canvas != null) {
        const canvas_el = canvas.el;
        if (canvas_el != null) {
            return {
                x: Math.random() * (canvas_el.width - 2 * CANVAS_PADDING) + CANVAS_PADDING,
                y: Math.random() * (canvas_el.height - 2 * CANVAS_PADDING) + CANVAS_PADDING
            }
        }
    }
    return { x: 0, y: 0 };
}