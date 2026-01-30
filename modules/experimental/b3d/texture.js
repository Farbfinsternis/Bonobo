/**
 * Represents a texture for 3D entities.
 */
export class Texture {
    constructor(url) {
        this.url = url;
        this.image = new Image();
        this.loaded = false;
        this.glTexture = null; // Will be created by Graphics3D

        if (url) {
            this.image.onload = () => {
                this.loaded = true;
                if (this.url.startsWith("blob:")) {
                    URL.revokeObjectURL(this.url);
                }
            };
            this.image.crossOrigin = "Anonymous";
            this.image.src = url;
        }
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
     * Loads a CubeMap texture from 6 URLs.
     * Order: pos-x, neg-x, pos-y, neg-y, pos-z, neg-z
     * @param {string[]} urls Array of 6 image URLs.
     * @returns {Texture} The loaded texture object (marked as cubemap).
     */
    static loadCubeMap(urls) {
        const tex = new Texture(urls[0]); // Use first as base
        tex.isCubeMap = true;
        tex.images = [];
        tex.loadedCount = 0;
        tex.loaded = false; // Reset loaded state

        urls.forEach((url, i) => {
            const img = new Image();
            img.onload = () => {
                tex.loadedCount++;
                if (tex.loadedCount === 6) tex.loaded = true;
            };
            img.crossOrigin = "Anonymous";
            img.src = url;
            tex.images[i] = img;
        });
        
        return tex;
    }

    /**
     * Creates a CubeMap from a single source texture (applied to all 6 faces).
     * Useful for simple skyboxes (space, single color, etc.).
     * @param {Texture} sourceTexture The source texture to use for all faces.
     * @returns {Texture} The new CubeMap texture.
     */
    static createCubeMapFromSingle(sourceTexture) {
        const tex = new Texture(null); // No URL, manual loading
        tex.isCubeMap = true;
        tex.images = [];
        
        const sync = () => {
            for(let i=0; i<6; i++) tex.images[i] = sourceTexture.image;
            tex.loaded = true;
        };

        if (sourceTexture.loaded) {
            sync();
        } else {
            sourceTexture.image.addEventListener('load', sync);
        }
        return tex;
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

    /**
     * Creates a normal map from a procedurally generated height map.
     * @param {number} width Width of the texture.
     * @param {number} height Height of the texture.
     * @param {object} bonobo The Bonobo engine instance.
     * @param {Function} drawFn Callback function to draw the height map (grayscale).
     * @param {number} [strength=2.0] Strength of the normal effect.
     * @returns {Texture} The created normal map texture.
     */
    static createFromHeightMap(width, height, bonobo, drawFn, strength = 2.0) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

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

        // Execute drawing (Height Map)
        drawFn();

        // Restore context
        bonobo.contextOwner = previousOwner;

        // Convert Height Map to Normal Map
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const normalData = ctx.createImageData(width, height);
        const out = normalData.data;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Get neighbors (wrapping)
                const xL = (x - 1 + width) % width;
                const xR = (x + 1) % width;
                const yU = (y - 1 + height) % height;
                const yD = (y + 1) % height;

                // Read height (using Red channel)
                const hL = data[(y * width + xL) * 4] / 255.0;
                const hR = data[(y * width + xR) * 4] / 255.0;
                const hU = data[(yU * width + x) * 4] / 255.0;
                const hD = data[(yD * width + x) * 4] / 255.0;

                // Calculate slope
                const dx = (hL - hR) * strength;
                const dy = (hU - hD) * strength;
                const dz = 1.0;

                // Normalize
                const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const nx = dx / len;
                const ny = dy / len;
                const nz = dz / len;

                // Map to 0..255
                const idx = (y * width + x) * 4;
                out[idx] = (nx + 1) * 127.5;     // R
                out[idx + 1] = (ny + 1) * 127.5; // G
                out[idx + 2] = (nz + 1) * 127.5; // B
                out[idx + 3] = 255;              // Alpha
            }
        }

        ctx.putImageData(normalData, 0, 0);

        return new Texture(canvas.toDataURL());
    }
}