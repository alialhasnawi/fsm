import { Component, ComponentChild, Fragment, h } from "preact";
import { DrawAcceptIcon, DrawLinkIcon, DrawNodeIcon, EliminateIcon, SelectIcon } from "../../assets/icons/components";
import { get_state, mutate, subscribe } from "../../store/store";
import { CanvasTool, State, StateKey } from "../../types";
import "./style.css";

type ToolDescriptions = { [tools in CanvasTool]: string };

export const DESCRIPTIONS: ToolDescriptions = {
    [CanvasTool.POINTER]: "Select: Click on a node or a link to select it.",
    [CanvasTool.DRAW_NODE]: "Draw Node: Click anywhere to create a new node.",
    [CanvasTool.DRAW_LINK]: "Draw Link: Click and drag from and to nodes to create transition links.",
    [CanvasTool.DRAW_ACCEPT]: "Draw Accept: Click on a state to toggle its accepting status.",
    [CanvasTool.ELIMINATE]: "Eliminate: Click on a state to eliminate it, creating partial regular expressions if necessary.",
};

// Consider removing this parent reference and relying strictly on vDOM.
type ToolProps = {
    tooltip: string,
    icon: JSX.Element,
    tool_mode: CanvasTool,
};

export class ToolBar extends Component {
    constructor() {
        super();
        subscribe(['curr_tool'], this);
    }

    render(): ComponentChild {
        return (
            <div id="toolbar">
                <Tool tooltip='Select' icon={SelectIcon} tool_mode={CanvasTool.POINTER} />
                <Tool tooltip='Draw Node (Dbl Click)' icon={DrawNodeIcon} tool_mode={CanvasTool.DRAW_NODE} />
                <Tool tooltip='Draw Link (Shift)' icon={DrawLinkIcon} tool_mode={CanvasTool.DRAW_LINK} />
                <Tool tooltip='Make Accepting State (Dbl Click)' icon={DrawAcceptIcon} tool_mode={CanvasTool.DRAW_ACCEPT} />
                <Tool tooltip='Eliminate State' icon={EliminateIcon} tool_mode={CanvasTool.ELIMINATE} />
            </div>
        );
    }
}

class Tool extends Component<ToolProps> {


    constructor(props: ToolProps) {
        super(props);
    }

    render(): ComponentChild {
        return (
            <div class={`tool-container ${this.props.tool_mode == get_state('curr_tool') ? 'selected' : ''}`}
                data-tooltip={this.props.tooltip}
                onClick={e => mutate(this.mutator)}
            >{this.props.icon}</div>
        );
    }

    mutator = (state: State): StateKey[] | undefined => {
        if (state.curr_tool == this.props.tool_mode) return;
        state.curr_tool = this.props.tool_mode;
        return ['curr_tool'];
    }
}