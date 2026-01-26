/**
 * Manages mouse input.
 */
export class Mouse{
    /**
     * Constants for mouse buttons.
     * @readonly
     * @enum {number}
     */
    static BUTTONS = {
        LEFT : 0,
        MIDDLE : 1,
        RIGHT : 2
    }

    /**
     * Creates an instance of the Mouse module.
     * @param {Bonobo} bonobo The Bonobo engine instance.
     */
    constructor(bonobo){
        this.bonobo = bonobo;
        this.bonobo.register(this);
        this.x = 0;
        this.y = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.xSpeed = 0;
        this.ySpeed = 0;
        this.z = 0; // Wheel
        this.zSpeed = 0;
        this.buttons = {};
        this.hitButtons = {};

        window.addEventListener("mousemove", (e) => this.mouseMove(e));
        window.addEventListener("mousedown", (e) => this.mouseDown(e));
        window.addEventListener("mouseup", (e) => this.mouseUp(e));
        window.addEventListener("contextmenu", (e) => e.preventDefault());
        window.addEventListener("wheel", (e) => this.mouseWheel(e), { passive: false });
    }

    /**
     * Handles mouse move events to update coordinates.
     * @private
     * @param {MouseEvent} e The mouse event.
     */
    mouseMove(e){
        if(this.bonobo.contextOwner){
            let canvas = this.bonobo.contextOwner.canvasData.element;
            let rect = canvas.getBoundingClientRect();
            this.x = e.clientX - rect.left;
            this.y = e.clientY - rect.top;
        }
    }

    /**
     * Handles mouse down events.
     * @private
     * @param {MouseEvent} e The mouse event.
     */
    mouseDown(e){
        if(!this.buttons[e.button]) this.hitButtons[e.button] = true;
        this.buttons[e.button] = true;
    }

    /**
     * Handles mouse up events.
     * @private
     * @param {MouseEvent} e The mouse event.
     */
    mouseUp(e){
        this.buttons[e.button] = false;
    }

    /**
     * Handles mouse wheel events.
     * @private
     * @param {WheelEvent} e 
     */
    mouseWheel(e){
        // Normalize wheel delta (usually 100 or 120, we want approx 1 per step)
        const delta = Math.sign(e.deltaY) * -1; 
        this.z += delta;
    }

    /**
     * Updates mouse states. Called automatically by the engine.
     */
    update(){
        this.hitButtons = {};
        
        this.xSpeed = this.x - this.lastX;
        this.ySpeed = this.y - this.lastY;
        this.zSpeed = this.z - (this.lastZ || this.z);
        
        this.lastX = this.x;
        this.lastY = this.y;
        this.lastZ = this.z;
    }

    /**
     * Checks if a mouse button is held down.
     * @param {number} button Button index (use Mouse.BUTTONS).
     * @returns {boolean} True if down.
     */
    down(button){
        return !!this.buttons[button];
    }

    /**
     * Checks if a mouse button was clicked in this frame (one-shot).
     * @param {number} button Button index.
     * @returns {boolean} True if hit.
     */
    hit(button){
        return !!this.hitButtons[button];
    }

    /**
     * Hides the mouse cursor.
     */
    hidePointer(){
        if(this.bonobo.contextOwner){
            this.bonobo.contextOwner.canvasData.element.style.cursor = "none";
        }
    }

    /**
     * Shows the mouse cursor (default).
     */
    showPointer(){
        if(this.bonobo.contextOwner){
            this.bonobo.contextOwner.canvasData.element.style.cursor = "default";
        }
    }

    /**
     * Clears all mouse input buffers.
     */
    flushMouse(){
        this.buttons = {};
        this.hitButtons = {};
    }
}