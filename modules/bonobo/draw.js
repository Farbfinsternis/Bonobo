/**
 * Provides 2D drawing primitives and state management.
 */
export class Draw{
    constructor(bonobo){
        this.bonobo = bonobo;
    }

    get #ctx() { return this.bonobo.contextOwner.canvasContext; }
    get #data() { return this.bonobo.contextOwner.canvasData; }

    /**
     * Sets the current drawing color.
     * @param {number} [r=255] Red component (0-255).
     * @param {number} [g=255] Green component (0-255).
     * @param {number} [b=255] Blue component (0-255).
     * @param {number} [a=1] Alpha component (0-1).
     */
    color(r = 255, g = 255, b = 255, a = 1){
        this.#data.drawColor = `rgba(${r}, ${g}, ${b}, ${a})`;
        this.#data.colorValues = { r, g, b, a };
        this.#ctx.fillStyle = this.#data.drawColor;
        this.#ctx.strokeStyle = this.#data.drawColor;
    }

    /**
     * Returns the current drawing color components.
     * @returns {{r: number, g: number, b: number, a: number}} The current color object.
     */
    getColor(){
        return this.#data.colorValues || { r: 255, g: 255, b: 255, a: 1 };
    }

    /**
     * Sets the background clear color.
     * @param {number} [r=0] Red component (0-255).
     * @param {number} [g=0] Green component (0-255).
     * @param {number} [b=0] Blue component (0-255).
     * @param {number} [a=1] Alpha component (0-1).
     */
    clsColor(r = 0, g = 0, b = 0, a = 1){
        this.#data.clsColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    /**
     * Clears the screen (or current viewport) with the set clear color.
     */
    cls(){
        this.#ctx.save();
        this.#ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to ensure full coverage
        this.#ctx.fillStyle = this.#data.clsColor;
        this.#ctx.fillRect(0, 0, this.bonobo.contextOwner.width, this.bonobo.contextOwner.height);
        this.#ctx.restore();
    }

    /**
     * Draws a single pixel at the specified coordinates.
     * @param {number} x X-coordinate.
     * @param {number} y Y-coordinate.
     */
    plot(x, y){
        this.#ctx.fillRect(x, y, 1, 1);
    }

    /**
     * Draws a line between two points.
     * @param {number} x1 Start X-coordinate.
     * @param {number} y1 Start Y-coordinate.
     * @param {number} x2 End X-coordinate.
     * @param {number} y2 End Y-coordinate.
     */
    line(x1, y1, x2, y2){
        this.#ctx.beginPath();
        this.#ctx.moveTo(x1, y1);
        this.#ctx.lineTo(x2, y2);
        this.#ctx.stroke();
    }

    /**
     * Draws a rectangle.
     * @param {number} x X-coordinate.
     * @param {number} y Y-coordinate.
     * @param {number} w Width.
     * @param {number} h Height.
     * @param {boolean} [filled=true] Whether to fill the rectangle or draw outlines only.
     */
    rect(x, y, w, h, filled = true){
        if(filled){
            this.#ctx.fillRect(x, y, w, h);
        }else{
            this.#ctx.strokeRect(x, y, w, h);
        }
    }

    /**
     * Draws an oval (ellipse).
     * @param {number} x X-coordinate of the bounding box.
     * @param {number} y Y-coordinate of the bounding box.
     * @param {number} w Width of the bounding box.
     * @param {number} h Height of the bounding box.
     * @param {boolean} [filled=true] Whether to fill the oval or draw outlines only.
     */
    oval(x, y, w, h, filled = true){
        this.#ctx.beginPath();
        // Canvas ellipse uses center x/y and radii
        this.#ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
        if(filled){
            this.#ctx.fill();
        }else{
            this.#ctx.stroke();
        }
    }

    /**
     * Sets the drawing origin (offset).
     * @param {number} x X-coordinate offset.
     * @param {number} y Y-coordinate offset.
     */
    origin(x, y){
        this.#data.origin = { x, y };
        this.#ctx.setTransform(1, 0, 0, 1, x, y);
    }

    /**
     * Sets the current viewport (clipping region).
     * @param {number} x X-coordinate.
     * @param {number} y Y-coordinate.
     * @param {number} w Width.
     * @param {number} h Height.
     */
    viewport(x, y, w, h){
        // Reset to initial state (clears previous clip)
        this.#ctx.restore(); 
        this.#ctx.save();
        
        this.#ctx.beginPath();
        this.#ctx.rect(x, y, w, h);
        this.#ctx.clip();

        // Re-apply current origin and color since restore() wiped them
        const ox = this.#data.origin ? this.#data.origin.x : 0;
        const oy = this.#data.origin ? this.#data.origin.y : 0;
        this.#ctx.setTransform(1, 0, 0, 1, ox, oy);
        
        this.#ctx.fillStyle = this.#data.drawColor;
        this.#ctx.strokeStyle = this.#data.drawColor;
    }
}