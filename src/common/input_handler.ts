import * as Tools from "../components/tool_bar/tools";
import { DESCRIPTIONS } from "../components/tool_bar/tool_bar";
import { effect_save_backup } from "../store/backup";
import { open, save_as } from "../store/files";
import { force_update, get_state, mutate, mutate_with_args } from "../store/store";
import { redo, undo } from "../store/undo_redo";
import { CanvasTool, State } from "../types";

/** Handle the window's beforeunload event by saving to localStorage. */
export function beforeunload(e: Event) {
    // Apply the save effect outside of a mutation context.
    mutate(s => { effect_save_backup(s); return undefined; });
}

/** Handle the window's resize event by adjusting the canvas. */
export function resize(e: UIEvent) {
    mutate(state => {
        state.canvas.resize();
        return ['canvas'];
    });
}

/** Handle the window's keyup event. */
export function keyup(e: KeyboardEvent) {
    if (e.key == 'Shift') {
        // Unshifting return to node drawing.
        mutate((state: State) => {
            if (state.curr_tool != CanvasTool.DRAW_LINK) return;
            state.curr_tool = state.last_tool;
            state.textbar = DESCRIPTIONS[state.curr_tool];
            return ['curr_tool', 'textbar'];
        }, false);

    }

    // Prevent actions.
    e.preventDefault();
    return false;
}

/** Handle the window's keydown event. */
export function keydown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey)
        handle_command_key(e);
    else
        handle_single_key(e);
}

/** Handle keydowns for a single key (no command/ctrl modifiers.) */
function handle_single_key(e: KeyboardEvent) {
    switch (e.key) {
        // Shift activates link drawing.
        case 'Shift': mutate((state: State) => {
            // Note: This is an illegal mutation of last_tool for reducing render calls.
            if (state.curr_tool == CanvasTool.DRAW_LINK) { state.last_tool = state.curr_tool; return; };
            state.curr_tool = CanvasTool.DRAW_LINK;
            state.textbar = DESCRIPTIONS[state.curr_tool];
            return ['curr_tool', 'textbar'];
        }, false); break;

        // Backspace deletes text.
        case 'Backspace': mutate(Tools.delete_char, false); break;

        // Delete is for deleting the element.
        case 'Delete': mutate(Tools.delete_element); break;

        // Try to enter a key.
        default: if (e.key.length == 1) {
            mutate_with_args(Tools.type_text, false, e.key);
        } else {
            // Continue with default action.
            return;
        }
    }

    // Prevent actions when focused.
    if (get_state('selected_object') != null) {
        e.preventDefault();
        return false;
    }
}

/** Handle command shortcuts (using ctr/command keys). */
function handle_command_key(e: KeyboardEvent) {
    switch (e.key.toUpperCase()) {
        case 'O': mutate(open); break;
        case 'S': mutate(save_as); break;
        case 'Y': mutate(redo); break;
        case 'Z': {
            // ctrl+shift+z is redo
            if (e.shiftKey)
                mutate(redo);
            // else undo
            else
                mutate(undo);
            break;
        }
        case '=': mutate(Tools.zoom_in); break;
        case '-': mutate(Tools.zoom_out); break;
        default: return;
    }

    // Same as above, allow normal behaviour.
    e.preventDefault();
    return false;
}

/** Click anywhere to close the opened menu. */
export function click(e: MouseEvent) {
    if (get_state('curr_menu') != null)
        mutate(state => { state.curr_menu = undefined; return ['curr_menu']; });
}