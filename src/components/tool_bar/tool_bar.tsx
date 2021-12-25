import { Component, ComponentChild, Fragment, h } from "preact";
import { get_state, mutate, subscribe } from "../../store/store";
import { CanvasTool, State, StateKey } from "../../types";

// Consider removing this parent reference and relying strictly on vDOM.
type ToolProps = {
    tooltip: string,
    icon: string,
    tool_mode: CanvasTool,
};

export class ToolBar extends Component {
    constructor() {
        super();
        subscribe(['curr_tool'], this);
    }

    render(): ComponentChild {
        return (<>
            <div>Tools:</div>
            <div style='display: flex; flex-direction: row;'>
                <Tool tooltip='Select' icon='' tool_mode={CanvasTool.POINTER} />
                <Tool tooltip='Draw Node' icon='' tool_mode={CanvasTool.DRAW_NODE} />
                <Tool tooltip='Draw Link' icon='' tool_mode={CanvasTool.DRAW_LINK} />
                <Tool tooltip='Draw Accept' icon='' tool_mode={CanvasTool.DRAW_ACCEPT} />
                <Tool tooltip='Eliminate' icon='' tool_mode={CanvasTool.ELIMINATE} />
                {/* <Tool tooltip='Pan (not yet implemented)' icon={''} tool_mode={CanvasTool.PAN} /> */}
            </div>
        </>);
    }
}

class Tool extends Component<ToolProps> {


    constructor(props: ToolProps) {
        super(props);
    }

    render(): ComponentChild {
        return (
            <div
                onClick={e => mutate(this.mutator)}

                style={
                    this.props.tool_mode == get_state('curr_tool') ? 'color: cyan' : 'color: black'
                }
            >{this.props.tooltip}</div>
        );
    }

    mutator = (state: State): StateKey[] | undefined => {
        if (state.curr_tool == this.props.tool_mode) return;
        state.curr_tool = this.props.tool_mode;
        return ['curr_tool'];
    }
}