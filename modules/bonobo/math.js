/**
 * Provides a collection of math utility functions, emulating BlitzBasic's syntax.
 */
export class Maths{
    constructor(bonobo){
        this.bonobo = bonobo;
    }

    /**
     * Returns a random integer between min and max (inclusive).
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number}
     */
    rand(min, max){
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Returns the value of PI.
     * @returns {number}
     */
    pi(){
        return Math.PI;
    }

    /**
     * Converts a value to a floating-point number.
     * @param {*} value The value to convert.
     * @returns {number}
     */
    float(value){
        return parseFloat(value);
    }

    /**
     * Converts a value to an integer.
     * @param {*} value The value to convert.
     * @returns {number}
     */
    int(value){
        return parseInt(value);
    }

    /**
     * Returns the sine of an angle (in degrees).
     * @param {number} angle Angle in degrees.
     * @returns {number}
     */
    sin(angle){
        return Math.sin(angle * (Math.PI / 180));
    }

    /**
     * Returns the cosine of an angle (in degrees).
     * @param {number} angle Angle in degrees.
     * @returns {number}
     */
    cos(angle){
        return Math.cos(angle * (Math.PI / 180));
    }

    /**
     * Returns the tangent of an angle (in degrees).
     * @param {number} angle Angle in degrees.
     * @returns {number}
     */
    tan(angle){
        return Math.tan(angle * (Math.PI / 180));
    }

    /**
     * Returns the arc sine of a value (result in degrees).
     * @param {number} v Value (-1.0 to 1.0).
     * @returns {number} Angle in degrees.
     */
    asin(v){
        return Math.asin(v) * (180 / Math.PI);
    }

    /**
     * Returns the arc cosine of a value (result in degrees).
     * @param {number} v Value (-1.0 to 1.0).
     * @returns {number} Angle in degrees.
     */
    acos(v){
        return Math.acos(v) * (180 / Math.PI);
    }

    /**
     * Returns the arc tangent of a value (result in degrees).
     * @param {number} v Value.
     * @returns {number} Angle in degrees.
     */
    atan(v){
        return Math.atan(v) * (180 / Math.PI);
    }

    /**
     * Returns the arc tangent of y/x (result in degrees).
     * @param {number} y Y coordinate.
     * @param {number} x X coordinate.
     * @returns {number} Angle in degrees.
     */
    atan2(y, x){
        return Math.atan2(y, x) * (180 / Math.PI);
    }

    /**
     * Returns the square root of a value.
     * @param {number} v Value.
     * @returns {number}
     */
    sqr(v){
        return Math.sqrt(v);
    }

    /**
     * Returns the absolute value.
     * @param {number} v Value.
     * @returns {number}
     */
    abs(v){
        return Math.abs(v);
    }

    /**
     * Returns the sign of a value (-1, 0, or 1).
     * @param {number} v Value.
     * @returns {number}
     */
    sgn(v){
        return Math.sign(v);
    }

    /**
     * Returns a random float.
     * Usage: rnd(max) or rnd(min, max).
     * @param {number} min Minimum value (or max if only one arg).
     * @param {number} [max] Maximum value.
     * @returns {number}
     */
    rnd(min, max){
        if (max === undefined) {
            return Math.random() * min;
        }
        return Math.random() * (max - min) + min;
    }

    /**
     * Calculates the distance between two points.
     * @param {number} x1 
     * @param {number} y1 
     * @param {number} x2 
     * @param {number} y2 
     * @returns {number}
     */
    dist(x1, y1, x2, y2){
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    /**
     * Rounds a number UP to the nearest integer.
     * @param {number} v 
     * @returns {number}
     */
    ceil(v){
        return Math.ceil(v);
    }

    /**
     * Rounds a number DOWN to the nearest integer.
     * @param {number} v 
     * @returns {number}
     */
    floor(v){
        return Math.floor(v);
    }
}