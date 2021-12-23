/**
 * In charge of loading strings, undoing and redoing actions.
 * Stores the global state and its subscribers.
 */

import { Component } from "preact";
import { Canvas } from "../components/canvas/canvas";
import { FSMLink } from "../components/elements/abstract";
import { NodeLink } from "../components/elements/node_link";
import { SelfLink } from "../components/elements/self_link";
import { StartLink } from "../components/elements/start_link";
import { StateNode } from "../components/elements/state_node";
import { Backup, BackupLink, BackupNode, CanvasJSON, CanvasTool, FSMCanvasState, State, StateKey, Subscribers } from "../types";

const _state: State = {
    temp_link: undefined, // a Link

    active_objects: [],
    selected_object: undefined, // either a Link or a Node
    nodes: [],
    links: [],

    last_tool: CanvasTool.POINTER,
    curr_tool: CanvasTool.POINTER,
};

const _subscribers: Subscribers<State> = {
    temp_link: [],

    active_objects: [],
    selected_object: [],
    nodes: [],
    links: [],

    last_tool: [],
    curr_tool: [],
};

const _subscriber_map: Map<Component, StateKey[]> = new Map();

/**
 * Subscribe the component to certain keys.
 */
export function subscribe(keys: StateKey[], component: Component) {
    for (const key of keys) {
        if (!_subscribers[key].includes(component)) _subscribers[key].push(component);
    }
    _subscriber_map.set(component, keys);
}

/**
 * Unsubscribe the component from all keys.
 */
export function unsubscribe(component: Component) {
    const subbed_keys = _subscriber_map.get(component);

    if (subbed_keys != null) {
        for (let key of subbed_keys) {
            for (let i = _subscribers[key].length - 1; i >= 0; i--) {
                if (component == _subscribers[key][i]) {
                    _subscribers[key].splice(i, 1);
                    i--;
                }
            }
        }
    }
}

let _canvas: Canvas;

export function get_canvas(): Canvas {
    return _canvas;
}

/** Set the canvas if not already set. */
export function set_default_canvas(c: Canvas): void {
    if (_canvas == null) _canvas = c;


}

let _undo_stack: CanvasJSON[] = [];
let _redo_stack: CanvasJSON[] = [];

/**
 * Undo a canvas change if possible.
 */
export function undo() {
    let next_str = _undo_stack.pop();
    if (next_str != null) {
        // Push current state to the redo stack.
        _redo_stack.push(canvas_to_string());

        // Load the new state from the undo stack.
        const next_state: FSMCanvasState = string_to_canvas(next_str);
        _state.nodes = next_state.nodes;
        _state.links = next_state.links;

        // Update subscribers.
        push_update(['nodes', 'links']);
    }
}

/**
 * Redo an undone canvas change if possible.
 */
export function redo() {
    let next_str = _redo_stack.pop();
    if (next_str != null) {
        // Push current state to the undo stack.
        _undo_stack.push(canvas_to_string());

        // Load the new state from the undo stack.
        const next_state: FSMCanvasState = JSON.parse(next_str);
        _state.nodes = next_state.nodes;
        _state.links = next_state.links;

        // Update subscribers.
        push_update(['nodes', 'links']);
    }
}


/**
 * Apply a function onto the state.
 * @param keys State keys which will be mutated.
 * @param func Function of the state.
 */
export function mutate(keys: StateKey[], func: (state: State) => void) {
    if (keys.includes('curr_tool')) {
        _state.last_tool = _state.curr_tool;
    }

    func(_state);

    if (keys.includes('nodes') || keys.includes('links') || keys.includes('selected_object')) {
        save_undo_redo();
    }


    push_update(keys);
}

/**
 * Apply a function onto the state. Mutate the keys if the function returns true.
 * @param keys State keys which will be mutated.
 * @param func Function of the state.
 */
export function mutate_if_true(keys: StateKey[], func: (state: State) => boolean) {
    let last_tool = _state.curr_tool;

    const result = func(_state);

    if (result) {
        if (keys.includes('curr_tool'))
            _state.last_tool = last_tool;

        if (keys.includes('nodes') || keys.includes('links') || keys.includes('selected_object')) {
            save_undo_redo();
        }

        push_update(keys);
    }
}

/**
 * Update the keys without explicit mutation.
 * 
 * Use with caution.
 */
export function force_update(keys: StateKey[]) {
    push_update(keys);
}

/**
 * Get a state.
 * 
 * Must not mutate the state.
 */
export function get_state<K extends StateKey>(key: K): State[K] {
    return _state[key];
}

/**
 * Apply a function onto the state and return the result.
 * 
 * Must not mutate the state.
 * @param func Function of the state.
 */
export function access<T>(func: (state: State) => T): T {
    return func(_state);
}

/**
 * Save the canvas to the undo/redo stacks and to localStorage.
 */
function save_undo_redo() {
    const str = canvas_to_string();
    _undo_stack.push(str);
    _redo_stack = [];
    save_backup(str);
}

/**
 * Update all the subscribers to this key.
 * @param key 
 */
function push_update(keys: StateKey[]) {
    // Store update-ables in set to minimize duplicate rerenders.
    const will_update: Component[] = [];
    for (const key of keys) {
        for (const subscriber of _subscribers[key])
            if (!will_update.includes(subscriber)) will_update.push(subscriber);
    }

    for (const comp of will_update) {
        comp.setState({});
    }
}

/**
 * Load the canvas from localStorage.
 */
export function restore_backup() {
    if (typeof window != 'undefined') {
        if (!localStorage || !JSON) {
            return;
        }

        try {
            const storage = localStorage.getItem("fsm");
            if (storage != null) {
                const next_state = string_to_canvas(storage);
                _state.nodes = next_state.nodes;
                _state.links = next_state.links;
            }

        } catch (error) {
            localStorage['fsm'] = "";
        }

        push_update(['nodes', 'links']);
    }
}

/**
 * Save the current canvas to localStorage.
 */
export function save_backup(backup: CanvasJSON) {
    if (!localStorage || !JSON) {
        return;
    }

    localStorage['fsm'] = backup;
}


/**
 * Get the node and link elements corresponding to the given json string.
 */
function string_to_canvas(json: CanvasJSON): FSMCanvasState {
    const nodes: StateNode[] = [];
    const links: FSMLink[] = [];

    if (!localStorage || !JSON) {
        return { nodes, links };
    }

    const backup = JSON.parse(json);

    for (let i = 0; i < backup.nodes.length; i++) {
        const backupNode: BackupNode = backup.nodes[i];
        const node = new StateNode(backupNode.x, backupNode.y);
        node.isAcceptState = backupNode.isAcceptState;
        node.text = backupNode.text;
        nodes.push(node);
    }

    for (let i = 0; i < backup.links.length; i++) {
        const backupLink: BackupLink = backup.links[i];
        let link = null;
        if (backupLink.type == 'SelfLink') {
            link = new SelfLink(nodes[backupLink.node]);
            link.anchorAngle = backupLink.anchorAngle;
            link.text = backupLink.text;
        } else if (backupLink.type == 'StartLink') {
            link = new StartLink(nodes[backupLink.node]);
            link.deltaX = backupLink.deltaX;
            link.deltaY = backupLink.deltaY;
            link.text = backupLink.text;
        } else if (backupLink.type == 'NodeLink') {
            link = new NodeLink(nodes[backupLink.nodeA], nodes[backupLink.nodeB]);
            link.parallelPart = backupLink.parallelPart;
            link.perpendicularPart = backupLink.perpendicularPart;
            link.text = backupLink.text;
            link.lineAngleAdjust = backupLink.lineAngleAdjust;
        }
        if (link != null) {
            links.push(link);
        }
    }

    return { nodes, links };
}

/**
 * Convert the current canvas state to a JSON string.
 * @returns The string representation of the current canvas.
 */
function canvas_to_string(): CanvasJSON {
    if (!localStorage || !JSON) {
        return "";
    }

    const nodes = _state.nodes;
    const links = _state.links;

    const backup: Backup = {
        nodes: [],
        links: [],
    };
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        let backup_node = {
            x: node.x,
            y: node.y,
            text: node.text,
            isAcceptState: node.isAcceptState,
        };
        backup.nodes.push(backup_node);
    }
    for (let i = 0; i < links.length; i++) {
        const link = links[i];
        let backup_link: BackupLink | undefined = undefined;
        if (link instanceof SelfLink) {
            backup_link = {
                type: 'SelfLink',
                node: nodes.indexOf(link.node),
                text: link.text,
                anchorAngle: link.anchorAngle,
            };
        } else if (link instanceof StartLink) {
            backup_link = {
                type: 'StartLink',
                node: nodes.indexOf(link.node),
                text: link.text,
                deltaX: link.deltaX,
                deltaY: link.deltaY,
            };
        } else if (link instanceof NodeLink) {
            backup_link = {
                type: 'NodeLink',
                nodeA: nodes.indexOf(link.nodeA),
                nodeB: nodes.indexOf(link.nodeB),
                text: link.text,
                lineAngleAdjust: link.lineAngleAdjust,
                parallelPart: link.parallelPart,
                perpendicularPart: link.perpendicularPart,
            };
        }
        if (backup_link != null) {
            backup.links.push(backup_link);
        }
    }

    return JSON.stringify(backup);
}