import { State, StateKey } from "../types";
import { canvas_to_string, string_to_canvas } from "./backup";
import { force_update } from "./store";

/** Open the save file dialogue window and download the canvas. */
export function save_as(state: State): StateKey[] | undefined {
    save_file(
        canvas_to_string(state),
        `${state.file_name || new Date().toISOString().replace(/[^0-9|-]/g, '')}.fsmjson`,
        'application/json',
    );

    return;
}

/** Save the given canvas using the given data string. */
export function save_canvas(canvas: HTMLCanvasElement, file_name: string) {
    // Use anchors instead of injecting anchor into UI.
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL();
    anchor.download = file_name;
    anchor.click();

    URL.revokeObjectURL(anchor.href);
};

/** Save the file using the given data string. */
export function save_file(data: string, file_name: string, type: string = 'text/plain') {
    const f = new Blob([data], { type: type });

    // Use anchors instead of injecting anchor into UI.
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(f);
    anchor.download = file_name;
    anchor.click();

    URL.revokeObjectURL(anchor.href);
};

export function open(state: State): StateKey[] | undefined {
    _open_text()
        .then(rep => {
            const [s, name] = rep;
            try {
                const next_state = string_to_canvas(s);
                state.nodes = next_state.nodes;
                state.links = next_state.links;
                state.file_name = name.substring(0, name.lastIndexOf('.'));

                // Force the update only when the call resolves.
                force_update(['nodes', 'links', 'can', 'file_name', 'canvas']);
            } catch (error) {
                console.error(error);
                state.textbar = 'Error opening file.';
                force_update(['textbar']);
            }
        });

    return;
}

async function _open_text(): Promise<[string, string]> {
    return new Promise<[string, string]>((resolve, reject) => {
        // TODO: verify that element creation is not causing a memory leak.
        // js may not be garbage collecting this properly.
        const f_input = document.createElement('input');
        f_input.type = 'file';
        f_input.accept = '.fsmjson';

        f_input.oninput = (e: Event) => {
            const f = (<HTMLInputElement>e.target).files![0];
            f.text()
                .then(s => resolve([s, f.name]));
        }

        f_input.click();
    });
}