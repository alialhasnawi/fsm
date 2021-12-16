/**
 * State of the canvas.
 */
export const state = {
    /** @type {boolean} */
    cursorVisible: true,
    /** @type {import('../elements/node').StateNode|import('../elements/link').Link|import('../elements/self_link').SelfLink|import('../elements/start_link').StartLink} */
    selectedObject: null, // either a Link or a Node
    /** @type {import('../elements/link').Link|import('../elements/self_link').SelfLink|import('../elements/start_link').StartLink|import('../elements/temporary_link').TemporaryLink} */
    currentLink: null, // a Link
    /** @type {boolean} */
    movingObject: false,
    /** @type {{x: number, y: number}} */
    originalClick: null
};

/** List of nodes on the canvas.
 * @type {import('../elements/node').StateNode[]}
 */
export const nodes = [];
/** List of links on the canvas.
 * @type {(import('../elements/link').Link|import('../elements/self_link').SelfLink|import('../elements/start_link').StartLink)[]}
 */
export const links = [];
/** The canvas element.
 * @type {HTMLCanvasElement}
 */
export let canvas;

/** Update the global canvas.
 * @param {HTMLCanvasElement} c
 */
export function setCanvas(c) { canvas = c; }
