/**
 * Regex parsing and utilities.
 */

import { convert_latex_shortcuts } from "../components/elements/text_utils";
import { BIN_OPS, FUNCTIONS_OPS, INFIX_CHAR_OPS, L_NON_CONCAT_OPS, OPS, OP_PRECEDENCE, R_NON_CONCAT_OPS } from "./constants";


/**
 * Convert string to RPN stack.
 * Using https://en.wikipedia.org/wiki/Shunting-yard_algorithm.
 */
export function to_RPN(s: string) {
    const lst = _parse_tokens(s);
    const output: string[] = [];
    const op_stack: string[] = [];

    for (let i = 0; i < lst.length; i++) {
        const token: string = lst[i];


        if (token == OPS.KLEIN) {
            // Function case.
            op_stack.push(token);

        } else if (BIN_OPS.includes(token)) {
            // Binary operands.
            while (op_stack.length > 0) {
                let top = op_stack[op_stack.length - 1];

                if (top != OPS.OPEN_LEFT && OP_PRECEDENCE[top] >= OP_PRECEDENCE[token]) {
                    const next = op_stack.pop();
                    if (next != null) output.push(next);
                } else break;
            }

            op_stack.push(token);
        } else if (token == OPS.OPEN_LEFT) {
            // (
            op_stack.push(token);
        } else if (token == OPS.CLOSE_RIGHT) {
            // )
            while (op_stack.length > 0) {
                let top = op_stack[op_stack.length - 1];

                if (top != OPS.OPEN_LEFT) {
                    const next = op_stack.pop();
                    if (next != null) output.push(next);
                } else break;
            }

            if (op_stack.length == 0)
                console.error('The operator stack is empty, fix the parentheses.');

            op_stack.pop();

            if (op_stack.length > 0 && FUNCTIONS_OPS.includes(op_stack[length - 1])) {
                const next = op_stack.pop();
                if (next != null) output.push(next);
            }
        } else {
            output.push(token);
        }

    }

    let top = op_stack.pop();
    while (top != null) {
        output.push(top);
        top = op_stack.pop();
    }

    return output;
}

/**
 * Convert string to token list.
 */
function _parse_tokens(s: string) {
    // Add explicity brackets to a* single character expressions.
    s = s.replace(/(\w)\*/g, '($1)*');
    s = convert_latex_shortcuts(s);
    const lst: string[] = [];
    let last = 0;
    let i = 0;

    while (i < s.length) {
        if (INFIX_CHAR_OPS.includes(s[i])) {
            if (last != i)
                lst.push(s.slice(last, i));
            last = i + 1;
            lst.push(s[i]);
        } else if (s[i] == OPS.KLEIN) {
            // Reverse order as * (operand)
            let locator = lst.length - 1;
            let score = 0;

            // Find where to insert *
            while (locator >= 0) {
                if (lst[locator] == OPS.CLOSE_RIGHT)
                    score++;
                else if (lst[locator] == OPS.OPEN_LEFT)
                    score--;

                if (score == 0)
                    break;

                locator--;
            }
            // Insert *
            lst.splice(locator, 0, s[i]);

            last = i + 1;
        }

        i++;
    }

    // Add remaining chars.
    if (last != i)
        lst.push(s.slice(last));

    // Insert concatenation operators.
    i = lst.length - 1;
    while (i > 0) {
        // Left is not: (x  +x  &x  *x
        // Right is not: x)  x+  x&
        // but x(  )x  *x allowed.
        if (!L_NON_CONCAT_OPS.includes(lst[i - 1]) && !R_NON_CONCAT_OPS.includes(lst[i])) {
            lst.splice(i, 0, OPS.CONCAT);
        }

        i--;
    }

    return lst;
}