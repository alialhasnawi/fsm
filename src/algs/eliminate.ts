/**
 * State elimination of nodes.
 */
import { AnyLink, FSMElementString, FSMLink } from "../components/elements/abstract";
import { NodeLink } from "../components/elements/node_link";
import { SelfLink } from "../components/elements/self_link";
import { StartLink } from "../components/elements/start_link";
import { StateNode } from "../components/elements/state_node";
import { mutate } from "../store/store";
import { EPSILON, OPS } from "./constants";
import { to_RPN } from "./expr";
import { to_symbol } from "./shared_utils";

/**
 * Eliminate node from nodes.
 * Replace transitions with a partial regex.
 * 
 * @return Whether any states were eliminated.
 */
export function _eliminate(node: StateNode, nodes: StateNode[], links: AnyLink[]): boolean {

    if (node.isAcceptState)
        return false;

    const incoming_links = [];
    const outgoing_links = [];
    const self_links = [];

    const new_links: FSMLink[] = [];

    // Find and categorize links.
    for (let i = 0; i < links.length; i++) {
        const link = links[i];

        if (link instanceof SelfLink && link.node == node)
            self_links.push(link);
        else if (link instanceof NodeLink) {
            if (link.nodeA == node)
                outgoing_links.push(link);
            else if (link.nodeB == node)
                incoming_links.push(link);
        } else if (link instanceof StartLink) {
            if (link.node == node)
                return false;
        }
    }

    // Create self pathway regex.
    let self_reg = '';
    if (self_links.length > 0) {
        const self_options = [];
        for (let _ = 0; _ < self_links.length; _++) {
            self_options.push(...self_links[_].text.split(','));
        }
        if (self_options.length == 1 && self_options[0].length == 1)
            self_reg = `${self_options[0]}*`
        else if (self_options.length > 0)
            self_reg = `(${self_options.join('+')})*`
    }

    // Create new links, 1 for each pair of incoming and outgoing links.
    for (let i = 0; i < incoming_links.length; i++) {
        const in_link = incoming_links[i];

        for (let j = 0; j < outgoing_links.length; j++) {
            const out_link = outgoing_links[j];

            let new_link;
            let text;

            text = `${to_safe_str(in_link.text.split(',').map(s => s.trim()).join('+'))}${self_reg}${to_safe_str(out_link.text.split(',').map(s => s.trim()).join('+'))}`;

            if (in_link.nodeA == out_link.nodeB)
                new_link = new SelfLink(in_link.nodeA);
            else
                new_link = new NodeLink(in_link.nodeA, out_link.nodeB);

            text = strip_parenthesis(remove_epsilon(text));
            new_link.text = text;
            links.push(new_link);
        }
    }

    // Delete old links and node.
    let i = links.length;
    // js moment
    while (i--)
        if (incoming_links.some(link => link == links[i]) || outgoing_links.some(link => link == links[i]) || self_links.some(link => link == links[i]))
            links.splice(i, 1);

    nodes.splice(nodes.indexOf(node), 1);

    for (let i = 0; i < new_links.length; i++) {
        links.push(new_links[i]);
    }

    minimize_links(links);

    return true;
}

/**
 * Remove redundant \epsilon from the regex string.
 */
function remove_epsilon(s: string) {
    // xe or x*e or )e case
    // And
    // ex or e(
    return s.replace(new RegExp(`/([)*\w])(${EPSILON})/g`), '$1')
        .replace(new RegExp(`/(${EPSILON})([(\w])/g`), '$2');
}

/**
 * Minimize redundant links.
 */
function minimize_links(links: AnyLink[]) {
    const deletable: AnyLink[] = [];

    const node_link_data = new Map<String, (NodeLink | SelfLink)[]>();

    for (let i = 0; i < links.length; i++) {
        const link = links[i];

        if (link instanceof SelfLink) {
            let key: FSMElementString = to_symbol(link.node);
            const similar = node_link_data.get(key);

            if (similar != null)
                similar.push(link);
            else
                node_link_data.set(key, [link]);
        } else if (link instanceof NodeLink) {
            let key: FSMElementString = to_symbol(link.nodeA) + to_symbol(link.nodeB);
            const similar = node_link_data.get(key);

            if (similar != null)
                similar.push(link);
            else
                node_link_data.set(key, [link]);
        }
    }

    // Squish and mark as deletable.
    for (const similar of node_link_data.values()) {
        if (similar.length > 1) {
            similar[0].text = `${similar.map
                (l => l.text)
                .join('+')}`;

            for (let i = 1; i < similar.length; i++)
                deletable.push(similar[i]);
        }
    }

    let i = links.length;
    // js moment
    while (i--)
        if (deletable.includes(links[i]))
            links.splice(i, 1);
}

// TODO: add infix conversion to make this function more effective.

/**
 * Take a regular expression string and add parenthesis if needed.
 * Parentheses are needed for when there is an exposed binary operator +.
 */
function to_safe_str(s: string) {
    if (s.includes('+')) {
        let rpn = to_RPN(s);
        // Has first level binary operator (+) which needs parentheses.
        if (rpn.length > 0 && rpn[rpn.length - 1] == OPS.OR) {
            // Has parentheses already, ex: (x+x)
            // Must check if those are needed.
            if (s.charAt(0) == OPS.OPEN_LEFT && s.charAt(s.length - 1) == OPS.CLOSE_RIGHT) {
                // Check if the parenthesis are needed.
                // By checking validity of x[1:-1] without them.
                let score = 0;
                for (let i = 1; i < s.length - 1; i++) {
                    if (s[i] == OPS.OPEN_LEFT)
                        score++;
                    else if (s[i] == OPS.CLOSE_RIGHT)
                        score--;

                    // More closed than expected (counting from the first index), ex: (x+y)+(x+z)
                    // So return s back immediately.
                    if (score < 0) return `(${s})`;
                }
                // More open that expected (counting from the first index), ex: (()
                if (score != 0) {
                    mutate(state => {
                        state.textbar = `String "${s}" has non matching number of parentheses.`;
                        return ['textbar'];
                    });
                    console.warn(`String "${s}" has non matching number of parentheses.`);
                    return s;
                };
                // Otherwise, just return s.
            }
            // Add brackets, ex: x+y --> (x+y) 
            else return `(${s})`;
        }
    }

    // All other operators are safely concatenated.
    return s;
}

/**
 * Remove unnecessary outer parenthesis if needed.
 */
function strip_parenthesis(s: string) {
    if (s.length > 2 && s.charAt(0) == OPS.OPEN_LEFT && s.charAt(s.length - 1) == OPS.CLOSE_RIGHT) {
        // Check if the parenthesis are needed.
        // By checking validity of x[1:-1] without them.
        let score = 0;
        for (let i = 1; i < s.length - 1; i++) {
            if (s[i] == OPS.OPEN_LEFT)
                score++;
            else if (s[i] == OPS.CLOSE_RIGHT)
                score--;

            // More closed than expected (counting from the first index), ex: (x+y)+(x+z)
            // So return s back immediately.
            if (score < 0) return s;
        }
        // More open that expected (counting from the first index), ex: (()
        if (score != 0) {
            return s;
        };
        // Otherwise, return s[1:-1] without those parenthesis as they were not needed.
        return s.substring(1, s.length - 1);
    }
    return s;
}

// {"nodes":[{"x":124,"y":106,"text":"q_0","isAcceptState":false},{"x":366,"y":98,"text":"q_1","isAcceptState":false},{"x":609,"y":98,"text":"q_2","isAcceptState":false},{"x":685,"y":328,"text":"q_3","isAcceptState":false},{"x":557,"y":512,"text":"q_4","isAcceptState":false},{"x":358,"y":328,"text":"q_5","isAcceptState":false},{"x":150,"y":428,"text":"q_6","isAcceptState":true}],"links":[{"type":"Link","nodeA":0,"nodeB":1,"text":"\\epsilon","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"SelfLink","node":1,"text":"0","anchorAngle":-2.0344439357957027},{"type":"Link","nodeA":1,"nodeB":2,"text":"1","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":1,"nodeB":6,"text":"\\epsilon","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":5,"nodeB":1,"text":"0","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":4,"nodeB":6,"text":"\\epsilon","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"SelfLink","node":4,"text":"0,1","anchorAngle":0.866302262552679},{"type":"Link","nodeA":5,"nodeB":4,"text":"1","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":3,"nodeB":5,"text":"0","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":2,"nodeB":4,"text":"1","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":2,"nodeB":3,"text":"0","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":3,"nodeB":4,"text":"1","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0}]}

// {"nodes":[{"x":166,"y":269,"text":"q_0","isAcceptState":false},{"x":315,"y":269,"text":"q_1","isAcceptState":false},{"x":485,"y":269,"text":"q_2","isAcceptState":false},{"x":676,"y":276,"text":"q_3","isAcceptState":false},{"x":585,"y":144,"text":"q_5","isAcceptState":true},{"x":158,"y":463,"text":"q_4","isAcceptState":false}],"links":[{"type":"StartLink","node":5,"text":"start","deltaX":0,"deltaY":78},{"type":"Link","nodeA":5,"nodeB":0,"text":"\\epsilon","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":2,"nodeB":4,"text":"\\epsilon","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":3,"nodeB":4,"text":"\\epsilon","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":1,"nodeB":0,"text":"a","lineAngleAdjust":0,"parallelPart":0.44966442953020136,"perpendicularPart":-25},{"type":"Link","nodeA":0,"nodeB":1,"text":"a","lineAngleAdjust":3.141592653589793,"parallelPart":0.6174496644295302,"perpendicularPart":-28},{"type":"Link","nodeA":0,"nodeB":2,"text":"b","lineAngleAdjust":3.141592653589793,"parallelPart":0.6807205087375884,"perpendicularPart":-79.68112458455441},{"type":"Link","nodeA":1,"nodeB":2,"text":"\\epsilon","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":3,"nodeB":2,"text":"a","lineAngleAdjust":3.141592653589793,"parallelPart":0.37839384167273493,"perpendicularPart":-27.283137716577034},{"type":"Link","nodeA":3,"nodeB":1,"text":"a","lineAngleAdjust":3.141592653589793,"parallelPart":0.364309273605891,"perpendicularPart":-76.56455478932932},{"type":"Link","nodeA":2,"nodeB":3,"text":"b","lineAngleAdjust":3.141592653589793,"parallelPart":0.6044073364358062,"perpendicularPart":-15.241076695359656},{"type":"SelfLink","node":2,"text":"b","anchorAngle":-1.5707963267948966}]}
