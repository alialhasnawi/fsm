/**
 * General purpose utilities for managing node data.
 * @module shared_utils
 */

import { Link } from "../elements/link";
import { StateNode } from "../elements/node";
import { StartLink } from "../elements/start_link";
import { canvasPadding } from "../main/constants";
import { canvas } from "../main/state";

/**
 * Return the union of A and B.
 * @param {Set} a 
 * @param {Set} b 
 */
export function union(a, b) {
    const set = new Set();

    for (const el of a.values())
        set.add(el);
    for (const el of b.values())
        set.add(el);

    return set;
}

/**
 * Add B's elements to A.
 * Mutates A.
 * @param {Set} a 
 * @param {Set} b 
 */
export function inplace_union(a, b) {
    for (const el of b.values())
        a.add(el);
}

/**
 * Return a unique string for each node or link.
 * @param {StateNode|Link|StartLink} node 
 * @returns symbol
 */
export function to_symbol(node) {
    if (node instanceof StateNode)
        return `${node.text}:${node.x},${node.y}`;
    else if (node instanceof Link)
        return `${to_symbol(node.nodeA)}->${to_symbol(node.nodeB)}:${node.text}${node.getAnchorPoint().x},${node.getAnchorPoint().y}`;
    else if (node instanceof StartLink)
        return `${to_symbol(node.node)}:${node.getStartPoint().x},${node.getStartPoint().y}`;
    return JSON.stringify(node);
}

/**
 * Get a random position object.
 */
export function rand_pos() {
    return {
        x: Math.random() * (canvas.width - 2 * canvasPadding) + canvasPadding,
        y: Math.random() * (canvas.height - 2 * canvasPadding) + canvasPadding
    }
}