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

        const rot = img.rotation || 0;
        const scaleX = (img.scaleX !== undefined) ? img.scaleX : 1;
        const scaleY = (img.scaleY !== undefined) ? img.scaleY : 1;

        if(rot === 0 && scaleX === 1 && scaleY === 1){
            ctx.drawImage(img.data, sx, sy, img.tileWidth, img.tileHeight, x - img.handleX, y - img.handleY, img.tileWidth, img.tileHeight);
        }else{
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot * (Math.PI / 180));
            ctx.scale(scaleX, scaleY);
            ctx.drawImage(img.data, sx, sy, img.tileWidth, img.tileHeight, -img.handleX, -img.handleY, img.tileWidth, img.tileHeight);
            ctx.restore();
        }
    }

    /**
     * Sets the scaling factor for an image.
     * @param {object} img The image object.
     * @param {number} x Horizontal scale factor.
     * @param {number} y Vertical scale factor.
     */
    scaleImage(img, x, y){
        img.scaleX = x;
        img.scaleY = y;
    }

    /**
     * Sets the rotation angle for an image.
     * @param {object} img The image object.
     * @param {number} angle Rotation angle in degrees.
     */
    rotateImage(img, angle){
        img.rotation = angle;
    }

    /**
     * Tiles an image across the entire viewport.
     * @param {object} img The image object.
     * @param {number} x X-offset for tiling (scroll position).
     * @param {number} y Y-offset for tiling.
     * @param {number} [frame=0] The frame index to draw.
     */
    tileImage(img, x, y, frame = 0){
        if(!img.loaded) return;
        const ctx = this.bonobo.contextOwner.canvasContext;
        const viewW = this.bonobo.contextOwner.width;
        const viewH = this.bonobo.contextOwner.height;

        let tilesPerRow = Math.floor(img.width / img.tileWidth);
        let sx = (frame % tilesPerRow) * img.tileWidth;
        let sy = Math.floor(frame / tilesPerRow) * img.tileHeight;

        const offsetX = x % img.tileWidth;
        const offsetY = y % img.tileHeight;
        
        const startX = offsetX > 0 ? offsetX - img.tileWidth : offsetX;
        const startY = offsetY > 0 ? offsetY - img.tileHeight : offsetY;

        for(let dy = startY; dy < viewH; dy += img.tileHeight){
            for(let dx = startX; dx < viewW; dx += img.tileWidth){
                ctx.drawImage(img.data, sx, sy, img.tileWidth, img.tileHeight, dx, dy, img.tileWidth, img.tileHeight);
            }
        }
    }

    /**
     * Grabs a portion of the screen into an image object.
     * @param {object} img The target image object.
     * @param {number} x X-coordinate on screen to grab from.
     * @param {number} y Y-coordinate on screen to grab from.
     */
    grabImage(img, x, y){
        const ctx = this.bonobo.contextOwner.canvasContext;
        const w = img.width || img.tileWidth;
        const h = img.height || img.tileHeight;
        
        if(w === 0 || h === 0) return;

        const imageData = ctx.getImageData(x, y, w, h);
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, 0);
        
        img.data = tempCanvas;
        img.loaded = true;
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
        this.scaleX = 1;
        this.scaleY = 1;
        this.rotation = 0;
    }

    get isLoaded(){
        return this.loaded;
    }
}