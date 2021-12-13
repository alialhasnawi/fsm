/**
 * Return the determinant of
 * a b c
 * d e f
 * g h i
 * @param {number} a 
 * @param {number} b 
 * @param {number} c 
 * @param {number} d 
 * @param {number} e 
 * @param {number} f 
 * @param {number} g 
 * @param {number} h 
 * @param {number} i 
 * @returns 
 */
function det(a, b, c, d, e, f, g, h, i) {
	return a * e * i + b * f * g + c * d * h - a * f * h - b * d * i - c * e * g;
}

/**
 * Return a circle object given 3 coordinates.
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @param {number} x3 
 * @param {number} y3 
 * @returns {{x: number, y:number, radius: number}}
 */
export function circleFromThreePoints(x1, y1, x2, y2, x3, y3) {
	const a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
	const bx = -det(x1 * x1 + y1 * y1, y1, 1, x2 * x2 + y2 * y2, y2, 1, x3 * x3 + y3 * y3, y3, 1);
	const by = det(x1 * x1 + y1 * y1, x1, 1, x2 * x2 + y2 * y2, x2, 1, x3 * x3 + y3 * y3, x3, 1);
	const c = -det(x1 * x1 + y1 * y1, x1, y1, x2 * x2 + y2 * y2, x2, y2, x3 * x3 + y3 * y3, x3, y3);
	return {
		'x': -bx / (2 * a),
		'y': -by / (2 * a),
		'radius': Math.sqrt(bx * bx + by * by - 4 * a * c) / (2 * Math.abs(a))
	};
}

/**
 * @param {number} number
 * @param {number} digits
 */
export function fixed(number, digits) {
	return number.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
}
