import { get_canvas } from "../../store/store";
import { FSMContext } from "../../types";

const greek_letter_names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'];

/**
 * Draw text using the context and with a caret if necessary.
 */
export function draw_text(c: FSMContext, original_text: string, x: number, y: number, angle_or_null: number | null, is_selected: boolean, caret_visible: boolean = false) {
    const text = convert_latex_shortcuts(original_text);
    c.font = '20px "Times New Roman", serif';
    const width = measure_text(text);

    // center the text
    x -= width / 2;

    // position the text intelligently if given an angle
    if (angle_or_null != null) {
        const cos = Math.cos(angle_or_null);
        const sin = Math.sin(angle_or_null);
        const cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
        const cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
        const slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
        x += cornerPointX - sin * slide;
        y += cornerPointY + cos * slide;
    }

    // draw text and caret (round the coordinates so the caret falls on a pixel)
    // Used for exports.
    if ('advancedFillText' in c) {
        // @ts-ignore
        c.advancedFillText(text, original_text, x + width / 2, y, angle_or_null);
    } else {
        x = Math.round(x);
        y = Math.round(y);
        c.fillText(text, x, y + 6);
        if (is_selected && caret_visible && document.hasFocus()) {
            x += width;
            c.beginPath();
            c.moveTo(x, y - 10);
            c.lineTo(x, y + 10);
            c.stroke();
        }
    }
}

/**
 * Draw an arrow at (x,y).
 * @param c Context.
 * @param x
 * @param y 
 * @param angle in rad.
 */
export function draw_arrow(c: FSMContext, x: number, y: number, angle: number) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
    c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
    c.fill();
}

/** Return the length of the text in the default 20px font, in px. */
export function measure_text(text: string): number {
    const c = get_canvas();
    if (c != null) {
        const ctx = c.ctx;
        if (ctx != null) {
            ctx.font = '20px "Times New Roman", serif';
            return ctx.measureText(text).width;
        }
    }
    return 0;
}

/**
 * Replace all LaTeX greek letter shortcuts with their characters.
 * @returns Converted string.
 */
export function convert_latex_shortcuts(text: string) {
    // html greek characters
    for (let i = 0; i < greek_letter_names.length; i++) {
        const name = greek_letter_names[i];
        text = text.replace(new RegExp('\\\\' + name, 'g'), String.fromCharCode(913 + i + +(i > 16)));
        text = text.replace(new RegExp('\\\\' + name.toLowerCase(), 'g'), String.fromCharCode(945 + i + +(i > 16)));
    }

    // subscripts
    for (let i = 0; i < 10; i++) {
        text = text.replace(new RegExp('_' + i, 'g'), String.fromCharCode(8320 + i));
    }

    return text;
}

/**
 * Convert text string to XML safe text.
 * @returns XML string.
 */
export function text_to_xml(text: string) {
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let result = '';
    for (let i = 0; i < text.length; i++) {
        let c = text.charCodeAt(i);
        if (c >= 0x20 && c <= 0x7E) {
            result += text[i];
        } else {
            result += '&#' + c + ';';
        }
    }
    return result;
}