import { Lexer } from './modules/lexer.js';
import { Parser } from './modules/parser.js';
import { CodeGenerator } from './modules/codegenerator.js';
import { Preprocessor } from './modules/preprocessor.js';

export class Compiler {
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
		try {
			source = await this.preprocessor.process(source, vfs);
		} catch (e) {
			console.error("Preprocessing failed:", e);
		}

		// 2. Lexing
		this.lexer.setInput(source);
		this.errors = [];
		this.output = this.lexer.tokenize();
		this.errors = this.lexer.errors;

		// 3. Parsing
		const ast = this.parser.parse(this.output);

		// Merge Parser Errors (Type checks etc.)
		if (this.parser.errors && this.parser.errors.length > 0) {
			this.errors = this.errors.concat(this.parser.errors);
		}

		// 4. Code Generation
		let jsCode = this.generator.generate(ast);
		this.lastJsCode = jsCode;

		return {
			jsCode,
			errors: this.errors,
			ast
		};
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
