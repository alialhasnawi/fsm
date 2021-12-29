/**
 * Non-specific types.
 */

import { Component } from "preact";
import { Canvas } from "./components/canvas/canvas";
import { AnyLink, DrawableElement, FSMLink } from "./components/elements/abstract";
import { StateNode } from "./components/elements/state_node";
import { ExportAsLaTeX } from "./export_as/latex";
import { ExportAsSVG } from "./export_as/svg";

export enum CanvasTool {
    POINTER = 1,
    DRAW_NODE,
    DRAW_LINK,
    DRAW_ACCEPT,
    ELIMINATE,
};

export type MenuOption = 'File' | 'Edit' | 'View' | undefined;

export interface State {
    /** The currently active temporary link, to be released when link creation is complete. */
    temp_link: AnyLink | undefined, // a Link

    /** The canvas component. */
    canvas: Canvas,
    /** The canvas camera's zoom scale and translation offset. */
    view_zone: CanvasViewTransform,
    /** The dimensions of the exportable area of the canvas. */
    export_dimensions: Rect2D,

    // Active objects is an experimental property and should not be used.
    active_objects: StateNode[],
    /** The currently selected object, undefined if no selection has been made. */
    selected_object: DrawableElement | undefined, // either a Link or a Node
    /** The StateNodes currently on the canvas. */
    nodes: StateNode[],
    /** The permanent Links currently on the canvas. */
    links: FSMLink[],

    /** The last selected canvas drawing tool. */
    last_tool: CanvasTool,
    /** The currently selected drawing tool. */
    curr_tool: CanvasTool,
    /** The opened menu from the menubar, undefined if none are open. */
    curr_menu: MenuOption,

    /** The enabled/disabled state of various action buttons'. */
    can: { undo: boolean, redo: boolean },
    /** The string to be displayed at the bottom text bar hint. */
    textbar: string,
    /** The name of the file last loaded or saved. */
    file_name: string,
};

export type Subscribers<State> = {
    [K in keyof State]: Component[];
};

export type StateEffects<State> = {
    [K in keyof State]: EffectOf<State>[];
};

export type EffectOf<State> = (state: State) => any;

export enum CanvasAction {
    LOAD = 1,
    SAVE,
    UNDO,
    REDO,
    SUBSET_CONSTRUCT,
    RESET_ZOOM,
    FORCE_EXPAND,
}

export enum MouseButton {
    LEFT = 0,
    MIDDLE = 1,
    RIGHT = 2,
}


export type CursorFlags = {
    moving: boolean,
    down: boolean,
}

export interface Rect2D {
    width: number,
    height: number,
};

export interface CanvasRectangle extends Rect2D {
    top: number,
    left: number,
}

export interface CanvasViewTransform extends Point2D {
    zoom: number,
}

export type FSMContext = CanvasRenderingContext2D | ExportAsLaTeX | ExportAsSVG;

export type NodeLinkEndPointsAndCircle = LinkNoCircle | LinkCircleReversible;
export type SelfLinkCircle = LinkCircle;

interface LinkEndPoints {
    startX: number,
    startY: number,
    endX: number,
    endY: number,
};

interface LinkNoCircle extends LinkEndPoints {
    hasCircle: false
};

interface LinkCircle extends LinkEndPoints {
    hasCircle: true,
    startAngle: number,
    endAngle: number,
    circleX: number,
    circleY: number,
    circleRadius: number,
}

interface LinkCircleReversible extends LinkCircle {
    reverseScale: number,
    isReversed: boolean,
}

export type StateKey = keyof State;

/** A JSON string containing nodes and links properties. */
export type CanvasJSON = string;

export type FSMCanvasState = {
    nodes: StateNode[],
    links: FSMLink[],
};

export interface Point2D {
    x: number;
    y: number;
};

export type Backup = {
    nodes: BackupNode[],
    links: BackupLink[],
    file_name?: string,
};

export type BackupNode = {
    x: number,
    y: number,
    text: string,
    isAcceptState: boolean,
};

export type BackupLink = BackupNodeLink | BackupStartLink | BackupSelfLink;

type _BackupLink = {
    text: string,
};

type BackupNodeLink = _BackupLink & {
    type: 'NodeLink' | 'Link',
    nodeA: number,
    nodeB: number,
    lineAngleAdjust: number,
    parallelPart: number,
    perpendicularPart: number,
}

type BackupStartLink = _BackupLink & {
    type: 'StartLink',
    node: number,
    deltaX: number,
    deltaY: number,
}

type BackupSelfLink = _BackupLink & {
    type: 'SelfLink',
    node: number,
    anchorAngle: number,
}