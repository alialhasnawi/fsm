/**
 * Various constants for parsing regular expressions.
 */

/** Internal operators. */
export const OPS = {
    CONCAT: "*&*",
    KLEIN: "*",
    OR: "+",
    OPEN_LEFT: "(",
    CLOSE_RIGHT: ")",
}

/** Operators which already follow infix notation. */
export const INFIX_CHAR_OPS = [OPS.OR, OPS.OPEN_LEFT, OPS.CLOSE_RIGHT];
/** Standard operators which can be recognized in user inputted strings. */
export const STANDARD_CHAR_OPS = [OPS.KLEIN, OPS.OR, OPS.OPEN_LEFT, OPS.CLOSE_RIGHT];
/** Binary operators. */
export const BIN_OPS = [OPS.CONCAT, OPS.OR];
/** Operators which should be recognized as function. */
export const FUNCTIONS_OPS = [OPS.KLEIN];
/** Operators which should not be concatenated from the left side. */
export const L_NON_CONCAT_OPS = [OPS.OPEN_LEFT, OPS.OR, OPS.CONCAT, OPS.KLEIN];
/** Operators which should not be concatenated from the right side. */
export const R_NON_CONCAT_OPS = [OPS.CLOSE_RIGHT, OPS.OR, OPS.CONCAT];

/** Operator precedence lookup. Higher precedence is a higher number.
 * 
 * \* > concatenation > +
 */
export const OP_PRECEDENCE = {
    [OPS.KLEIN]: 8,
    [OPS.CONCAT]: 4,
    [OPS.OR]: 2,
}

/** Epsilon empty string character. */
export const EPSILON = '\\epsilon';