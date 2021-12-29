import { Attributes, Component, ComponentChild, ComponentChildren, Fragment, h, Ref } from "preact";
import { mutate, subscribe } from "../../store/store";
import { open, redo, reset_camera, save_as, subset_construct, undo } from "./actions";
import { State, StateKey } from "../../types";
import { export_to_svg } from "../../export_as/svg";
import { export_to_latex } from "../../export_as/latex";
import { export_to_png } from "../../export_as/png";
import { ActionMenuItem } from "./action_menu";
import "./style.css";
import { ActionTab } from "./action_tab";
import { delete_element, zoom_in, zoom_out } from "../tool_bar/tools";
import { Logo } from "../../assets/icons/components";
import { FilenameDisplay } from "./filename";

export class ActionBar extends Component {
    render(): ComponentChild {
        return (
            <div class="menubar">
                <FilenameDisplay />
                <div class="menu-logo">
                    {Logo}
                </div>
                <Menubar />
            </div>
        );
    }
}

class Menubar extends Component {
    constructor() {
        super();
        subscribe(['curr_menu'], this);
    }

    render(): ComponentChild {
        return (
            <div class="menubar-tab-container">
                <ActionTab title="File">
                    <ActionMenuItem text='Open' shortcut='Ctrl+O' action={open} />
                    <ActionMenuItem text='Save As' shortcut='Ctrl+S' action={save_as} />
                    <ActionMenuItem text='Save PNG' shortcut='' action={export_to_png} />
                    <ActionMenuItem text='Save SVG' shortcut='' action={export_to_svg} />
                    <ActionMenuItem text='Copy LaTeX' shortcut='' action={export_to_latex} />
                </ActionTab>
                <ActionTab title="Edit">
                    <ActionMenuItem text='Undo' shortcut='Ctrl+Z' action={undo} />
                    <ActionMenuItem text='Redo' shortcut='Ctrl+Y' action={redo} />
                    <ActionMenuItem text='Delete' shortcut='Delete' action={delete_element} />
                    <ActionMenuItem text='Subset Construction' shortcut='' action={subset_construct} />
                </ActionTab>
                <ActionTab title="View">
                    <ActionMenuItem text='Reset Zoom' shortcut='' action={reset_camera} />
                    <ActionMenuItem text='Zoom In' shortcut='Ctrl+=' action={zoom_in} />
                    <ActionMenuItem text='Zoom Out' shortcut='Ctrl+-' action={zoom_out} />
                </ActionTab>
            </div>
        );
    }
}