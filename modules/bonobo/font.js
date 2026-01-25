/**
 * Handles loading and rendering of fonts.
 */
export class Font{
    constructor(bonobo){
        this.bonobo = bonobo;
        this.activeFont = null;
    }

    /**
     * Loads a font from a file.
     * @param {string} path Path to the font file.
     * @param {string} name Name to assign to the font family.
     * @returns {FontAsset} The font asset object.
     */
    load(path, name){
        let font = new FontAsset(name);
        
        this.bonobo.utils.loadFile(path, "font").then(buffer => {
            const fontFace = new FontFace(name, buffer);
            fontFace.load().then(loadedFace => {
                document.fonts.add(loadedFace);
                font.loaded = true;
            });
        }).catch(e => {
            this.bonobo.utils.error.error(`Bonobo Font: Failed to load font at ${path} - ${e}`);
        });
        return font;
    }

    /**
     * Sets the current font for drawing.
     * @param {FontAsset} font The loaded font asset.
     * @param {number} [size=12] Font size in pixels.
     * @param {boolean} [bold=false] Whether to use bold weight.
     * @param {boolean} [italic=false] Whether to use italic style.
     */
    set(font, size = 12, bold = false, italic = false){
        if(!font || !font.loaded) return;
        
        let ctx = this.bonobo.contextOwner.canvasContext;
        const style = italic ? "italic" : "normal";
        const weight = bold ? "bold" : "normal";
        
        // Set font
        ctx.font = `${style} ${weight} ${size}px "${font.name}"`;
        
        // Improvement: Align top by default (better for game coordinates)
        ctx.textBaseline = "top"; 
        
        this.activeFont = font;
    }

    /**
     * Draws text at the specified coordinates.
     * @param {string} text The text to draw.
     * @param {number} x X-coordinate.
     * @param {number} y Y-coordinate.
     */
    draw(text, x, y){
        let ctx = this.bonobo.contextOwner.canvasContext;
        ctx.fillText(text, x, y);
    }

    /**
     * Measures the width of the given text.
     * @param {string} text The text to measure.
     * @returns {number} The width in pixels.
     */
    width(text){
        let ctx = this.bonobo.contextOwner.canvasContext;
        return ctx.measureText(text).width;
    }

    /**
     * Sets the text alignment.
     * @param {string} [horizontal="left"] Horizontal alignment (left, right, center, start, end).
     * @param {string} [vertical="top"] Vertical alignment (top, hanging, middle, alphabetic, ideographic, bottom).
     */
    align(horizontal = "left", vertical = "top"){
        let ctx = this.bonobo.contextOwner.canvasContext;
        ctx.textAlign = horizontal;
        ctx.textBaseline = vertical;
    }
}

class FontAsset{
    constructor(name){
        this.name = name;
        this.loaded = false;
    }
}