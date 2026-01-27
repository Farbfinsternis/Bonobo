/**
 * Manages gamepad input via the browser's Gamepad API.
 */
export class Joy{
    #gamepads = {};
    #prevButtons = {};
    #hitButtons = {};

    constructor(bonobo){
        this.bonobo = bonobo;
        this.bonobo.register(this);

        window.addEventListener("gamepadconnected", (e) => {
            this.bonobo.utils.error.log(`Bonobo Gamepad: Connected at index ${e.gamepad.index}: ${e.gamepad.id}.`);
            this.#gamepads[e.gamepad.index] = e.gamepad;
        });
        window.addEventListener("gamepaddisconnected", (e) => {
            this.bonobo.utils.error.log(`Bonobo Gamepad: Disconnected from index ${e.gamepad.index}: ${e.gamepad.id}.`);
            delete this.#gamepads[e.gamepad.index];
            delete this.#prevButtons[e.gamepad.index];
            delete this.#hitButtons[e.gamepad.index];
        });
    }

    /**
     * Polls the gamepad status. Called automatically by the engine.
     */
    update(){
        const pads = navigator.getGamepads();
        this.#hitButtons = {};

        for (const pad of pads) {
            if (pad) {
                this.#gamepads[pad.index] = pad;
                
                if (!this.#prevButtons[pad.index]) this.#prevButtons[pad.index] = [];
                if (!this.#hitButtons[pad.index]) this.#hitButtons[pad.index] = [];

                for (let i = 0; i < pad.buttons.length; i++) {
                    const pressed = pad.buttons[i].pressed;
                    const wasPressed = this.#prevButtons[pad.index][i];

                    if (pressed && !wasPressed) {
                        this.#hitButtons[pad.index][i] = true;
                    }
                    this.#prevButtons[pad.index][i] = pressed;
                }
            }
        }
    }

    /**
     * Returns the ID string of a gamepad.
     * @param {number} [padIndex=0] Index of the gamepad.
     * @returns {string} ID string or "Not connected".
     */
    joyType(padIndex = 0){
        const pad = this.#gamepads[padIndex];
        return pad ? pad.id : "Not connected";
    }

    /**
     * Checks if a button is currently held down.
     * @param {number} button Button index.
     * @param {number} [padIndex=0] Gamepad index.
     * @returns {boolean} True if down.
     */
    joyDown(button, padIndex = 0){
        const pad = this.#gamepads[padIndex];
        return pad && pad.buttons[button] && pad.buttons[button].pressed;
    }

    /**
     * Checks if a button was pressed in this frame (one-shot).
     * @param {number} button Button index.
     * @param {number} [padIndex=0] Gamepad index.
     * @returns {boolean} True if hit.
     */
    joyHit(button, padIndex = 0){
        return this.#hitButtons[padIndex] && this.#hitButtons[padIndex][button];
    }

    /**
     * Gets the X-axis value of the primary stick.
     * @param {number} [padIndex=0] Gamepad index.
     * @returns {number} Value between -1.0 and 1.0.
     */
    joyX(padIndex = 0){
        const pad = this.#gamepads[padIndex];
        if (!pad || pad.axes.length < 1) return 0.0;
        const val = pad.axes[0];
        return Math.abs(val) > 0.15 ? val : 0.0;
    }

    /**
     * Gets the Y-axis value of the primary stick.
     * @param {number} [padIndex=0] Gamepad index.
     * @returns {number} Value between -1.0 and 1.0.
     */
    joyY(padIndex = 0){
        const pad = this.#gamepads[padIndex];
        if (!pad || pad.axes.length < 2) return 0.0;
        const val = pad.axes[1];
        return Math.abs(val) > 0.15 ? val : 0.0;
    }

    /**
     * Gets the value of a specific axis.
     * @param {number} axis Axis index.
     * @param {number} [padIndex=0] Gamepad index.
     * @returns {number} Value between -1.0 and 1.0.
     */
    joyAxis(axis, padIndex = 0){
        const pad = this.#gamepads[padIndex];
        if (!pad || pad.axes.length <= axis) return 0.0;
        const val = pad.axes[axis];
        return Math.abs(val) > 0.15 ? val : 0.0;
    }
}