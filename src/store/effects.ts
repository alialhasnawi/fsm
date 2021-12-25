import { State } from "../types";


/** Update the undo/redo stack. */
export function effect_prev_tool(state: State) {
    state.last_tool = state.curr_tool;
}

/** Force the canvas to redraw. Avoid using. */
export function effect_canvas(state: State) {
    state.canvas.draw();
}

export { effect_undo_redo } from "./undo_redo";

export { effect_save_backup } from "./backup";