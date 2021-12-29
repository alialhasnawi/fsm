/**
 * Bind key handlers and render the app.
 */

import { Component, Fragment, h } from 'preact';
import { beforeunload, click, keydown, keyup, resize } from './common/input_handler';
import { ActionBar } from './components/action_bar/action_bar';
import { Canvas } from './components/canvas/canvas';
import { Textbar } from './components/textbar/textbar';
import { ToolBar } from './components/tool_bar/tool_bar';
import { restore_backup } from './store/backup';
import { get_canvas, mutate } from './store/store';
import { reset_undo_redo } from './store/undo_redo';
import './style/main.css';


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
                <ActionBar />
                <ToolBar />
                <Canvas />
                <Textbar />
            </>
            // <p>Created by <a href="http://madebyevan.com/">Evan Wallace</a> in 2010 <br />
            //     + Extended by <a href="https://alialhasnawi.github.io/">Ali Al-Hasnawi in 2021</a>
            // </p>
        );
    };

    init(): void {
        window.onkeydown = keydown;
        window.onkeyup = keyup;
        window.onresize = resize;
        window.onbeforeunload = beforeunload;
        window.onclick = click;

        mutate(restore_backup);
        mutate(reset_undo_redo);
    }
}

export default App;