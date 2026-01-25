/**
 * Manages mouse input.
 */
export class Mouse{
    static BUTTONS = {
        LEFT : 0,
        MIDDLE : 1,
        RIGHT : 2
    }

    constructor(bonobo){
        this.bonobo = bonobo;
        this.bonobo.register(this);
        this.x = 0;
        this.y = 0;
        this.buttons = {};
        this.hitButtons = {};

        window.addEventListener("mousemove", (e) => this.mouseMove(e));
        window.addEventListener("mousedown", (e) => this.mouseDown(e));
        window.addEventListener("mouseup", (e) => this.mouseUp(e));
        window.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    mouseMove(e){
        if(this.bonobo.contextOwner){
            let canvas = this.bonobo.contextOwner.canvasData.element;
            let rect = canvas.getBoundingClientRect();
            this.x = e.clientX - rect.left;
            this.y = e.clientY - rect.top;
        }
    }

    mouseDown(e){
        if(!this.buttons[e.button]) this.hitButtons[e.button] = true;
        this.buttons[e.button] = true;
    }

    mouseUp(e){
        this.buttons[e.button] = false;
    }

    /**
     * Updates mouse button states. Called automatically by the engine.
     */
    update(){
        this.hitButtons = {};
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
}