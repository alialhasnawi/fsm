import { CanvasViewTransform, Rect2D, State, StateKey } from "../../types";

export { redo, undo } from "../../store/undo_redo";
export { subset_construct } from "../../algs/subset_construct";

export function reset_camera(state: State): StateKey[] | undefined {
    const view_zone: CanvasViewTransform = { zoom: 1, x: 0, y: 0 };

    const canvas: Rect2D = {
        width: state.canvas.el!.width,
        height: state.canvas.el!.height,
    }


    // Choose different default positions based on longer side.
    if ((canvas.width / canvas.height) < (state.export_dimensions.width / state.export_dimensions.height)) {
        // Keep the width at 100% the canvas size.
        view_zone.zoom = canvas.width / state.export_dimensions.width;

        // Center the canvas vertically.
        view_zone.y = (canvas.height - state.export_dimensions.height * view_zone.zoom) / 2;
    } else {
        // Keep the height at 100% the canvas size.
        view_zone.zoom = canvas.height / state.export_dimensions.height;

        // Center the canvas horizontally.
        view_zone.x = (canvas.width - state.export_dimensions.width * view_zone.zoom) / 2;
    }


    state.view_zone = view_zone;

    return ['view_zone'];
}

export { open, save_as } from "../../store/files";