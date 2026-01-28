import { Bonobo } from "../../../lib/bonobo.js";
import { Graphics3D } from "../../../modules/experimental/b3d/graphics3d.js";
import { Camera } from "../../../modules/experimental/b3d/camera.js";
import { Light } from "../../../modules/experimental/b3d/light.js";
import { Mesh } from "../../../modules/experimental/b3d/mesh.js";
import { Texture } from "../../../modules/experimental/b3d/texture.js";
import { Keyboard } from "../../../modules/bonobo/keyboard.js";
import { Draw } from "../../../modules/bonobo/draw.js";
import { Maths } from "../../../modules/bonobo/math.js";

const b = new Bonobo();
const g3d = new Graphics3D(800, 600, b);
const draw = new Draw(b);
const math = new Maths(b);
const keys = new Keyboard(b);

const cam = new Camera();
cam.position(0, 2, 5); // Kamera etwas höher
cam.rotate(-10, 0, 0); // Leicht nach unten neigen
cam.clsColor(100, 149, 237); // Cornflower Blue (Heller, damit wir es sicher sehen)

const light = new Light(2); // Point Light
light.position(10, 10, 10); // Licht von vorne
light.lightRange(50);
Light.ambientLight(200, 160, 0);

// Gras-Textur erzeugen
const grassTex = Texture.createProcedural(256, 256, b, () => {
    draw.color(0, 68, 0); // Dunkelgrüner Grund
    draw.rect(0, 0, 256, 256);
    // Rauschen / Grashalme
    for(let i=0; i<4000; i++) {
        if (math.rand(0, 100) > 50) draw.color(34, 139, 34); else draw.color(50, 205, 50);
        const x = math.rand(0, 256);
        const y = math.rand(0, 256);
        draw.rect(x, y, 2, 2);
    }
});

// Brick-Textur erzeugen
const brickTex = Texture.createProcedural(256, 256, b, () => {
    draw.color(136, 136, 136); // Fugen (Grau)
    draw.rect(0, 0, 256, 256);
    draw.color(160, 48, 48); // Ziegel (Rotbraun)
    const rows = 4, cols = 4, gap = 4;
    const bw = 256 / cols, bh = 256 / rows;
    for(let y=0; y<rows; y++) {
        const off = (y%2) * (bw/2);
        for(let x=-1; x<=cols; x++) {
            draw.rect(x*bw + off + gap/2, y*bh + gap/2, bw - gap, bh - gap);
        }
    }
});

// Boden erstellen
const plane = Mesh.createPlane();
plane.position(0, -5, 0);
plane.entityColor(255, 255, 255); // Weiß, damit Texturfarben stimmen
plane.entityTexture(grassTex);

// Beispiel für LoadMesh (noch ohne Funktion, aber Syntax ist bereit)
// const castle = Mesh.loadMesh("media/castle.b3d");
// castle.scale(0.1, 0.1, 0.1);

const cube = Mesh.createCube();
cube.position(0, 0, 0);
cube.entityColor(255, 255, 255); // Weiß
cube.entityTexture(brickTex);

function loop() {
    // Logik: Würfel drehen
    cube.turn(1, 1, 0.5);

    // Kamera Steuerung (WASD = Bewegen, Pfeile = Drehen)
    const speed = 0.1;
    const turnSpeed = 1.5;

    // Drehen
    if (keys.keyDown("KEY_LEFT")) cam.turn(0, turnSpeed, 0);
    if (keys.keyDown("KEY_RIGHT")) cam.turn(0, -turnSpeed, 0);
    if (keys.keyDown("KEY_UP")) cam.turn(-turnSpeed, 0, 0);
    if (keys.keyDown("KEY_DOWN")) cam.turn(turnSpeed, 0, 0);

    // Bewegen (In Blickrichtung)
    // Da Entity.move() noch global ist, berechnen wir hier simpel die Richtung
    // Annahme: 0 Grad Yaw schaut nach -Z (in den Bildschirm)
    // Wir nutzen math.sin/cos für einfache Vorwärtsbewegung auf der X/Z Ebene
    const yawRad = (cam.yaw + 180) * (Math.PI / 180); // +180 Korrektur für -Z Ausrichtung
    const sx = Math.sin(yawRad) * speed;
    const sz = Math.cos(yawRad) * speed;

    if (keys.keyDown("KEY_W")) cam.move(sx, 0, sz);
    if (keys.keyDown("KEY_S")) cam.move(-sx, 0, -sz);
    if (keys.keyDown("KEY_A")) cam.move(sz, 0, -sx); // 90 Grad versetzt strafen
    if (keys.keyDown("KEY_D")) cam.move(-sz, 0, sx);

    // Render
    g3d.cls();
    g3d.renderWorld();

    g3d.updateWorld(loop);
}

loop();