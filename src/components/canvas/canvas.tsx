/**
 * Canvas component wrapper and event binder.
 * The Canvas retains and updates its own cursor data state.
 */

import { Component, ComponentChild, createRef, h } from "preact";
import { access, get_state, set_default_canvas, subscribe, unsubscribe } from "../../store/store";
import { CanvasRectangle, CanvasViewTransform, FSMContext, Point2D } from "../../types";
import { DrawableElement } from "../elements/abstract";
import { CANVAS_SIZE } from "../elements/constants";
import { _CanvasHandler } from "./handlers";

import './style.css';

/** State only accessible to the canvas and it's handlers. */
type CanvasRenderState = {
    caret_visible: boolean,
    selected_zone: CanvasRectangle | undefined,
};

type CursorData = {
    mouse_down_pos: Point2D,
    obj_at_mouse_down: DrawableElement | undefined,
    last_pos: Point2D,
    obj_at_last_pos: DrawableElement | undefined,
    down: boolean,
    moving: boolean,
};

export class Canvas extends Component<any, CanvasRenderState> {
    private ref = createRef();
    public el: HTMLCanvasElement | undefined;

    public ctx: CanvasRenderingContext2D | undefined;
    public cursor: CursorData;

    private handlers: _CanvasHandler;

    private caret_interval: number = -1;

    constructor() {
        super();
        this.state = {
            caret_visible: false,
            selected_zone: undefined,
        };
        this.cursor = {
            mouse_down_pos: { x: 0, y: 0 },
            obj_at_mouse_down: undefined,
            last_pos: { x: 0, y: 0 },
            obj_at_last_pos: undefined,
            down: false,
            moving: false,
        };
        this.handlers = new _CanvasHandler(this);
    }

    componentDidMount() {
        set_default_canvas(this);
        this.el = this.ref.current;
        this.ctx = this.el!.getContext('2d')!;

        this.el!.onmousedown = this.handlers.mouse_down;
        this.el!.onmousemove = this.handlers.mouse_move;
        this.el!.onmouseup = this.handlers.mouse_up;
        this.el!.ondblclick = this.handlers.dbl_click;
        this.el!.oncontextmenu = this.handlers.prevent_default;
        this.el!.onwheel = this.handlers.wheel;

        subscribe(['nodes', 'links', 'active_objects', 'selected_object', 'temp_link', 'view_zone'], this);
        access(this.draw);
    }

    componentWillUnmount() {
        unsubscribe(this);
    }

    shouldComponentUpdate() {
        this.reinit_caret();
        this.draw();
        return false;
    }

    render(): ComponentChild {
        return (
            <canvas ref={this.ref} id="canvas" width={CANVAS_SIZE.x} height={CANVAS_SIZE.y}>
                <span>Your browser does not support<br />the HTML5 &lt;canvas&gt; element</span>
            </canvas>
        );
    }

    /** Restart the caret blink interval. */
    reinit_caret() {
        if (get_state('selected_object') != null && this.caret_interval == -1) {
            this.caret_interval = window.setInterval(this.caret_function, 300);
        }
    }

    private caret_function = () => {
        if (get_state('selected_object') == null) {
            window.clearInterval(this.caret_interval);
            this.caret_interval = -1;
        } else {
            this.setState({ caret_visible: !this.state.caret_visible });
        }
    }

    /**
     * Convert a mouse event to it's corresponding point in canvas draw space.
     */
    public event_to_canvas_space(e: MouseEvent): Point2D {
        const view = get_state('view_zone');
        const rect = this.el!.getBoundingClientRect();
        const element_space = {
            x: e.clientX - rect.x,
            y: e.clientY - rect.y,
        };

        // Apply the inverse of the view transform.
        return {
            x: (element_space.x - view.x) / view.zoom,
            y: (element_space.y - view.y) / view.zoom,
        }
    }

    /** Convert a point in canvas element space to it's corresponding point in canvas draw space. */
    public point_to_canvas_space(p: Point2D): Point2D {
        const view = get_state('view_zone');

        // Apply the inverse of the view transform.
        return {
            x: (p.x - view.x) / view.zoom,
            y: (p.y - view.y) / view.zoom,
        }
    }

    /** Draw the canvas using its own 2D context. */
    draw = () => {
        const zone = get_state('view_zone');

        if (this.ctx != null) {
            this.ctx.setTransform(zone.zoom, 0, 0, zone.zoom, zone.x, zone.y);
            this.draw_using(this.ctx, true);
        } else if (this.el != null) {
            const ctx = this.el.getContext("2d");
            if (ctx != null) {
                this.ctx = ctx;
                ctx.setTransform(zone.zoom, 0, 0, zone.zoom, zone.x, zone.y);
                this.draw_using(ctx, true);
            }
        }
    }

    draw_using(ctx: FSMContext, with_border: boolean = false) {
        if (this.el != null) {
            const nodes = get_state("nodes");
            const links = get_state("links");
            const selected_object = get_state("selected_object");
            const current_link = get_state("temp_link");

            // Draw rectangle.
            const upper_left = this.point_to_canvas_space({ x: 0, y: 0 });
            const lower_right = this.point_to_canvas_space({ x: this.el.width, y: this.el.height });
            ctx.clearRect(upper_left.x, upper_left.y, lower_right.x - upper_left.x, lower_right.y - upper_left.y);
            ctx.save();

            if (with_border) {
                ctx.beginPath();
                ctx.fillStyle = 'white';
                ctx.rect(-1, -1, this.el.width + 2, this.el.height + 2);
                ctx.fill();
                ctx.stroke();
            }

            for (let i = 0; i < nodes.length; i++) {
                ctx.lineWidth = 1;
                ctx.fillStyle = ctx.strokeStyle = nodes[i].curr_colour();
                nodes[i].draw(ctx, nodes[i] == selected_object && this.state.caret_visible);
            }
            for (let i = 0; i < links.length; i++) {
                ctx.lineWidth = 1;
                ctx.fillStyle = ctx.strokeStyle = links[i].curr_colour();
                links[i].draw(ctx, links[i] == selected_object && this.state.caret_visible);
            }
            if (current_link != null) {
                ctx.lineWidth = 1;
                ctx.fillStyle = ctx.strokeStyle = 'black';
                current_link.draw(ctx, current_link == selected_object && this.state.caret_visible);
            }

            // // Debug.
            // ctx.fillStyle = ctx.strokeStyle = 'magenta';
            // if (this.cursor.obj_at_mouse_down != null) this.cursor.obj_at_mouse_down.draw(ctx, false);
            // ctx.fillStyle = ctx.strokeStyle = 'lime';
            // if (this.cursor.obj_at_last_pos != null) this.cursor.obj_at_last_pos.draw(ctx, false);

            ctx.restore();
        }
    }
}