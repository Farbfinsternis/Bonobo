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
		this.jsOutputElement = document.getElementById("js-code");
		this.gameFrame = document.getElementById("game-frame");
		this.init();
	}

	init() {
		document.getElementById("source").addEventListener("input", (e) => {
			this.compile(e.target.value);
		});
		// Initial compile
		this.compile(document.getElementById("source").value);
	}

	async compile(source) {
		// 1. Preprocessing (Includes auflösen)
		try {
			source = await this.preprocessor.process(source);
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
		const jsCode = this.generator.generate(ast);

		// Display JS
		this.jsOutputElement.value = jsCode;

		if (this.errors.length > 0) {
			console.error(this.errors);
			// Optional: Show errors in UI
			return;
		}

		// Run in Iframe
		this.run(jsCode);
	}

	run(jsCode) {
		const html = `
			<!DOCTYPE html>
			<html>
			<head>
				<style>body { margin: 0; overflow: hidden; background: #000; }</style>
			</head>
			<body>
				<script type="module">
					${jsCode}
				</script>
			</body>
			</html>
		`;
		this.gameFrame.srcdoc = html;
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const compiler = new Compiler();
});
