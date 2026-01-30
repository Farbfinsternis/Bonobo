import { Matrix4 } from "./matrix.js";
import { EntityControl } from "./entity-control.js";

/**
 * Base class for all 3D entities (Camera, Light, Mesh, etc.).
 * Handles position, rotation, scale, and hierarchy.
 */
export class Entity extends EntityControl {
    static roots = [];

    constructor() {
        super();
        // Transform
        this.x = 0;
        this.y = 0;
        this.z = 0;

        this.pitch = 0;
        this.yaw = 0;
        this.roll = 0;

        this.scaleX = 1;
        this.scaleY = 1;
        this.scaleZ = 1;

        this.visible = true;

        // Hierarchy
        this.parent = null;
        this.children = [];

        this.localMatrix = new Matrix4();
        this.worldMatrix = new Matrix4();

        Entity.roots.push(this);
    }

    /**
     * Sets the entity's absolute position.
     */
    position(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Moves the entity.
     * TODO: Implement local vs global movement when matrix math is available.
     */
    move(x, y, z) {
        this.x += x;
        this.y += y;
        this.z += z;
    }

    /**
     * Sets the entity's rotation (Euler angles).
     */
    rotate(pitch, yaw, roll) {
        this.pitch = pitch;
        this.yaw = yaw;
        this.roll = roll;
    }

    /**
     * Turns the entity.
     */
    turn(pitch, yaw, roll) {
        this.pitch += pitch;
        this.yaw += yaw;
        this.roll += roll;
    }

    /**
     * Sets the entity's scale.
     */
    scale(x, y, z) {
        this.scaleX = x;
        this.scaleY = y;
        this.scaleZ = z;
    }

    /**
     * Sets the parent of this entity.
     * @param {Entity} parent 
     */
    setParent(parent) {
        if (this.parent) {
            const idx = this.parent.children.indexOf(this);
            if (idx > -1) this.parent.children.splice(idx, 1);
        }
        
        this.parent = parent;
        
        if (parent) {
            parent.children.push(this);
            // Remove from roots if it has a parent
            const idx = Entity.roots.indexOf(this);
            if (idx > -1) Entity.roots.splice(idx, 1);
        } else {
            // Add to roots if it has no parent
            if (!Entity.roots.includes(this)) Entity.roots.push(this);
        }
    }

    /**
     * Updates the local and world matrices.
     */
    updateMatrices() {
        this.localMatrix.identity();
        this.localMatrix.translate(this.x, this.y, this.z);
        this.localMatrix.rotateY(this.yaw);
        this.localMatrix.rotateX(this.pitch);
        this.localMatrix.rotateZ(this.roll);
        this.localMatrix.scale(this.scaleX, this.scaleY, this.scaleZ);

        if (this.parent) {
            this.worldMatrix.copy(this.parent.worldMatrix);
            this.worldMatrix.multiply(this.localMatrix);
        } else {
            this.worldMatrix.copy(this.localMatrix);
        }

        for (const child of this.children) {
            child.updateMatrices();
        }
    }

    /**
     * Hides the entity.
     */
    hide() {
        this.visible = false;
    }

    /**
     * Shows the entity.
     */
    show() {
        this.visible = true;
    }

    /**
     * Checks if the entity is hidden.
     */
    hidden() {
        return !this.visible;
    }

    /**
     * Removes the entity from the scene and its parent.
     */
    free() {
        if (this.parent) {
            const idx = this.parent.children.indexOf(this);
            if (idx > -1) this.parent.children.splice(idx, 1);
            this.parent = null;
        } else {
            const idx = Entity.roots.indexOf(this);
            if (idx > -1) Entity.roots.splice(idx, 1);
        }
        
        for (const child of [...this.children]) {
            child.free();
        }
        this.children = [];
    }
}