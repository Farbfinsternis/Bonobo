/**
 * Handles First-Person / Free-Flight player control.
 * Manages a pivot (body) and a camera (head).
 */
export class PlayerController {
    /**
     * @param {Entity} player The player entity (usually a Pivot representing the body/feet).
     * @param {Camera} camera The camera entity (usually a child of the player).
     * @param {Keyboard} keys The Bonobo Keyboard module instance.
     * @param {Mouse} mouse The Bonobo Mouse module instance.
     */
    constructor(player, camera, keys, mouse) {
        this.player = player;
        this.camera = camera;
        this.keys = keys;
        this.mouse = mouse;

        // Settings
        this.speed = 0.5;
        this.turnSpeed = 1.5;
        this.mouseSensitivity = 0.2;

        // State
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    /**
     * Updates the player position and rotation based on input.
     * Should be called every frame.
     */
    update() {
        // Maus-Steuerung
        const dx = this.mouse.x - this.lastMouseX;
        const dy = this.mouse.y - this.lastMouseY;
        this.lastMouseX = this.mouse.x;
        this.lastMouseY = this.mouse.y;

        // Pointer Lock aktivieren bei Klick
        if (this.mouse.down(0) && !this.mouse.isLocked) {
            this.mouse.lockPointer();
        }

        // Drehen wenn gelockt
        if (this.mouse.isLocked) {
            this.player.turn(0, -dx * this.mouseSensitivity, 0); // Körper dreht sich (Yaw)
            this.camera.turn(-dy * this.mouseSensitivity, 0, 0);    // Kopf nickt (Pitch)
        }

        // Tasten-Steuerung (Fallback für Drehung)
        if (this.keys.keyDown("KEY_LEFT")) this.player.turn(0, this.turnSpeed, 0);
        if (this.keys.keyDown("KEY_RIGHT")) this.player.turn(0, -this.turnSpeed, 0);
        if (this.keys.keyDown("KEY_UP")) this.camera.turn(-this.turnSpeed, 0, 0);
        if (this.keys.keyDown("KEY_DOWN")) this.camera.turn(this.turnSpeed, 0, 0);

        // Bewegen (In Blickrichtung - Free Flight)
        const yawRad = (this.player.yaw + 180) * (Math.PI / 180);
        const pitchRad = this.camera.pitch * (Math.PI / 180);

        // Vorwärts-Vektor (3D)
        const fwdScale = Math.cos(pitchRad);
        const fwdX = Math.sin(yawRad) * fwdScale * this.speed;
        const fwdY = Math.sin(pitchRad) * this.speed;
        const fwdZ = Math.cos(yawRad) * fwdScale * this.speed;

        // Seitwärts-Vektor (Strafe - Flach auf XZ)
        const leftYawRad = (this.player.yaw + 180 + 90) * (Math.PI / 180);
        const leftX = Math.sin(leftYawRad) * this.speed;
        const leftZ = Math.cos(leftYawRad) * this.speed;

        if (this.keys.keyDown("KEY_W")) this.player.move(fwdX, fwdY, fwdZ);
        if (this.keys.keyDown("KEY_S")) this.player.move(-fwdX, -fwdY, -fwdZ);
        if (this.keys.keyDown("KEY_A")) this.player.move(leftX, 0, leftZ);
        if (this.keys.keyDown("KEY_D")) this.player.move(-leftX, 0, -leftZ);
    }
}