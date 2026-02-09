import { Lexer } from './modules/lexer.js';
import { Parser } from './modules/parser.js';
import { CodeGenerator } from './modules/codegenerator.js';
import { Preprocessor } from './modules/preprocessor.js';

export class Compiler {
	static VERSION = "0.4.0";

	constructor() {
		this.lexer = new Lexer("");
		this.parser = new Parser();
		this.generator = new CodeGenerator();
		this.preprocessor = new Preprocessor();
		this.output = [];
		this.errors = [];
		this.lastJsCode = '';
	}

	async compile(source, vfs = {}) {
		this.errors = [];
		try {
			source = await this.preprocessor.process(source, vfs);

			// 2. Lexing
			this.lexer.setInput(source);
			this.output = this.lexer.tokenize();
			this.errors = this.lexer.errors || [];

			// 3. Parsing
			const ast = this.parser.parse(this.output);

			// 4. Transformation / Hoisting Pass
			this.parser.hoist(ast);
			
			// 5. Async Analysis
			if (typeof this.parser.analyzeAsync === 'function') {
				this.parser.analyzeAsync(ast);
			}

			// Merge Parser Errors
			if (this.parser.errors && this.parser.errors.length > 0) {
				this.errors = this.errors.concat(this.parser.errors);
			}

			// 6. Code Generation
			let jsCode = this.generator.generate(ast);
			this.lastJsCode = jsCode;

			return {
				jsCode,
				errors: this.errors,
				ast
			};
		} catch (err) {
			console.error("Compiler Internal Error:", err);
			return {
				jsCode: "",
				errors: [{ line: 0, value: "Internal Compiler Error: " + err.message }],
				ast: null
			};
		}
	}

	/**
	 * Gibt den zuletzt erfolgreich (oder versuchten) generierten Code zurück.
	 */
	getLastJsCode() {
		return this.lastJsCode;
	}

	/**
	 * Prüft, ob die letzte Kompilierung Fehler enthielt.
	 */
	hasErrors() {
		return this.errors.length > 0;
	}
}
