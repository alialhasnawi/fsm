import { Attributes, Component, ComponentChild, ComponentChildren, Ref } from "preact";
import { mutate } from "../../store/store";
import { State, StateKey } from "../../types";

type ActionMenuItemProps = {
    text: string,
    shortcut: string,
    action: (state: State) => StateKey[] | undefined
};

type ActionMenuItemState = {
    clickable: boolean,
};

export class ActionMenuItem extends Component<ActionMenuItemProps, ActionMenuItemState> {
    constructor(props: ActionMenuItemProps) {
        super(props);
    }

    render(): ComponentChild {
        return <div class={this.state.clickable ? "menu-item" : "menu-item disabled"} onMouseUp={e => mutate(this.props.action)}>
            <span class="menu-item-text">{this.props.text}</span>
            <span class="menu-item-shortcut">{this.props.shortcut}</span>
        </div>;
    }

}