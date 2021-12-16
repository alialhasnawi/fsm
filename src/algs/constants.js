/**
 * Various constants for parsing regular expressions.
 * @module constants
 */

/** Internal concatenation operator. */
export const CONCAT_OP = '*&*';
/** Klein star operator. */
export const KLEIN_OP = '*';
/** Regular expression or operator. In JS style regex, | is used. */
export const OR_OP = '+';
/** Open parenthesis. */
export const OPEN_LEFT = '(';
/** Close parenthesis. */
export const CLOSE_RIGHT = ')';

/** Operators which already follow infix notation. */
export const INFIX_CHAR_OPS = [OR_OP, OPEN_LEFT, CLOSE_RIGHT];
/** Standard operators which can be recognized in user inputted strings. */
export const STANDARD_CHAR_OPS = [KLEIN_OP, OR_OP, OPEN_LEFT, CLOSE_RIGHT];
/** Binary operators. */
export const BIN_OPS = [CONCAT_OP, OR_OP];
/** Operators which should be recognized as function. */
export const FUNCTIONS_OPS = [KLEIN_OP];
/** Operators which should not be concatenated from the left side. */
export const L_NON_CONCAT_OPS = [OPEN_LEFT, OR_OP, CONCAT_OP, KLEIN_OP];
/** Operators which should not be concatenated from the right side. */
export const R_NON_CONCAT_OPS = [CLOSE_RIGHT, OR_OP, CONCAT_OP];

/** Operator precedence lookup. Higher precedence is a higher number.
 * 
 * \* > concatenation > +
 */
export const OP_PRECEDENCE = {
    KLEIN_OP: 8,
    CONCAT_OP: 4,
    OR_OP: 2
};

/** Epsilon empty string character. */
export const EPSILON = '\\epsilon';