import { Graphics } from "./graphics.js";
import { Draw } from "./draw.js";
import { Image } from "./image.js";
import { Keyboard } from "./keyboard.js";
import { Mouse } from "./mouse.js";
import { Sound } from "./sound.js";
import { Font } from "./font.js";
import { Files } from "./file.js";
import { Collision } from "./collision.js";
import { Joy } from "./joy.js";
import { Maths } from "./math.js";
import { Time } from "./time.js";
import { Strings } from "./string.js";

/**
 * Helper function to initialize all core modules at once.
 * @param {Bonobo} bonobo The engine instance.
 * @param {number|string} [width=640] Canvas width or "*" for fullscreen.
 * @param {number} [height=480] Canvas height.
 * @returns {object} An object containing initialized instances of all modules.
 */
export const init = (bonobo, width = 640, height = 480) => {
    return {
        gfx: new Graphics(width, height, bonobo),
        draw: new Draw(bonobo),
        img: new Image(bonobo),
        keys: new Keyboard(bonobo),
        mouse: new Mouse(bonobo),
        sound: new Sound(bonobo),
        font: new Font(bonobo),
        file: new Files(bonobo),
        collision: new Collision(bonobo),
        joy: new Joy(bonobo),
        math: new Maths(bonobo),
        time: new Time(bonobo),
        str: new Strings(bonobo),
    };
}

export { Graphics, Draw, Image, Keyboard, Mouse, Sound, Font, Files, Collision, Joy, Maths, Time, Strings };