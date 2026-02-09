import { commandMap } from './command_map.js';

export class CodeGenerator {
    constructor() {
        this.indent = 0;
        this.variables = new Set();
        this.globals = new Set();
        this.isInsideFunction = false;
        
        // List of commands that require 'await'
        this.asyncCommands = new Set([
            'flip', 'waitkey', 'loadimage', 'loadsound', 'loadmusic', 'loadfont',
            'readfile', 'writefile', 'readdir', 'copyfile', 'deletefile', 'delay', 'input'
            // 'delay' and 'input' are handled via command_map 'code' type which already includes await
        ]);
        this.asyncUserFunctions = new Set();
        this.importRoot = '..'; // Default path for playground
    }

    /**
     * Generates JavaScript code from the AST
     * @param {Object} ast 
     * @returns {string}
     */
    generate(ast) {
        this.indent = 0;
        this.variables.clear();
        this.globals.clear();
        this.isInsideFunction = false;

        this.asyncUserFunctions = new Set(
            ast.body
                .filter(n => n.type === 'FunctionDeclaration' && n.isAsync)
                .map(f => f.name.toLowerCase())
        );
        if (!ast || ast.type !== 'Program') return '';

        const importList = [
            `import { Bonobo } from '${this.importRoot}/lib/bonobo.js';`,
            `import * as BonoboModules from '${this.importRoot}/modules/bonobo/bonobo-modules.js';`
        ];

        importList.push(`import { BlitzRuntime } from '${this.importRoot}/cpl/modules/blitz.runtime.js';`);

        const imports = importList.join('\n') + '\n\n';

        const types = ast.body.filter(n => n.type === 'TypeDeclaration');
        const functions = ast.body.filter(n => n.type === 'FunctionDeclaration');
        const statements = ast.body.filter(n => n.type !== 'TypeDeclaration' && n.type !== 'FunctionDeclaration');

        // Find Main Loop (Look for a loop containing 'Flip')
        let mainLoopNode = null;
        let initStatements = [];
        let loopFound = false;

        for (const stmt of statements) {
            if (!loopFound && (stmt.type === 'WhileStatement' || stmt.type === 'RepeatStatement')) {
                if (this.hasFlip(stmt)) {
                    mainLoopNode = stmt;
                    loopFound = true;
                    continue;
                }
            }
            if (!loopFound) {
                initStatements.push(stmt);
            }
        }

        // 1. Scan for Consts to generate them first and exclude from globals
        const constNames = new Set();
        const constStatements = [];
        const scanForConsts = (nodes) => {
            if (!nodes) return;
            for (const node of nodes) {
                if (node.type === 'ConstStatement') {
                    constStatements.push(node);
                    node.constants.forEach(c => constNames.add(this.cleanName(c.name)));
                }
                // Recurse into blocks if necessary, but Const is usually top-level.
                // We'll assume top-level or simple nesting for now.
            }
        };
        scanForConsts(ast.body);

        // Scan for variables in main program (init + loop) to declare them globally
        const nodesToScan = [...initStatements];
        if (mainLoopNode && mainLoopNode.body) {
            nodesToScan.push(...mainLoopNode.body);
        }
        this.globals = this.scanForVariables(nodesToScan);
        
        // Remove constants from globals to avoid "Identifier has already been declared"
        for (const cName of constNames) {
            this.globals.delete(cName);
        }
        this.variables = new Set(this.globals);

        // Scan for Data and Labels
        const { dataList, labelMap } = this.scanForData(ast);

        // Handle Graphics command specially to pass dims to init
        let gfxWidth = 640;
        let gfxHeight = 480;
        for (const stmt of initStatements) {
            if (stmt.type === 'CommandStatement' && stmt.command.toLowerCase() === 'graphics') {
                if (stmt.args.length >= 2) {
                    // Only use literals for init configuration to avoid ReferenceErrors with variables
                    // The actual $.rtl.graphics call later will handle variables correctly if used
                    if (stmt.args[0].type === 'Literal') gfxWidth = Number(stmt.args[0].value);
                    if (stmt.args[1].type === 'Literal') gfxHeight = Number(stmt.args[1].value);
                }
            }
        }

        let js = imports;
        const globalVarsList = Array.from(this.globals).join(', ');
        
        js += `let bonobo, $, _initialized = false${globalVarsList ? ', ' + globalVarsList : ''};\n`;
        
        // Generate Consts
        for (const stmt of constStatements) {
            for (const c of stmt.constants) {
                js += `const ${this.cleanName(c.name)} = ${this.visitExpression(c.value)};\n`;
            }
        }

        // Generate Data
        js += `const _DATA = [${dataList.join(', ')}];\n`;
        const labelEntries = Object.entries(labelMap).map(([k, v]) => `'${k}': ${v}`);
        js += `const _LABELS = { ${labelEntries.join(', ')} };\n`;
        js += `let _dataPtr = 0;\n`;

        // Types
        js += types.map(t => this.visit(t)).join('\n') + '\n';

        // Functions
        js += functions.map(f => this.visit(f)).join('\n') + '\n';

        // Main Setup
        js += 'async function main() {\n';
        js += '    bonobo = new Bonobo({ loop: loop });\n';
        js += "    bonobo.appName('ApeShift Game');\n";
        js += `    $ = BonoboModules.init(bonobo, ${gfxWidth}, ${gfxHeight});\n`;
        js += '    $.rtl = new BlitzRuntime(bonobo, $);\n';
        js += '    bonobo.start();\n';
        js += '\n    // --- User Init ---\n';
        js += this.generateBlock(initStatements) + '\n';
        js += `\n    _initialized = true;\n}\n`;

        // Main Loop
        js += '\n// --- Main Loop ---\n';
        js += 'async function loop() {\n';
        this.indent++;
        js += `${this.getIndent()}if (!_initialized) return;\n`;
        
        if (mainLoopNode) {
            // We wrap the body in the loop condition to preserve logic (e.g. While Not KeyHit(1))
            if (mainLoopNode.type === 'WhileStatement') {
                 js += `${this.getIndent()}if (${this.visitExpression(mainLoopNode.condition)}) {\n`;
                 this.indent++;
                 js += this.generateBlock(mainLoopNode.body);
                 this.indent--;
                 js += `\n${this.getIndent()}}\n`;
            } else {
                 // Repeat / Forever
                 js += this.generateBlock(mainLoopNode.body);
            }
        }
        
        js += `${this.getIndent()}$.rtl.update();\n`;

        this.indent--;
        js += '}\n';

        js += "\nmain();";

        return js;
    }

    scanForData(ast) {
        const dataList = [];
        const labelMap = {};
        
        const visit = (node) => {
            if (!node) return;
            if (Array.isArray(node)) {
                node.forEach(visit);
                return;
            }
            
            // Traverse children based on type
            if (node.type === 'Program') visit(node.body);
            else if (node.body) visit(node.body);
            else if (node.thenBranch) { visit(node.thenBranch); visit(node.elseBranch); }
            else if (node.cases) { visit(node.cases); visit(node.defaultCase); }
            
            if (node.type === 'Label') {
                labelMap[node.name.toLowerCase()] = dataList.length;
            } else if (node.type === 'DataStatement') {
                node.values.forEach(v => {
                    dataList.push(this.visitExpression(v));
                });
            }
        };
        visit(ast);
        return { dataList, labelMap };
    }

    scanForVariables(nodes) {
        const vars = new Set();
        const scan = (nodeList) => {
            if (!nodeList) return;
            for (const node of nodeList) {
                if (node.type === 'Assignment') {
                    vars.add(this.cleanName(node.variable));
                } else if (node.type === 'GlobalStatement' || node.type === 'LocalStatement') {
                    vars.add(this.cleanName(node.variable));
                } else if (node.type === 'DimStatement') {
                    vars.add(this.cleanName(node.name));
                } else if (node.type === 'ReadStatement') {
                    for (const v of node.variables) {
                        if (v.type === 'Variable') {
                            vars.add(this.cleanName(v.name));
                        }
                    }
                } else if (node.type === 'IfStatement') {
                    scan(node.thenBranch);
                    scan(node.elseBranch);
                } else if (node.type === 'SelectStatement') {
                    for (const c of node.cases) {
                        scan(c.body);
                    }
                    if (node.defaultCase) scan(node.defaultCase);
                } else if (node.type === 'ForStatement') {
                    vars.add(this.cleanName(node.variable));
                    scan(node.body);
                } else if (node.type === 'WhileStatement') {
                    scan(node.body);
                } else if (node.type === 'RepeatStatement') {
                    scan(node.body);
                } else if (node.type === 'ForEachStatement') {
                     vars.add(this.cleanName(node.variable));
                     scan(node.body);
                }
            }
        };
        scan(nodes);
        return vars;
    }

    generateBlock(statements) {
        if (!statements) return '';
        return statements.map(stmt => this.visit(stmt)).join('\n');
    }

    visit(node) {
        if (!node) return '';

        switch (node.type) {
            case 'CommandStatement': {
                const args = node.args.map(arg => this.visitExpression(arg)).join(', ');
                const argsArray = node.args.map(arg => this.visitExpression(arg));
                const config = this.getCommandConfig(node.command);
                
                const prefix = this.asyncCommands.has(node.command.toLowerCase()) ? 'await ' : '';

                if (config.type === 'unsupported') {
                    return '';
                }

                if (config.type === 'code') return `${this.getIndent()}${prefix}${config.target}`;

                const finalArgs = config.mapArgs ? config.mapArgs(argsArray) : argsArray;
                return `${this.getIndent()}${prefix}${config.target}(${finalArgs.join(', ')});`;
            }

            case 'FunctionCallStatement': {
                const prefix = this.asyncUserFunctions.has(node.name.toLowerCase()) ? 'await ' : '';
                const args = node.args.map(arg => this.visitExpression(arg));
                return `${this.getIndent()}${prefix}${this.cleanName(node.name)}(${args.join(', ')});`;
            }

            case 'Assignment': {
                const cleanVar = this.cleanName(node.variable);
                if (this.variables.has(cleanVar)) {
                    return `${this.getIndent()}${cleanVar} = ${this.visitExpression(node.value)};`;
                } else {
                    this.variables.add(cleanVar);
                    return `${this.getIndent()}var ${cleanVar} = ${this.visitExpression(node.value)};`;
                }
            }

            case 'GlobalStatement': {
                const cleanVar = this.cleanName(node.variable);
                if (!this.variables.has(cleanVar)) this.variables.add(cleanVar);
                const val = node.value ? this.visitExpression(node.value) : '0';
                return `${this.getIndent()}${cleanVar} = ${val};`;
            }

            case 'ConstStatement':
                return '';

            case 'DataStatement':
                return '';

            case 'Comment':
                return `${this.getIndent()}// ${node.value}`;

            case 'ReadStatement': {
                let code = '';
                for (const v of node.variables) {
                    const valExpr = `_DATA[_dataPtr++]`;
                    if (v.type === 'Variable') {
                        const cleanVar = this.cleanName(v.name);
                        if (this.variables.has(cleanVar)) {
                            code += `${this.getIndent()}${cleanVar} = ${valExpr};\n`;
                        } else {
                            // Should have been declared, but if not, assume var
                            code += `${this.getIndent()}${cleanVar} = ${valExpr};\n`;
                        }
                    } else if (v.type === 'ArrayAccess') {
                        const indices = v.indices.map(idx => `[${this.visitExpression(idx)}]`).join('');
                        code += `${this.getIndent()}${this.cleanName(v.name)}${indices} = ${valExpr};\n`;
                    }
                    // FieldAccess could be added here
                }
                return code.trim();
            }

            case 'RestoreStatement':
                return `${this.getIndent()}_dataPtr = _LABELS['${node.label.toLowerCase()}'] || 0;`;

            case 'ExitStatement':
                return `${this.getIndent()}break;`;

            case 'LocalStatement': {
                const cleanVar = this.cleanName(node.variable);
                const val = node.value ? this.visitExpression(node.value) : '0';
                if (this.isInsideFunction) {
                    this.variables.add(cleanVar);
                    return `${this.getIndent()}var ${cleanVar} = ${val};`;
                } else {
                    if (!this.variables.has(cleanVar)) this.variables.add(cleanVar);
                    return `${this.getIndent()}${cleanVar} = ${val};`;
                }
            }

            case 'DimStatement': {
                const cleanName = this.cleanName(node.name);
                if (!this.variables.has(cleanName)) this.variables.add(cleanName);
                
                const dims = node.dimensions.map(d => this.visitExpression(d)); // Note: Expressions inside Dim usually sync
                let fillVal = '0';
                if (node.name.endsWith('$')) fillVal = '""';
                
                const createArray = (dimensions) => {
                    if (dimensions.length === 0) return fillVal;
                    const currentDim = dimensions[0];
                    const remaining = dimensions.slice(1);
                    
                    if (remaining.length === 0) {
                        return `new Array(${currentDim} + 1).fill(${fillVal})`;
                    } else {
                        return `Array.from({ length: ${currentDim} + 1 }, () => ${createArray(remaining)})`;
                    }
                };

                return `${this.getIndent()}${cleanName} = ${createArray(dims)};`;
            }

            case 'ArrayAssignment': {
                const indices = node.indices.map(idx => `[${this.visitExpression(idx)}]`).join('');
                return `${this.getIndent()}${this.cleanName(node.variable)}${indices} = ${this.visitExpression(node.value)};`;
            }

            case 'FieldAssignment': {
                const obj = this.visitExpression(node.object);
                const field = this.cleanName(node.field);
                return `${this.getIndent()}${obj}.${field} = ${this.visitExpression(node.value)};`;
            }

            case 'IfStatement': {
                let ifCode = `${this.getIndent()}if (${this.visitExpression(node.condition)}) {\n`;
                this.indent++;
                ifCode += this.generateBlock(node.thenBranch) + '\n';
                this.indent--;
                ifCode += `${this.getIndent()}}`;
                
                if (node.elseBranch) {
                    ifCode += ` else {\n`;
                    this.indent++;
                    ifCode += this.generateBlock(node.elseBranch) + '\n';
                    this.indent--;
                    ifCode += `${this.getIndent()}}`;
                }
                return ifCode;
            }

            case 'SelectStatement': {
                const expr = this.visitExpression(node.expression);
                let js = `${this.getIndent()}switch (${expr}) {\n`;
                
                this.indent++;
                
                for (const c of node.cases) {
                    for (const caseExpr of c.expressions) {
                        js += `${this.getIndent()}case ${this.visitExpression(caseExpr)}:\n`;
                    }
                    this.indent++;
                    if (c.body && c.body.length > 0) {
                        js += this.generateBlock(c.body) + '\n';
                    }
                    js += `${this.getIndent()}break;\n`;
                    this.indent--;
                }

                if (node.defaultCase) {
                    js += `${this.getIndent()}default:\n`;
                    this.indent++;
                    if (node.defaultCase.length > 0) {
                        js += this.generateBlock(node.defaultCase) + '\n';
                    }
                    js += `${this.getIndent()}break;\n`;
                    this.indent--;
                }

                this.indent--;
                js += `${this.getIndent()}}`;
                return js;
            }

            case 'ForStatement': {
                const v = this.cleanName(node.variable);
                const start = this.visitExpression(node.start);
                const end = this.visitExpression(node.end);
                const stepNode = node.step;
                const step = stepNode ? this.visitExpression(stepNode) : '1';
                
                let initPart;
                if (this.variables.has(v)) {
                    initPart = `${v} = ${start}`;
                } else {
                    this.variables.add(v);
                    initPart = `var ${v} = ${start}`;
                }

                let condition;
                if (!stepNode) {
                    condition = `${v} <= ${end}`;
                } else if (stepNode.type === 'Literal' && stepNode.valueType === 'number') {
                    condition = parseFloat(stepNode.value) >= 0 ? `${v} <= ${end}` : `${v} >= ${end}`;
                } else {
                    condition = `(${step} >= 0 ? ${v} <= ${end} : ${v} >= ${end})`;
                }
                
                let forCode = `${this.getIndent()}for (${initPart}; ${condition}; ${v} += ${step}) {\n`;
                this.indent++;
                forCode += this.generateBlock(node.body) + '\n';
                this.indent--;
                forCode += `${this.getIndent()}}`;
                return forCode;
            }

            case 'ForEachStatement': {
                const v = this.cleanName(node.variable);
                const type = this.cleanName(node.typeName);
                
                let loopVar = this.variables.has(v) || this.globals.has(v) ? v : `var ${v}`;
                if (!this.variables.has(v)) this.variables.add(v);

                let forCode = `${this.getIndent()}for (${loopVar} of ${type}.list) {\n`;
                this.indent++;
                forCode += this.generateBlock(node.body) + '\n';
                this.indent--;
                forCode += `${this.getIndent()}}`;
                return forCode;
            }

            case 'WhileStatement': {
                let whileCode = `${this.getIndent()}while (${this.visitExpression(node.condition)}) {\n`;
                this.indent++;
                whileCode += this.generateBlock(node.body) + '\n';
                this.indent--;
                whileCode += `${this.getIndent()}}`;
                return whileCode;
            }

            case 'RepeatStatement': {
                let condition = 'true';
                if (node.loopType === 'Until') {
                    condition = `!(${this.visitExpression(node.condition)})`;
                }
                
                let repeatCode = `${this.getIndent()}do {\n`;
                this.indent++;
                repeatCode += this.generateBlock(node.body) + '\n';
                this.indent--;
                repeatCode += `${this.getIndent()}} while (${condition});`;
                return repeatCode;
            }

            case 'FunctionDeclaration': {
                const oldVars = new Set(this.variables);
                const oldInFunc = this.isInsideFunction;
                this.variables = new Set(this.globals);
                this.isInsideFunction = true;
                // TODO: Detect if function needs to be async (contains async calls)
                const params = node.parameters.map(p => this.cleanName(p.name)).join(', ');
                node.parameters.forEach(p => this.variables.add(this.cleanName(p.name)));

                let funcCode = `${this.getIndent()}${node.isAsync ? 'async ' : ''}function ${this.cleanName(node.name)}(${params}) {\n`;
                this.indent++;
                funcCode += this.generateBlock(node.body) + '\n';
                this.indent--;
                funcCode += `${this.getIndent()}}`;
                
                this.variables = oldVars; // Restore scope
                this.isInsideFunction = oldInFunc;
                return funcCode;
            }

            case 'TypeDeclaration': {
                const fields = node.fields.map(f => `this.${this.cleanName(f.name)} = ${f.name.endsWith('$') ? "''" : '0'};`).join(' ');
                const name = this.cleanName(node.name);
                return `${this.getIndent()}class ${name} { constructor() { ${fields} ${name}.list.push(this); } }\n${this.getIndent()}${name}.list = [];`;
            }

            case 'InsertStatement': {
                const obj = this.visitExpression(node.object);
                const target = this.visitExpression(node.target);
                return `${this.getIndent()}$.rtl.insert(${obj}, ${target}, ${node.isBefore});`;
            }

            case 'ReturnStatement': {
                if (node.value) {
                    return `${this.getIndent()}return ${this.visitExpression(node.value)};`;
                }
                return `${this.getIndent()}return;`;
            }

            case 'EndStatement':
                return '';

            case 'GotoStatement':
                return '';

            case 'GosubStatement':
                return '';

            case 'Label':
                return '';

            default:
                return '';
        }
    }

    visitExpression(node) {
        if (!node) return '';

        switch (node.type) {
            case 'BinaryExpression':
                let op = node.operator;
                if (op === '=') op = '===';
                if (op === '<>') op = '!==';
                if (op === 'and') op = '&&';
                if (op === 'or') op = '||';
                if (op === 'mod') op = '%';
                return `${this.visitExpression(node.left)} ${op} ${this.visitExpression(node.right)}`;

            case 'UnaryExpression':
                let uOp = node.operator;
                if (uOp === 'not') uOp = '!';
                return `${uOp}(${this.visitExpression(node.right)})`;

            case 'FunctionCall':
                const argsArray = node.args.map(arg => this.visitExpression(arg));
                const config = this.getCommandConfig(node.name);
                const prefix = (this.asyncCommands.has(node.name.toLowerCase()) || this.asyncUserFunctions.has(node.name.toLowerCase())) ? 'await ' : '';

                if (config.type === 'property') return config.target;

                const finalArgs = config.mapArgs ? config.mapArgs(argsArray) : argsArray;
                return `${prefix}${config.target}(${finalArgs.join(', ')})`;

            case 'NewExpression':
                return `new ${this.cleanName(node.typeName)}()`;

            case 'FieldAccess':
                return `${this.visitExpression(node.object)}.${this.cleanName(node.field)}`;

            case 'ArrayAccess':
                const idxs = node.indices.map(idx => `[${this.visitExpression(idx)}]`).join('');
                return `${this.cleanName(node.name)}${idxs}`;

            case 'Literal':
                if (node.valueType === 'string') return `\`${node.value.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\``;
                if (node.valueType === 'null') return 'null';
                return node.value;

            case 'Variable':
                return this.cleanName(node.name);

            case 'Grouping':
                return `(${this.visitExpression(node.expression)})`;

            case 'Error':
                return `null`;

            default:
                return `null`;
        }
    }

    getIndent() {
        return '    '.repeat(this.indent);
    }

    cleanName(name) {
        if (!name) return name;
        let cleaned = name;
        if (!/[%#$]$/.test(cleaned)) cleaned += '%';
        return cleaned.replace(/%/g, '_i').replace(/#/g, '_f').replace(/\$/g, '_s');
    }

    /**
     * Resolves the command mapping, handling both simple strings and complex objects.
     */
    getCommandConfig(name) {
        const lower = name.toLowerCase();
        const entry = commandMap[lower];
        
        if (!entry) return { target: this.cleanName(name), type: 'function' };
        
        if (typeof entry === 'string') {
            return { target: entry, type: 'function' };
        }
        
        return {
            target: entry.target,
            type: entry.type || 'function',
            mapArgs: entry.mapArgs
        };
    }

    /**
     * Helper to detect if a statement block contains a 'Flip' command
     */
    hasFlip(node) {
        if (!node) return false;
        if (node.type === 'CommandStatement' && node.command.toLowerCase() === 'flip') return true;
        if (Array.isArray(node)) return node.some(n => this.hasFlip(n));
        if (node.body) return this.hasFlip(node.body);
        if (node.thenBranch) return this.hasFlip(node.thenBranch) || this.hasFlip(node.elseBranch);
        if (node.elseBranch) return this.hasFlip(node.elseBranch);
        if (node.cases) return node.cases.some(c => this.hasFlip(c.body));
        if (node.defaultCase) return this.hasFlip(node.defaultCase);
        return false;
    }
}
