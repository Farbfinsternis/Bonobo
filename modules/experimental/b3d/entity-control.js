/**
 * Handles Entity Control commands (Color, Alpha, etc.).
 * Corresponds to the "Entity Control" category in Blitz3D.
 */
export class EntityControl {
    constructor() {
        // Color & Alpha (Default: White, Opaque)
        this.color = { r: 1, g: 1, b: 1, a: 1 };
        this.texture = null;
    }

    /**
     * Sets the entity's color.
     * @param {number} r Red (0-255)
     * @param {number} g Green (0-255)
     * @param {number} b Blue (0-255)
     */
    entityColor(r, g, b) {
        this.color.r = r / 255.0;
        this.color.g = g / 255.0;
        this.color.b = b / 255.0;
    }

    /**
     * Sets the entity's alpha transparency.
     * @param {number} a Alpha (0.0 - 1.0)
     */
    entityAlpha(a) {
        this.color.a = a;
    }

    /**
     * Applies a texture to the entity.
     * @param {Texture} texture The texture to apply.
     * @param {number} [frame=0] Texture frame (not implemented yet).
     * @param {number} [index=0] Texture index (for multi-texturing, not implemented yet).
     */
    entityTexture(texture, frame = 0, index = 0) {
        this.texture = texture;
    }
}