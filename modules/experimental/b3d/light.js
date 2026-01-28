import { Entity } from "./entity.js";

/**
 * Represents a light source in the 3D scene.
 * Types: 1=Directional, 2=Point, 3=Spot
 */
export class Light extends Entity {
    static ambient = { r: 0.5, g: 0.5, b: 0.5 };

    /**
     * Sets the global ambient light color.
     * @param {number} r Red (0-255)
     * @param {number} g Green (0-255)
     * @param {number} b Blue (0-255)
     */
    static ambientLight(r, g, b) {
        Light.ambient.r = r / 255.0;
        Light.ambient.g = g / 255.0;
        Light.ambient.b = b / 255.0;
    }

    constructor(type = 1, parent) {
        super();
        this.lightType = type;
        this.colorValues = { r: 1, g: 1, b: 1 };
        this.rangeValue = 1000.0;
        this.coneAngles = { inner: 0, outer: 45 };
        
        if (parent) this.setParent(parent);
    }

    /**
     * Sets the light color.
     * @param {number} r Red (0-255)
     * @param {number} g Green (0-255)
     * @param {number} b Blue (0-255)
     */
    lightColor(r, g, b) {
        this.colorValues.r = r / 255.0;
        this.colorValues.g = g / 255.0;
        this.colorValues.b = b / 255.0;
    }

    /**
     * Sets the light range.
     * @param {number} range 
     */
    lightRange(range) {
        this.rangeValue = range;
    }

    /**
     * Sets the spot light cone angles.
     * @param {number} inner Inner angle in degrees
     * @param {number} outer Outer angle in degrees
     */
    lightConeAngles(inner, outer) {
        this.coneAngles.inner = inner;
        this.coneAngles.outer = outer;
    }
}