import { Bonobo } from "../../../lib/bonobo.js";
import { Graphics3D } from "../../../modules/experimental/b3d/graphics3d.js";
import { Camera } from "../../../modules/experimental/b3d/camera.js";
import { Light } from "../../../modules/experimental/b3d/light.js";
import { Mesh } from "../../../modules/experimental/b3d/mesh.js";
import { Skybox } from "../../../modules/experimental/b3d/skybox.js";
import { Pivot } from "../../../modules/experimental/b3d/pivot.js";
import { Texture } from "../../../modules/experimental/b3d/texture.js";
import { Keyboard } from "../../../modules/bonobo/keyboard.js";
import { Mouse } from "../../../modules/bonobo/mouse.js";
import { Draw } from "../../../modules/bonobo/draw.js";
import { Maths } from "../../../modules/bonobo/math.js";
import { PlayerController } from "./imports/player-control.js";
import { TextureGenerator } from "./imports/texture-generator.js";
import { LevelGenerator } from "./imports/level-generator.js";

const b = new Bonobo();
const g3d = new Graphics3D("*", b);
const draw = new Draw(b);
const math = new Maths(b);
const keys = new Keyboard(b);
const mouse = new Mouse(b);

// Generatoren initialisieren
const texGen = new TextureGenerator(b, draw, math);
const levelGen = new LevelGenerator(math);

// Kamera-Rig erstellen (Pivot als Körper, Kamera als Kopf)
const player = Pivot.createPivot();
player.position(0, 2, 5);

const cam = new Camera(player); // Kamera an Pivot hängen
cam.position(0, 0, 0); // Lokal 0,0,0 (im Kopf des Spielers)
cam.rotate(-10, 0, 0); // Leicht nach unten neigen
cam.clsColor(0, 0, 0); // Schwarz, da wir jetzt eine Skybox haben

const controller = new PlayerController(player, cam, keys, mouse);

const light = new Light(2); // Point Light
light.position(10, 10, 10); // Licht von vorne
light.lightRange(50);
Light.ambientLight(60, 60, 60); // Dunkleres Ambient, damit Reflexionen wirken

// Texturen generieren
const grassTex = texGen.createGrass();
const brickTex = texGen.createBrick();
const brickNormalTex = texGen.createBrickNormal(5.0);
const skyTex = texGen.createSky();

// Environment Map für Reflexionen erstellen (aus der Skybox-Textur)
const envMap = Texture.createCubeMapFromSingle(skyTex);

// Skybox erstellen
const sky = new Skybox();
sky.entityEmissiveTexture(skyTex); // Emissive nutzen, damit es selbst leuchtet (Unlit)

// Boden erstellen
const plane = Mesh.createPlane();
plane.position(0, -5, 0);
plane.entityColor(255, 255, 255); // Weiß, damit Texturfarben stimmen
plane.entityTexture(grassTex);

// Beispiel für LoadMesh (noch ohne Funktion, aber Syntax ist bereit)
// const castle = Mesh.loadMesh("media/castle.b3d");
// castle.scale(0.1, 0.1, 0.1);

const masterCube = Mesh.createCube();
masterCube.entityTexture(brickTex);
masterCube.entityNormalTexture(brickNormalTex); // Normal Map anwenden
masterCube.entityEnvMap(envMap); // Reflexionen aktivieren!
masterCube.entityPBR(1.0, 0.0); // Metallisch und perfekt glatt für Spiegelung
masterCube.hide();

const cubes = levelGen.createAsteroidField(masterCube, 1000);

let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

function loop() {
    // Logik: Würfel drehen
    for (const c of cubes) {
        c.turn(c.rotX, c.rotY, c.rotZ);
    }

    controller.update();

    // Render
    g3d.cls();
    g3d.renderWorld();

    // FPS Berechnung
    const now = performance.now();
    frameCount++;
    if (now - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = now;
    }

    // 2D Overlay (FPS Anzeige)
    const ctx = g3d.canvasData.context;
    ctx.fillStyle = "yellow";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`FPS: ${fps}`, 10, 20);

    ctx.fillStyle = "white";
    ctx.font = "12px monospace";
    ctx.fillText("Klick zum Starten", 10, 40);
    ctx.fillText("WASD + Mouse zum Steuern", 10, 55);
    ctx.fillText("ESC zum Deaktivieren des Locks", 10, 70);

    g3d.updateWorld(loop);
}

loop();