/**
 * Represents a texture for 3D entities.
 */
export class Texture {
    constructor(url) {
        this.url = url;
        this.image = new Image();
        this.loaded = false;
        this.glTexture = null; // Will be created by Graphics3D

        this.image.onload = () => {
            this.loaded = true;
        };
        this.image.crossOrigin = "Anonymous";
        this.image.src = url;
    }

    /**
     * Loads a texture from a file.
     * Emulates Blitz3D's LoadTexture.
     * @param {string} url Path to the image file.
     * @returns {Texture} The loaded texture.
     */
    static loadTexture(url) {
        return new Texture(url);
    }

    /**
     * Creates a procedural texture using Bonobo drawing commands.
     * @param {number} width Width of the texture.
     * @param {number} height Height of the texture.
     * @param {object} bonobo The Bonobo engine instance.
     * @param {Function} drawFn Callback function to draw the texture.
     * @returns {Texture} The created texture.
     */
    static createProcedural(width, height, bonobo, drawFn) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // Save current context owner
        const previousOwner = bonobo.contextOwner;

        // Create temporary context owner for Draw module
        const tempOwner = {
            canvasContext: ctx,
            canvasData: {
                element: canvas,
                context: ctx,
                drawColor: "rgba(255,255,255,1)",
                clsColor: "rgba(0,0,0,1)",
                colorValues: { r: 255, g: 255, b: 255, a: 1 },
                origin: { x: 0, y: 0 }
            },
            width: width,
            height: height
        };

        // Switch context
        bonobo.contextOwner = tempOwner;

        // Execute drawing
        drawFn();

        // Restore context
        bonobo.contextOwner = previousOwner;

        return new Texture(canvas.toDataURL());
    }
}