export const blitzKeys = {
    1: "Escape",
    2: "Digit1", 3: "Digit2", 4: "Digit3", 5: "Digit4", 6: "Digit5", 7: "Digit6", 8: "Digit7", 9: "Digit8", 10: "Digit9", 11: "Digit0",
    12: "Minus", 13: "Equal", 14: "Backspace",
    15: "Tab",
    16: "KeyQ", 17: "KeyW", 18: "KeyE", 19: "KeyR", 20: "KeyT", 21: "KeyY", 22: "KeyU", 23: "KeyI", 24: "KeyO", 25: "KeyP", 26: "BracketLeft", 27: "BracketRight",
    28: "Enter",
    29: "ControlLeft",
    30: "KeyA", 31: "KeyS", 32: "KeyD", 33: "KeyF", 34: "KeyG", 35: "KeyH", 36: "KeyJ", 37: "KeyK", 38: "KeyL", 39: "Semicolon", 40: "Quote",
    41: "Backquote",
    42: "ShiftLeft",
    43: "Backslash",
    44: "KeyZ", 45: "KeyX", 46: "KeyC", 47: "KeyV", 48: "KeyB", 49: "KeyN", 50: "KeyM", 51: "Comma", 52: "Period", 53: "Slash",
    54: "ShiftRight",
    55: "NumpadMultiply",
    56: "AltLeft",
    57: "Space",
    58: "CapsLock",
    59: "F1", 60: "F2", 61: "F3", 62: "F4", 63: "F5", 64: "F6", 65: "F7", 66: "F8", 67: "F9", 68: "F10",
    87: "F11", 88: "F12",
    157: "ControlRight",
    184: "AltRight",
    200: "ArrowUp", 203: "ArrowLeft", 205: "ArrowRight", 208: "ArrowDown",
    210: "Insert", 211: "Delete", 199: "Home", 207: "End", 201: "PageUp", 209: "PageDown"
};

export function mapBlitzKey(code) {
    const num = parseInt(code);
    if (!isNaN(num) && blitzKeys[num]) {
        return `"${blitzKeys[num]}"`;
    }
    return code;
}

export function mapBlitzMouse(code) {
    const num = parseInt(code);
    if (isNaN(num)) return code;
    
    // Blitz: 1=Left, 2=Right, 3=Middle
    // JS:    0=Left, 2=Right, 1=Middle
    if (num === 1) return '0';
    if (num === 2) return '2';
    if (num === 3) return '1';
    
    return code;
}