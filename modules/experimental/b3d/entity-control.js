/**
 * Handles Entity Control commands (Color, Alpha, etc.).
 * Corresponds to the "Entity Control" category in Blitz3D.
 */
export class EntityControl {
    constructor() {
        // Color & Alpha (Default: White, Opaque)
        this.color = { r: 1, g: 1, b: 1, a: 1 };
        this.texture = null;
        this.normalTexture = null;
        this.roughnessTexture = null;
        this.occlusionTexture = null;
        this.emissiveTexture = null;
        this.emissiveColor = { r: 0, g: 0, b: 0 };
        this.envMap = null;
        this.metallic = 0.0;
        this.roughness = 0.5;
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

    /**
     * Applies a normal map texture to the entity.
     * @param {Texture} texture The normal map texture.
     */
    entityNormalTexture(texture) {
        this.normalTexture = texture;
    }

    /**
     * Applies a roughness/metallic texture to the entity.
     * @param {Texture} texture The roughness texture (GLTF packs Metallic in B, Roughness in G).
     */
    entityRoughnessTexture(texture) {
        this.roughnessTexture = texture;
    }

    /**
     * Applies an occlusion texture (AO).
     * @param {Texture} texture 
     */
    entityOcclusionTexture(texture) {
        this.occlusionTexture = texture;
    }

    /**
     * Applies an emissive texture.
     * @param {Texture} texture 
     */
    entityEmissiveTexture(texture) {
        this.emissiveTexture = texture;
    }

    /**
     * Sets the emissive factor color.
     */
    entityEmissiveColor(r, g, b) {
        this.emissiveColor.r = r / 255.0;
        this.emissiveColor.g = g / 255.0;
        this.emissiveColor.b = b / 255.0;
    }

    /**
     * Applies an environment map (CubeMap) for reflections.
     * @param {Texture} texture The CubeMap texture.
     */
    entityEnvMap(texture) {
        this.envMap = texture;
    }

    /**
     * Sets PBR material properties.
     * @param {number} metallic 0.0 (dielectric) to 1.0 (metal).
     * @param {number} roughness 0.0 (smooth) to 1.0 (rough).
     */
    entityPBR(metallic, roughness) {
        this.metallic = metallic;
        this.roughness = roughness;
    }
}