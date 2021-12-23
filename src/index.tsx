/**
 * Bind key handlers and render the app.
 */

import { Component, Fragment, h } from 'preact';
import { Canvas } from './components/canvas/canvas';
import { ToolBar } from './components/tool_bar/tool_bar';
import { get_canvas, mutate, mutate_if_true, restore_backup } from './store/store';
import './style/index.css';
import { CanvasTool } from './types';

class App extends Component {
    componentWillMount() {
        init();
    }

    render() {
        return (
            <>
                <div id="preact_root">
                    <ToolBar />
                    <Canvas />
                </div>
                <div>
                    {/* <p class="center">Export as: <a id="a-saveAsPNG">PNG</a> | <a id="a-saveAsSVG">SVG</a>
                        | <a id="a-saveAsLaTeX">LaTeX</a></p> */}
                    <textarea id="output"></textarea>
                    <p>The big white box above is the FSM designer.&nbsp; Here's how to use it:</p>
                    <ul>
                        <li><b>Add a state:</b> double-click on the canvas</li>
                        <li><b>Add an arrow:</b> shift-drag on the canvas</li>
                        <li><b>Move something:</b> drag it around</li>
                        <li><b>Delete something:</b> click it and press the delete key (not the backspace key)</li>
                    </ul>
                    <ul>
                        <li><b>Make accept state:</b> double-click on an existing state</li>
                        <li><b>Type numeric subscript:</b> put an underscore before the number (like "S_0")</li>
                        <li><b>Type greek letter:</b> put a backslash before it (like "\beta")</li>
                        <li><b>Eliminate a non-accept, non-start state:</b> use the state tool or press ]</li>
                        <li><b>Perform subset construction:</b> right click anywhere on the canvas</li>
                    </ul>
                    <p>This was made in HTML5 and JavaScript using the canvas element.</p>
                </div>
                <p>Created by <a href="http://madebyevan.com/">Evan Wallace</a> in 2010 <br />
                    + Extended by <a href="https://alialhasnawi.github.io/">Ali Al-Hasnawi in 2021</a>
                </p>
            </>
        );
    };
}

function init(): void {
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
}

export default App;