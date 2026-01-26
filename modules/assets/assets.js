export class AssetsManager{
    constructor(bonobo){
        this.bonobo = bonobo;
        this.total = 0;
        this.loaded = 0;
        this.failed = 0;

        // We hook into the central load function of Utils.
        // This allows us to automatically track when Image, Bob, or Sound load something.
        this._originalLoadFile = this.bonobo.utils.loadFile.bind(this.bonobo.utils);
        this.bonobo.utils.loadFile = this._trackedLoadFile.bind(this);
    }

    /**
     * Internal wrapper to track file loading progress.
     * @private
     * @param {string} path 
     * @param {string} loadAs 
     * @returns {Promise<any>}
     */
    async _trackedLoadFile(path, loadAs){
        this.total++;
        try{
            let data = await this._originalLoadFile(path, loadAs);
            this.loaded++;
            return data;
        }catch(e){
            this.failed++;
            this.bonobo.utils.error.error(`AssetsManager: Failed to load ${path} - ${e}`);
            throw e;
        }
    }

    /**
     * Returns the loading progress from 0.0 to 1.0.
     */
    get progress(){
        if(this.total === 0) return 1.0;
        return this.loaded / this.total;
    }

    /**
     * Returns true if all assets have finished loading.
     */
    get isReady(){
        return this.total === 0 || (this.loaded + this.failed) === this.total;
    }
}