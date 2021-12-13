export const state = {
    cursorVisible: true,
    selectedObject: null, // either a Link or a Node
    currentLink: null, // a Link
    movingObject: false,
    originalClick: null
};

/**
 * @type {import('../elements/node').StateNode[]}
 */
export const nodes = [];
/**
 * @type {(import('../elements/link').Link|import('../elements/self_link').SelfLink|import('../elements/start_link').StartLink)[]}
 */
export const links = [];
/**
 * @type {HTMLCanvasElement}
 */
export let canvas;

/**
 * @param {HTMLCanvasElement} c
 */
export function setCanvas(c) { canvas = c; }
