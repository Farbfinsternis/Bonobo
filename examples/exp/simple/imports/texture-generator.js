import { Texture } from "../../../../modules/experimental/b3d/texture.js";

export class TextureGenerator {
    constructor(bonobo, draw, math) {
        this.bonobo = bonobo;
        this.draw = draw;
        this.math = math;
    }

    createGrass() {
        return Texture.createProcedural(256, 256, this.bonobo, () => {
            this.draw.color(0, 68, 0); // Dunkelgrüner Grund
            this.draw.rect(0, 0, 256, 256);
            // Rauschen / Grashalme
            for (let i = 0; i < 4000; i++) {
                if (this.math.rand(0, 100) > 50) this.draw.color(34, 139, 34); else this.draw.color(50, 205, 50);
                const x = this.math.rand(0, 256);
                const y = this.math.rand(0, 256);
                this.draw.rect(x, y, 2, 2);
            }
        });
    }

    createBrick() {
        return Texture.createProcedural(256, 256, this.bonobo, () => {
            this.draw.color(136, 136, 136); // Fugen (Grau)
            this.draw.rect(0, 0, 256, 256);
            this.draw.color(160, 48, 48); // Ziegel (Rotbraun)
            const rows = 4, cols = 4, gap = 4;
            const bw = 256 / cols, bh = 256 / rows;
            for (let y = 0; y < rows; y++) {
                const off = (y % 2) * (bw / 2);
                for (let x = -1; x <= cols; x++) {
                    this.draw.rect(x * bw + off + gap / 2, y * bh + gap / 2, bw - gap, bh - gap);
                }
            }
        });
    }

    createBrickNormal(strength = 5.0) {
        return Texture.createFromHeightMap(256, 256, this.bonobo, () => {
            this.draw.color(0, 0, 0); // Fugen (Tief = Schwarz)
            this.draw.rect(0, 0, 256, 256);
            this.draw.color(255, 255, 255); // Ziegel (Hoch = Weiß)
            const rows = 4, cols = 4, gap = 4;
            const bw = 256 / cols, bh = 256 / rows;
            for (let y = 0; y < rows; y++) {
                const off = (y % 2) * (bw / 2);
                for (let x = -1; x <= cols; x++) {
                    this.draw.rect(x * bw + off + gap / 2, y * bh + gap / 2, bw - gap, bh - gap);
                }
            }
        }, strength);
    }

    createSky() {
        return Texture.createProcedural(1024, 1024, this.bonobo, () => {
            this.draw.color(40, 40, 80); // Etwas hellerer Hintergrund für Sichtbarkeit
            this.draw.rect(0, 0, 1024, 1024);
            this.draw.color(255, 255, 255);
            // Größere Sterne für bessere Sichtbarkeit
            for (let i = 0; i < 1000; i++) {
                const x = this.math.rand(0, 1024);
                const y = this.math.rand(0, 1024);
                this.draw.rect(x, y, 2, 2);
            }
        });
    }
}