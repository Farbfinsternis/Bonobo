/**
 * Provides collision detection methods (AABB and Pixel-Perfect).
 */
export class Collision{
    constructor(bonobo){
        this.bonobo = bonobo;
    }

    /**
     * Checks if two axis-aligned rectangles overlap.
     * @param {number} x1 X-coordinate of first rect.
     * @param {number} y1 Y-coordinate of first rect.
     * @param {number} w1 Width of first rect.
     * @param {number} h1 Height of first rect.
     * @param {number} x2 X-coordinate of second rect.
     * @param {number} y2 Y-coordinate of second rect.
     * @param {number} w2 Width of second rect.
     * @param {number} h2 Height of second rect.
     * @returns {boolean} True if overlapping.
     */
    rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 &&
               x1 + w1 > x2 &&
               y1 < y2 + h2 &&
               y1 + h1 > y2;
    }

    /**
     * Calculates the axis-aligned bounding box (AABB) for a transformed image.
     * @param {object} img The image or BOB object.
     * @param {number} x The x-position.
     * @param {number} y The y-position.
     * @returns {object} The bounding box {x, y, width, height}.
     */
    getBoundingBox(img, x, y) {
        const w = img.tileWidth;
        const h = img.tileHeight;
        const hx = img.handleX || 0;
        const hy = img.handleY || 0;
        
        // Fallback if Rotation/Scale are not yet implemented in Bob/Image
        const sx = img.scaleX || 1;
        const sy = img.scaleY || 1;
        const rotation = img.rotation || 0;

        // Optimization: If no transformation, return simple box
        if (rotation === 0 && sx === 1 && sy === 1) {
            return { x: x - hx, y: y - hy, width: w, height: h };
        }

        const rad = rotation * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const corners = [
            { x: -hx, y: -hy },
            { x: w - hx, y: -hy },
            { x: w - hx, y: h - hy },
            { x: -hx, y: h - hy }
        ];

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (const corner of corners) {
            const scaledX = corner.x * sx;
            const scaledY = corner.y * sy;

            const rotatedX = scaledX * cos - scaledY * sin;
            const rotatedY = scaledX * sin + scaledY * cos;

            const finalX = rotatedX + x;
            const finalY = rotatedY + y;

            minX = Math.min(minX, finalX);
            maxX = Math.max(maxX, finalX);
            minY = Math.min(minY, finalY);
            maxY = Math.max(maxY, finalY);
        }

        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    /**
     * Checks if two images overlap based on their bounding boxes.
     * @param {object} img1 First image/BOB.
     * @param {number} x1 X-pos of first image.
     * @param {number} y1 Y-pos of first image.
     * @param {object} img2 Second image/BOB.
     * @param {number} x2 X-pos of second image.
     * @param {number} y2 Y-pos of second image.
     * @returns {boolean} True if bounding boxes overlap.
     */
    imagesOverlap(img1, x1, y1, img2, x2, y2) {
        if (!img1 || !img2 || !img1.loaded || !img2.loaded) {
            return false;
        }

        const box1 = this.getBoundingBox(img1, x1, y1);
        const box2 = this.getBoundingBox(img2, x2, y2);

        return this.rectsOverlap(box1.x, box1.y, box1.width, box1.height, box2.x, box2.y, box2.width, box2.height);
    }

    /**
     * Helper to extract pixel data from ImageBitmap (cached).
     * @private
     */
    #getImageData(img) {
        if (img.pixelData) return img.pixelData;
        if (!img.loaded) return null;

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img.data, 0, 0);
        img.pixelData = ctx.getImageData(0, 0, img.width, img.height);
        return img.pixelData;
    }

    /**
     * Checks for pixel-perfect collision between two images.
     * @param {object} img1 First image/BOB.
     * @param {number} x1 X-pos of first image.
     * @param {number} y1 Y-pos of first image.
     * @param {number} [frame1=0] Frame index of first image.
     * @param {object} img2 Second image/BOB.
     * @param {number} x2 X-pos of second image.
     * @param {number} y2 Y-pos of second image.
     * @param {number} [frame2=0] Frame index of second image.
     * @param {number} [alphaThreshold=128] Alpha threshold for collision (0-255).
     * @returns {boolean} True if solid pixels overlap.
     */
    imagesCollide(img1, x1, y1, frame1 = 0, img2, x2, y2, frame2 = 0, alphaThreshold = 128) {
        // 1. Bounding Box Check (fast)
        const box1 = this.getBoundingBox(img1, x1, y1);
        const box2 = this.getBoundingBox(img2, x2, y2);
        
        if (!this.rectsOverlap(box1.x, box1.y, box1.width, box1.height, box2.x, box2.y, box2.width, box2.height)) {
            return false;
        }

        // 2. Pixel Perfect Check (precise, but expensive)
        const data1 = this.#getImageData(img1);
        const data2 = this.#getImageData(img2);
        
        if (!data1 || !data2) return false;

        const intersectX1 = Math.max(box1.x, box2.x);
        const intersectY1 = Math.max(box1.y, box2.y);
        const intersectX2 = Math.min(box1.x + box1.width, box2.x + box2.width);
        const intersectY2 = Math.min(box1.y + box1.height, box2.y + box2.height);

        // Prepare transformations
        const prepareTransform = (img) => {
            const rot = img.rotation || 0;
            const sx = img.scaleX || 1;
            const sy = img.scaleY || 1;
            const rad = -rot * Math.PI / 180;
            return {
                cos: Math.cos(rad),
                sin: Math.sin(rad),
                invSx: 1 / sx,
                invSy: 1 / sy,
                hx: img.handleX || 0,
                hy: img.handleY || 0,
                tilesPerRow: Math.floor(img.width / img.tileWidth)
            };
        };

        const t1 = prepareTransform(img1);
        const t2 = prepareTransform(img2);

        const f1x = (frame1 % t1.tilesPerRow) * img1.tileWidth;
        const f1y = Math.floor(frame1 / t1.tilesPerRow) * img1.tileHeight;
        const f2x = (frame2 % t2.tilesPerRow) * img2.tileWidth;
        const f2y = Math.floor(frame2 / t2.tilesPerRow) * img2.tileHeight;

        for (let y = Math.floor(intersectY1); y < intersectY2; y++) {
            for (let x = Math.floor(intersectX1); x < intersectX2; x++) {
                // Transform screen -> local (img1)
                const dx1 = x - x1, dy1 = y - y1;
                const rx1 = dx1 * t1.cos - dy1 * t1.sin;
                const ry1 = dx1 * t1.sin + dy1 * t1.cos;
                const lx1 = (rx1 * t1.invSx) + t1.hx;
                const ly1 = (ry1 * t1.invSy) + t1.hy;

                // Transform screen -> local (img2)
                const dx2 = x - x2, dy2 = y - y2;
                const rx2 = dx2 * t2.cos - dy2 * t2.sin;
                const ry2 = dx2 * t2.sin + dy2 * t2.cos;
                const lx2 = (rx2 * t2.invSx) + t2.hx;
                const ly2 = (ry2 * t2.invSy) + t2.hy;

                if (lx1 >= 0 && lx1 < img1.tileWidth && ly1 >= 0 && ly1 < img1.tileHeight &&
                    lx2 >= 0 && lx2 < img2.tileWidth && ly2 >= 0 && ly2 < img2.tileHeight) {

                    const alpha1 = data1.data[((f1y + Math.floor(ly1)) * data1.width + (f1x + Math.floor(lx1))) * 4 + 3];
                    const alpha2 = data2.data[((f2y + Math.floor(ly2)) * data2.width + (f2x + Math.floor(lx2))) * 4 + 3];

                    if (alpha1 > alphaThreshold && alpha2 > alphaThreshold) return true;
                }
            }
        }

        return false;
    }
}