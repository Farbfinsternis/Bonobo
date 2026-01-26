export class Files{
	/** @private @type {Array<object|null>} Handles for open files. Index 0 is unused. */
	#openFiles = [null];
	/** @private @type {Array<object|null>} Handles for open directories. Index 0 is unused. */
	#openDirs = [null];
	/** @private @type {string} Current working directory. */
	#currentDir = '/';
    #lastDirPrinted = null;
    #lastStructureVersion = -1;

    constructor(bonobo){
        this.bonobo = bonobo;
    }

    get vfs() {
        return this.bonobo.utils.vfs;
    }

	/**
	 * @private
	 * Finds the first available null slot in a handle array or creates a new one.
	 * @param {Array} handleArray The array to search for a free handle.
	 * @returns {number} The free handle index.
	 */
	#getFreeHandle(handleArray) {
		for (let i = 1; i < handleArray.length; i++) {
			if (handleArray[i] === null) {
				return i;
			}
		}
		return handleArray.push(null) - 1;
	}

	/**
	 * Opens a file for reading/writing. Creates the file if it doesn't exist.
	 * @param {string} path The path to the file.
	 * @returns {number} A file handle, or 0 on failure.
	 */
	async openFile(path) {
		const absPath = this.#getAbsolutePath(path);
		let content = '';

		// Check if file exists, if not create it
		if (!this.vfs.resolvePath(absPath)) {
			await this.vfs.writeFile(absPath, '');
		} else {
			const resolved = this.vfs.resolvePath(absPath);
			if (resolved.node.type !== 'file') return 0; // Path is a directory
			// Load content from IDB
			content = await this.vfs.readFile(absPath) || '';
		}

		const handle = this.#getFreeHandle(this.#openFiles);
		this.#openFiles[handle] = { path: absPath, content: content, pos: 0 };
		return handle;
	}

	/**
	 * Reads the next line from an open file.
	 * @param {number} handle The file handle returned by `openFile`.
	 * @returns {string} The content of the line, or an empty string if at the end of the file.
	 */
	readFile(handle) {
		const file = this.#openFiles[handle];
		if (!file || file.pos >= file.content.length) return '';

		const content = file.content;
		const newlineIndex = content.indexOf('\n', file.pos);

		let line;
		if (newlineIndex === -1) {
			line = content.substring(file.pos);
			file.pos = content.length; // End of file
		} else {
			line = content.substring(file.pos, newlineIndex);
			file.pos = newlineIndex + 1;
		}
		return line.replace('\r', ''); // Handle Windows line endings
	}

	/**
	 * Appends a line of text (with a newline character) to an open file.
	 * @param {number} handle The file handle.
	 * @param {string} text The text to write.
	 */
	async writeFile(handle, text) {
		const file = this.#openFiles[handle];
		if (!file) return;

		const textWithNewline = text + '\n';
		file.content += textWithNewline;
		file.pos = file.content.length;
		await this.vfs.writeFile(file.path, file.content);
	}

	/**
	 * Closes an open file handle.
	 * @param {number} handle The file handle to close.
	 */
	closeFile(handle) {
		if (this.#openFiles[handle]) {
			this.#openFiles[handle] = null;
		}
	}

	filePos(handle) {
		/**
		 * Gets the current read/write position in an open file.
		 * @param {number} handle The file handle.
		 * @returns {number} The current position (cursor) in the file.
		 */
		const file = this.#openFiles[handle];
		return file ? file.pos : 0;
	}

	/**
	 * Sets the read/write position for an open file.
	 * @param {number} handle The file handle.
	 * @param {number} pos The new position to seek to.
	 */
	seekFile(handle, pos) {
		const file = this.#openFiles[handle];
		if (file) {
			file.pos = Math.max(0, Math.min(pos, file.content.length));
		}
	}

	/**
	 * Checks if the end of an open file has been reached.
	 * @param {number} handle The file handle.
	 * @returns {boolean} True if the file cursor is at or beyond the end of the file.
	 */
	eof(handle) {
		const file = this.#openFiles[handle];
		return !file || file.pos >= file.content.length;
	}

	/**
	 * Opens a directory for reading its contents.
	 * @param {string} path The path to the directory.
	 * @returns {number} A directory handle, or 0 on failure.
	 */
	readDir(path) {
		const resolved = this.vfs.resolvePath(path, this.#currentDir);
		if (!resolved || !resolved.node || resolved.node.type !== 'directory') return 0;

		const handle = this.#getFreeHandle(this.#openDirs);
		this.#openDirs[handle] = {
			keys: Object.keys(resolved.node.children),
			index: 0
		};
		return handle;
	}

	/**
	 * Reads the next entry from an open directory handle.
	 * @param {number} handle The directory handle.
	 * @returns {string} The name of the next file or directory, or an empty string if no more entries exist.
	 */
	nextFile(handle) {
		const dir = this.#openDirs[handle];
		if (dir && dir.index < dir.keys.length) {
			return dir.keys[dir.index++];
		}
		return '';
	}

	closeDir(handle) {
		if (this.#openDirs[handle]) {
			this.#openDirs[handle] = null;
		}
	}

	currentDir() {
		return this.#currentDir;
	}

	changeDir(path) {
		const resolved = this.vfs.resolvePath(path, this.#currentDir);
		if (resolved && resolved.node && resolved.node.type === 'directory') {
			// Use the fully resolved, absolute path
			this.#currentDir = resolved.resolvedParts.length > 0 ? '/' + resolved.resolvedParts.join('/') : '/';
			return true;
		}
		return false;
	}

	async createDir(path) {
		const resolved = this.vfs.resolvePath(path, this.#currentDir, true);
		if (!resolved || !resolved.parent) return false;

		if (!resolved.node) {
			resolved.parent.children[resolved.name] = { type: 'directory', name: resolved.name, children: {} };
			await this.vfs.saveStructure();
			return true;
		}
		return resolved.node.type === 'directory'; // Return true if it already exists as a directory
	}

	/**
	 * Deletes an empty directory.
	 * @param {string} path The path of the directory to delete.
	 * @returns {boolean} True on success, false if the directory is not found or not empty.
	 */
	async deleteDir(path) {
		const resolved = this.vfs.resolvePath(path, this.#currentDir);
		if (resolved && resolved.node && resolved.node.type === 'directory' && resolved.parent) {
			if (Object.keys(resolved.node.children).length > 0) {
				return false; // Directory not empty
			}
			delete resolved.parent.children[resolved.name];
			await this.vfs.saveStructure();
			return true;
		}
		return false;
	}

	/**
	 * Determines the type of a path.
	 * @param {string} path The path to check.
	 * @returns {number} 0 for not found, 1 for a file, 2 for a directory.
	 */
	fileType(path) {
		const resolved = this.vfs.resolvePath(path, this.#currentDir);
		if (!resolved || !resolved.node) return 0; // Not found
		if (resolved.node.type === 'file') return 1;
		if (resolved.node.type === 'directory') return 2;
		return 0;
	}

	/**
	 * Gets the size of a file in bytes.
	 * @param {string} path The path to the file.
	 * @returns {number} The size of the file, or 0 if not found or it's a directory.
	 */
	async fileSize(path) {
		const absPath = this.#getAbsolutePath(path);
		const content = await this.vfs.readFile(absPath);
		if (content !== null && content !== undefined) {
			return content.length || 0;
		}
		return 0;
	}

	/**
	 * Copies a file from a source path to a destination path.
	 * @param {string} sourcePath The path of the file to copy.
	 * @param {string} destPath The destination path for the new file.
	 * @returns {boolean} True on success, false on failure.
	 */
	async copyFile(sourcePath, destPath) {
		const absSource = this.#getAbsolutePath(sourcePath);
		const absDest = this.#getAbsolutePath(destPath);

		const content = await this.vfs.readFile(absSource);
		if (content === null) return false;
		
		// Write to new location (handles structure update automatically)
		await this.vfs.writeFile(absDest, content);
		return true;
	}

	/**
	 * Deletes a file.
	 * @param {string} path The path of the file to delete.
	 * @returns {boolean} True on success, false if the file is not found or is currently open.
	 */
	async deleteFile(path) {
		const absPath = this.#getAbsolutePath(path);
		const resolved = this.vfs.resolvePath(absPath);
		if (resolved && resolved.node && resolved.parent && resolved.node.type === 'file') {
			for (const fileHandle of this.#openFiles) {
				if (fileHandle && fileHandle.path === absPath) {
					this.bonobo.utils.error.error(`Bonobo FileSystem: Cannot delete file "${path}" because it is currently open.`);
					return false;
				}
			}
			await this.vfs.deleteFile(absPath);
			return true;
		}
		return false;
	}

	/**
	 * Loads a JSON file and returns the parsed object.
	 * @param {string} path The path to the JSON file.
	 * @returns {any} The parsed JSON data or null if failed.
	 */
	async loadJSON(path) {
		const absPath = this.#getAbsolutePath(path);
		const content = await this.vfs.readFile(absPath);
		if (content) {
			try {
				return JSON.parse(content);
			} catch (e) {
				this.bonobo.utils.error.error(`Bonobo FileSystem: Invalid JSON in "${path}". ${e}`);
			}
		}
		return null;
	}

	/**
	 * Saves data to a JSON file.
	 * @param {string} path The path to the file.
	 * @param {any} data The data to serialize and save.
	 * @returns {boolean} True on success, false on failure.
	 */
	async saveJSON(path, data) {
		try {
			const jsonString = JSON.stringify(data);
			const absPath = this.#getAbsolutePath(path);
			// Check if directory exists? vfs.writeFile handles structure creation if parents exist
			await this.vfs.writeFile(absPath, jsonString);
			return true;
		} catch (e) {
			this.bonobo.utils.error.error(`Bonobo FileSystem: Could not save JSON to "${path}". ${e}`);
			return false;
		}
	}

	/**
	 * Lists the directory structure to the browser console.
	 * Emulates a tree view of the current working directory.
	 * Files from the real file system (server) are listed in blue ("real"),
	 * while files persisted in IndexedDB are listed in orange ("virtual").
	 */
	dir() {
        if (this.#lastDirPrinted === this.#currentDir && this.#lastStructureVersion === this.vfs.structureVersion) {
            return;
        }
        this.#lastDirPrinted = this.#currentDir;
        this.#lastStructureVersion = this.vfs.structureVersion;

		const resolved = this.vfs.resolvePath(this.#currentDir);
		if (!resolved || !resolved.node || resolved.node.type !== 'directory') {
			console.log(`Directory not found: ${this.#currentDir}`);
			return;
		}

		const dbName = this.vfs.dbName;
		let displayPath = this.#currentDir;
		if (displayPath === '/') {
			displayPath = `/${dbName}/`;
		} else {
			displayPath = `/${dbName}${displayPath}`;
		}

		console.group(`Directory listing for ${displayPath}`);
		this.#printTree(resolved.node);
		console.groupEnd();
	}

	#printTree(node) {
		const children = node.children || {};
		const keys = Object.keys(children).sort();

		for (const key of keys) {
			const child = children[key];
			if (child.type === 'directory') {
				console.groupCollapsed(key);
				this.#printTree(child);
				console.groupEnd();
			} else {
				let style = 'color: inherit';
				if(child.origin === 'real') style = 'color: #29b6f6'; // Light Blue
				if(child.origin === 'virtual') style = 'color: #ffa726'; // Orange
				console.log(`%c${key}`, style);
			}
		}
	}

	/**
	 * Checks if a file exists at the given path.
	 * @param {string} path The path to check.
	 * @returns {boolean} True if a file exists, false otherwise.
	 */
	fileExists(path) {
		return this.fileType(path) === 1;
	}

	/**
	 * Helper to resolve a path to an absolute path string based on current dir.
	 * @private
	 */
	#getAbsolutePath(path) {
		const resolved = this.vfs.resolvePath(path, this.#currentDir);
		return resolved ? '/' + resolved.resolvedParts.join('/') : path;
	}
}