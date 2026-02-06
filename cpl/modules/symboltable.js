export class SymbolTable {
    constructor() {
        // Stack of scopes. Index 0 is global.
        this.scopes = [new Map()];
    }

    /**
     * Enter a new scope (e.g. inside a function)
     */
    enterScope() {
        this.scopes.push(new Map());
    }

    /**
     * Exit the current scope
     */
    exitScope() {
        if (this.scopes.length > 1) {
            this.scopes.pop();
        }
    }

    /**
     * Define a symbol in the current scope
     * @param {string} name 
     * @param {string} type 'int', 'float', 'string', 'unknown'
     * @param {string} kind 'variable', 'array', 'function', 'label'
     * @param {Object} extra Additional attributes (e.g. dimensions for arrays)
     */
    define(name, type = 'unknown', kind = 'variable', extra = {}) {
        const scope = this.scopes[this.scopes.length - 1];
        const symbol = {
            name,
            type,
            kind,
            ...extra
        };
        // BlitzBasic is case-insensitive
        scope.set(name.toLowerCase(), symbol);
        return symbol;
    }

    /**
     * Define a custom Type
     * @param {string} name 
     * @param {Array} fields List of field objects {name, type}
     */
    defineType(name, fields = []) {
        return this.define(name, 'type', 'type', { fields });
    }

    /**
     * Define a function symbol
     * @param {string} name 
     * @param {string} returnType 
     * @param {Array} parameters List of parameter objects {name, type}
     */
    defineFunction(name, returnType = 'void', parameters = []) {
        return this.define(name, returnType, 'function', { parameters });
    }

    /**
     * Look up a symbol by name (searches from current scope up to global)
     * @param {string} name 
     * @returns {Object|null}
     */
    resolve(name) {
        const key = name.toLowerCase();
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].has(key)) {
                return this.scopes[i].get(key);
            }
        }
        return null;
    }

    /**
     * Check if a symbol is defined in the current scope (useful for duplicate checks)
     */
    isDefinedLocally(name) {
        return this.scopes[this.scopes.length - 1].has(name.toLowerCase());
    }
}