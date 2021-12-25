import { State, StateKey } from "../../types";

export { redo, undo } from "../../store/undo_redo";
export { subset_construct } from "../../algs/subset_construct";

export function reset_camera(state: State): StateKey[] | undefined {
    state.view_zone = { zoom: 1, x: 0, y: 0 };

    return ['view_zone'];
}

export {open, save_as} from "../../store/files";