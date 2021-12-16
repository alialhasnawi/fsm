/**
 * Subset construction for converting NFAs to DFAs.
 * @module subset_construct
 */

import { Link } from "../elements/link";
import { StateNode } from "../elements/node";
import { SelfLink } from "../elements/self_link";
import { StartLink } from "../elements/start_link";
import { links, nodes, state } from "../main/state";
import { EPSILON } from "./constants";
import { FAData } from "./data";
import { inplace_union } from "./shared_utils";


/**
 * Preform subset construction on the current 
 */
export function subset_construct() {
    const fa = new FAData();
    fa.load(nodes, links);

    if (fa.is_deterministic()) {
        console.warn('Tried to perform subset construction on a DFA.');
        return;
    } else if (fa.starting_state == -1) {
        console.warn('FA has no starting state so subset construction failed.');
        return;
    }

    const dfa = _subset_alg(fa);
    const { nodes: new_nodes, links: new_links } = dfa.create_elements();

    replace_elements(new_nodes, new_links);
}

/**
 * Return a new DFA equivalent to the given FA.
 * @param {FAData} fa 
 */
function _subset_alg(fa) {
    const dfa = new FAData();

    /** Map of all state strings, ex; '0,2,4' which have
     * already been explored. Index of state in the new DFA.
    /** 
     * @type {Map<string, number>} */
    const name_to_index = new Map();
    /** List of names of all state transitions corresponding
     * to dfa.state_names.
     * @type {string[]} */
    const names = [];
    /** Stack of 
     * @type {Set<number>[]} */
    const state_stack = [];

    let curr = 0;

    dfa.starting_state = 0;

    // Initialize the FA and search with the FA's start/equivalent states.
    // The steps are:
    // 1. Create the set.
    // 2. Get it's identifying symbol and assign it an index.
    // 3. Give it a name and add it to the names array.
    // 4. Push the state-set to the stack to be explored.
    // 5. Check if the state should be accepting.

    const dfa_start_set = fa.get_equivalents(fa.starting_state);
    name_to_index.set(_set_to_string(dfa_start_set), curr);
    const start_state_names = Array.from(dfa_start_set).map(i => fa.state_names[i]);
    start_state_names.sort();
    names.push(`{${start_state_names.join('')}}`);
    state_stack.push(dfa_start_set);

    console.log(Array.from(fa.accepting_states));
    console.log(fa.starting_state, fa.accepting_states.has(fa.starting_state));

    if (Array.from(dfa_start_set).some(i => fa.accepting_states.has(i)))
        dfa.accepting_states.add(curr);
    curr++;

    while (state_stack.length > 0) {
        const origin = state_stack.pop();
        const from_name = _set_to_string(origin);
        const from = name_to_index.get(from_name);

        /** The new transitions from the popped state-set.
         * @type {Map<string, Set<number>>} */
        const transitions = new Map();

        // Populate transitions.
        for (const state of origin) {
            if (fa.transitions.has(state)) {
                // Iterate over all possible transitions from the state.
                for (const transition of fa.transitions.get(state).keys()) {
                    if (transition != EPSILON) {
                        if (!transitions.has(transition))
                            transitions.set(transition, new Set());
                        inplace_union(transitions.get(transition), fa.deep_delta(state, transition));
                    }
                }
            }
        }

        // Add transitions map to dfa.
        for (const [transition, output] of transitions.entries()) {
            const name = _set_to_string(output);

            if (name_to_index.has(name)) {
                // Case 1, the state has already been defined.
                // Add it to the dfa and move on.
                dfa.add_transition(from, transition, name_to_index.get(name));
            } else {
                // Case 2, the state has not been defined.
                const to_name = _set_to_string(output);

                // Initialize the new state.
                name_to_index.set(to_name, curr);
                const state_names = Array.from(output).map(i => fa.state_names[i]);
                state_names.sort();
                names.push(`{${state_names.join('')}}`);
                state_stack.push(output);

                // The state is accepting if any constituents are accepting.
                if (Array.from(output).some(i => fa.accepting_states.has(i)))
                    dfa.accepting_states.add(curr);

                // Add the transition. curr is the index of the newly created state.
                dfa.add_transition(from, transition, curr);

                curr++;
            }
        }
    }

    dfa.state_names = names;

    return dfa;
}

/**
 * Convert a set to its string representation.
 * @param {Set<number>} set 
 */
function _set_to_string(set) {
    const arr = Array.from(set);
    arr.sort();
    return arr.join(',');
}

/**
 * @param {StateNode[]} new_nodes
 * @param {(Link|StartLink|SelfLink)[]} new_links
 */
function replace_elements(new_nodes, new_links) {
    nodes.splice(0, nodes.length);
    links.splice(0, links.length);

    for (let i = 0; i < new_nodes.length; i++)
        nodes.push(new_nodes[i]);
    for (let i = 0; i < new_links.length; i++)
        links.push(new_links[i]);
}