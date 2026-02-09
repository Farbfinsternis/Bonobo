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
            if (this.match('NEWLINE') || this.match('OPERATOR', ':')) continue;

            const stmt = this.statement();
            if (stmt) {
                ast.body.push(stmt);
            } else {
                this.synchronize();
            }
        }

        return ast;
    }

    /**
     * Multi-Pass: Reorganizes the AST (Hoisting)
     * Ensures Types, Functions, and Data (with their labels) are at the top.
     */
    hoist(ast) {
        const hoisted = [];
        const remaining = [];
        const dataLabels = new Set();

        // Pass 1: Identify all labels that precede DataStatements
        for (let i = 0; i < ast.body.length; i++) {
            if (ast.body[i].type === 'DataStatement') {
                let j = i - 1;
                while (j >= 0 && ast.body[j].type === 'Label') {
                    dataLabels.add(ast.body[j]);
                    j--;
                }
            }
        }

        // Pass 2: Partition the AST
        for (const node of ast.body) {
            const isHoisted = 
                node.type === 'TypeDeclaration' || 
                node.type === 'FunctionDeclaration' || 
                node.type === 'DataStatement' || 
                dataLabels.has(node);

            if (isHoisted) {
                hoisted.push(node);
            } else {
                remaining.push(node);
            }
        }
        ast.body = hoisted.concat(remaining);
    }

    /**
     * Analyzes the AST to propagate 'async' status from primitive commands to user functions.
     */
    analyzeAsync(ast) {
        const functions = ast.body.filter(n => n.type === 'FunctionDeclaration');
        const asyncPrimitives = new Set([
            'flip', 'waitkey', 'delay', 'input', 'loadimage', 'loadanimimage', 
            'loadsound', 'loadmusic', 'loadfont', 'readfile', 'writefile', 
            'openfile', 'readdir', 'nextfile', 'copyfile', 'deletefile'
        ]);

        const getCalls = (rootNode) => {
            const calls = new Set();
            const traverse = (node) => {
                if (!node || typeof node !== 'object') return;
                if (Array.isArray(node)) {
                    for (const item of node) traverse(item);
                    return;
                }
                
                if (node.type === 'CommandStatement') calls.add(node.command.toLowerCase());
                if (node.type === 'FunctionCall' || node.type === 'FunctionCallStatement') calls.add(node.name.toLowerCase());

                for (const key in node) {
                    if (Object.prototype.hasOwnProperty.call(node, key) && key !== 'parent') {
                        traverse(node[key]);
                    }
                }
            };
            traverse(rootNode);
            return calls;
        };

        const funcMap = new Map();
        for (const f of functions) {
            funcMap.set(f.name.toLowerCase(), { node: f, calls: getCalls(f.body) });
        }

        let changed = true;
        while (changed) {
            changed = false;
            for (const data of funcMap.values()) {
                if (data.node.isAsync) continue;

                for (const call of data.calls) {
                    if (asyncPrimitives.has(call) || (funcMap.has(call) && funcMap.get(call).node.isAsync)) {
                        data.node.isAsync = true;
                        changed = true;
                        break;
                    }
                }
            }
        }
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

        // Handle standalone 'End' but don't trip over 'End If', 'End Function' etc. (Case Insensitive)
        if (this.check('KEYWORD', 'end') && !['if', 'function', 'type', 'select'].includes((this.peek(1).value || '').toLowerCase())) {
            this.advance();
            return { type: 'EndStatement' };
        }

        if (this.match('KEYWORD', 'type')) return this.typeDeclaration();
        if (this.match('KEYWORD', 'if')) return this.ifStatement();
        if (this.match('KEYWORD', 'for')) return this.forStatement();
        if (this.match('KEYWORD', 'while')) return this.whileStatement();
        if (this.match('KEYWORD', 'repeat')) return this.repeatStatement();
        if (this.match('KEYWORD', 'dim')) return this.dimStatement();

        // Treat 'delete' as a command to use the runtime mapping ($.rtl.deleteObj)
        if (this.match('KEYWORD', 'delete')) {
            const token = this.previous();
            const args = [this.expression()];
            this.validateCommandArgs(token, args);
            return { type: 'CommandStatement', command: 'delete', args };
        }

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
            let node = this.parseAccessChain({ type: 'Variable', name });

            // Special case: Function call as a standalone statement
            if (node.type === 'FunctionCall') {
                return { type: 'FunctionCallStatement', name: node.name, args: node.args };
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
        
        // 4. Handle Dot-Labels split by lexer (. Label)
        if (this.match('OPERATOR', '.') && this.match('IDENTIFIER')) {
            return { type: 'Label', name: '.' + this.previous().value };
        }

        return null;
    }

    globalStatement() {
        if (!this.match('IDENTIFIER')) return null;
        const name = this.previous().value;
        this.consumeTypeSuffix();
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
        this.consumeTypeSuffix();
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
            this.consumeTypeSuffix();
            this.consume('OPERATOR', '=', "Expected '=' after constant name");
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
                // Read only supports variables, arrays or fields, no function calls
                let node = this.parseAccessChain({ type: 'Variable', name }, false);
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
        this.consumeTypeSuffix();
        
        this.consume('OPERATOR', '(', "Expected '(' after Dim");
        const dimensions = [];
        do {
            dimensions.push(this.expression());
        } while (this.match('OPERATOR', ','));
        this.consume('OPERATOR', ')', "Expected ')' after Dim dimensions");

        this.symbols.define(name, 'unknown', 'array', { dimCount: dimensions.length });
        return { type: 'DimStatement', name, dimensions };
    }

    typeDeclaration() {
        if (!this.match('IDENTIFIER')) return null;
        const name = this.previous().value;
        this.consume('NEWLINE', null, "Expected newline after Type name");
        
        const fields = [];
        while (!this.check('KEYWORD', 'end') && !this.isAtEnd()) {
             if (this.match('KEYWORD', 'field')) {
                 do {
                     if (this.match('IDENTIFIER')) {
                         const fName = this.previous().value;
                         this.consumeTypeSuffix();
                         fields.push({ name: fName, type: 'unknown' });
                     }
                 } while (this.match('OPERATOR', ','));
             }
             this.match('NEWLINE');
        }
        this.consume('KEYWORD', 'end', "Expected 'End Type'");
        this.consume('KEYWORD', 'type', "Expected 'End Type'");
        
        this.symbols.defineType(name, fields);
        return { type: 'TypeDeclaration', name, fields };
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
                        this.consumeTypeSuffix();
                        parameters.push({ name: pName, type: 'unknown' });
                    }
                } while (this.match('OPERATOR', ','));
            }
            this.consume('OPERATOR', ')');
        }

        const returnType = this.inferType({ type: 'Variable', name });
        this.symbols.defineFunction(name, returnType, parameters);
        this.symbols.enterScope();
        parameters.forEach(p => this.symbols.define(p.name, p.type, 'variable'));

        while (this.match('NEWLINE') || this.match('COMMENT')); 
        // Parse body until 'End Function'
        const body = this.block([], () => this.checkKeywords(['endfunction']));
        this.consumeEndFunction();
        
        this.symbols.exitScope();
        return { type: 'FunctionDeclaration', name, parameters, body, isAsync: false };
    }

    selectStatement() {
        const expression = this.expression();
        this.consume('NEWLINE', null, "Expected newline after Select expression");
        
        const cases = [];
        let defaultCase = null;

        while (!this.checkKeywords(['endselect']) && !this.isAtEnd()) {
            if (this.match('KEYWORD', 'case')) {
                const expressions = [];
                do {
                    expressions.push(this.expression());
                } while (this.match('OPERATOR', ','));
                
                this.match('NEWLINE');
                const body = this.block(['case', 'default', 'end']);
                cases.push({ type: 'Case', expressions, body });
            } else if (this.match('KEYWORD', 'default')) {
                this.match('NEWLINE');
                defaultCase = this.block(['end', 'case', 'default']);
            } else {
                if (this.match('NEWLINE')) continue;
                this.advance(); // Skip unknown/invalid tokens inside select
            }
        }
        
        this.consumeEndSelect();
        
        return { type: 'SelectStatement', expression, cases, defaultCase };
    }

    // --- Control Flow Structures ---

    ifStatement() {
        const condition = this.expression();
        this.match('KEYWORD', 'then');
        
        while (this.match('COMMENT')); // Skip comments on the same line

        if (!this.check('NEWLINE') && !this.isAtEnd()) {
            const thenBranch = [this.statement()];
            let elseBranch = null;
            if (this.match('KEYWORD', 'else')) {
                elseBranch = [this.statement()];
            }
            return { type: 'IfStatement', condition, thenBranch, elseBranch, mode: 'single' };
        }

        // Block If
        this.consume('NEWLINE', null, "Expected newline after Then");
        const thenBranch = this.block(['endif', 'else', 'elseif']);
        let elseBranch = null;

        // Handle ElseIf (Recursive chain)
        if (this.checkKeywords(['elseif']) || (this.check('KEYWORD', 'else') && (this.peek(1).value || '').toLowerCase() === 'if')) {
            if (this.match('KEYWORD', 'else')) this.advance(); // consume 'if'
            else this.match('KEYWORD', 'elseif');
            
            elseBranch = [this.ifStatement()];
            return { type: 'IfStatement', condition, thenBranch, elseBranch, mode: 'block' };
        } else if (this.match('KEYWORD', 'else')) {
            while (this.match('NEWLINE') || this.match('COMMENT'));
            elseBranch = this.block(['endif']);
            this.consumeEndIf();
        } else {
            this.consumeEndIf();
        }

        return { type: 'IfStatement', condition, thenBranch, elseBranch, mode: 'block' };
    }

    forStatement() {
        // For i = 1 To 10 Step 2
        this.consume('IDENTIFIER', null, "Expected variable name after For");
        const variable = this.previous().value;
        
        this.consumeTypeSuffix();
        
        this.consume('OPERATOR', '=', "Expected '=' after For variable");

        // Handle For ... Each
        if (this.match('KEYWORD', 'each')) {
             if (!this.match('IDENTIFIER')) return null;
             const typeName = this.previous().value;
             
             // Register variable as object in symbol table
             this.symbols.define(variable, 'object', 'variable');

             this.match('NEWLINE');
             const body = this.block(['next']);
             this.consume('KEYWORD', 'next', "Expected 'Next' after For Each block");
             return { type: 'ForEachStatement', variable, typeName, body };
        }

        const start = this.expression();
        this.consume('KEYWORD', 'to', "Expected 'To' in For statement");
        const end = this.expression();
        
        let step = null;
        if (this.match('KEYWORD', 'step')) {
            step = this.expression();
        }

        this.match('NEWLINE');
        const body = this.block(['next']);
        this.consume('KEYWORD', 'next', "Expected 'Next' after For block");
        this.match('IDENTIFIER'); // Optional: Next i
        
        return { type: 'ForStatement', variable, start, end, step, body };
    }

    whileStatement() {
        const condition = this.expression();
        this.match('NEWLINE');
        const body = this.block(['wend']);
        this.consume('KEYWORD', 'wend', "Expected 'Wend' after While block");
        return { type: 'WhileStatement', condition, body };
    }

    repeatStatement() {
        this.match('NEWLINE');
        const body = this.block(['until', 'forever']);
        let condition = null;
        let type = 'Forever';

        if (this.match('KEYWORD', 'until')) {
            condition = this.expression();
            type = 'Until';
        } else {
            this.consume('KEYWORD', 'forever', "Expected 'Until' or 'Forever' after Repeat block");
        }
        return { type: 'RepeatStatement', condition, body, loopType: type };
    }

    block(terminators, customCheck = null) {
        const statements = [];
        while (!this.isAtEnd()) {
            if (this.checkKeywords(terminators)) break;
            if (customCheck && customCheck()) break;

            if (this.match('NEWLINE') || this.match('OPERATOR', ':') || this.match('COMMENT')) continue;

            const stmt = this.statement();
            if (stmt) statements.push(stmt);
            else {
                this.advance(); // Skip truly unknown tokens
            }
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
            return this.parseAccessChain({ type: 'Variable', name });
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
        const msg = 'Unexpected token: ' + (token.value || token.type);
        this.error(msg, token);
        return { type: 'Error', value: msg };
    }

    // --- Helper Methods ---

    error(message, token = null) {
        const t = token || this.peek();
        const err = {
            line: t.line,
            column: t.col || 0,
            value: message,
            token: t.value
        };
        this.errors.push(err);
        return null;
    }

    synchronize() {
        this.advance();
        while (!this.isAtEnd()) {
            if (this.previous().type === 'NEWLINE') return;
            if (this.peek().type === 'KEYWORD') {
                if (['if', 'for', 'while', 'repeat', 'function', 'type', 'select', 'data', 'global', 'local'].includes(this.peek().value.toLowerCase())) {
                    return;
                }
            }
            this.advance();
        }
    }

    /**
     * Helper to parse suffixes, array access, and field chains.
     * Reduces redundancy between statement() and primary().
     */
    parseAccessChain(node, allowFunctions = true) {
        node.dataType = this.consumeTypeSuffix();

        // Array Access OR Function Call
        if (this.check('OPERATOR', '(')) {
            const name = node.name;
            const symbol = this.symbols.resolve(name);
            
            this.consume('OPERATOR', '(');
            const args = [];
            if (!this.check('OPERATOR', ')')) {
                do {
                    args.push(this.expression());
                } while (this.match('OPERATOR', ','));
            }
            this.consume('OPERATOR', ')');

            if (symbol && symbol.kind === 'array') {
                node = { type: 'ArrayAccess', name, indices: args, dataType: node.dataType };
            } else if (allowFunctions) {
                node = { type: 'FunctionCall', name, args, dataType: node.dataType };
                this.validateCommandArgs({ value: name, line: this.peek().line }, args);
            }
        }

        // Field Access (chain): obj\field\subfield
        while (this.match('OPERATOR', '\\')) {
            if (this.match('IDENTIFIER')) {
                const fieldName = this.previous().value;
                const fieldType = this.consumeTypeSuffix();
                node = { type: 'FieldAccess', object: node, field: fieldName, dataType: fieldType };
            }
        }
        return node;
    }

    consumeTypeSuffix() {
        const token = this.peek();
        // Blitz suffixes: $ (string), # (float), % (int)
        if (token.type === 'LABEL') {
            this.advance();
            if (token.value === '$') return 'string';
            if (token.value === '#') return 'float';
            if (token.value === '%') return 'number';
            return 'unknown';
        }
        // Type suffix: .TypeName
        if (this.check('OPERATOR', '.') && this.peek(1).type === 'IDENTIFIER') {
            this.advance(); // .
            this.advance(); // Identifier
            return 'object';
        }
        return null;
    }

    consumeEndIf() {
        if (this.match('KEYWORD', 'endif')) return true;
        if (this.check('KEYWORD', 'end') && (this.peek(1).value || '').toLowerCase() === 'if') {
            this.advance(); // end
            this.advance(); // if
            return true;
        }
        return false;
    }

    consumeEndFunction() {
        if (this.match('KEYWORD', 'endfunction')) return true;
        if (this.check('KEYWORD', 'end') && (this.peek(1).value || '').toLowerCase() === 'function') {
            this.advance(); this.advance();
            return true;
        }
        return false;
    }

    consumeEndSelect() {
        if (this.match('KEYWORD', 'endselect')) return true;
        if (this.check('KEYWORD', 'end') && (this.peek(1).value || '').toLowerCase() === 'select') {
            this.advance(); this.advance();
            return true;
        }
        return false;
    }

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
        const val = this.peek().value.toLowerCase();
        if (keywords.includes(val)) return true;
        
        // Handle "End If", "End Function", etc.
        if (val === 'end' && this.peek(1).type === 'KEYWORD') {
            const combined = 'end' + this.peek(1).value.toLowerCase();
            if (keywords.includes(combined)) return true;
        }
        return false;
    }

    match(type, value) {
        if (this.check(type, value)) {
            this.advance();
            return true;
        }
        return false;
    }

    consume(type, value, message) {
        if (this.check(type, value)) return this.advance();
        this.error(message || `Expected ${type} ${value || ''}`);
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
            // Allow null for objects
            if (expected === 'object' && actual === 'null') {
                continue;
                }

                this.errors.push({
                    line: token.line || this.peek().line,
                    column: token.col || 0,
                    value: `Type Mismatch in '${token.value}' arg ${i+1}: Expected ${expected}, got ${actual}`
                });
            }
        }
    }

    inferType(node) {
        if (!node) return 'unknown';

        if (node.type === 'Literal') return node.valueType; // 'number', 'string', 'null'
        
        if (node.type === 'NewExpression') return 'object';
        
        if (node.type === 'Variable') {
            if (node.name.endsWith('$')) return 'string';
            if (node.name.endsWith('%') || node.name.endsWith('#')) return 'number';
            
            const sym = this.symbols.resolve(node.name);
            if (sym && sym.type !== 'unknown') return sym.type;
            
            return 'number'; // Default Blitz assumption for variables without suffix
        }
        
        if (node.type === 'UnaryExpression') {
            // Handle negative numbers (-5)
            if (node.operator === '-') return this.inferType(node.right);
            if (node.operator === 'not') return 'boolean';
        }

        if (node.type === 'FieldAccess') {
            // Heuristic: If field name ends in $, it's a string, else number
            if (node.field.endsWith('$')) return 'string';
            return 'number';
        }

        if (node.type === 'ArrayAccess') {
            if (node.name.endsWith('$')) return 'string';
            const sym = this.symbols.resolve(node.name);
            if (sym && sym.type !== 'unknown') return sym.type;
            return 'number';
        }

        if (node.type === 'FunctionCall') {
            // Simple heuristic for common return types
            const name = node.name.toLowerCase();
            if (name.endsWith('$')) return 'string';
            if (name.endsWith('%') || name.endsWith('#')) return 'number';

            if (['mid', 'left', 'right', 'upper', 'lower', 'chr', 'hex', 'bin', 'string', 'input', 'currentdate', 'currenttime'].includes(name)) return 'string';
            
            // Check symbol table for user-defined functions
            const sym = this.symbols.resolve(name);
            if (sym && sym.kind === 'function' && sym.type !== 'unknown') {
                return sym.type;
            }
            return 'number';
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