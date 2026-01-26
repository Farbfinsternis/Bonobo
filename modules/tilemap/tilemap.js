import { Utils } from "../../lib/modules/utils.js";

/**
 * Handles loading and rendering of Tiled JSON maps.
 */
export class TileMap{
    constructor(bonobo){
        this.bonobo = bonobo;
        this.mapData = null;
        this.tilesets = [];
        this.loaded = false;
    }

    /**
     * Loads a Tiled JSON map.
     * @param {string} path Path to the JSON file.
     * @returns {TileMap} The TileMap instance.
     */
    load(path){
        this.loaded = false;
        this.bonobo.utils.loadFile(path, Utils.TYPES.JSON).then(data => {
            this.mapData = data;
            this._loadTilesets(path);
        });
        return this;
    }

    /**
     * Loads tileset images defined in the map data.
     * @private
     * @param {string} mapPath The base path of the map file.
     */
    async _loadTilesets(mapPath){
        const basePath = mapPath.substring(0, mapPath.lastIndexOf('/') + 1);
        
        const promises = this.mapData.tilesets.map(async (ts) => {
            if(!ts.image) return null; 

            const imgPath = basePath + ts.image;
            const blob = await this.bonobo.utils.loadFile(imgPath, Utils.TYPES.IMAGE);
            const bitmap = await createImageBitmap(blob);

            return {
                firstgid: ts.firstgid,
                image: bitmap,
                tileWidth: ts.tilewidth,
                tileHeight: ts.tileheight,
                columns: ts.columns,
                margin: ts.margin || 0,
                spacing: ts.spacing || 0
            };
        });

        this.tilesets = (await Promise.all(promises)).filter(t => t !== null);
        this.loaded = true;
    }

    /**
     * Draws a specific layer of the map.
     * @param {string} layerName Name of the layer to draw.
     * @param {number} x X-offset (e.g. for scrolling).
     * @param {number} y Y-offset.
     */
    draw(layerName, x, y){
        if(!this.loaded) return;

        const layer = this.mapData.layers.find(l => l.name === layerName && l.type === "tilelayer");
        if(!layer || !layer.visible) return;

        const ctx = this.bonobo.contextOwner.canvasContext;
        const viewW = this.bonobo.contextOwner.width;
        const viewH = this.bonobo.contextOwner.height;

        const mapW = layer.width;
        const tileW = this.mapData.tilewidth;
        const tileH = this.mapData.tileheight;

        const startCol = Math.floor(-x / tileW);
        const endCol = startCol + (viewW / tileW) + 1;
        const startRow = Math.floor(-y / tileH);
        const endRow = startRow + (viewH / tileH) + 1;

        const cMin = Math.max(0, startCol);
        const cMax = Math.min(mapW, endCol);
        const rMin = Math.max(0, startRow);
        const rMax = Math.min(layer.height, endRow);

        for(let r = rMin; r < rMax; r++){
            for(let c = cMin; c < cMax; c++){
                const idx = r * mapW + c;
                const gid = layer.data[idx];
                
                if(gid === 0) continue;

                let ts = null;
                for(let i = this.tilesets.length - 1; i >= 0; i--){
                    if(gid >= this.tilesets[i].firstgid){
                        ts = this.tilesets[i];
                        break;
                    }
                }
                if(!ts) continue;

                const localId = gid - ts.firstgid;
                const tsCol = localId % ts.columns;
                const tsRow = Math.floor(localId / ts.columns);

                const sx = ts.margin + (tsCol * (ts.tileWidth + ts.spacing));
                const sy = ts.margin + (tsRow * (ts.tileHeight + ts.spacing));
                
                const dx = Math.floor(x + c * tileW);
                const dy = Math.floor(y + r * tileH);

                ctx.drawImage(ts.image, sx, sy, ts.tileWidth, ts.tileHeight, dx, dy, tileW, tileH);
            }
        }
    }
}