import { Utils } from "./modules/utils.js"

/**
 * The main engine class that manages the game loop and DOM integration.
 */
export class Bonobo{
    /**
     * Current Framework Version.
     * - Major (x.0.0): Breaking Changes (API changes that break existing games).
     * - Minor (0.x.0): New Features (Backward compatible).
     * - Patch (0.0.x): Bug Fixes / Refactoring.
     */
    static VERSION = "0.4.0";

    /**
     * @param {object} gameObj The game instance containing the 'loop' method.
     */
    constructor(gameObj){
        console.log(`%cBonobo Engine v${Bonobo.VERSION}`, "color: #4caf50; font-weight: bold;");
		this.utils = new Utils();
        this.game = gameObj;
        this.setupDOM();
        this.plugins = [];
        this.gameLoop = this.gameLoop.bind(this);
    }

    /**
     * Checks if the current engine version meets the required version.
     * @param {string} required The required version string (e.g. "0.1.0").
     * @returns {boolean} True if current version is greater or equal.
     */
    static checkVersion(required){
        const current = Bonobo.VERSION.split('.').map(Number);
        const req = required.split('.').map(Number);
        
        for(let i=0; i<3; i++){
            if(current[i] > req[i]) return true;
            if(current[i] < req[i]) return false;
        }
        return true; // Equal
    }

    /**
     * Registers a plugin/module to be updated every frame.
     * @param {object} plugin The module instance (must implement an update() method).
     */
    register(plugin){
        this.plugins.push(plugin);
    }

    /**
     * Sets the application name.
     * Updates the browser title and sets the VFS database name (converted to camelCase).
     * IMPORTANT: This method must be called before loading any assets to ensure the correct database is used.
     * @param {string} title The title of the app (e.g. "My Cool Game").
     */
    appName(title){
        document.title = title;
        // Convert to camelCase for DB name (e.g. "My Cool Game" -> "myCoolGame")
        const dbName = title.toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
            
        this.utils.vfs.setDBName(dbName);
    }

    /**
     * Starts the game loop.
     */
	start(){
		this.gameLoop();
	}

    /**
     * The internal game loop, driven by requestAnimationFrame.
     * @private
     */
    gameLoop(){
        const result = this.game.loop();
        // Handle both sync and async loop functions
        Promise.resolve(result).then(() => {
            this.plugins.forEach(p => p.update && p.update());
            requestAnimationFrame(this.gameLoop);
        }).catch(err => {
            console.error("ApeShift Engine: Runtime Error in Loop", err);
        });
    }

    /**
     * Sets up the HTML DOM structure for the game (centering, removing margins).
     * @private
     */
    setupDOM(){
        // Basic Page Reset (No margins, no scrollbars)
        document.body.style.margin = "0";
        document.body.style.overflow = "hidden";
        document.body.style.backgroundColor = "#111";

        // Create a Flex-Container to center the game
        this.domContainer = document.createElement("div");
        this.domContainer.style.height = "100vh";
        this.domContainer.style.display = "flex";
        this.domContainer.style.justifyContent = "center";
        this.domContainer.style.alignItems = "center";
        document.body.appendChild(this.domContainer);
    }

    /**
     * Appends a canvas element to the game's DOM container.
     * @param {HTMLCanvasElement} canvasElement 
     */
	canvasToDOM(canvasElement){
		this.domContainer.appendChild(canvasElement);
	}

    set contextOwner(owner){
        this.ctxOwner = owner;
    }

    get contextOwner(){
        return this.ctxOwner;
    }
}