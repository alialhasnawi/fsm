import { CanvasJSON, FSMCanvasState, State, StateKey } from "../types";
import { canvas_to_string, string_to_canvas } from "./backup";
import { mutate } from "./store";

let _undo_stack: CanvasJSON[] = [];
let _curr: CanvasJSON = '';
let _redo_stack: CanvasJSON[] = [];

/** Reset the undo and redo stacks. */
export function reset_undo_redo(state: State): StateKey[] | undefined {
    _undo_stack = [];
    _redo_stack = [];
    _curr = canvas_to_string(state);
    state.can = { undo: false, redo: false };
    return ['can'];
}

/**
 * Save the canvas to the undo/redo stacks and to localStorage.
 */
export function effect_undo_redo(prev: State) {
    const str = canvas_to_string(prev);

    if (_curr != str) {
        _undo_stack.push(_curr);
        _curr = str;
        _redo_stack = [];
    }
}

/** Deselect an object and mutate the store if necessary.
 * The state update causes the undo_redo effect to store otherwise
 * unrecorded text changes of the selected object.
 */
function deselect(state: State): StateKey[] | undefined {
    if (state.selected_object != null) {
        state.selected_object.selected = false;
        state.selected_object = undefined;
        return ['selected_object'];
    }
    return;
}

/**
 * Undo a canvas change if possible.
 */
export function undo(state: State): StateKey[] | undefined {
    mutate(deselect);

    if (_undo_stack.length > 0) {
        let next_str = _undo_stack.pop()!;
        // Push current state to the redo stack.
        _redo_stack.push(_curr);
        _curr = next_str;

        // Load the new state from the undo stack.
        const next_state: FSMCanvasState = string_to_canvas(next_str!);
        state.nodes = next_state.nodes;
        state.links = next_state.links;

        state.can.undo = _undo_stack.length > 0;
        state.can.redo = _redo_stack.length > 0;

        // Update subscribers.
        return ['nodes', 'links', 'can'];
    } else { console.warn('Tried to undo with no actions to undo.'); return; }
}

/**
 * Redo an undone canvas change if possible.
 */
export function redo(state: State): StateKey[] | undefined {
    mutate(deselect);

    let next_str = _redo_stack.pop();
    if (next_str != null) {
        // Push current state to the undo stack.
        _undo_stack.push(_curr);
        _curr = next_str;

        // Load the new state from the undo stack.
        const next_state: FSMCanvasState = string_to_canvas(next_str);
        state.nodes = next_state.nodes;
        state.links = next_state.links;

        state.can.undo = _undo_stack.length > 0;
        state.can.redo = _redo_stack.length > 0;

        // Update subscribers.
        return ['nodes', 'links', 'can'];
    } else { console.warn('Tried to redo with no actions to redo.'); return; }
}