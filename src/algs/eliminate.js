import {
    OR_OP,
    OPEN_LEFT,
    CLOSE_RIGHT,
} from "./constants";
import { Link } from "../elements/link";
import { StateNode } from "../elements/node";
import { SelfLink } from "../elements/self_link";
import { StartLink } from "../elements/start_link";
import { to_RPN } from "./expr";

/**
 * Eliminate node from nodes.
 * Replace transitions with a partial regex.
 * @param {StateNode} node 
 * @param {StateNode[]} nodes 
 * @param {(Link|SelfLink|StartLink)[]} links 
 */
export function eliminate(node, nodes, links) {
    if (node.isAcceptState)
        return;

    const incoming_links = [];
    const outgoing_links = [];
    const self_links = [];

    const new_links = [];

    // Find and categorize links.
    for (let i = 0; i < links.length; i++) {
        const link = links[i];

        if (link instanceof SelfLink && link.node == node)
            self_links.push(link);
        else if (link instanceof Link) {
            if (link.nodeA == node)
                outgoing_links.push(link);
            else if (link.nodeB == node)
                incoming_links.push(link);
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

            text = `${to_safe_str(in_link.text)}${self_reg}${to_safe_str(out_link.text)}`;

            if (in_link.nodeA == out_link.nodeB)
                new_link = new SelfLink(in_link.nodeA);
            else
                new_link = new Link(in_link.nodeA, out_link.nodeB);

            text = remove_epsilon(text);
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
}

/**
 * Remove redundant \epsilon from the regex string.
 * @param {string} s 
 */
function remove_epsilon(s) {
    // xe or x*e or )e case
    // And
    // ex or e(
    return s.replace(/([)*\w])(\\epsilon)/g, '$1')
        .replace(/(\\epsilon)([(\w])/g, '$2');
}

/**
 * Minimize redundant links.
 * @param {(Link|SelfLink|StartLink)[]} links 
 */
function minimize_links(links) {
    const deletable = [];

    // @type Map<String, [Link]>
    const link_data = new Map();

    for (let i = 0; i < links.length; i++) {
        const link = links[i];

        if (link instanceof SelfLink)
            continue;
        if (!(link instanceof Link))
            continue;

        let key = to_symbol(link.nodeA) + to_symbol(link.nodeB);

        if (link_data.get(key))
            link_data.get(key).push(link);
        else
            link_data.set(key, [link]);
    }

    // Squish and mark as deletable.
    for (const lst of link_data.values()) {
        if (lst.length > 1) {
            lst[0].text = `${lst.map
                (l => l.text)
                .join('+')}`;

            for (let i = 1; i < lst.length; i++)
                deletable.push(lst[i]);
        }
    }

    let i = links.length;
    // js moment
    while (i--)
        if (deletable.some(link => link == links[i]))
            links.splice(i, 1);
}

/**
 * Return a unique string for each node.
 * @param {StateNode} node 
 * @returns symbol
 */
function to_symbol(node) {
    // lazy
    return JSON.stringify(node);
}

/**
 * Take a regular expression string and add parenthesis if needed.
 * Parentheses are needed for when there is an exposed binary operator +.
 * @param {string} s 
 */
function to_safe_str(s) {
    if (s.includes('+')) {
        let rpn = to_RPN(s);
        // Has first level binary operator + that needs parentheses.
        if (rpn.length > 0 && rpn[rpn.length - 1] == OR_OP) {
            // Has parentheses already.
            if (s.charAt(0) == OPEN_LEFT && s.charAt(s.length - 1) == CLOSE_RIGHT) {
                // Check if the parenthesis are needed.
                let score = 0;
                for (let i = 0; i < s.length; i++) {
                    if (s[i] == OPEN_LEFT)
                        score++;
                    else if (s[i] == CLOSE_RIGHT)
                        score--;

                    if (score < 0) return `(${s})`;
                }
            } else return `(${s})`;
        }
    }

    return s;
}

// {"nodes":[{"x":124,"y":106,"text":"q_0","isAcceptState":false},{"x":366,"y":98,"text":"q_1","isAcceptState":false},{"x":609,"y":98,"text":"q_2","isAcceptState":false},{"x":685,"y":328,"text":"q_3","isAcceptState":false},{"x":557,"y":512,"text":"q_4","isAcceptState":false},{"x":358,"y":328,"text":"q_5","isAcceptState":false},{"x":150,"y":428,"text":"q_6","isAcceptState":true}],"links":[{"type":"Link","nodeA":0,"nodeB":1,"text":"\\epsilon","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"SelfLink","node":1,"text":"0","anchorAngle":-2.0344439357957027},{"type":"Link","nodeA":1,"nodeB":2,"text":"1","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":1,"nodeB":6,"text":"\\epsilon","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":5,"nodeB":1,"text":"0","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":4,"nodeB":6,"text":"\\epsilon","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"SelfLink","node":4,"text":"0,1","anchorAngle":0.866302262552679},{"type":"Link","nodeA":5,"nodeB":4,"text":"1","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":3,"nodeB":5,"text":"0","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":2,"nodeB":4,"text":"1","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":2,"nodeB":3,"text":"0","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":3,"nodeB":4,"text":"1","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0}]}

// {"nodes":[{"x":166,"y":269,"text":"q_0","isAcceptState":false},{"x":315,"y":269,"text":"q_1","isAcceptState":false},{"x":485,"y":269,"text":"q_2","isAcceptState":false},{"x":676,"y":276,"text":"q_3","isAcceptState":false},{"x":585,"y":144,"text":"q_5","isAcceptState":true},{"x":158,"y":463,"text":"q_4","isAcceptState":false}],"links":[{"type":"StartLink","node":5,"text":"start","deltaX":0,"deltaY":78},{"type":"Link","nodeA":5,"nodeB":0,"text":"\\epsilon","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":2,"nodeB":4,"text":"\\epsilon","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":3,"nodeB":4,"text":"\\epsilon","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":1,"nodeB":0,"text":"a","lineAngleAdjust":0,"parallelPart":0.44966442953020136,"perpendicularPart":-25},{"type":"Link","nodeA":0,"nodeB":1,"text":"a","lineAngleAdjust":3.141592653589793,"parallelPart":0.6174496644295302,"perpendicularPart":-28},{"type":"Link","nodeA":0,"nodeB":2,"text":"b","lineAngleAdjust":3.141592653589793,"parallelPart":0.6807205087375884,"perpendicularPart":-79.68112458455441},{"type":"Link","nodeA":1,"nodeB":2,"text":"\\epsilon","lineAngleAdjust":0,"parallelPart":0.5,"perpendicularPart":0},{"type":"Link","nodeA":3,"nodeB":2,"text":"a","lineAngleAdjust":3.141592653589793,"parallelPart":0.37839384167273493,"perpendicularPart":-27.283137716577034},{"type":"Link","nodeA":3,"nodeB":1,"text":"a","lineAngleAdjust":3.141592653589793,"parallelPart":0.364309273605891,"perpendicularPart":-76.56455478932932},{"type":"Link","nodeA":2,"nodeB":3,"text":"b","lineAngleAdjust":3.141592653589793,"parallelPart":0.6044073364358062,"perpendicularPart":-15.241076695359656},{"type":"SelfLink","node":2,"text":"b","anchorAngle":-1.5707963267948966}]}
