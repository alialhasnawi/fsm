import { eliminate } from "./algs/eliminate";
import { subset_construct } from "./algs/subset_construct";
import { Link } from "./elements/link";
import { StateNode } from "./elements/node";
import { SelfLink } from "./elements/self_link";
import { StartLink } from "./elements/start_link";
import { TemporaryLink } from "./elements/temporary_link";
import { canvasHasFocus, crossBrowserKey, crossBrowserRelativeMousePos, draw, resetCaret, selectObject, snapNode } from "./main/fsm";
import { restoreBackup } from "./main/save";
import { canvas, links, nodes, setCanvas, state } from "./main/state";

window.onload = function () {
	// @ts-ignore
	setCanvas(document.getElementById('canvas'));
	restoreBackup();
	draw();

	canvas.onmousedown = function (e) {
		const mouse = crossBrowserRelativeMousePos(e);
		state.selectedObject = selectObject(mouse.x, mouse.y);
		state.movingObject = false;
		state.originalClick = mouse;

		if (state.selectedObject != null) {
			if (shift && state.selectedObject instanceof StateNode) {
				state.currentLink = new SelfLink(state.selectedObject, mouse);
			} else {
				state.movingObject = true;
				if ('setMouseStart' in state.selectedObject) {
					state.selectedObject.setMouseStart(mouse.x, mouse.y);
				}
			}
			resetCaret();
		} else if (shift) {
			state.currentLink = new TemporaryLink(mouse, mouse);
		}

		draw();

		if (canvasHasFocus()) {
			// disable drag-and-drop only if the canvas is already focused
			return false;
		} else {
			// otherwise, let the browser switch the focus away from wherever it was
			resetCaret();
			return true;
		}
	};

	canvas.ondblclick = function (e) {
		const mouse = crossBrowserRelativeMousePos(e);
		state.selectedObject = selectObject(mouse.x, mouse.y);

		if (state.selectedObject == null) {
			state.selectedObject = new StateNode(mouse.x, mouse.y);
			nodes.push(state.selectedObject);
			resetCaret();
			draw();
		} else if (state.selectedObject instanceof StateNode) {
			state.selectedObject.isAcceptState = !state.selectedObject.isAcceptState;
			draw();
		}
	};

	canvas.onmousemove = function (e) {
		const mouse = crossBrowserRelativeMousePos(e);

		if (state.currentLink != null) {
			let targetNode = selectObject(mouse.x, mouse.y);
			if (!(targetNode instanceof StateNode)) {
				targetNode = null;
			}

			if (state.selectedObject == null) {
				if (targetNode != null) {
					// @ts-ignore
					state.currentLink = new StartLink(targetNode, state.originalClick);
				} else {
					state.currentLink = new TemporaryLink(state.originalClick, mouse);
				}
			} else {
				if (targetNode == state.selectedObject) {
					// @ts-ignore
					state.currentLink = new SelfLink(state.selectedObject, mouse);
				} else if (targetNode != null) {
					// @ts-ignore
					state.currentLink = new Link(state.selectedObject, targetNode);
				} else {
					// @ts-ignore
					state.currentLink = new TemporaryLink(state.selectedObject.closestPointOnCircle(mouse.x, mouse.y), mouse);
				}
			}
			draw();
		}

		if (state.movingObject) {
			state.selectedObject.setAnchorPoint(mouse.x, mouse.y);
			if (state.selectedObject instanceof StateNode) {
				snapNode(state.selectedObject);
			}
			draw();
		}
	};

	canvas.onmouseup = function (e) {
		state.movingObject = false;

		if (state.currentLink != null) {
			if (!(state.currentLink instanceof TemporaryLink)) {
				state.selectedObject = state.currentLink;
				links.push(state.currentLink);
				resetCaret();
			}
			state.currentLink = null;
			draw();
		}
	};

	canvas.oncontextmenu = function (e) {
		subset_construct();

		state.selectedObject = null;
		draw();

		e.preventDefault();
		return false;
	}
}

let shift = false;

document.addEventListener('keydown', function (e) {
	const key = crossBrowserKey(e);

	if (key == 'Shift') {
		shift = true;
	} else if (!canvasHasFocus()) {
		// don't read keystrokes when other things have focus
		return true;
	} else if (key == 'Backspace') { // backspace key
		if (state.selectedObject != null && 'text' in state.selectedObject) {
			state.selectedObject.text = state.selectedObject.text.substr(0, state.selectedObject.text.length - 1);
			resetCaret();
			draw();
		}

		// backspace is a shortcut for the back button, but do NOT want to change pages
		return false;
	} else if (key == 'Delete') { // delete key
		if (state.selectedObject != null) {
			for (let i = 0; i < nodes.length; i++) {
				if (nodes[i] == state.selectedObject) {
					nodes.splice(i--, 1);
				}
			}
			for (let i = 0; i < links.length; i++) {
				// @ts-ignore
				if (links[i] == state.selectedObject || links[i].node == state.selectedObject || links[i].nodeA == state.selectedObject || links[i].nodeB == state.selectedObject) {
					links.splice(i--, 1);
				}
			}
			state.selectedObject = null;
			draw();
		}
	} else if (key == ']') { // ] key
		if (selectObject != null) {
			for (let i = 0; i < nodes.length; i++) {
				if (nodes[i] == state.selectedObject) {
					eliminate(state.selectedObject, nodes, links);
					state.selectedObject = null;
					draw();
				}
			}
		}
	} else if (key.length == 1 && key.charCodeAt(0) && key.charCodeAt(0) && state.selectedObject != null && 'text' in state.selectedObject) {
		state.selectedObject.text += key;
		resetCaret();
		draw();

		// don't let keys do their actions (like space scrolls down the page)
		e.preventDefault();
		return false;
	}
});

document.addEventListener('keyup', function (e) {
	const key = crossBrowserKey(e);

	if (key == 'Shift') {
		shift = false;
	}
});