import { save_canvas } from "../store/files";
import { State, StateKey } from "../types";

export function export_to_png(state: State): StateKey[] | undefined {
	if (state.selected_object != null) {
		state.selected_object.selected = false;
		state.selected_object = undefined;
	}

    const temp = document.createElement('canvas');
    temp.width = state.export_dimensions.width;
    temp.height = state.export_dimensions.height;

	state.canvas.draw_using(temp.getContext('2d')!);

	save_canvas(
        temp,
        `${state.file_name}.png`
    );

	return ['selected_object'];
}