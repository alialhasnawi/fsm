import { Component, FunctionalComponent, h, Fragment } from 'preact';
import { restore_backup } from '../store/store';
import { Canvas } from './canvas/canvas';
import { ToolBar } from './tool_bar/tool_bar';

class App extends Component {
    componentWillMount() {
        restore_backup();
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

export default App;
