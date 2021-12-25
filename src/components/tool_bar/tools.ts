/**
 * Tool functions for canvas handlers and actions.
 * All tools are functions of the state.
 * 
 * @note Move this to a class in the future to avoid dependencies.
 */

import { _eliminate } from "../../algs/eliminate";
import { State, StateKey } from "../../types";
import { NodeLink } from "../elements/node_link";
import { SelfLink } from "../elements/self_link";
import { StartLink } from "../elements/start_link";
import { StateNode } from "../elements/state_node";
import { TemporaryLink } from "../elements/temporary_link";



// Tools:

/** Select an object if necessary. */
export function update_select(state: State): StateKey[] | undefined {
    // Deselect old object.
    if (state.selected_object != null) state.selected_object.selected = false;

    // Select the new object if applicable.
    const at_cursor = state.canvas.cursor.obj_at_last_pos;
    state.selected_object = at_cursor;

    // Update the selected object's state.
    if (at_cursor != null) {
        at_cursor.selected = true;

        if (at_cursor instanceof StateNode || at_cursor instanceof SelfLink)
            at_cursor.set_mouse_start(state.canvas.cursor.mouse_down_pos.x, state.canvas.cursor.mouse_down_pos.y);
    }

    return ['selected_object'];
}

/** Draw a new node at the cursor's position and select it. */
export function draw_node(state: State): StateKey[] | undefined {
    if (state.canvas.cursor.obj_at_last_pos == null) {
        const pos = state.canvas.cursor.last_pos;

        const new_node = new StateNode(pos.x, pos.y);
        new_node.selected = true;

        // Deselect old object.
        if (state.selected_object != null) state.selected_object.selected = false;
        state.selected_object = new_node;

        state.nodes.push(new_node);

        return ['nodes', 'selected_object'];
    }
}

/** Toggle the selected node's accepting node / vice versa. */
export function toggle_accept_state(state: State): StateKey[] | undefined {
    const obj = state.canvas.cursor.obj_at_last_pos;
    if (obj instanceof StateNode)
        obj.isAcceptState = !obj.isAcceptState;

    state.selected_object = obj;

    return ['selected_object'];
}

/** Drag the selected object across the canvas / drag the canvas around. */
export function drag(state: State): StateKey[] | undefined {
    const anchor = state.canvas.cursor.last_pos;

    if (state.selected_object != undefined) {
        state.selected_object.set_anchor_point(anchor.x, anchor.y);
        return ['nodes', 'links', 'selected_object'];
    } else {
        // Drag canvas itself.
        const next_view = { ...state.view_zone };

        next_view.x = next_view.zoom * (anchor.x - state.canvas.cursor.mouse_down_pos.x) + next_view.x;
        next_view.y = next_view.zoom * (anchor.y - state.canvas.cursor.mouse_down_pos.y) + next_view.y;

        state.view_zone = next_view;

        return ['view_zone'];
    }
}

/** Update the temporary link that should be created given the state of the cursor. */
export function update_temp_link(state: State): StateKey[] | undefined {
    let temp;

    const start = state.canvas.cursor.obj_at_mouse_down;
    const end = state.canvas.cursor.obj_at_last_pos;
    const start_pos = { ...state.canvas.cursor.mouse_down_pos };
    const end_pos = { ...state.canvas.cursor.last_pos };

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
    } else {
        // Starting anywhere else, it is a temp link, possibly with a starting node.
        temp = new TemporaryLink(
            (start instanceof StateNode)
                ? start.closest_point_on_circle(end_pos.x, end_pos.y)
                : start_pos,
            end_pos);
    }

    state.temp_link = temp;

    return ['temp_link'];
}

/** Add the currently worked on temporary link to the list of links. */
export function end_temp_link(state: State): StateKey[] | undefined {
    if (!(state.temp_link instanceof TemporaryLink)) {
        state.links.push(state.temp_link!);

        // Select the new link automatically.
        state.temp_link!.selected = true;
        if (state.selected_object != null) state.selected_object.selected = false;
        state.selected_object = state.temp_link;
    }

    state.temp_link = undefined;

    return ['links', 'temp_link'];
}

/** Eliminate the selected state node. */
export function eliminate(state: State): StateKey[] | undefined {
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

    return should_update ? ['nodes', 'links', 'selected_object'] : undefined;
}

// Actions:

/** Element deletion from model. */
export function delete_element(state: State): StateKey[] | undefined {

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
        return ['nodes', 'links', 'selected_object'];
    }
    return;
}

/** Typing text into an object. */
export function type_text(state: State, text: string): StateKey[] | undefined {
    if (state.selected_object != null) {
        state.selected_object.text = state.selected_object.text + text;
        return ['selected_object'];
    }
}

/** Deleting text from object. */
export function delete_char(state: State): StateKey[] | undefined {
    if (state.selected_object != null) {
        state.selected_object.text = state.selected_object.text.substring(0, state.selected_object.text.length - 1);
        return ['selected_object'];
    }
}

/** Update the state when dragging is ended to update the undo queue. */
export function end_drag(state: State): StateKey[] | undefined {
    if (state.selected_object != null) {
        return ['nodes', 'links'];
    }
}

type NewType = StateKey;

/**  */
export function zoom(state: State, e: WheelEvent): NewType[] | undefined {
    const prev_view = state.view_zone;
    const next_view = { ...prev_view };
    const draw_space = state.canvas.event_to_canvas_space(e);

    // Restrict zoom so user doesn't get lost.
    next_view.zoom = Math.min(Math.max(next_view.zoom * Math.exp(-e.deltaY / 1000), 0.3), 3);

    // Do math to find where mouse is pointing (via x,y offsets).
    // Move towards mouse position.
    next_view.x = (prev_view.zoom - next_view.zoom) * draw_space.x + prev_view.x;
    next_view.y = (prev_view.zoom - next_view.zoom) * draw_space.y + prev_view.y;

    state.view_zone = next_view;

    return ['view_zone'];
}