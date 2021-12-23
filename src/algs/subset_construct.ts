/**
 * Subset construction for converting NFAs to DFAs.
 */

import { AnyLink } from "../components/elements/abstract";
import { StateNode } from "../components/elements/state_node";
import { State } from "../types";
import { EPSILON } from "./constants";
import { FAData } from "./data";
import { inplace_union } from "./shared_utils";


/**
 * Preform subset construction on the current 
 */
export function subset_construct(state: State): boolean {
    const fa = new FAData();
    const nodes = state.nodes;
    const links = state.links;

    fa.load(nodes, links);

    if (fa.is_deterministic()) {
        console.warn('Tried to perform subset construction on a DFA.');
        return false;
    } else if (fa.starting_state == -1) {
        console.warn('FA has no starting state so subset construction failed.');
        return false;
    }

    const dfa = _subset_alg(fa);
    const { nodes: new_nodes, links: new_links } = dfa.create_elements();

    replace_elements(nodes, links, new_nodes, new_links);

    return true;
}

/**
 * Return a new DFA equivalent to the given FA.
 */
function _subset_alg(fa: FAData) {
    const dfa = new FAData();

    /** Map of all state strings, ex; '0,2,4' which have
     * already been explored to index of state in the new DFA. */
    const name_to_index = new Map<string, number>();
    /** List of names of all state transitions corresponding
     * to dfa.state_names. */
    const names: string[] = [];
    const state_stack: number[][] = [];

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

    if (Array.from(dfa_start_set).some(i => fa.accepting_states.includes(i)))
        dfa.accepting_states.push(curr);
    curr++;

    // Iterate over the state stack.
    let origin = state_stack.pop();
    while (origin != null) {
        const from_name = _set_to_string(origin);

        /** The new transitions from the popped state-set. */
        const transitions = new Map<string, number[]>();

        // Populate transitions.
        for (const state of origin) {
            const from_state_transitions = fa.transitions.get(state);
            if (from_state_transitions != null) {
                // Iterate over all possible transitions from the state.
                for (const transition of from_state_transitions.keys()) {
                    // Excluding epislon transitions.
                    if (transition != EPSILON) {
                        let result = transitions.get(transition);
                        if (result == null) {
                            result = [];
                            transitions.set(transition, result);
                        }
                        inplace_union(result, fa.deep_delta(state, transition));
                    }
                }
            }
        }

        // Add transitions map to dfa.
        for (const [transition, output] of transitions.entries()) {
            const to_name = _set_to_string(output);
            const from = name_to_index.get(from_name)!;

            if (name_to_index.has(to_name)) {
                // Case 1, the state has already been defined.
                // Add it to the dfa and move on.
                dfa.add_transition(from, transition, name_to_index.get(to_name)!);
            } else {
                // Case 2, the state has not been defined.
                const to_name = _set_to_string(output);

                // Initialize the new state.
                name_to_index.set(to_name, curr);
                const state_names = Array.from(output).map(i => fa.state_names[i]);
                state_names.sort();
                names.push(`{${state_names.join(',')}}`);
                state_stack.push(output);

                // The state is accepting if any constituents are accepting.
                if (Array.from(output).some(i => fa.accepting_states.includes(i)))
                    dfa.accepting_states.push(curr);

                // Add the transition. curr is the index of the newly created state.
                dfa.add_transition(from, transition, curr);

                curr++;
            }

        }

        origin = state_stack.pop();
    }

    dfa.state_names = names;

    return dfa;
}

/**
 * Convert a set to its string representation.
 */
function _set_to_string(set: number[]) {
    const arr = set.slice();
    arr.sort();
    return arr.join(',');
}

/**
 * Move new nodes and new links into node and links array.
 */
function replace_elements(nodes: StateNode[], links: AnyLink[], new_nodes: StateNode[], new_links: AnyLink[]) {
    nodes.splice(0, nodes.length);
    links.splice(0, links.length);

    for (let i = 0; i < new_nodes.length; i++)
        nodes.push(new_nodes[i]);
    for (let i = 0; i < new_links.length; i++)
        links.push(new_links[i]);

}