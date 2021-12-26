/**
 * Bind key handlers and render the app.
 */

import { Component, Fragment, h } from 'preact';
import { ActionBar } from './components/action_bar/action_bar';
import { Canvas } from './components/canvas/canvas';
import * as Tools from './components/tool_bar/tools';
import { ToolBar } from './components/tool_bar/tool_bar';
import { restore_backup } from './store/backup';
import { get_canvas, mutate, mutate_with_args } from './store/store';
import { reset_undo_redo } from './store/undo_redo';
import './style/main.css';
import { CanvasTool, State } from './types';


class App extends Component {
    private canvas: Canvas | undefined;


    componentWillMount() {
        this.init();
    }

    componentDidMount() {
        this.canvas = get_canvas();
    }

    render() {
        return (
            <>
                <div id="preact_root">
                    <ActionBar />
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

    init(): void {
        /** On initialized. */
        mutate(restore_backup);
        mutate(reset_undo_redo);

        // Bind keyboard shortcuts.
        if (typeof window != 'undefined') {
            window.onkeydown = e => {
                switch (e.key) {
                    // Shift activates link drawing.
                    case 'Shift': mutate((state: State) => {
                        // Note: This is an illegal mutation of last_tool for reducing render calls.
                        if (state.curr_tool == CanvasTool.DRAW_LINK) { state.last_tool = state.curr_tool; return; };
                        state.curr_tool = CanvasTool.DRAW_LINK;
                        return ['curr_tool'];
                    }, false); break;

                    // Backspace deletes text.
                    case 'Backspace': mutate(Tools.delete_char, false); break;

                    // ] is for state elimination.
                    case ']': mutate(Tools.eliminate); break;

                    // Delete is for deleting the element.
                    case 'Delete': mutate(Tools.delete_element); break;

                    // Try to enter a key.
                    default: if (e.key.length == 1) {
                        mutate_with_args(Tools.type_text, false, e.key);
                    }

                }

                // Prevent actions.
                e.preventDefault();
                return false;
            }

            window.onkeyup = e => {
                if (e.key == 'Shift') {
                    // Unshifting return to node drawing.
                    mutate((state: State) => {
                        if (state.curr_tool != CanvasTool.DRAW_LINK) return;
                        state.curr_tool = state.last_tool;
                        return ['curr_tool'];
                    }, false);

                }

                // Prevent actions.
                e.preventDefault();
                return false;
            }
        }
    }
}

export default App;