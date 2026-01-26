/**
 * Provides string manipulation functions similar to BlitzBasic.
 * Note: BlitzBasic uses 1-based indexing for string positions.
 */
export class Strings{
    constructor(bonobo){
        this.bonobo = bonobo;
    }

    /**
     * Returns the length of the string.
     * @param {string} txt 
     * @returns {number}
     */
    len(txt){
        return txt.length;
    }

    /**
     * Returns the leftmost n characters of the string.
     * @param {string} txt 
     * @param {number} n 
     * @returns {string}
     */
    left(txt, n){
        return txt.substring(0, n);
    }

    /**
     * Returns the rightmost n characters of the string.
     * @param {string} txt 
     * @param {number} n 
     * @returns {string}
     */
    right(txt, n){
        return txt.substring(txt.length - n);
    }

    /**
     * Returns a substring starting at 'start' with length 'count'.
     * BlitzBasic Mid is 1-based.
     * @param {string} txt 
     * @param {number} start 1-based start index.
     * @param {number} [count] Number of characters (optional).
     * @returns {string}
     */
    mid(txt, start, count){
        if(start < 1) start = 1;
        let s = start - 1;
        if(count === undefined) return txt.slice(s);
        return txt.slice(s, s + count);
    }

    /**
     * Converts string to uppercase.
     * @param {string} txt 
     * @returns {string}
     */
    upper(txt){
        return txt.toUpperCase();
    }

    /**
     * Converts string to lowercase.
     * @param {string} txt 
     * @returns {string}
     */
    lower(txt){
        return txt.toLowerCase();
    }

    /**
     * Trims whitespace from both ends.
     * @param {string} txt 
     * @returns {string}
     */
    trim(txt){
        return txt.trim();
    }

    /**
     * Replaces all occurrences of 'find' with 'replace'.
     * @param {string} txt 
     * @param {string} find 
     * @param {string} replaceWith 
     * @returns {string}
     */
    replace(txt, find, replaceWith){
        return txt.split(find).join(replaceWith);
    }

    /**
     * Returns the position of substring 'sub' in 'txt'.
     * 1-based return value. 0 if not found.
     * @param {string} txt 
     * @param {string} sub 
     * @param {number} [start=1] 1-based start position.
     * @returns {number}
     */
    instr(txt, sub, start = 1){
        if(start < 1) start = 1;
        return txt.indexOf(sub, start - 1) + 1;
    }

    /**
     * Returns the ASCII code of the first character.
     * @param {string} txt 
     * @returns {number}
     */
    asc(txt){
        return txt.length > 0 ? txt.charCodeAt(0) : 0;
    }

    /**
     * Returns the character for a given ASCII code.
     * @param {number} code 
     * @returns {string}
     */
    chr(code){
        return globalThis.String.fromCharCode(code);
    }

    /**
     * Returns the hexadecimal string representation of a number.
     * @param {number} val 
     * @returns {string}
     */
    hex(val){
        return val.toString(16).toUpperCase();
    }

    /**
     * Returns the binary string representation of a number.
     * @param {number} val 
     * @returns {string}
     */
    bin(val){
        return val.toString(2);
    }
    
    /**
     * Repeats a string n times.
     * @param {string} txt 
     * @param {number} n 
     * @returns {string}
     */
    repeat(txt, n){
        return txt.repeat(n);
    }
}