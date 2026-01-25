import { Utils } from "../../lib/modules/utils.js";

/**
 * Manages loading and drawing of images and spritesheets.
 */
export class Image{
    constructor(bonobo){
        this.bonobo = bonobo;
        this.midHandleMode = false;
    }

    /**
     * Sets whether new images should automatically have their handle centered.
     * @param {boolean} mode True to enable auto mid-handle.
     */
    autoMidHandle(mode){
        this.midHandleMode = mode;
    }

    /**
     * Sets the handle of a specific image to its center.
     * @param {object} img The image object.
     */
    midHandle(img){
        img.midHandleRequested = true;
        if(img.loaded){
            img.handleX = Math.floor(img.tileWidth / 2);
            img.handleY = Math.floor(img.tileHeight / 2);
        }
    }

    /**
     * Loads an image or spritesheet.
     * @param {string} path Path to the image file.
     * @param {number} [tileWidth=0] Width of a single tile (for spritesheets).
     * @param {number} [tileHeight=0] Height of a single tile.
     * @param {number} [tileCount=1] Total number of tiles.
     * @returns {Img} The image object container.
     */
    load(path, tileWidth = 0, tileHeight = 0, tileCount = 1){
        let img = new Img();
        img.tileWidth = tileWidth;
        img.tileHeight = tileHeight;
        img.tileCount = tileCount;
        
        if(this.midHandleMode) img.midHandleRequested = true;

        this.bonobo.utils.loadFile(path, Utils.TYPES.IMAGE).then(blob => {
            createImageBitmap(blob).then(bitmap => {
                img.data = bitmap;
                img.width = bitmap.width;
                img.height = bitmap.height;

                if(img.tileWidth === 0) img.tileWidth = img.width;
                if(img.tileHeight === 0) img.tileHeight = img.height;

                if(img.midHandleRequested){
                    img.handleX = Math.floor(img.tileWidth / 2);
                    img.handleY = Math.floor(img.tileHeight / 2);
                }

                img.loaded = true;
            });
        });
        return img;
    }

    /**
     * Draws an image or a specific frame of a spritesheet.
     * @param {object} img The image object.
     * @param {number} x X-coordinate.
     * @param {number} y Y-coordinate.
     * @param {number} [frame=0] The frame index to draw.
     */
    draw(img, x, y, frame = 0){
        if(!img.loaded) return;
        let ctx = this.bonobo.contextOwner.canvasContext;

        let tilesPerRow = Math.floor(img.width / img.tileWidth);
        let sx = (frame % tilesPerRow) * img.tileWidth;
        let sy = Math.floor(frame / tilesPerRow) * img.tileHeight;

        ctx.drawImage(img.data, sx, sy, img.tileWidth, img.tileHeight, x - img.handleX, y - img.handleY, img.tileWidth, img.tileHeight);
    }
}

class Img{
    constructor(){
        this.loaded = false;
        this.width = 0;
        this.height = 0;
        this.tileWidth = 0;
        this.tileHeight = 0;
        this.tileCount = 0;
        this.handleX = 0;
        this.handleY = 0;
        this.midHandleRequested = false;
    }

    get isLoaded(){
        return this.loaded;
    }
}