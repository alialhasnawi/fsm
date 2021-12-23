/**
 * Tool functions for canvas handlers and actions.
 * All tools are functions of the state.
 * 
 * @note Move this to a class in the future to avoid dependencies.
 */

import { _eliminate } from "../../algs/eliminate";
import { State } from "../../types";
import { Canvas } from "../canvas/canvas";
import { NodeLink } from "../elements/node_link";
import { SelfLink } from "../elements/self_link";
import { StartLink } from "../elements/start_link";
import { StateNode } from "../elements/state_node";
import { TemporaryLink } from "../elements/temporary_link";


export class _CanvasTools {
    private canvas: Canvas;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
    }

    // Tools:

    /** Select an object if necessary. */
    update_select = (state: State) => {
        // Deselect old object.
        if (state.selected_object != null) state.selected_object.selected = false;

        // Select the new object if applicable.
        const at_cursor = this.canvas.cursor.obj_at_last_pos;
        state.selected_object = at_cursor;

        // Update the selected object's state.
        if (at_cursor != null) {
            at_cursor.selected = true;

            if (at_cursor instanceof StateNode || at_cursor instanceof SelfLink)
                at_cursor.set_mouse_start(this.canvas.cursor.mouse_down_pos.x, this.canvas.cursor.mouse_down_pos.y);
        }

    }

    /** Draw a new node at the cursor's position and select it. */
    draw_node = (state: State) => {
        if (this.canvas.cursor.obj_at_last_pos == null) {
            const pos = this.canvas.cursor.last_pos;

            const new_node = new StateNode(pos.x, pos.y);
            new_node.selected = true;

            // Deselect old object.
            if (state.selected_object != null) state.selected_object.selected = false;
            state.selected_object = new_node;

            state.nodes.push(new_node);
        }
    }

    /** Toggle the selected node's accepting node / vice versa. */
    toggle_accept_state = (state: State) => {
        const obj = this.canvas.cursor.obj_at_last_pos;
        if (obj instanceof StateNode)
            obj.isAcceptState = !obj.isAcceptState;

        state.selected_object = obj;
    }

    /** Drag the selected object across the canvas. */
    drag = (state: State) => {
        const anchor = this.canvas.cursor.last_pos;

        if (state.active_objects.length > 0) {
            // Implement group dragging.
        } else if (state.selected_object != undefined) {
            state.selected_object.set_anchor_point(anchor.x, anchor.y);
        }
    }

    /** Update the temporary link that should be created given the state of the cursor. */
    update_temp_link = (state: State) => {
        let temp;

        const start = this.canvas.cursor.obj_at_mouse_down;
        const end = this.canvas.cursor.obj_at_last_pos;
        const start_pos = { ... this.canvas.cursor.mouse_down_pos };
        const end_pos = { ... this.canvas.cursor.last_pos };

        // The link starts and ends at a node.
        if (start instanceof StateNode && end instanceof StateNode) {
            if (start == end) {
                // The links start and ends at the same node.
                temp = new SelfLink(start);
                temp.set_mouse_start(start_pos.x, start_pos.y);
                temp.set_anchor_point(end_pos.x, end_pos.y);
            } else {
                // If it ends at a different node, create a regular link.
                temp = new NodeLink(start, end);
            }

        } else if (end instanceof StateNode) {
            temp = new StartLink(end, start_pos);
        }

        else {
            // Starting anywhere else, it is a temp link, possibly with a starting node.
            temp = new TemporaryLink(
                (start instanceof StateNode)
                    ? start.closest_point_on_circle(end_pos.x, end_pos.y) :
                    start_pos,
                end_pos);
        }

        state.temp_link = temp;
    }

    /** Add the currently worked on temporary link to the list of links. */
    end_temp_link = (state: State) => {
        if (!(state.temp_link instanceof TemporaryLink)) {
            state.links.push(state.temp_link!);

            // Select the new link automatically.
            state.temp_link!.selected = true;
            if (state.selected_object != null) state.selected_object.selected = false;
            state.selected_object = state.temp_link;
        }

        state.temp_link = undefined;
    }

    /** Eliminate the selected state node. */
    eliminate = (state: State) => {
        let should_update = false;
        const active_objects = [state.selected_object, ...state.active_objects];

        for (const obj of active_objects) {
            if (obj instanceof StateNode)
                should_update = should_update || _eliminate(obj, state.nodes, state.links);
        }

        if (state.selected_object != null) {
            state.selected_object.selected = false;
            state.selected_object = undefined;
        }

        return should_update;
    }

    // Actions:

    /** Element deletion from model. */
    delete_element = (state: State) => {

        if (state.selected_object != null) {

            if (state.selected_object instanceof StateNode) {
                // Delete the node.
                for (let i = state.nodes.length - 1; i >= 0; i--)
                    if (state.selected_object == state.nodes[i]) {
                        state.nodes.splice(i, 1);
                        break;
                    }

                // Delete links attached to the node.
                for (let i = state.links.length - 1; i >= 0; i--) {
                    const link = state.links[i];
                    let should_delete = false;

                    if (link instanceof NodeLink)
                        should_delete = link.nodeA == state.selected_object || link.nodeB == state.selected_object;
                    else if (link instanceof StartLink || link instanceof SelfLink)
                        should_delete = link.node == state.selected_object;

                    if (should_delete) state.links.splice(i, 1);

                }
            } else {
                // Delete links themselves.
                for (let i = state.links.length - 1; i >= 0; i--)
                    if (state.selected_object == state.links[i]) {
                        state.links.splice(i, 1);
                        break;
                    }
            }
            state.selected_object = undefined;
        }
        return false;
    }
}