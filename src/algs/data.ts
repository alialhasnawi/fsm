/**
 * Data objects parsed from the canvas elements.
 */

import { FSMCanvasState, Point2D } from "../types";
import { AnyLink, FSMElementString, FSMLink, FSMStringableElement } from "../components/elements/abstract";
import { NodeLink } from "../components/elements/node_link";
import { SelfLink } from "../components/elements/self_link";
import { StartLink } from "../components/elements/start_link";
import { StateNode } from "../components/elements/state_node";
import { EPSILON } from "./constants";
import { inplace_union, rand_pos, to_symbol, union } from "./shared_utils";
import { force_update } from "../store/store";

/**
 * Utility data for FAs. Can be used to test strings,
 * and evaluate the delta function.
 */
export class FAData {
    /** Names of all of the states. */
    state_names: string[];
    /** Transitions from the ith state via a string to a list of states. */
    transitions: Map<number, Map<string, number[]>>;
    /** Index of starting state. */
    starting_state: number;
    /** Index of accepting states. */
    accepting_states: number[];

    /**
     * Create an empty FAData.
     */
    constructor() {
        this.state_names = [];
        this.transitions = new Map();
        this.starting_state = -1;
        this.accepting_states = [];
    }
    /**
     * Load states and links from elements into this FAData.
     * Automatically generate state transitions.
     */
    load(nodes: StateNode[], links: AnyLink[]) {
        // Reset
        this.state_names = [];
        this.transitions = new Map();
        this.starting_state = -1;
        this.accepting_states = [];

        const node_to_index = new Map<FSMElementString, number>();

        // Get nodes.
        let curr = 0;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            node_to_index.set(to_symbol(node), curr);
            this.state_names.push(node.text);

            if (node.isAcceptState)
                this.accepting_states.push(curr);

            curr++;
        }

        // Get links.
        for (let i = 0; i < links.length; i++) {
            const link = links[i];

            if (link instanceof NodeLink) {
                const start = node_to_index.get(to_symbol(link.nodeA));
                const end = node_to_index.get(to_symbol(link.nodeB));
                const options = link.text.split(',').map(s => s.trim());

                if (start != null && end != null) {
                    // Initialize transition map.
                    let map = this.transitions.get(start);
                    if (map == null) {
                        map = new Map<string, number[]>();
                        this.transitions.set(start, map);
                    }

                    // Append options.
                    for (const option of options) {
                        let opt = map.get(option);
                        if (opt == null) {
                            opt = [];
                            map.set(option, opt);
                        }

                        opt.push(end);
                    }
                }
            }
            else if (link instanceof SelfLink) {
                const start = node_to_index.get(to_symbol(link.node));
                const end = start;
                const options = link.text.split(',').map(s => s.trim());

                if (start != null && end != null) {
                    // Initialize transition map.
                    let map = this.transitions.get(start);
                    if (map == null) {
                        map = new Map<string, number[]>();
                        this.transitions.set(start, map);
                    }

                    // Append options.
                    for (const option of options) {
                        let opt = map.get(option);
                        if (opt == null) {
                            opt = [];
                            map.set(option, opt);
                        }

                        opt.push(end);
                    }
                }
            }
            else if (link instanceof StartLink) {
                const index = node_to_index.get(to_symbol(link.node));
                if (index != null) this.starting_state = index;
            }
        }
    }

    /**
     * Create StateNodes and Links from this FAData.
     * All elements are created at a random position
     * in the canvas.
     */
    create_elements(): FSMCanvasState {
        const new_nodes: StateNode[] = [];
        const new_links: FSMLink[] = [];

        const index_to_node = new Map<number, StateNode>();

        for (let i = 0; i < this.state_names.length; i++) {
            const pos = rand_pos();
            const node = new StateNode(pos.x, pos.y);
            node.text = this.state_names[i];
            index_to_node.set(i, node);

            if (this.accepting_states.includes(i))
                node.isAcceptState = true;

            new_nodes.push(node);
        }

        for (const [start, transitions] of this.transitions.entries()) {
            const start_node = index_to_node.get(start);

            if (start_node != null) {
                for (const [transition, ends] of transitions.entries()) {
                    for (const end of ends) {
                        const end_node = index_to_node.get(end);
                        if (end_node != null) {
                            let link;
                            if (start == end) {
                                link = new SelfLink(start_node);

                            } else {
                                link = new NodeLink(start_node, end_node);
                                link.perpendicularPart += 100 * Math.random();
                            }

                            link.text = transition;
                            new_links.push(link);
                        }
                    }
                }
            }
        }

        if (this.starting_state != -1) {
            const start = index_to_node.get(this.starting_state);
            if (start != null) {
                const link = new StartLink(start);
                const pos = rand_pos();
                link.set_anchor_point(pos.x, pos.y);
                link.text = 'start';
                new_links.push(link);
            }
        }

        return {
            nodes: new_nodes,
            links: new_links
        }
    }

    /**
     * Add a new transition from an index to another via a transition.
     */
    add_transitions(from: number, transition: string, to: number[]) {
        let map = this.transitions.get(from);
        if (map == null) {
            map = new Map<string, number[]>();
            this.transitions.set(from, map);
        }

        let opt = map.get(transition);
        if (opt == null) {
            opt = [];
            map.set(transition, opt);
        }

        inplace_union(opt, to);
    }

    /**
     * Add one new transition from an index to another via a transition.
     */
    add_transition(from: number, transition: string, to: number) {
        let map = this.transitions.get(from);
        if (map == null) {
            map = new Map<string, number[]>();
            this.transitions.set(from, map);
        }

        let opt = map.get(transition);
        if (opt == null) {
            opt = [];
            map.set(transition, opt);
        }

        if (!opt.includes(to)) opt.push(to);
    }

    /**
     * Delta transition for this FA.
     * 
     * *transition must not be epsilon
     */
    deep_delta(state: number, transition: string): number[] {
        const shallow_dests: number[] = [];

        // Explore each equivalent starting state, and add the destinations.
        for (const from of this.get_equivalents(state)) {
            inplace_union(shallow_dests, this.shallow_delta(from, transition));
        }

        // Return each equivalent destination state.
        return this.get_equivalents(shallow_dests).slice();
    }

    /**
     * Shallow delta function for this FA, ignoring epsilon transitions.
     */
    shallow_delta(state: number, transition: string): number[] {
        let map = this.transitions.get(state);
        if (map != null) {
            let opt = map.get(transition);
            if (opt != null) {
                return opt.slice();
            }
        }

        return [];
    }

    /**
     * Return the set of all equivalent states in this fa.
     * Equivalent states are states reachable via epsilon transitions.
     * @param {number|number>} state
     */
    get_equivalents(state: number | number[]): number[] {
        // Make a set of the initial states from which to begin the search.
        if (!Array.isArray(state))
            state = [state];
        else
            state = state.slice();

        const stack = state.slice();

        let top = stack.pop();

        while (top != null) {
            let destinations = this.shallow_delta(top, EPSILON);

            for (const dest of destinations.values())
                // The state has not yet been explored, so add it to the stack and the set.
                if (!state.includes(dest)) { stack.push(dest); state.push(dest); }

            top = stack.pop();
        }

        return state;
    }

    /**
     * Return true if the FA is deterministic.
     */
    is_deterministic() {
        // Check that all transitions are non epsilon, and all transitions are
        // deterministic (return size of 1 state).
        for (const trans_map of this.transitions.values()) {
            for (const [transition, result] of trans_map.entries()) {
                if (transition == EPSILON || result.length > 1)
                    return false;
            }
        }

        return true;
    }
}

/**
 * Utility data for a graph where StateNodes are vertices,
 * links' anchor points are vertices, and edges connect
 * vertices and links as needed.
 * 
 * The graph is undirected.
 * 
 * Each vertex has a {x, y} position object.
 */
export class FSAGraph {
    private node_to_vert: Map<FSMElementString, number>;
    private vert_to_node: Map<number, FSMStringableElement>;
    private vertices: Point2D[];
    private edges: [number, number][];

    /**
     * Create an empty FSAGraph.
     * Modifying the vertices and edges does not modify
     * the canvas until sync_positions is called.
     */
    constructor() {
        /** Map from canvas element to vertex index. */
        this.node_to_vert = new Map();
        /** Map from vertex index to canvas element. */
        this.vert_to_node = new Map();
        /** List of vertex position objects. */
        this.vertices = [];
        /** List of edge tuples [a, b]. a,b are vertex indices
         * with a < b always. */
        this.edges = [];
    }

    /**
     * Load states and links from elements into this FSAGraph.
     */
    load(nodes: StateNode[], links: AnyLink[]) {
        this.node_to_vert = new Map();
        this.vert_to_node = new Map();
        this.vertices = [];
        this.edges = [];

        let curr = 0;

        // Append nodes.
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            this.vertices[curr] = { x: node.x, y: node.y };
            this.node_to_vert.set(to_symbol(node), curr);
            this.vert_to_node.set(curr, node);
            curr++;
        }

        // Append links.
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            if (link instanceof NodeLink) {
                const pos = link.get_anchor_point();
                this.vertices[curr] = { x: pos.x, y: pos.y };
                this.node_to_vert.set(to_symbol(link), curr);
                this.vert_to_node.set(curr, link);

                // Add linking edges.
                this.edges.push([this.node_to_vert.get(to_symbol(link.nodeA))!, curr]);
                this.edges.push([this.node_to_vert.get(to_symbol(link.nodeB))!, curr]);


                curr++;
            } else if (link instanceof StartLink) {
                const pos = link.get_start_point();
                this.vertices[curr] = { x: pos.x, y: pos.y };
                this.node_to_vert.set(to_symbol(link), curr);
                this.vert_to_node.set(curr, link);

                // Only 1 linking edge to StartLinks.
                this.edges.push([this.node_to_vert.get(to_symbol(link.node))!, curr]);

                curr++;
            }

        }
    }

    /**
     * Update all of the nodes and links referenced by the graph to
     * match its vertices' positions.
     */
    sync_positions() {
        // Update StateNodes.
        for (let i = 0; i < this.vertices.length; i++) {
            /** @type {{x: number, y:number}} */
            const v: Point2D = this.vertices[i];
            const node = this.vert_to_node.get(i);

            if (node instanceof StateNode) {
                node.set_mouse_start(node.x, node.y);
                node.set_anchor_point(v.x, v.y);
            } else if (node instanceof Node || node instanceof StartLink) {
                node.set_anchor_point(v.x, v.y);
            }
        }

        force_update(['nodes', 'links']);
    }
}