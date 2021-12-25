import { Component, ComponentChild, Fragment, h } from "preact";
import { mutate, subscribe } from "../../store/store";
import { open, redo, reset_camera, save_as, subset_construct, undo } from "./actions";
import { State, StateKey } from "../../types";
import { export_to_svg } from "../../export_as/svg";
import { export_to_latex } from "../../export_as/latex";
import { export_to_png } from "../../export_as/png";

type ActionProps = {
    text: string,
    icon: string,
    handle_click: (state: State) => StateKey[] | undefined,
};

export class ActionBar extends Component {
    constructor() {
        super();
        subscribe(['can'], this);
    }

    render(): ComponentChild {
        return (<>
            <div>Actions:</div>
            <div style='display: flex; flex-direction: row; flex-wrap: wrap;'>
                <Action text='Undo' icon='' handle_click={undo} />
                <Action text='Redo' icon='' handle_click={redo} />
                <Action text='Subset Construction' icon='' handle_click={subset_construct} />
                <Action text='Save' icon='' handle_click={save_as} />
                <Action text='Load' icon='' handle_click={open} />
                <Action text='Reset Cam' icon='' handle_click={reset_camera} />
                <Action text='Save PNG' icon='' handle_click={export_to_png} />
                <Action text='Save SVG' icon='' handle_click={export_to_svg} />
                <Action text='Copy LaTeX' icon='' handle_click={export_to_latex} />
            </div>
        </>);
    }
}

class Action extends Component<ActionProps> {
    constructor(props: ActionProps) {
        super(props);
    }

    render(): ComponentChild {
        return (
            <div
                onClick={e => mutate(this.props.handle_click)}

            >{this.props.text}</div>
        );
    }
}