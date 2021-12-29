import { Attributes, Component, ComponentChild, ComponentChildren, Ref } from "preact"
import { effect_file_name } from "../../store/effects";
import { get_state, mutate, subscribe } from "../../store/store"

export class FilenameDisplay extends Component {
    constructor() {
        super();
        subscribe(['file_name'], this);
    }

    onClick = (e: MouseEvent) => {
        // Deselect objects.
        mutate(state => {
            if (state.selected_object != null) {
                state.selected_object.selected = false;
                state.selected_object = undefined;
                return ['selected_object'];
            }
        })
    }

    onInput = (e: Event) => {
        mutate(state => {
            state.file_name = (e.target! as HTMLElement).innerText;
            // Apply external side effect. This is a temporary fix as,
            // otherwise, this will cause circular state updates to
            // this component.
            effect_file_name(state);
            return undefined;
        });
        
        e.stopPropagation();
    }

    render(): ComponentChild {
        return <span contentEditable role="textbox" type="text" class="menu-filename"
            onInput={this.onInput}
            onMouseDown={this.onClick}>
            {get_state('file_name')}
        </span>
    }
}