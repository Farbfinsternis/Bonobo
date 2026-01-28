import { Entity } from "./entity.js";
import { Matrix4 } from "./matrix.js";

/**
 * Represents a camera in the 3D scene.
 * Emulates Blitz3D camera commands.
 */
export class Camera extends Entity {
    constructor(parent) {
        super();
        if (parent) this.setParent(parent);

        this.clsColorValues = { r: 0, g: 0, b: 0 };
        this.clsModeValues = { color: true, zBuffer: true };
        this.viewportValues = { x: 0, y: 0, w: 0, h: 0, auto: true };
        this.rangeValues = { near: 1.0, far: 1000.0 };
        this.zoomValue = 1.0;
        this.projModeValue = 1; // 1 = Perspective, 2 = Orthographic

        this.projectionMatrix = new Matrix4();
        
        // Projected coordinates (set by cameraProject)
        this.projectedX = 0;
        this.projectedY = 0;
        this.projectedZ = 0;
    }

    /**
     * Sets the viewport of the camera.
     * If not called, it defaults to the full screen.
     * @param {number} x X coordinate
     * @param {number} y Y coordinate
     * @param {number} width Width
     * @param {number} height Height
     */
    viewport(x, y, width, height) {
        this.viewportValues.x = x;
        this.viewportValues.y = y;
        this.viewportValues.w = width;
        this.viewportValues.h = height;
        this.viewportValues.auto = false;
    }

    /**
     * Sets the clear color of the camera.
     * @param {number} r Red (0-255)
     * @param {number} g Green (0-255)
     * @param {number} b Blue (0-255)
     */
    clsColor(r, g, b) {
        this.clsColorValues.r = r / 255.0;
        this.clsColorValues.g = g / 255.0;
        this.clsColorValues.b = b / 255.0;
    }

    /**
     * Sets the clear mode of the camera.
     * @param {boolean} color Clear color buffer?
     * @param {boolean} zBuffer Clear depth buffer?
     */
    clsMode(color, zBuffer) {
        this.clsModeValues.color = !!color;
        this.clsModeValues.zBuffer = !!zBuffer;
    }

    /**
     * Sets the near and far clip planes.
     * @param {number} near Near clip plane
     * @param {number} far Far clip plane
     */
    range(near, far) {
        this.rangeValues.near = near;
        this.rangeValues.far = far;
    }

    /**
     * Sets the camera zoom factor.
     * @param {number} zoom Zoom factor (1.0 = 90 degrees FOV)
     */
    zoom(zoom) {
        this.zoomValue = zoom;
    }

    /**
     * Sets the projection mode.
     * @param {number} mode 1=Perspective, 2=Orthographic
     */
    projMode(mode) {
        this.projModeValue = mode;
    }

    /**
     * Updates the projection matrix.
     * @param {number} canvasWidth 
     * @param {number} canvasHeight 
     */
    updateProjection(canvasWidth, canvasHeight) {
        let w = this.viewportValues.auto ? canvasWidth : this.viewportValues.w;
        let h = this.viewportValues.auto ? canvasHeight : this.viewportValues.h;
        let aspect = w / h;

        if (this.projModeValue === 1) {
            // Blitz3D Zoom 1.0 corresponds to 90 degrees FOV (approx)
            // Formula: zoom = 1 / tan(fov / 2)
            // Therefore: fov = 2 * atan(1 / zoom)
            const fov = 2 * Math.atan(1.0 / this.zoomValue) * (180 / Math.PI);
            this.projectionMatrix.perspective(fov, aspect, this.rangeValues.near, this.rangeValues.far);
        } else {
            // Orthographic fallback (TODO: Implement ortho in Matrix4)
            this.projectionMatrix.identity();
        }
    }
}