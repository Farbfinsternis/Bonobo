export class Preprocessor {
    constructor() {
    }

    async process(source, rootPath = '') {
        const lines = source.split(/\r?\n/);
        let output = [];

        for (const line of lines) {
            const trimmed = line.trim();
            const commentIndex = trimmed.indexOf(';');
            
            if (/^include\s+"[^"]+"/i.test(trimmed)) {
                if (commentIndex === -1 || commentIndex > 0) {
                    const match = /include\s+"([^"]+)"/i.exec(trimmed);
                    if (match) {
                        const filename = match[1];
                        try {
                            const content = await this.loadFile(filename);
                            const processedContent = await this.process(content, rootPath);
                            output.push(`; --- Begin Include: ${filename} ---`);
                            output.push(processedContent);
                            output.push(`; --- End Include: ${filename} ---`);
                            continue;
                        } catch (e) {
                            console.error(`Preprocessor: Failed to load '${filename}'`, e);
                            output.push(`; Error including '${filename}': ${e.message}`);
                        }
                    }
                }
            }
            output.push(line);
        }
        return output.join('\n');
    }

    async loadFile(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
    }
}