import { Utils } from "../../lib/modules/utils.js";

/**
 * Manages Blitter Objects (BOBs), which are advanced sprites with animation support.
 */
export class Bob{
    constructor(bonobo){
        this.bonobo = bonobo;
        this.midHandleMode = false;
    }

    /**
     * Sets whether new BOBs should automatically have their handle centered.
     * @param {boolean} mode True to enable auto mid-handle.
     */
    autoMidHandle(mode){
        this.midHandleMode = mode;
    }

    /**
     * Sets the handle of a specific BOB to its center.
     * @param {object} bob The BOB object.
     */
    midHandle(bob){
        bob.midHandleRequested = true;
        if(bob.loaded){
            bob.handleX = Math.floor(bob.tileWidth / 2);
            bob.handleY = Math.floor(bob.tileHeight / 2);
        }
    }

    /**
     * Loads a BOB from an image file.
     * @param {string} path Path to the image file.
     * @param {number} [tileWidth=0] Width of a single frame.
     * @param {number} [tileHeight=0] Height of a single frame.
     * @param {number} [tileCount=1] Total number of frames.
     * @returns {BobEntity} The BOB object container.
     */
    load(path, tileWidth = 0, tileHeight = 0, tileCount = 1){
        let bob = new BobEntity();
        bob.tileWidth = tileWidth;
        bob.tileHeight = tileHeight;
        bob.tileCount = tileCount;

        if(this.midHandleMode) bob.midHandleRequested = true;

        this.bonobo.utils.loadFile(path, Utils.TYPES.IMAGE).then(blob => {
            createImageBitmap(blob).then(bitmap => {
                bob.data = bitmap;
                bob.width = bitmap.width;
                bob.height = bitmap.height;

                if(bob.tileWidth === 0) bob.tileWidth = bob.width;
                if(bob.tileHeight === 0) bob.tileHeight = bob.height;

                if(bob.midHandleRequested){
                    bob.handleX = Math.floor(bob.tileWidth / 2);
                    bob.handleY = Math.floor(bob.tileHeight / 2);
                }

                bob.loaded = true;
            });
        });
        return bob;
    }

    /**
     * Defines an animation sequence for a BOB.
     * @param {BobEntity} bob The BOB object.
     * @param {string} name Name of the animation.
     * @param {number} startFrame Start frame index.
     * @param {number} endFrame End frame index.
     * @param {number} speed Speed in FPS.
     */
    setAnimation(bob, name, startFrame, endFrame, speed){
        bob.animations[name] = {
            start : startFrame,
            end : endFrame,
            speed : speed
        };
    }

    /**
     * Plays a defined animation.
     * @param {BobEntity} bob The BOB object.
     * @param {string} name Name of the animation to play.
     */
    play(bob, name){
        if(bob.currentAnim !== name){
            bob.currentAnim = name;
            bob.frameIndex = bob.animations[name].start;
            bob.lastFrameTime = performance.now();
        }
    }

    /**
     * Draws the BOB at the specified coordinates.
     * @param {BobEntity} bob The BOB object.
     * @param {number} x X-coordinate.
     * @param {number} y Y-coordinate.
     */
    draw(bob, x, y){
        if(!bob.loaded) return;

        // Animation Logic
        if(bob.currentAnim && bob.animations[bob.currentAnim]){
            let anim = bob.animations[bob.currentAnim];
            let now = performance.now();
            let delay = 1000 / anim.speed;

            if(now - bob.lastFrameTime > delay){
                bob.frameIndex++;
                if(bob.frameIndex > anim.end) bob.frameIndex = anim.start;
                bob.lastFrameTime = now;
            }
        }

        let ctx = this.bonobo.contextOwner.canvasContext;
        
        let tilesPerRow = Math.floor(bob.width / bob.tileWidth);
        let sx = (bob.frameIndex % tilesPerRow) * bob.tileWidth;
        let sy = Math.floor(bob.frameIndex / tilesPerRow) * bob.tileHeight;

        if(bob.scaleX !== 1 || bob.scaleY !== 1 || bob.rotation !== 0){
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(bob.rotation * Math.PI / 180);
            ctx.scale(bob.scaleX, bob.scaleY);
            ctx.drawImage(bob.data, sx, sy, bob.tileWidth, bob.tileHeight, -bob.handleX, -bob.handleY, bob.tileWidth, bob.tileHeight);
            ctx.restore();
        }else{
            ctx.drawImage(bob.data, sx, sy, bob.tileWidth, bob.tileHeight, x - bob.handleX, y - bob.handleY, bob.tileWidth, bob.tileHeight);
        }
    }
}

class BobEntity{
    constructor(){
        this.loaded = false;
        this.width = 0;
        this.height = 0;
        this.tileWidth = 0;
        this.tileHeight = 0;
        this.tileCount = 0;
        this.handleX = 0;
        this.handleY = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.rotation = 0;
        this.midHandleRequested = false;
        
        this.animations = {};
        this.currentAnim = null;
        this.frameIndex = 0;
        this.lastFrameTime = 0;
    }
}