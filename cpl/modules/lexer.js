import { commandMap } from './command_map.js';

export class Lexer {
    /**
     * @param {string} input The source code to tokenize
     */
    constructor(input) {
        this.input = input || "";
        this.pos = 0;
        this.line = 1;
        this.col = 1;
        this.length = this.input.length;
        
        // BlitzBasic Keywords (Case Insensitive)
        this.keywords = new Set([
            "after", "and", "before", "case", "const", "data", "default", "delete", "dim", "each",
            "else", "elseif", "end", "endif", "exit", "field", "first", "for", "forever", "function",
            "global", "gosub", "goto", "if", "include", "insert", "last", "let", "local", "mod",
            "new", "next", "not", "null", "or", "read", "repeat", "restore", "return", "select",
            "shl", "shr", "step", "stop", "then", "to", "type", "until", "wend", "while", "xor",
            "true", "false", "pi"
        ]);

        this.commands = new Set(Object.keys(commandMap));
        this.errors = [];
    }

    /**
     * Resets the lexer with new input
     * @param {string} input 
     */
    setInput(input) {
        this.input = input;
        this.pos = 0;
        this.line = 1;
        this.col = 1;
        this.length = input.length;
        this.errors = [];
    }

    /**
     * Returns the next character without advancing
     */
    peek(offset = 0) {
        if (this.pos + offset >= this.length) return null;
        return this.input[this.pos + offset];
    }

    /**
     * Consumes and returns the next character
     */
    advance() {
        if (this.pos >= this.length) return null;
        const char = this.input[this.pos];
        this.pos++;
        if (char === '\n') {
            this.line++;
            this.col = 1;
        } else {
            this.col++;
        }
        return char;
    }

    /**
     * Checks if character is a whitespace (excluding newline)
     */
    isWhitespace(char) {
        return char === ' ' || char === '\t' || char === '\r';
    }

    /**
     * Checks if character is a letter
     */
    isAlpha(char) {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
    }

    /**
     * Checks if character is a digit
     */
    isDigit(char) {
        return char >= '0' && char <= '9';
    }

    /**
     * Checks if character is a hex digit
     */
    isHexDigit(char) {
        return this.isDigit(char) || (char >= 'a' && char <= 'f') || (char >= 'A' && char <= 'F');
    }

    /**
     * Main tokenization method
     * @returns {Array} List of tokens
     */
    tokenize() {
        const tokens = [];
        this.errors = [];

        while (this.pos < this.length) {
            const char = this.peek();

            // 1. Handle Whitespace
            if (this.isWhitespace(char)) {
                this.advance();
                continue;
            }

            // 2. Handle Newlines (Important for BlitzBasic statements)
            if (char === '\n') {
                tokens.push({ type: 'NEWLINE', value: '\n', line: this.line, col: this.col });
                this.advance();
                continue;
            }

            // 3. Handle Comments (; to end of line)
            if (char === ';') {
                const startCol = this.col;
                const startLine = this.line;
                this.advance(); // consume ;
                let value = '';
                while (this.peek() !== null && this.peek() !== '\n') {
                    value += this.advance();
                }
                tokens.push({ type: 'COMMENT', value: value.trim(), line: startLine, col: startCol });
                continue;
            }

            // 4. Handle Hex Numbers ($AABB)
            if (char === '$') {
                const startCol = this.col;
                const startLine = this.line;
                let value = this.advance(); // consume $
                
                // Consume hex digits
                while (this.peek() !== null && this.isHexDigit(this.peek())) {
                    value += this.advance();
                }

                tokens.push({ type: 'NUMBER_HEX', value, line: startLine, col: startCol });
                continue;
            }

            // 5. Handle Numbers (Integer and Float)
            // Case: Starts with digit OR starts with dot followed by digit (.5)
            if (this.isDigit(char) || (char === '.' && this.isDigit(this.peek(1)))) {
                const startCol = this.col;
                const startLine = this.line;
                let value = '';
                let isFloat = false;

                if (char === '.') {
                    isFloat = true;
                    value += this.advance();
                }

                while (this.peek() !== null) {
                    const c = this.peek();
                    if (this.isDigit(c)) {
                        value += this.advance();
                    } else if (c === '.' && !isFloat) {
                        isFloat = true;
                        value += this.advance();
                    } else {
                        break;
                    }
                }
                
                tokens.push({ type: isFloat ? 'NUMBER_FLOAT' : 'NUMBER_INT', value, line: startLine, col: startCol });
                continue;
            }

            // 6. Handle Identifiers, Keywords and Commands
            if (this.isAlpha(char)) {
                const startCol = this.col;
                const startLine = this.line;
                let value = '';

                while (this.peek() !== null && (this.isAlpha(this.peek()) || this.isDigit(this.peek()))) {
                    value += this.advance();
                }

                // Check for Type Suffixes (%, #, $)
                const nextChar = this.peek();
                if (nextChar === '%' || nextChar === '#' || nextChar === '$') {
                    value += this.advance();
                }

                const lowerValue = value.toLowerCase();
                if (this.keywords.has(lowerValue)) {
                    tokens.push({ type: 'KEYWORD', value: lowerValue, original: value, line: startLine, col: startCol });
                } else if (this.commands.has(lowerValue)) {
                    tokens.push({ type: 'COMMAND', value: lowerValue, original: value, line: startLine, col: startCol });
                } else {
                    tokens.push({ type: 'IDENTIFIER', value, line: startLine, col: startCol });
                }
                continue;
            }

            // 7. Handle Strings
            if (char === '"') {
                const startCol = this.col;
                const startLine = this.line;
                this.advance(); // consume opening quote
                let value = '';

                while (this.peek() !== null && this.peek() !== '"' && this.peek() !== '\n') {
                    value += this.advance();
                }

                if (this.peek() === '"') {
                    this.advance(); // consume closing quote
                } else {
                    // Error: Unterminated string
                    this.errors.push({ type: 'ERROR', value: "Unterminated string", line: this.line, col: this.col });
                }

                tokens.push({ type: 'STRING', value, line: startLine, col: startCol });
                continue;
            }

            // Handle Labels starting with . (e.g. .JumpLabel)
            if (char === '.' && this.isAlpha(this.peek(1))) {
                const startCol = this.col;
                const startLine = this.line;
                let value = this.advance(); // consume .
                
                while (this.peek() !== null && (this.isAlpha(this.peek()) || this.isDigit(this.peek()) || this.peek() === '_')) {
                    value += this.advance();
                }
                tokens.push({ type: 'LABEL', value, line: startLine, col: startCol });
                continue;
            }

            // 8. Handle Operators and Delimiters
            const startCol = this.col;
            const startLine = this.line;
            
            // Two-character operators
            const twoChar = char + (this.peek(1) || '');
            if (['<>', '<=', '>=', '..'].includes(twoChar)) {
                this.advance(); this.advance();
                tokens.push({ type: 'OPERATOR', value: twoChar, line: startLine, col: startCol });
                continue;
            }

            // Single-character operators
            // Note: '\' is used for Field access in BlitzBasic
            if ('+ - * / ^ = < > ( ) [ ] , : \\ .'.indexOf(char) !== -1) {
                this.advance();
                tokens.push({ type: 'OPERATOR', value: char, line: startLine, col: startCol });
                continue;
            }

            // 9. Unknown Character
            this.errors.push({ type: 'ERROR', value: `Unknown character '${char}'`, line: this.line, col: this.col });
            this.advance();
        }

        tokens.push({ type: 'EOF', value: '', line: this.line, col: this.col });
        return tokens;
    }
}
