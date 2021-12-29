/**
 * Canvas input handlers.
 * 
 * @note Move this to a class in the future to avoid dependencies.
 */

import { subset_construct } from "../../algs/subset_construct";
import { get_state, mutate, mutate_with_args } from "../../store/store";
import { CanvasTool, MouseButton } from "../../types";
import { StateNode } from "../elements/state_node";
import * as Tools from "../tool_bar/tools";
import { Canvas } from "./canvas";
import { object_at } from "./collide";

export class _CanvasHandler {
    private canvas: Canvas;

    constructor(canvas: Canvas) {
        this.canvas = canvas;
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
        this.canvas.cursor.last_pos = this.canvas.event_to_canvas_space(e);
        if (update_object_at_cursor) this.canvas.cursor.obj_at_last_pos = object_at(this.canvas.cursor.last_pos);
    }

    mouse_down = (e: MouseEvent) => {
        // Update cursor.
        this.sync_canvas_coordinates(e, true);
        this.canvas.cursor.mouse_down_pos = { ... this.canvas.cursor.last_pos };
        this.canvas.cursor.obj_at_mouse_down = this.canvas.cursor.obj_at_last_pos;

        // Select if possible.
        mutate(Tools.update_select);
        this.canvas.cursor.down = true;


        // Hand over control to tools.
        switch (get_state('curr_tool')) {
            case CanvasTool.DRAW_LINK: mutate(Tools.update_temp_link, false);
        }

        this.canvas.cursor.moving = false;
    }

    mouse_up = (e: MouseEvent) => {
        // Update cursor.
        this.sync_canvas_coordinates(e);
        this.canvas.cursor.down = false;

        if (this.canvas.cursor.moving) {
            mutate(Tools.end_drag);
        } else {
            // The mouse was clicked.
            if (e.button == MouseButton.LEFT)
                this.left_click();
            else if (e.button == MouseButton.RIGHT)
                this.right_click();
        }

        // Pop the temp link if it exists.
        if (get_state('temp_link') != undefined) mutate(Tools.end_temp_link);

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
            mutate(Tools.toggle_accept_state);
        else
            // Create node.
            mutate(Tools.draw_node);
    }

    wheel = (e: WheelEvent) => {
        if (!this.canvas.cursor.down) {
            mutate_with_args(Tools.zoom, true, e);

            e.preventDefault();
            return false;
        }
    }

    private drag = () => {
        switch (get_state('curr_tool')) {
            // A link is being drawn.
            case CanvasTool.DRAW_LINK: { mutate(Tools.update_temp_link, false); break; }
            // An object is being dragged.
            default: mutate(Tools.drag, false);
        }
    }

    private left_click = () => {
        switch (get_state('curr_tool')) {
            // A node is being created.
            case CanvasTool.DRAW_NODE: mutate(Tools.draw_node); break;
            case CanvasTool.DRAW_ACCEPT: mutate(Tools.toggle_accept_state); break;
            case CanvasTool.ELIMINATE: mutate(Tools.eliminate); break;
        }
    }

    private right_click = () => {
        // mutate(subset_construct);
    }
}

