import { SymbolTable } from './symboltable.js';
import { commandMap } from './command_map.js';

export class Parser {
    constructor() {
        this.tokens = [];
        this.pos = 0;
        this.symbols = new SymbolTable();
        this.errors = [];
    }

    /**
     * Parses a list of tokens into an AST
     * @param {Array} tokens 
     */
    parse(tokens) {
        this.tokens = tokens;
        this.pos = 0;
        this.symbols = new SymbolTable(); // Reset symbols for new compilation
        this.errors = [];
        const ast = { type: 'Program', body: [] };

        while (!this.isAtEnd()) {
            // Skip empty newlines
            if (this.match('NEWLINE')) continue;

            const stmt = this.statement();
            if (stmt) {
                ast.body.push(stmt);
            } else {
                // Panic mode: Skip token to avoid infinite loop on error
                this.advance();
            }
        }
        return ast;
    }

    statement() {
        // 0. Handle Keywords (Control Flow)
        if (this.match('KEYWORD', 'function')) return this.functionDeclaration();
        if (this.match('KEYWORD', 'global')) return this.globalStatement();
        if (this.match('KEYWORD', 'local')) return this.localStatement();
        if (this.match('KEYWORD', 'goto')) return this.gotoStatement();
        if (this.match('KEYWORD', 'gosub')) return this.gosubStatement();
        if (this.match('KEYWORD', 'const')) return this.constStatement();
        if (this.match('KEYWORD', 'data')) return this.dataStatement();
        if (this.match('KEYWORD', 'read')) return this.readStatement();
        if (this.match('KEYWORD', 'restore')) return this.restoreStatement();
        if (this.match('KEYWORD', 'exit')) return { type: 'ExitStatement' };
        if (this.match('KEYWORD', 'return')) return this.returnStatement();
        if (this.match('KEYWORD', 'select')) return this.selectStatement();
        if (this.match('KEYWORD', 'end')) return { type: 'EndStatement' };
        if (this.match('KEYWORD', 'type')) return this.typeDeclaration();
        if (this.match('KEYWORD', 'delete')) return this.deleteStatement();
        if (this.match('KEYWORD', 'if')) return this.ifStatement();
        if (this.match('KEYWORD', 'for')) return this.forStatement();
        if (this.match('KEYWORD', 'while')) return this.whileStatement();
        if (this.match('KEYWORD', 'repeat')) return this.repeatStatement();
        if (this.match('KEYWORD', 'dim')) return this.dimStatement();

        // 1. Handle Commands (e.g. Graphics 640, 480)
        if (this.match('COMMAND')) {
            const commandToken = this.previous();
            const args = [];
            
            // Parse arguments if not end of line
            if (!this.check('NEWLINE') && !this.isAtEnd()) {
                do {
                    args.push(this.expression());
                } while (this.match('OPERATOR', ','));
            }
            this.validateCommandArgs(commandToken, args);
            return { type: 'CommandStatement', command: commandToken.value, args };
        }

        // 2. Handle Assignments (e.g. x = 10) or Labels (Label:)
        if (this.match('IDENTIFIER')) {
            const name = this.previous().value;
            let node = { type: 'Variable', name };

            // Handle Type Suffix (e.g. var.Type)
            if (this.check('LABEL')) {
                this.advance();
            }

            // Check for Array Access
            if (this.check('OPERATOR', '(')) {
                const symbol = this.symbols.resolve(name);
                if (symbol && symbol.kind === 'array') {
                    this.consume('OPERATOR', '(');
                    const indices = [];
                    do {
                        indices.push(this.expression());
                    } while (this.match('OPERATOR', ','));
                    this.consume('OPERATOR', ')');
                    node = { type: 'ArrayAccess', name, indices };
                } else {
                    // Function Call Statement (e.g. UpdateParticles())
                    this.consume('OPERATOR', '(');
                    const args = [];
                    if (!this.check('OPERATOR', ')')) {
                        do {
                            args.push(this.expression());
                        } while (this.match('OPERATOR', ','));
                    }
                    this.consume('OPERATOR', ')');
                    return { type: 'FunctionCallStatement', name, args };
                }
            }

            // Check for Field Access (chain): obj\field
            while (this.match('OPERATOR', '\\')) {
                if (this.match('IDENTIFIER')) {
                    node = { type: 'FieldAccess', object: node, field: this.previous().value };
                }
            }

            // Assignment
            if (this.match('OPERATOR', '=')) {
                const value = this.expression();
                if (node.type === 'Variable') return { type: 'Assignment', variable: node.name, value };
                if (node.type === 'ArrayAccess') return { type: 'ArrayAssignment', variable: node.name, indices: node.indices, value };
                if (node.type === 'FieldAccess') return { type: 'FieldAssignment', object: node.object, field: node.field, value };
            }

            // Label defined with colon: LabelName:
            if (node.type === 'Variable' && this.match('OPERATOR', ':')) {
                return { type: 'Label', name: node.name };
            }
        }

        // 3. Handle Dot-Labels (.JumpMarke)
        if (this.match('LABEL')) {
            return { type: 'Label', name: this.previous().value };
        }

        return null;
    }

    globalStatement() {
        if (!this.match('IDENTIFIER')) return null;
        const name = this.previous().value;
        if (this.check('LABEL')) this.advance();
        let value = null;
        if (this.match('OPERATOR', '=')) {
            value = this.expression();
        }
        this.symbols.define(name, 'unknown', 'variable');
        return { type: 'GlobalStatement', variable: name, value };
    }

    localStatement() {
        if (!this.match('IDENTIFIER')) return null;
        const name = this.previous().value;
        if (this.check('LABEL')) this.advance();
        let value = null;
        if (this.match('OPERATOR', '=')) {
            value = this.expression();
        }
        this.symbols.define(name, 'unknown', 'variable');
        return { type: 'LocalStatement', variable: name, value };
    }

    gotoStatement() {
        if (!this.match('IDENTIFIER')) return null;
        const label = this.previous().value;
        return { type: 'GotoStatement', label };
    }

    gosubStatement() {
        if (!this.match('IDENTIFIER')) return null;
        const label = this.previous().value;
        return { type: 'GosubStatement', label };
    }

    constStatement() {
        const constants = [];
        do {
            if (!this.match('IDENTIFIER')) break;
            const name = this.previous().value;
            if (this.check('LABEL')) this.advance(); // Skip type suffix
            this.consume('OPERATOR', '=');
            const value = this.expression();
            constants.push({ name, value });
        } while (this.match('OPERATOR', ','));
        return { type: 'ConstStatement', constants };
    }

    dataStatement() {
        const values = [];
        do {
            values.push(this.expression());
        } while (this.match('OPERATOR', ','));
        return { type: 'DataStatement', values };
    }

    readStatement() {
        const variables = [];
        do {
            if (this.match('IDENTIFIER')) {
                const name = this.previous().value;
                let node = { type: 'Variable', name };
                
                if (this.check('LABEL')) this.advance();
                
                if (this.check('OPERATOR', '(')) {
                     this.consume('OPERATOR', '(');
                     const indices = [];
                     do { indices.push(this.expression()); } while (this.match('OPERATOR', ','));
                     this.consume('OPERATOR', ')');
                     node = { type: 'ArrayAccess', name, indices };
                }
                
                while (this.match('OPERATOR', '\\')) {
                    if (this.match('IDENTIFIER')) {
                        node = { type: 'FieldAccess', object: node, field: this.previous().value };
                    }
                }
                variables.push(node);
            }
        } while (this.match('OPERATOR', ','));
        return { type: 'ReadStatement', variables };
    }

    restoreStatement() {
        if (this.match('IDENTIFIER')) {
            return { type: 'RestoreStatement', label: this.previous().value };
        }
        // Handle Restore with no label (restore to start)? Blitz usually requires a label.
        // But Restore 0 or similar might be valid in some dialects. Assuming label for now.
        return null;
    }

    returnStatement() {
        let value = null;
        // If next token is NOT a newline and NOT a keyword that ends a block, try to parse expression
        if (!this.check('NEWLINE') && !this.isAtEnd() && 
            !this.check('KEYWORD', 'end') && 
            !this.check('KEYWORD', 'endif') && 
            !this.check('KEYWORD', 'else') && 
            !this.check('KEYWORD', 'elseif') &&
            !this.check('KEYWORD', 'until') &&
            !this.check('KEYWORD', 'forever')) {
            value = this.expression();
        }
        return { type: 'ReturnStatement', value };
    }

    dimStatement() {
        if (!this.match('IDENTIFIER')) {
            // Error handling could be improved
            return null;
        }
        const name = this.previous().value;
        if (this.check('LABEL')) this.advance();
        
        this.consume('OPERATOR', '(');
        const dimensions = [];
        do {
            dimensions.push(this.expression());
        } while (this.match('OPERATOR', ','));
        this.consume('OPERATOR', ')');

        this.symbols.define(name, 'unknown', 'array', { dimCount: dimensions.length });
        return { type: 'DimStatement', name, dimensions };
    }

    typeDeclaration() {
        if (!this.match('IDENTIFIER')) return null;
        const name = this.previous().value;
        this.consume('NEWLINE');
        
        const fields = [];
        while (!this.check('KEYWORD', 'end') && !this.isAtEnd()) {
             if (this.match('KEYWORD', 'field')) {
                 do {
                     if (this.match('IDENTIFIER')) {
                         const fName = this.previous().value;
                         if (this.check('LABEL')) this.advance();
                         fields.push({ name: fName, type: 'unknown' });
                     }
                 } while (this.match('OPERATOR', ','));
             }
             this.consume('NEWLINE');
        }
        this.consume('KEYWORD', 'end');
        this.consume('KEYWORD', 'type');
        
        this.symbols.defineType(name, fields);
        return { type: 'TypeDeclaration', name, fields };
    }

    deleteStatement() {
        const expr = this.expression();
        return { type: 'DeleteStatement', expression: expr };
    }

    functionDeclaration() {
        if (!this.match('IDENTIFIER')) return null;
        const name = this.previous().value;
        
        const parameters = [];
        if (this.match('OPERATOR', '(')) {
            if (!this.check('OPERATOR', ')')) {
                do {
                    if (this.match('IDENTIFIER')) {
                        const pName = this.previous().value;
                        if (this.check('LABEL')) this.advance();
                        parameters.push({ name: pName, type: 'unknown' });
                    }
                } while (this.match('OPERATOR', ','));
            }
            this.consume('OPERATOR', ')');
        }

        this.symbols.defineFunction(name, 'unknown', parameters);
        this.symbols.enterScope();
        parameters.forEach(p => this.symbols.define(p.name, p.type, 'variable'));

        this.consume('NEWLINE');
        // Parse body until 'End Function'
        const body = this.block([], () => this.check('KEYWORD', 'end') && this.peek(1).value === 'function');
        this.consume('KEYWORD', 'end');
        this.consume('KEYWORD', 'function');
        
        this.symbols.exitScope();
        return { type: 'FunctionDeclaration', name, parameters, body };
    }

    selectStatement() {
        const expression = this.expression();
        this.consume('NEWLINE');
        
        const cases = [];
        let defaultCase = null;

        while (!this.check('KEYWORD', 'end') && !this.isAtEnd()) {
            if (this.match('KEYWORD', 'case')) {
                const expressions = [];
                do {
                    expressions.push(this.expression());
                } while (this.match('OPERATOR', ','));
                
                this.consume('NEWLINE');
                const body = this.block(['case', 'default', 'end']);
                cases.push({ type: 'Case', expressions, body });
            } else if (this.match('KEYWORD', 'default')) {
                this.consume('NEWLINE');
                defaultCase = this.block(['end', 'case', 'default']);
            } else {
                if (this.match('NEWLINE')) continue;
                this.advance(); // Skip unknown/invalid tokens inside select
            }
        }
        
        this.consume('KEYWORD', 'end');
        this.consume('KEYWORD', 'select');
        
        return { type: 'SelectStatement', expression, cases, defaultCase };
    }

    // --- Control Flow Structures ---

    ifStatement() {
        const condition = this.expression();
        this.match('KEYWORD', 'then'); // Optional 'Then'

        // Check for Single Line If: If x=1 Then End
        if (!this.check('NEWLINE')) {
            const thenBranch = [this.statement()];
            let elseBranch = null;
            if (this.match('KEYWORD', 'else')) {
                elseBranch = [this.statement()];
            }
            return { type: 'IfStatement', condition, thenBranch, elseBranch, mode: 'single' };
        }

        // Block If
        this.consume('NEWLINE');
        const thenBranch = this.block(['endif', 'else', 'elseif']);
        let elseBranch = null;

        // Handle ElseIf (Recursive or Iterative - simplified here as nested Ifs in Else)
        if (this.match('KEYWORD', 'elseif')) {
            // Recursively parse the ElseIf as a new IfStatement
            elseBranch = [this.ifStatement()];
            // Note: In a full implementation, we might want a flat 'elseIfs' array in the AST
        } else if (this.match('KEYWORD', 'else')) {
            this.consume('NEWLINE');
            elseBranch = this.block(['endif']);
            this.consume('KEYWORD', 'endif');
        } else {
            this.consume('KEYWORD', 'endif');
        }

        return { type: 'IfStatement', condition, thenBranch, elseBranch, mode: 'block' };
    }

    forStatement() {
        // For i = 1 To 10 Step 2
        this.consume('IDENTIFIER');
        const variable = this.previous().value;
        
        if (this.check('LABEL')) {
            this.advance();
        }
        
        this.consume('OPERATOR', '=');

        // Handle For ... Each
        if (this.match('KEYWORD', 'each')) {
             if (!this.match('IDENTIFIER')) return null;
             const typeName = this.previous().value;
             this.consume('NEWLINE');
             const body = this.block(['next']);
             this.consume('KEYWORD', 'next');
             return { type: 'ForEachStatement', variable, typeName, body };
        }

        const start = this.expression();
        this.consume('KEYWORD', 'to');
        const end = this.expression();
        
        let step = null;
        if (this.match('KEYWORD', 'step')) {
            step = this.expression();
        }

        this.consume('NEWLINE');
        const body = this.block(['next']);
        this.consume('KEYWORD', 'next');
        
        return { type: 'ForStatement', variable, start, end, step, body };
    }

    whileStatement() {
        const condition = this.expression();
        this.consume('NEWLINE');
        const body = this.block(['wend']);
        this.consume('KEYWORD', 'wend');
        return { type: 'WhileStatement', condition, body };
    }

    repeatStatement() {
        this.consume('NEWLINE');
        const body = this.block(['until', 'forever']);
        let condition = null;
        let type = 'Forever';

        if (this.match('KEYWORD', 'until')) {
            condition = this.expression();
            type = 'Until';
        } else {
            this.consume('KEYWORD', 'forever');
        }
        return { type: 'RepeatStatement', condition, body, loopType: type };
    }

    block(terminators, customCheck = null) {
        const statements = [];
        while (!this.isAtEnd() && !this.checkKeywords(terminators)) {
            if (customCheck && customCheck()) break;

            if (this.match('NEWLINE')) continue;
            const stmt = this.statement();
            if (stmt) statements.push(stmt);
            else this.advance(); // Skip invalid tokens
        }
        return statements;
    }

    // --- Expressions (Recursive Descent with Precedence) ---

    expression() {
        return this.equality();
    }

    equality() {
        let expr = this.comparison();
        while (this.match('OPERATOR', '=') || this.match('OPERATOR', '<>')) {
            const operator = this.previous().value;
            const right = this.comparison();
            expr = { type: 'BinaryExpression', left: expr, operator, right };
        }
        return expr;
    }

    comparison() {
        let expr = this.term();
        while (this.match('OPERATOR', '>') || this.match('OPERATOR', '>=') || 
               this.match('OPERATOR', '<') || this.match('OPERATOR', '<=')) {
            const operator = this.previous().value;
            const right = this.term();
            expr = { type: 'BinaryExpression', left: expr, operator, right };
        }
        return expr;
    }

    term() {
        let expr = this.factor();
        while (this.match('OPERATOR', '-') || this.match('OPERATOR', '+')) {
            const operator = this.previous().value;
            const right = this.factor();
            expr = { type: 'BinaryExpression', left: expr, operator, right };
        }
        return expr;
    }

    factor() {
        let expr = this.unary();
        while (this.match('OPERATOR', '/') || this.match('OPERATOR', '*') || 
               this.match('OPERATOR', '^') || this.match('KEYWORD', 'mod')) {
            const operator = this.previous().value;
            const right = this.unary();
            expr = { type: 'BinaryExpression', left: expr, operator, right };
        }
        return expr;
    }

    unary() {
        if (this.match('KEYWORD', 'not') || this.match('OPERATOR', '-')) {
            const operator = this.previous().value;
            const right = this.unary();
            return { type: 'UnaryExpression', operator, right };
        }
        return this.primary();
    }

    primary() {
        if (this.match('NUMBER_INT') || this.match('NUMBER_FLOAT') || this.match('NUMBER_HEX')) {
            return { type: 'Literal', value: this.previous().value, valueType: 'number' };
        }
        if (this.match('STRING')) {
            return { type: 'Literal', value: this.previous().value, valueType: 'string' };
        }
        if (this.match('KEYWORD', 'new')) {
            if (this.match('IDENTIFIER')) {
                return { type: 'NewExpression', typeName: this.previous().value };
            }
        }
        if (this.match('KEYWORD', 'null')) {
            return { type: 'Literal', value: 'null', valueType: 'null' };
        }
        if (this.match('KEYWORD', 'true')) {
            return { type: 'Literal', value: 'true', valueType: 'boolean' };
        }
        if (this.match('KEYWORD', 'false')) {
            return { type: 'Literal', value: 'false', valueType: 'boolean' };
        }
        if (this.match('KEYWORD', 'pi')) {
            return { type: 'Literal', value: 'Math.PI', valueType: 'number' };
        }
        if (this.match('IDENTIFIER')) {
            const name = this.previous().value;
            
            let node = { type: 'Variable', name };

            // Array Access OR Function Call (if not an array)
            if (this.check('OPERATOR', '(')) {
                const symbol = this.symbols.resolve(name);
                
                // If it is explicitly known as an array
                if (symbol && symbol.kind === 'array') {
                    this.consume('OPERATOR', '(');
                    const indices = [];
                    do {
                        indices.push(this.expression());
                    } while (this.match('OPERATOR', ','));
                    this.consume('OPERATOR', ')');
                    node = { type: 'ArrayAccess', name, indices };
                } else {
                    // Treat as Function Call (e.g. Cos(), MyFunc())
                    this.consume('OPERATOR', '(');
                    const args = [];
                    if (!this.check('OPERATOR', ')')) {
                        do {
                            args.push(this.expression());
                        } while (this.match('OPERATOR', ','));
                    }
                    this.consume('OPERATOR', ')');
                    node = { type: 'FunctionCall', name, args };
                    this.validateCommandArgs({ value: name, line: this.peek().line }, args);
                }
            }

            // Field Access
            while (this.match('OPERATOR', '\\')) {
                if (this.match('IDENTIFIER')) {
                    node = { type: 'FieldAccess', object: node, field: this.previous().value };
                }
            }
            return node;
        }
        if (this.match('COMMAND')) {
            const name = this.previous().value;
            const args = [];
            if (this.match('OPERATOR', '(')) {
                if (!this.check('OPERATOR', ')')) {
                    do {
                        args.push(this.expression());
                    } while (this.match('OPERATOR', ','));
                }
                this.consume('OPERATOR', ')');
            }
            this.validateCommandArgs({ value: name, line: this.peek().line }, args);
            return { type: 'FunctionCall', name, args };
        }
        if (this.match('OPERATOR', '(')) {
            const expr = this.expression();
            this.consume('OPERATOR', ')');
            return { type: 'Grouping', expression: expr };
        }
        
        const token = this.peek();
        const msg = 'Unexpected token: ' + (token ? token.value : 'EOF');
        this.errors.push({ line: token ? token.line : 0, value: msg });
        return { type: 'Error', value: msg };
    }

    // --- Helper Methods ---

    peek(offset = 0) {
        if (this.pos + offset >= this.tokens.length) return this.tokens[this.tokens.length - 1];
        return this.tokens[this.pos + offset];
    }

    previous() {
        return this.tokens[this.pos - 1];
    }

    isAtEnd() {
        return this.peek().type === 'EOF';
    }

    check(type, value) {
        if (this.isAtEnd()) return false;
        const token = this.peek();
        return token.type === type && (!value || token.value === value);
    }

    checkKeywords(keywords) {
        if (this.isAtEnd() || this.peek().type !== 'KEYWORD') return false;
        return keywords.includes(this.peek().value);
    }

    match(type, value) {
        if (this.check(type, value)) {
            this.advance();
            return true;
        }
        return false;
    }

    consume(type, value) {
        // Handle optional value argument
        if (value === undefined && typeof type === 'string' && !['KEYWORD', 'OPERATOR', 'IDENTIFIER', 'NEWLINE'].includes(type)) {
             // Logic allows consume('NEWLINE') without value
        }
        if (this.check(type, value)) return this.advance();
        // Error handling could be improved here
        return null; 
    }

    advance() {
        if (!this.isAtEnd()) this.pos++;
        return this.previous();
    }

    // --- Type Checking Helpers ---

    validateCommandArgs(token, args) {
        const name = token.value.toLowerCase();
        const config = commandMap[name];
        
        // Wenn kein Mapping oder keine Params definiert sind, ignorieren wir es
        if (!config || !config.params) return;

        // Wir prüfen nur so viele Argumente wie übergeben wurden (wegen optionaler Parameter)
        // Aber nicht mehr als definiert sind.
        const checkCount = Math.min(args.length, config.params.length);

        for (let i = 0; i < checkCount; i++) {
            const expected = config.params[i];
            const actual = this.inferType(args[i]);

            if (actual !== 'unknown' && actual !== expected) {
                // Ausnahme: Number und Boolean sind in Blitz oft austauschbar (0/1)
                if ((expected === 'number' && actual === 'boolean') || 
                    (expected === 'boolean' && actual === 'number')) {
                    continue;
                }

                this.errors.push({
                    line: token.line || this.peek().line, // Fallback line
                    value: `Type Mismatch in '${token.value}' arg ${i+1}: Expected ${expected}, got ${actual}`
                });
            }
        }
    }

    inferType(node) {
        if (!node) return 'unknown';

        if (node.type === 'Literal') return node.valueType; // 'number', 'string', 'null'
        
        if (node.type === 'Variable') {
            if (node.name.endsWith('$')) return 'string';
            if (node.name.endsWith('%') || node.name.endsWith('#')) return 'number';
            
            const sym = this.symbols.resolve(node.name);
            if (sym && sym.type !== 'unknown') return sym.type;
            
            return 'number'; // Default Blitz assumption for variables without suffix
        }

        if (node.type === 'BinaryExpression') {
            // String concatenation
            if (node.operator === '+') {
                const l = this.inferType(node.left);
                const r = this.inferType(node.right);
                if (l === 'string' || r === 'string') return 'string';
            }
            // Comparisons return boolean (internally)
            if (['=', '<>', '<', '>', '<=', '>='].includes(node.operator)) return 'boolean';
            return 'number'; // Math ops
        }

        return 'unknown';
    }
}