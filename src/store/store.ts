/**
 * In charge of loading strings, undoing and redoing actions.
 * Stores the global state and its subscribers.
 */

import { Component } from "preact";
import { Canvas } from "../components/canvas/canvas";
import { CanvasTool, EffectOf, State, StateEffects, StateKey, Subscribers } from "../types";
import { effect_canvas, effect_prev_tool, effect_save_backup, effect_undo_redo } from "./effects";

const _state: State = {
    temp_link: undefined, // a Link

    canvas: undefined!,
    view_zone: {
        zoom: 1,
        x: 0,
        y: 0,
    },

    active_objects: [],
    selected_object: undefined, // either a Link or a Node
    nodes: [],
    links: [],

    last_tool: CanvasTool.POINTER,
    curr_tool: CanvasTool.POINTER,

    can: { undo: false, redo: false },
    file_name: 'untitled',
};

const _subscribers: Subscribers<State> = {
    temp_link: [],

    canvas: [],
    view_zone: [],

    active_objects: [],
    selected_object: [],
    nodes: [],
    links: [],

    last_tool: [],
    curr_tool: [],

    can: [],
    file_name: [],
};

const _post_effects: StateEffects<State> = {
    temp_link: [],

    canvas: [effect_canvas],
    view_zone: [],

    active_objects: [],
    selected_object: [effect_undo_redo, effect_save_backup],
    nodes: [effect_undo_redo, effect_save_backup],
    links: [effect_undo_redo, effect_save_backup],

    last_tool: [],
    curr_tool: [effect_prev_tool],

    can: [],
    file_name: [],
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
export function get_canvas(): Canvas { return _canvas; }
/** Set the canvas if not already set. */
export function set_default_canvas(c: Canvas): void { if (_canvas == null) _canvas = c; _state.canvas = c; }


// /**
//  * Apply a function onto the state.
//  * @param func Function of the state.
//  */
// export function mutate_mediate(keys: StateKey[], func: (state: State) => StateKey[] | undefined, execute_actions: boolean = true) {
//     if (execute_actions) pre_actions(keys);

//     func(_state);

//     if (keys != null) {
//         if (execute_actions) post_actions(keys);

//         // And update.
//         push_update(keys);
//     };
// }

// function pre_actions(keys: StateKey[]) {
//     // Fetch actions.
//     const actions: EffectOf<State>[] = [];
//     for (const key of keys)
//         for (const action of _pre_effects[key])
//             if (!actions.includes(action)) actions.push(action);

//     // Execute actions.  
//     for (const action of actions)
//         action(_state);
// }

function post_actions(keys: StateKey[]) {
    // Fetch actions.
    const actions: EffectOf<State>[] = [];
    for (const key of keys)
        for (const action of _post_effects[key])
            if (!actions.includes(action)) actions.push(action);

    // Execute actions.  
    for (const action of actions)
        action(_state);
}

/**
 * Apply a function onto the state.
 * @param func Function of the state.
 */
export function mutate(func: (state: State) => StateKey[] | undefined, execute_actions: boolean = true) {
    let keys = func(_state);

    if (keys != null) {
        if (execute_actions) post_actions(keys);

        // And update.
        push_update(keys);
    };
}

/**
 * Apply a function onto the state with extra arguments.
 * @param func Function of the state.
 */
export function mutate_with_args<Args>(func: (state: State, ...args: Args[]) => StateKey[] | undefined, execute_actions: boolean = true, ...args: Args[]) {
    let keys = func(_state, ...args);

    if (keys != null) {
        if (execute_actions) post_actions(keys);

        // And update.
        push_update(keys);
    };
}

/**
 * Update the keys without explicit mutation.
 * 
 * Use with caution.
 */
export function force_update(keys: StateKey[]) {
    push_update(keys);
    post_actions(keys);
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