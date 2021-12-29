import { Attributes, Component, ComponentChild, ComponentChildren, Ref } from "preact";
import { get_state, subscribe } from "../../store/store";
import "./style.css";

export class Textbar extends Component {
    private last_str;

    constructor() {
        super();
        this.last_str = get_state('textbar');
        subscribe(['textbar'], this);
    }

    shouldComponentUpdate() {
        const next = get_state('textbar');
        if (this.last_str == next)
            return false;

        this.last_str = next;
        return true;
    }

    render(): ComponentChild {
        return <div class="text-bar">{this.last_str}</div>
    }

}