/**
 * Input Manager for mapping abstract actions to hardware inputs.
 * Allows defining actions like "Jump" or "MoveLeft" and binding them to
 * Keys, Mouse Buttons/Axes, or Gamepad Buttons/Axes.
 */
export class InputManager{
    /**
     * Creates an instance of the InputManager.
     * @param {Bonobo} bonobo The Bonobo engine instance.
     */
    constructor(bonobo){
        this.bonobo = bonobo;
        /** @type {Object.<string, Array<object>>} Stores actions and their bindings. */
        this.actions = {};
    }

    /**
     * Defines a new input action.
     * @param {string} name The name of the action (e.g., "Jump", "MoveLeft").
     */
    define(name){
        if(!this.actions[name]) {
            this.actions[name] = [];
        }
    }

    /**
     * Binds a hardware input to an action.
     * @param {string} action The action name.
     * @param {string} type Input type: "KEY", "MOUSE_BTN", "MOUSE_AXIS", "JOY_BTN", "JOY_AXIS".
     * @param {string|object|number} config Configuration for the binding.
     *        - KEY: Key code string (e.g., "KEY_A").
     *        - MOUSE_BTN: Button index (0=Left, 1=Middle, 2=Right).
     *        - MOUSE_AXIS: { axis: "x"|"y", dir: 1|-1, sens: number }.
     *        - JOY_BTN: Button index or { button: number, pad: number }.
     *        - JOY_AXIS: { axis: 0|1, dir: 1|-1, pad: number }.
     */
    bind(action, type, config){
        this.define(action); // Ensure action exists
        this.actions[action].push({ type, config });
    }

    /**
     * Returns the current normalized value (0.0 to 1.0) of an action.
     * "Winner takes all": Returns the highest value among all bindings.
     * @param {string} action The action name.
     * @returns {number} The normalized value.
     */
    getValue(action){
        if(!this.actions[action]) return 0.0;

        let maxVal = 0.0;
        const bindings = this.actions[action];

        for(const binding of bindings){
            let val = 0.0;
            const cfg = binding.config;

            switch(binding.type){
                case "KEY":
                    // Digital: 0 or 1
                    if(this.bonobo.keys && this.bonobo.keys.keyDown(cfg)) val = 1.0;
                    break;

                case "MOUSE_BTN":
                    // Digital: 0 or 1
                    if(this.bonobo.mouse && this.bonobo.mouse.down(cfg)) val = 1.0;
                    break;

                case "MOUSE_AXIS":
                    // Analog-ish: Delta * Sensitivity
                    if(this.bonobo.mouse){
                        const axisVal = (cfg.axis === "y") ? this.bonobo.mouse.ySpeed : this.bonobo.mouse.xSpeed;
                        const dir = cfg.dir || 1;
                        const sens = cfg.sens || 0.1;
                        val = axisVal * dir * sens;
                    }
                    break;

                case "JOY_BTN":
                    // Digital: 0 or 1
                    if(this.bonobo.joy){
                        const btn = (typeof cfg === 'object') ? cfg.button : cfg;
                        const pad = (typeof cfg === 'object' && cfg.pad !== undefined) ? cfg.pad : 0;
                        if(this.bonobo.joy.joyDown(btn, pad)) val = 1.0;
                    }
                    break;

                case "JOY_AXIS":
                    // Analog: -1.0 to 1.0
                    if(this.bonobo.joy){
                        const axisIdx = cfg.axis || 0; // 0=X, 1=Y
                        const padIdx = cfg.pad || 0;
                        const dir = cfg.dir || 1;
                        
                        let raw = 0.0;
                        if(axisIdx === 1) raw = this.bonobo.joy.joyY(padIdx);
                        else raw = this.bonobo.joy.joyX(padIdx);

                        val = raw * dir;
                    }
                    break;
            }

            // Clamp to 0..1 range
            if(val < 0) val = 0;
            if(binding.type !== "MOUSE_AXIS" && val > 1) val = 1;

            if(val > maxVal) maxVal = val;
        }

        return maxVal;
    }

    /**
     * Checks if an action is active (value > threshold).
     * @param {string} action The action name.
     * @param {number} [threshold=0.5] The threshold.
     * @returns {boolean} True if active.
     */
    isPressed(action, threshold = 0.5){
        return this.getValue(action) > threshold;
    }

    /**
     * Checks if an action was triggered (one-shot) in this frame.
     * Useful for UI navigation or single actions like jumping.
     * @param {string} action The action name.
     * @returns {boolean} True if triggered.
     */
    isHit(action){
        if(!this.actions[action]) return false;

        const bindings = this.actions[action];
        for(const binding of bindings){
            const cfg = binding.config;
            switch(binding.type){
                case "KEY":
                    if(this.bonobo.keys && this.bonobo.keys.keyHit(cfg)) return true;
                    break;
                case "MOUSE_BTN":
                    if(this.bonobo.mouse && this.bonobo.mouse.hit(cfg)) return true;
                    break;
                case "JOY_BTN":
                    if(this.bonobo.joy){
                        const btn = (typeof cfg === 'object') ? cfg.button : cfg;
                        const pad = (typeof cfg === 'object' && cfg.pad !== undefined) ? cfg.pad : 0;
                        if(this.bonobo.joy.joyHit(btn, pad)) return true;
                    }
                    break;
            }
        }
        return false;
    }
}