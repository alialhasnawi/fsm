/**
 * Non-specific types.
 */

import { Component } from "preact";
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
    PAN,
};

export interface State {
    temp_link: AnyLink | undefined, // a Link

    // Active objects is an experimental property and should not be used.
    active_objects: StateNode[],
    selected_object: DrawableElement | undefined, // either a Link or a Node
    nodes: StateNode[],
    links: FSMLink[],

    last_tool: CanvasTool,
    curr_tool: CanvasTool,
};

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

export interface CanvasRectangle {
    top: number,
    left: number,
    width: number,
    height: number,
}

export interface CanvasViewTransform {
    zoom: number,
    x: number,
    y: number,
}

export type FSMContext = CanvasRenderingContext2D | ExportAsLaTeX | ExportAsSVG;

export type Subscribers<State> = {
    [K in keyof State]: Component[];
};

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
    links: BackupLink[]
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
    type: 'NodeLink',
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