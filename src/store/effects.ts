import { DESCRIPTIONS } from "../components/tool_bar/tool_bar";
import { State } from "../types";
import { force_update } from "./store";


/** Update the previous tool and description. */
export function effect_prev_tool(state: State) {
    state.last_tool = state.curr_tool;
    state.textbar = DESCRIPTIONS[state.curr_tool];

    // Update the textbar when tools are chosen.
    force_update(['textbar']);
}

/** Force the canvas to redraw. Avoid using. */
export function effect_canvas(state: State) {
    state.canvas.draw();
}

export { effect_undo_redo } from "./undo_redo";

export { effect_save_backup } from "./backup";

export function effect_file_name(state: State) {
    document.title = `fsmD — ${state.file_name}`;
}