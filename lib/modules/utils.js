import { VFS } from "./vfs.js";
import { ErrorHandler } from "./error.js";

/**
 * Utility class for loading files and managing types.
 */
export class Utils{
    /**
     * Enum for supported file types.
     * @readonly
     * @enum {string}
     */
    static TYPES = {
        IMAGE : "image",
        TEXT : "text",
        FONT : "font",
        SOUND : "sound",
        AUDIO : "audio",
        JSON : "json"
    }

    /**
     * Initializes the Utils module and the Virtual File System.
     */
    constructor(){
        this.error = new ErrorHandler();
        this.vfs = new VFS(this.error);
    }

    /**
     * Loads a file from a path, handling different file types and the VFS overlay.
     * @param {string} path The path to the file.
     * @param {string} [loadAs=Utils.TYPES.JSON] The type of content to load.
     * @returns {Promise<any>} The loaded data.
     */
    async loadFile(path, loadAs = Utils.TYPES.JSON){
        // Ensure VFS is initialized
        await this.vfs.ready;

        // VFS Overlay: Check if the file exists in the virtual file system.
        const resolved = this.vfs.resolvePath(path);
        if(resolved && resolved.node && resolved.node.type === 'file'){
            const content = await this.vfs.readFile(path);
            if(content !== undefined && content !== null){
                if(loadAs === Utils.TYPES.JSON){
                    try{
                        const text = (content instanceof Blob) ? await content.text() : content;
                        return JSON.parse(text);
                    }catch(e){
                        this.error.warn(`Bonobo VFS: Error parsing JSON from ${path} - ${e}`);
                    }
                }else{
                    return content;
                }
            }
        }

        let response = await fetch(path);
        if(response.ok && !path.includes("://")){
            // Mirror the existence of this file in the VFS structure
            this.vfs.touch(path).catch(e => {
                this.error.warn(`VFS Touch failed for ${path}: ${e}`);
            });
        }
        let data = null;

        switch(loadAs){
            case Utils.TYPES.JSON:
                data = await response.json();
                break;
            case Utils.TYPES.IMAGE:
                data = await response.blob();
                break;
            case Utils.TYPES.SOUND:
            case Utils.TYPES.AUDIO:
            case Utils.TYPES.FONT:
                data = await response.arrayBuffer();
                break;
            default:
                data = await response.text();
                break;
        }

        return data;
    }    
}