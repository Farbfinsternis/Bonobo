/**
 * Manages keyboard input.
 */
export class Keyboard{
    static KEYMAP = {
        "KEY_BACKSPACE": "Backspace", "KEY_TAB": "Tab", "KEY_ENTER": "Enter",
        "KEY_LSHIFT": "ShiftLeft", "KEY_RSHIFT": "ShiftRight",
        "KEY_LCTRL": "ControlLeft", "KEY_RCTRL": "ControlRight",
        "KEY_LALT": "AltLeft", "KEY_RALT": "AltRight",
        "KEY_PAUSE": "Pause", "KEY_CAPSLOCK": "CapsLock", "KEY_ESC": "Escape",
        "KEY_SPACEBAR": "Space",
        "KEY_PAGEUP": "PageUp", "KEY_NEXT": "PageDown", "KEY_END": "End", "KEY_HOME": "Home",
        "KEY_LEFT": "ArrowLeft", "KEY_UP": "ArrowUp", "KEY_RIGHT": "ArrowRight", "KEY_DOWN": "ArrowDown",
        "KEY_INSERT": "Insert", "KEY_DEL": "Delete",
        "KEY_0": "Digit0", "KEY_1": "Digit1", "KEY_2": "Digit2", "KEY_3": "Digit3", "KEY_4": "Digit4",
        "KEY_5": "Digit5", "KEY_6": "Digit6", "KEY_7": "Digit7", "KEY_8": "Digit8", "KEY_9": "Digit9",
        "KEY_A": "KeyA", "KEY_B": "KeyB", "KEY_C": "KeyC", "KEY_D": "KeyD", "KEY_E": "KeyE", "KEY_F": "KeyF",
        "KEY_G": "KeyG", "KEY_H": "KeyH", "KEY_I": "KeyI", "KEY_J": "KeyJ", "KEY_K": "KeyK", "KEY_L": "KeyL",
        "KEY_M": "KeyM", "KEY_N": "KeyN", "KEY_O": "KeyO", "KEY_P": "KeyP", "KEY_Q": "KeyQ", "KEY_R": "KeyR",
        "KEY_S": "KeyS", "KEY_T": "KeyT", "KEY_U": "KeyU", "KEY_V": "KeyV", "KEY_W": "KeyW", "KEY_X": "KeyX",
        "KEY_Y": "KeyY", "KEY_Z": "KeyZ",
        "KEY_NUM0": "Numpad0", "KEY_NUM1": "Numpad1", "KEY_NUM2": "Numpad2", "KEY_NUM3": "Numpad3",
        "KEY_NUM4": "Numpad4", "KEY_NUM5": "Numpad5", "KEY_NUM6": "Numpad6", "KEY_NUM7": "Numpad7",
        "KEY_NUM8": "Numpad8", "KEY_NUM9": "Numpad9",
        "KEY_NUMSTAR": "NumpadMultiply", "KEY_NUMPLUS": "NumpadAdd", "KEY_NUMMINUS": "NumpadSubtract",
        "KEY_NUMDECIMAL": "NumpadDecimal", "KEY_NUMSLASH": "NumpadDivide",
        "KEY_F1": "F1", "KEY_F2": "F2", "KEY_F3": "F3", "KEY_F4": "F4", "KEY_F5": "F5", "KEY_F6": "F6",
        "KEY_F7": "F7", "KEY_F8": "F8", "KEY_F9": "F9", "KEY_F10": "F10", "KEY_F11": "F11", "KEY_F12": "F12"
    };

    constructor(bonobo){
        this.bonobo = bonobo;
        this.bonobo.register(this);
        this.keys = {};
        this.hitKeys = {};
        this.modifiers = {};

        // Register event listeners
        window.addEventListener("keydown", (e) => this.onKeyDown(e));
        window.addEventListener("keyup", (e) => this.onKeyUp(e));
    }

    onKeyDown(e){
        if(!this.keys[e.code]) this.hitKeys[e.code] = true;
        this.keys[e.code] = true;
        this.updateModifiers(e);
    }

    onKeyUp(e){
        this.keys[e.code] = false;
        this.updateModifiers(e);
    }

    updateModifiers(e){
        this.modifiers["shift"] = e.shiftKey;
        this.modifiers["ctrl"] = e.ctrlKey;
        this.modifiers["alt"] = e.altKey;
        this.modifiers["meta"] = e.metaKey;
    }

    /**
     * Updates the key states. Called automatically by the engine.
     */
    update(){
        this.hitKeys = {};
    }

    /**
     * Checks if a key is currently held down.
     * @param {string} keyName The key name (e.g., "KEY_LEFT" or "ArrowLeft").
     * @returns {boolean} True if down.
     */
    keyDown(keyName){
        let code = Keyboard.KEYMAP[keyName] || keyName;
        return !!this.keys[code];
    }

    /**
     * Checks if a key was pressed in this frame (one-shot).
     * @param {string} keyName The key name.
     * @returns {boolean} True if hit.
     */
    keyHit(keyName){
        let code = Keyboard.KEYMAP[keyName] || keyName;
        return !!this.hitKeys[code];
    }

    /**
     * Checks if a key is NOT pressed.
     * @param {string} keyName The key name.
     * @returns {boolean} True if up.
     */
    keyUp(keyName){
        let code = Keyboard.KEYMAP[keyName] || keyName;
        return !this.keys[code];
    }

    /**
     * Checks if a modifier key is held down.
     * @param {string} name Modifier name ("shift", "ctrl", "alt", "meta").
     * @returns {boolean} True if active.
     */
    modifier(name){
        return !!this.modifiers[name];
    }
}