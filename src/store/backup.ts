import { FSMLink } from "../components/elements/abstract";
import { NodeLink } from "../components/elements/node_link";
import { SelfLink } from "../components/elements/self_link";
import { StartLink } from "../components/elements/start_link";
import { StateNode } from "../components/elements/state_node";
import { Backup, BackupLink, BackupNode, CanvasJSON, FSMCanvasState, State, StateKey } from "../types";


/**
 * Save the current canvas to localStorage.
 */
export function effect_save_backup(curr: State) {
    if (!localStorage || !JSON) {
        return;
    }

    localStorage['fsm'] = canvas_to_string(curr);
}

/**
 * Load the canvas from localStorage.
 */
export function restore_backup(state: State): StateKey[] | undefined {
    if (typeof window != 'undefined') {
        if (!localStorage || !JSON) {
            return;
        }

        try {
            const storage = localStorage.getItem("fsm");
            if (storage != null) {
                const next_state = string_to_canvas(storage);
                state.nodes = next_state.nodes;
                state.links = next_state.links;
            }

        } catch (error) {
            localStorage['fsm'] = "";
        }
        
        return ['nodes', 'links'];
    }
}

/**
 * Get the node and link elements corresponding to the given json string.
 */
export function string_to_canvas(json: CanvasJSON): FSMCanvasState {
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
        } else if (backupLink.type == 'NodeLink' || backupLink.type == 'Link') {
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
export function canvas_to_string(state: State): CanvasJSON {
    if (!localStorage || !JSON) {
        return "";
    }

    const nodes = state.nodes;
    const links = state.links;

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