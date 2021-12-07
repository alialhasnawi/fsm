const CONCAT_OP = '*CONCAT*';
const KLEIN_OP = '*';
const OR_OP = '+';
const OPEN_LEFT = '(';
const CLOSE_RIGHT = ')';

const INFIX_CHAR_OPS = [OR_OP, OPEN_LEFT, CLOSE_RIGHT];
const STANDARD_CHAR_OPS = [KLEIN_OP, OR_OP, OPEN_LEFT, CLOSE_RIGHT];
const BIN_OPS = [CONCAT_OP, OR_OP];
const FUNCTIONS_OPS = [KLEIN_OP];
const L_NON_CONCAT_OPS = [OPEN_LEFT, OR_OP, CONCAT_OP, KLEIN_OP];
const R_NON_CONCAT_OPS = [CLOSE_RIGHT, OR_OP, CONCAT_OP];

const OP_PRECEDENCE = {
    KLEIN_OP: 8,
    CONCAT_OP: 4,
    OR_OP: 2
};

/**
 * Convert string to RPN stack.
 * Using https://en.wikipedia.org/wiki/Shunting-yard_algorithm.
 * @param {string} s 
 */
function _to_RPN(s) {
    const lst = _parse_tokens(s);
    const output = [];
    const op_stack = [];

    for (let i = 0; i < lst.length; i++) {
        const token = lst[i];

        if (token == KLEIN_OP) {
            // Function case.
            op_stack.push(token);

        } else if (BIN_OPS.includes(token)) {
            // Binary operands.
            while (op_stack.length > 0) {
                let top = op_stack[op_stack.length - 1];

                if (top != OPEN_LEFT && OP_PRECEDENCE[top] >= OP_PRECEDENCE[token]) {
                    output.push(op_stack.pop());
                } else break;
            }

            op_stack.push(token);
        } else if (token == OPEN_LEFT) {
            // (
            op_stack.push(token);
        } else if (token == CLOSE_RIGHT) {
            // )
            while (op_stack.length > 0) {
                let top = op_stack[op_stack.length - 1];

                if (top != OPEN_LEFT)
                    output.push(op_stack.pop());
                else break;
            }

            if (op_stack.length == 0)
                console.error('The operator stack is empty, fix the parentheses.');

            op_stack.pop();

            if (op_stack.length > 0 && FUNCTIONS_OPS.includes(op_stack[length - 1]))
                output.push(op_stack.pop());
        } else {
            output.push(token);
        }

    }

    while (op_stack.length > 0)
        output.push(op_stack.pop());

    return output;
}

/**
 * Convert string to token list.
 * @param {string} s 
 */
function _parse_tokens(s) {
    s = s.replace(/(\w)\*/g, '($1)*');
    const lst = [];
    let last = 0;
    let i = 0;

    while (i < s.length) {
        if (INFIX_CHAR_OPS.includes(s[i])) {
            if (last != i)
                lst.push(s.slice(last, i));
            last = i + 1;
            lst.push(s[i]);
        } else if (s[i] == KLEIN_OP) {
            // Reverse order as * (operand)
            let locator = lst.length - 1;
            let score = 0;

            // Find where to insert *
            while (locator >= 0) {
                if (lst[locator] == CLOSE_RIGHT)
                    score++;
                else if (lst[locator] == OPEN_LEFT)
                    score--;

                if (score == 0)
                    break;

                locator--;
            }
            lst.splice(locator, 0, s[i]);

            last = i + 1;
        }

        i++;
    }

    // Add remaining chars.
    if (last != i)
        lst.push(s.slice(last));

    i = lst.length - 1;
    while (i > 0) {
        // Left is not: (x  +x  CONCATx  *x
        // Right is not: x)  x+  xCONCAT
        // but x(  )x  *x allowed.
        if (!L_NON_CONCAT_OPS.includes(lst[i-1]) && !R_NON_CONCAT_OPS.includes(lst[i])) {
            lst.splice(i, 0, CONCAT_OP);
        }

        i--;
    }

    return lst;
}