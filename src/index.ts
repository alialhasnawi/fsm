/**
 * Bind key handlers and render the app.
 */

import './style/index.css';
import App from './components/app';
import { get_canvas, mutate, mutate_if_true, restore_backup } from './store/store';
import { CanvasTool } from './types';
import { StateNode } from './components/elements/state_node';

export default App;

/** On initialized. */
restore_backup();

// Bind keyboard shortcuts.
if (typeof window != 'undefined') {
    window.onkeydown = e => {
        switch (e.key) {
            // Shift activates link drawing.
            case 'Shift': mutate_if_true(['curr_tool'], state => {
                // Note: This is an illegal mutation of last_tool for reducing render calls.
                if (state.curr_tool == CanvasTool.DRAW_LINK) { state.last_tool = state.curr_tool; return false; };
                state.curr_tool = CanvasTool.DRAW_LINK;
                return true;
            });
                break;

            // Backspace deletes text.
            case 'Backspace': mutate_if_true(['selected_object'], state => {
                if (state.selected_object != null) {
                    state.selected_object.text = state.selected_object.text.substring(0, state.selected_object.text.length - 1);
                    return true;
                }
                return false;
            });
                break;

            // ] is for state elimination.
            case ']': mutate_if_true(['selected_object'], get_canvas().tools.eliminate); break;

            // Delete is for deleting the element.
            case 'Delete': mutate(['selected_object'], get_canvas().tools.delete_element);
                break;

            // Try to enter a key.
            default: if (e.key.length == 1) {
                mutate_if_true(['selected_object'], state => {
                    if (state.selected_object != null) {
                        state.selected_object.text += e.key;
                        return true;
                    }
                    return false;
                });
            }

        }

        // Prevent actions.
        e.preventDefault();
        return false;
    }

    window.onkeyup = e => {
        if (e.key == 'Shift') {
            // Unshifting return to node drawing.
            mutate_if_true(['curr_tool'], state => {
                if (state.curr_tool != CanvasTool.DRAW_LINK) return false;
                state.curr_tool = state.last_tool;
                return true;
            });

        }

        // Prevent actions.
        e.preventDefault();
        return false;
    }
}