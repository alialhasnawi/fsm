import { Component, ComponentChild } from "preact";
import { get_state, mutate } from "../../store/store";
import { MenuOption, State, StateKey } from "../../types";


type ActionTabProps = {
    title: MenuOption,
};

export class ActionTab extends Component<ActionTabProps> {
    constructor() {
        super();
    }

    onClick = (e: MouseEvent) => {
        mutate(this.click_this);
        e.stopPropagation();
    }

    onHover = (e: MouseEvent) => {
        mutate(this.hover_this);
        e.stopPropagation();
    }

    private hover_this = (state: State): StateKey[] | undefined => {
        if (state.curr_menu != null) {
            if (state.curr_menu != this.props.title) {
                state.curr_menu = this.props.title;
                return ['curr_menu'];
            }
        }
    }

    private click_this = (state: State): StateKey[] | undefined => {
        // Toggle.

        if (state.curr_menu != this.props.title)
            state.curr_menu = this.props.title;
        else
            state.curr_menu = undefined;

        return ['curr_menu'];
    }

    render(): ComponentChild {
        const selected = get_state('curr_menu') == this.props.title;
        return (
            <div class="menu-tab-root">
                <div class={`menu-tab-button ${selected ? 'selected' : ''}`}
                    // Switch to this menu when the mouse is held down.
                    onMouseDown={this.onClick}
                    // Or switch if the mouse was held down on a menu.
                    onMouseEnter={this.onHover}
                    // Prevent the window handler from closing the menu.
                    onClick={e => { e.stopPropagation() }}>
                    {this.props.title}
                </div>
                {selected ?
                    <div class="menu-item-container">
                        {this.props.children}
                    </div>
                    : ''
                }
            </div>
        );
    }
}