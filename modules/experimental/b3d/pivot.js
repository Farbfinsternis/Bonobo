import { Entity } from "./entity.js";

/**
 * Represents a Pivot in the 3D scene.
 * A Pivot is an invisible entity used for hierarchy and transformations.
 * In Blitz3D, pivots were often used as parent nodes for cameras or groups of objects.
 */
export class Pivot extends Entity {
    constructor(parent) {
        super();
        if (parent) this.setParent(parent);
    }

    /**
     * Creates a new pivot.
     * @param {Entity} [parent] Optional parent entity.
     * @returns {Pivot} The created pivot.
     */
    static createPivot(parent) {
        return new Pivot(parent);
    }
}