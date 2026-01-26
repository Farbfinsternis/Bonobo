const DB_VERSION = 1;
const STORE_STRUCTURE = 'structure';
const STORE_FILES = 'files';

/**
 * Virtual File System that persists data to IndexedDB.
 */
export class VFS{
    #vfs;
    #db;
    structureVersion = 0;
    dbName = 'Bonobo_FileSystem';

    constructor(errorHandler){
        this.errorHandler = errorHandler;
        this.#vfs = { type: 'directory', name: '/', children: {} };
        this.structureVersion = 0;
        this.ready = this.#init();
    }

    /**
     * Sets the database name and re-initializes the VFS.
     * @param {string} name 
     */
    async setDBName(name){
        if(this.#db) this.#db.close();
        this.dbName = name;
        this.ready = this.#init();
        await this.ready;
    }

    async #init() {
        if (!window.indexedDB) {
            this.errorHandler?.error("IndexedDB not supported.");
            return;
        }
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, DB_VERSION);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_STRUCTURE)) db.createObjectStore(STORE_STRUCTURE);
                if (!db.objectStoreNames.contains(STORE_FILES)) db.createObjectStore(STORE_FILES);
            };

            request.onsuccess = async (event) => {
                const db = event.target.result;
                if(db.name !== this.dbName){
                    db.close();
                    resolve(); // Resolve anyway to prevent hanging promises on DB switch
                    return;
                }
                this.#db = db;
                await this.#loadStructure();
                resolve();
            };

            request.onerror = (event) => {
                this.errorHandler?.error(`VFS IDB Error: ${event.target.error}`);
                resolve(); // Resolve anyway to allow fallback
            };
        });
    }

    async #loadStructure() {
        return new Promise((resolve) => {
            const tx = this.#db.transaction([STORE_STRUCTURE], 'readonly');
            const req = tx.objectStore(STORE_STRUCTURE).get('root');
            req.onsuccess = () => {
                if (req.result) this.#vfs = req.result;
                this.structureVersion++; // Force update notification so dir() picks up the new structure
                resolve();
            };
            req.onerror = () => {
                this.#createDefaultVFS();
                resolve();
            };
        });
    }

    /**
     * Saves the current structure of the VFS to IndexedDB.
     */
    save() {
        this.saveStructure().catch(e => {
            if(this.errorHandler) this.errorHandler.error(`Bonobo FileSystem: Could not save VFS structure. ${e}`);
        });
    }

    /**
     * Persists the directory structure to the database.
     * @returns {Promise<void>}
     */
    async saveStructure() {
        this.structureVersion++;
        if (!this.#db) return;
        const tx = this.#db.transaction([STORE_STRUCTURE], 'readwrite');
        tx.objectStore(STORE_STRUCTURE).put(this.#vfs, 'root');
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    #createDefaultVFS() {
        this.#vfs = { type: 'directory', name: '/', children: {} };
        this.saveStructure();
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

    /**
     * Reads file content from IndexedDB.
     * @param {string} path 
     */
    async readFile(path) {
        await this.ready;
        const resolved = this.resolvePath(path);
        if (!resolved || !resolved.node || resolved.node.type !== 'file') return null;

        return new Promise((resolve, reject) => {
            const tx = this.#db.transaction([STORE_FILES], 'readonly');
            const req = tx.objectStore(STORE_FILES).get(path);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Writes file content to IndexedDB and updates structure.
     * @param {string} path 
     * @param {any} content 
     */
    async writeFile(path, content) {
        await this.ready;
        let resolved = this.resolvePath(path, '/', true);
        
        if (!resolved.node) {
            resolved.parent.children[resolved.name] = { type: 'file', name: resolved.name, origin: 'virtual' };
            this.structureVersion++;
        } else if (resolved.node.type === 'directory') {
            throw new Error(`Path ${path} is a directory.`);
        } else {
            resolved.node.origin = 'virtual';
            this.structureVersion++;
        }

        const tx = this.#db.transaction([STORE_FILES, STORE_STRUCTURE], 'readwrite');
        tx.objectStore(STORE_FILES).put(content, path);
        tx.objectStore(STORE_STRUCTURE).put(this.#vfs, 'root');
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    /**
     * Deletes a file from IndexedDB and updates structure.
     * @param {string} path 
     */
    async deleteFile(path) {
        await this.ready;
        const resolved = this.resolvePath(path);

        if (!resolved || !resolved.node) {
            throw new Error(`File not found: ${path}`);
        }

        if (resolved.node.type === 'directory') {
            throw new Error(`Path ${path} is a directory.`);
        }

        delete resolved.parent.children[resolved.name];
        this.structureVersion++;

        const tx = this.#db.transaction([STORE_FILES, STORE_STRUCTURE], 'readwrite');
        tx.objectStore(STORE_FILES).delete(path);
        tx.objectStore(STORE_STRUCTURE).put(this.#vfs, 'root');

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    /**
     * Ensures a file entry exists in the VFS structure without writing content.
     * Useful for mirroring real file system paths that are loaded via fetch.
     * @param {string} path 
     */
    async touch(path) {
        await this.ready;
        let resolved = this.resolvePath(path, '/', true);
        
        if (!resolved.node) {
            resolved.parent.children[resolved.name] = { type: 'file', name: resolved.name, origin: 'real' };
            this.structureVersion++;
            return this.saveStructure();
        } else if (resolved.node.type === 'directory') {
            throw new Error(`Path ${path} is a directory.`);
        } else {
            if(resolved.node.origin !== 'real'){
                resolved.node.origin = 'real';
                this.structureVersion++;
                return this.saveStructure();
            }
        }
    }
}