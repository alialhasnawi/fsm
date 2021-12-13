export const CONCAT_OP = '*&*';
export const KLEIN_OP = '*';
export const OR_OP = '+';
export const OPEN_LEFT = '(';
export const CLOSE_RIGHT = ')';

export const INFIX_CHAR_OPS = [OR_OP, OPEN_LEFT, CLOSE_RIGHT];
export const STANDARD_CHAR_OPS = [KLEIN_OP, OR_OP, OPEN_LEFT, CLOSE_RIGHT];
export const BIN_OPS = [CONCAT_OP, OR_OP];
export const FUNCTIONS_OPS = [KLEIN_OP];
export const L_NON_CONCAT_OPS = [OPEN_LEFT, OR_OP, CONCAT_OP, KLEIN_OP];
export const R_NON_CONCAT_OPS = [CLOSE_RIGHT, OR_OP, CONCAT_OP];

export const OP_PRECEDENCE = {
    KLEIN_OP: 8,
    CONCAT_OP: 4,
    OR_OP: 2
};