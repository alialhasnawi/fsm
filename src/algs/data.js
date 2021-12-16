/**
 * Data objects parsed from the canvas elements.
 * @module data
 */

import { Link } from "../elements/link";
import { StateNode } from "../elements/node";
import { SelfLink } from "../elements/self_link";
import { StartLink } from "../elements/start_link";
import { TemporaryLink } from "../elements/temporary_link";
import { canvasPadding } from "../main/constants";
import { canvas } from "../main/state";
import { EPSILON } from "./constants";
import { inplace_union, rand_pos, to_symbol, union } from "./shared_utils";

/**
 * Utility data for FAs. Can be used to test strings,
 * and evaluate the delta function.
 */
export class FAData {

    /**
     * Create an empty FAData.
     */
    constructor() {
        this.#reset();
    }

    /** Reset all properties. */
    #reset() {
        /** Names of all of the states.
         * @type {string[]} */
        this.state_names = [];
        /** Transitions from the ith state via a string to a list of states.
         * @type {Map<number, Map<string, Set<number>>>} */
        this.transitions = new Map();
        /** 
         * @type {number} */
        this.starting_state = -1;
        /** 
         * @type {Set<number>} */
        this.accepting_states = new Set();
    }

    /**
     * Load states and links from elements into this FAData.
     * Automatically generate state transitions.
     * 
     * @param {StateNode[]} nodes
     * @param {(Link|StartLink|TemporaryLink|SelfLink)[]} links
     */
    load(nodes, links) {
        this.#reset();

        /** @type {Map<string, number>} */
        const node_to_index = new Map();

        // Get nodes.
        let curr = 0;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            node_to_index.set(to_symbol(node), curr);
            this.state_names.push(node.text);

            if (node.isAcceptState)
                this.accepting_states.add(curr);

            curr++;
        }

        // Get links.
        for (let i = 0; i < links.length; i++) {
            const link = links[i];

            if (link instanceof Link) {
                const start = node_to_index.get(to_symbol(link.nodeA));
                const end = node_to_index.get(to_symbol(link.nodeB));
                const options = link.text.split(',').map(s => s.trim());

                if (!(this.transitions.has(start)))
                    this.transitions.set(start, new Map());

                for (const option of options) {
                    if (!(this.transitions.get(start).has(option)))
                        this.transitions.get(start).set(option, new Set());

                    this.transitions.get(start).get(option).add(end);
                }
            }
            else if (link instanceof SelfLink) {
                const start = node_to_index.get(to_symbol(link.node));
                const end = start;
                const options = link.text.split(',').map(s => s.trim());

                // Initialize map.
                if (!(this.transitions.has(start)))
                    this.transitions.set(start, new Map());

                // Append all options.
                for (const option of options) {
                    if (!(this.transitions.get(start).has(option)))
                        this.transitions.get(start).set(option, new Set());

                    this.transitions.get(start).get(option).add(end);
                }
            }
            else if (link instanceof StartLink) {
                this.starting_state = node_to_index.get(to_symbol(link.node));
            }
        }
    }

    /**
     * Create StateNodes and Links from this FAData.
     * All elements are created at a random position
     * in the canvas.
     */
    create_elements() {
        const new_nodes = [];
        const new_links = [];

        /** @type {Map<number, StateNode>} */
        const index_to_node = new Map();

        for (let i = 0; i < this.state_names.length; i++) {
            const pos = rand_pos();
            const node = new StateNode(pos.x, pos.y);
            node.text = this.state_names[i];
            index_to_node.set(i, node);

            if (this.accepting_states.has(i))
                node.isAcceptState = true;

            new_nodes.push(node);
        }

        for (const [start, transitions] of this.transitions.entries()) {
            for (const [transition, ends] of transitions.entries()) {
                for (const end of ends.values()) {
                    let link;
                    if (start == end) {
                        link = new SelfLink(index_to_node.get(start));

                    } else {
                        const pos = rand_pos();
                        link = new Link(index_to_node.get(start), index_to_node.get(end));
                        link.perpendicularPart += 100 * Math.random();
                    }

                    link.text = transition;
                    new_links.push(link);
                }
            }
        }

        if (this.starting_state != -1) {
            const start = new StartLink(index_to_node.get(this.starting_state));
            const pos = rand_pos();
            start.setAnchorPoint(pos.x, pos.y);
            start.text = 'start';
            new_links.push(start);
        }

        return {
            nodes: new_nodes,
            links: new_links
        }
    }

    /**
     * Add a new transition from an index to another via a transition.
     * @param {number} from 
     * @param {string} transition 
     * @param {Set<number>} to 
     */
    add_transitions(from, transition, to) {
        if (!this.transitions.has(from))
            this.transitions.set(from, new Map());

        if (!this.transitions.get(from).has(transition))
            this.transitions.get(from).set(transition, new Set());

        inplace_union(this.transitions.get(from).get(transition), to);
    }

    /**
     * Add one new transition from an index to another via a transition.
     * @param {number} from 
     * @param {string} transition 
     * @param {number} to 
     */
    add_transition(from, transition, to) {
        if (!this.transitions.has(from))
            this.transitions.set(from, new Map());

        if (!this.transitions.get(from).has(transition))
            this.transitions.get(from).set(transition, new Set());

        this.transitions.get(from).get(transition).add(to);
    }

    /**
     * Delta transition for this FA.
     * 
     * *transition must not be epsilon
     * @param {number} state 
     * @param {string} transition 
     */
    deep_delta(state, transition) {
        const shallow_dests = new Set();

        // Explore each equivalent starting state, and add the destinations.
        for (const from of this.get_equivalents(state).values()) {
            inplace_union(shallow_dests, this.shallow_delta(from, transition));
        }

        // Return each equivalent destination state.
        return this.get_equivalents(shallow_dests);
    }

    /**
     * Shallow delta function for this FA, ignoring epsilon transitions.
     * @param {number} state 
     * @param {string} transition 
     */
    shallow_delta(state, transition) {
        if (this.transitions.has(state)) {
            if (this.transitions.get(state).has(transition)) {
                return new Set(this.transitions.get(state).get(transition));
            }
        }

        return new Set();
    }

    /**
     * Return the set of all equivalent states in this fa.
     * Equivalent states are states reachable via epsilon transitions.
     * @param {number|Set<number>} state
     */
    get_equivalents(state) {
        // Make a set of the initial states from which to begin the search.
        if (!(state instanceof Set))
            state = new Set([state]);
        else
            state = new Set(state);

        /** @type {number[]} */
        const stack = Array.from(state);

        while (stack.length > 0) {
            let destinations = this.shallow_delta(stack.pop(), EPSILON);

            for (const dest of destinations.values()) {
                // The state has not yet been explored, so add it to the stack and the set.
                if (!state.has(dest)) {
                    stack.push(dest);
                    state.add(dest);
                }
            }

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
                if (transition == EPSILON || result.size > 1)
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
    /**
     * Create an empty FSAGraph.
     * Modifying the vertices and edges does not modify
     * the canvas until sync_positions is called.
     */
    constructor() {
        this.#reset();
    }

    /** Reset all properties. */
    #reset() {
        /** Map from a canvas element's string symbol to its
         * vertex index.
         * @type {Map<string, number>} */
        this.node_to_vert = new Map();
        /** Map from vertex index to canvas element.
         *  @type {Map<number, StateNode|Link|StartLink>} */
        this.vert_to_node = new Map();;
        /** List of vertex position objects. 
         * @type {{x: number, y:number}[]}} */
        this.vertices = [];
        /** List of edge tuples [a, b]. a,b are vertex indices
         * with a < b always. 
         * @type {[number, number][]} */
        this.edges = [];
    }

    /**
     * Load states and links from elements into this FSAGraph.
     * 
     * @param {StateNode[]} nodes
     * @param {(Link|StartLink|TemporaryLink|SelfLink)[]} links
     */
    load(nodes, links) {
        this.#reset();

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
            if (link instanceof Link) {
                const pos = link.getAnchorPoint();
                this.vertices[curr] = { x: pos.x, y: pos.y };
                this.node_to_vert.set(to_symbol(link), curr);
                this.vert_to_node.set(curr, link);

                // Add linking edges.
                this.edges.push([this.node_to_vert.get(to_symbol(link.nodeA)), curr]);
                this.edges.push([this.node_to_vert.get(to_symbol(link.nodeB)), curr]);

                curr++;
            } else if (link instanceof StartLink) {
                const pos = link.getStartPoint();
                this.vertices[curr] = { x: pos.x, y: pos.y };
                this.node_to_vert.set(to_symbol(link), curr);
                this.vert_to_node.set(curr, link);

                // Only 1 linking edge to StartLinks.
                this.edges.push([this.node_to_vert.get(to_symbol(link.node)), curr]);

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
            const v = this.vertices[i];
            const node = this.vert_to_node.get(i);

            if (node instanceof StateNode) {
                node.setMouseStart(node.x, node.y);
                node.setAnchorPoint(v.x, v.y);
            } else if (node instanceof Link || node instanceof StartLink) {
                node.setAnchorPoint(v.x, v.y);
            }
        }
    }
}