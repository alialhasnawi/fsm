/**
 * Canvas input handlers.
 * 
 * @note Move this to a class in the future to avoid dependencies.
 */

import { subset_construct } from "../../algs/subset_construct";
import { get_state, mutate } from "../../store/store";
import { CanvasTool, MouseButton } from "../../types";
import { StateNode } from "../elements/state_node";
import { _CanvasTools } from "../tool_bar/tools";
import { Canvas } from "./canvas";
import { object_at } from "./collide";

export class _CanvasHandler {
    private canvas: Canvas;
    private Tools: _CanvasTools;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
        this.Tools = canvas.tools;
    }

    /** Dummy event handler. */
    prevent_default(e: Event) {
        e.preventDefault();
        return false;
    }

    /**
     * Sync up the state's cursor with the given mouse event.
     * @param canvas_coord Point in canvas element space.
     */
    sync_canvas_coordinates(e: MouseEvent, update_object_at_cursor: boolean = false) {
        this.canvas.cursor.last_pos = this.canvas.to_canvas_space(e);
        if (update_object_at_cursor) this.canvas.cursor.obj_at_last_pos = object_at(this.canvas.cursor.last_pos);
    }

    mouse_down = (e: MouseEvent) => {
        // Update cursor.
        this.sync_canvas_coordinates(e, true);
        this.canvas.cursor.mouse_down_pos = { ... this.canvas.cursor.last_pos };
        this.canvas.cursor.obj_at_mouse_down = this.canvas.cursor.obj_at_last_pos;

        // Select if possible.
        mutate(['selected_object'], this.Tools.update_select);
        this.canvas.cursor.down = true;


        // Hand over control to tools.
        switch (get_state('curr_tool')) {
            case CanvasTool.DRAW_LINK: mutate(['temp_link'], this.Tools.update_temp_link)
        }

        this.canvas.cursor.moving = false;
    }

    mouse_up = (e: MouseEvent) => {
        // Update cursor.
        this.sync_canvas_coordinates(e);
        this.canvas.cursor.down = false;

        if (this.canvas.cursor.moving) {
            // The mouse was being dragged.
        } else {
            // The mouse was clicked.
            if (e.button == MouseButton.LEFT)
                this.left_click();
            else if (e.button == MouseButton.RIGHT)
                this.right_click();
        }

        // Pop the temp link if it exists.
        if (get_state('temp_link') != undefined) mutate(['temp_link'], this.Tools.end_temp_link);

        this.canvas.cursor.moving = false;

        e.preventDefault();
        return false;
    }

    mouse_move = (e: MouseEvent) => {
        // Update cursor.
        this.sync_canvas_coordinates(e, true);
        this.canvas.cursor.moving = true;

        // Only drag if the mouse was down.
        if (this.canvas.cursor.down) {
            this.drag();
        }
    }

    dbl_click = (e: MouseEvent) => {
        // Shortcut for node creation / toggling accept state ported from original.
        this.sync_canvas_coordinates(e);

        const obj = this.canvas.cursor.obj_at_last_pos;

        if (obj instanceof StateNode)
            // Toggle accept.
            mutate(['nodes', 'selected_object'], this.Tools.toggle_accept_state);
        else
            // Create node.
            mutate(['nodes', 'selected_object'], this.Tools.draw_node);
    }

    private drag = () => {
        switch (get_state('curr_tool')) {
            // A link is being drawn.
            case CanvasTool.DRAW_LINK: { mutate(['temp_link'], this.Tools.update_temp_link); break; }
            // An object is being dragged.
            default: mutate(['nodes', 'links'], this.Tools.drag);
        }
    }

    private left_click = () => {
        switch (get_state('curr_tool')) {
            // A node is being created.
            case CanvasTool.DRAW_NODE: mutate(['nodes', 'selected_object'], this.Tools.draw_node); break;
            case CanvasTool.DRAW_ACCEPT: mutate(['nodes', 'selected_object'], this.Tools.toggle_accept_state); break;
            case CanvasTool.ELIMINATE: mutate(['nodes', 'links', 'selected_object'], this.Tools.eliminate); break;
        }
    }

    private right_click = () => {
        mutate(['nodes', 'links'], subset_construct);
    }
}

