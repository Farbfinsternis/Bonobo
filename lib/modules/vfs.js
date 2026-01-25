const VFS_STORAGE_KEY = 'Bonobo_FileSystem';

/**
 * Virtual File System that persists data to localStorage.
 */
export class VFS{
    #vfs;

    constructor(errorHandler){
        this.errorHandler = errorHandler;
        this.#loadVFS();
    }

    #loadVFS() {
        const storedVFS = localStorage.getItem(VFS_STORAGE_KEY);
        if (storedVFS) {
            try {
                this.#vfs = JSON.parse(storedVFS);
            } catch (e) {
                if(this.errorHandler) this.errorHandler.error(`Bonobo FileSystem: Could not parse VFS from localStorage. Resetting. ${e}`);
                this.#createDefaultVFS();
            }
        } else {
            this.#createDefaultVFS();
        }
    }

    /**
     * Saves the current state of the VFS to localStorage.
     */
    save() {
        try {
            localStorage.setItem(VFS_STORAGE_KEY, JSON.stringify(this.#vfs));
        } catch (e) {
            if(this.errorHandler) this.errorHandler.error(`Bonobo FileSystem: Could not save VFS to localStorage (storage might be full). ${e}`);
        }
    }

    #createDefaultVFS() {
        this.#vfs = {
            type: 'directory',
            name: '/',
            children: {}
        };
        this.save();
    }

    /**
     * Resolves a path string to a node in the VFS.
     * @param {string} rawPath The path to resolve.
     * @param {string} [currentDir='/'] The current working directory.
     * @param {boolean} [createParents=false] Whether to create missing parent directories.
     * @returns {object|null} The resolved node info or null.
     */
    resolvePath(rawPath, currentDir = '/', createParents = false) {
        const initialParts = rawPath.startsWith('/') ? [] : currentDir.split('/').filter(p => p);
        const relativeParts = rawPath.split('/');

        for (const part of relativeParts) {
            if (part === '..') {
                initialParts.pop();
            } else if (part !== '.' && part !== '') {
                initialParts.push(part);
            }
        }
        const resolvedParts = initialParts;

        let currentNode = this.#vfs;
        let parentNode = null;

        for (let i = 0; i < resolvedParts.length; i++) {
            const part = resolvedParts[i];
            if (currentNode.type !== 'directory') {
                return null; // Can't traverse through a file
            }

            if (!currentNode.children[part]) {
                if (createParents && i < resolvedParts.length - 1) { // Create intermediate directory
                    currentNode.children[part] = { type: 'directory', name: part, children: {} };
                } else {
                    return { node: null, parent: currentNode, name: part, resolvedParts: resolvedParts };
                }
            }

            parentNode = currentNode;
            currentNode = currentNode.children[part];
        }

        return { node: currentNode, parent: parentNode, name: resolvedParts[resolvedParts.length - 1] || '/', resolvedParts: resolvedParts };
    }
}