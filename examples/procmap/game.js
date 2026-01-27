import { Bonobo } from "../../lib/bonobo.js";
import * as $ from "../../modules/bonobo/bonobo-modules.js";
import { InputManager } from "../../modules/input/input-manager.js";

// --- VARIABLES ---
let bonobo, gfx, draw, img, input, math, font, time, files, mouse;

// Assets (generated at runtime)
let tiles = {};
let fontAsset;
let modifiedTiles = {}; // Stores user changes: "x,y" -> "type"

// Camera / Map
let camX = 0;
let camY = 0;
let speedX = 0;
let speedY = 0;
const TILE_SIZE = 32;
let worldSeed = 0;

let particles = [];
// Cursor
let cursorX = 0;
let cursorY = 0;

// --- MAIN ---
async function main(){
    bonobo = new Bonobo({ loop: loop });
    bonobo.appName("Procedural Realm");

    // Init Core Modules (No TileMap, No Bobs - just pure Bonobo)
    const modules = $.init(bonobo, "*"); // Fullscreen
    Object.assign(bonobo, modules);
    ({ gfx, draw, img, math, font, time, files, mouse } = modules);

    cursorX = gfx.width / 2;
    cursorY = gfx.height / 2;

    input = new InputManager(bonobo);

    // Setup Input
    input.bind("Up", "KEY", "KEY_W");
    input.bind("Up", "KEY", "KEY_UP");
    input.bind("Up", "JOY_AXIS", { axis: 1, dir: -1 });

    input.bind("Down", "KEY", "KEY_S");
    input.bind("Down", "KEY", "KEY_DOWN");
    input.bind("Down", "JOY_AXIS", { axis: 1, dir: 1 });

    input.bind("Left", "KEY", "KEY_A");
    input.bind("Left", "KEY", "KEY_LEFT");
    input.bind("Left", "JOY_AXIS", { axis: 0, dir: -1 });

    input.bind("Right", "KEY", "KEY_D");
    input.bind("Right", "KEY", "KEY_RIGHT");
    input.bind("Right", "JOY_AXIS", { axis: 0, dir: 1 });

    input.bind("Speed", "KEY", "KEY_LSHIFT");
    input.bind("Speed", "KEY", "KEY_RSHIFT");
    input.bind("Speed", "JOY_BTN", 4); // L1 / LB
    input.bind("Speed", "JOY_BTN", 5); // R1 / RB

    // Cursor & Action
    input.bind("CursorLeft", "JOY_AXIS", { axis: 2, dir: -1 });
    input.bind("CursorRight", "JOY_AXIS", { axis: 2, dir: 1 });
    input.bind("CursorUp", "JOY_AXIS", { axis: 3, dir: -1 });
    input.bind("CursorDown", "JOY_AXIS", { axis: 3, dir: 1 });
    input.bind("Place", "MOUSE_BTN", 0);
    input.bind("Place", "JOY_BTN", 0); // Button A / Cross
    input.bind("Place", "JOY_BTN", 1); // Button B / Circle
    input.bind("Place", "KEY", "KEY_SPACEBAR");

    // Setup Font
    // We use a system font fallback if no file is loaded, 
    // but here we just assume a default font is available or load a standard one if we had it.
    // For this demo, we'll use the default canvas font logic wrapped in our module.
    fontAsset = { name: "monospace", loaded: true }; // Hack to use system font

    // --- GENERATE ASSETS ---
    draw.clsColor(0, 0, 0);
    draw.cls();
    
    // Show loading text
    draw.color(255, 255, 255);
    font.set(fontAsset, 20);
    draw.text("Generating World Assets...", 20, 20);

    // Create tiles
    tiles.water = createTile("water", 0, 100, 255);
    tiles.sand = createTile("sand", 240, 230, 140);
    tiles.grass = createTile("grass", 50, 200, 50);
    tiles.rock = createTile("rock", 120, 120, 120);
    tiles.snow = createTile("snow", 240, 240, 255);
    tiles.lava = createTile("lava", 255, 50, 0);

    // Init Noise
    // Try to load existing world seed to keep the world persistent across reloads
    let worldData = await files.loadJSON("world.json");
    
    if(worldData){
        if(worldData.seed) worldSeed = worldData.seed;
        if(worldData.mods) modifiedTiles = worldData.mods;
    } else {
        worldSeed = Math.random();
        await files.saveJSON("world.json", { seed: worldSeed });
    }
    Noise.seed(worldSeed);

    bonobo.start();
}

// --- ASSET GENERATION ---
function createTile(type, r, g, b){
    // 1. Draw the texture on the hidden backbuffer
    // Base color
    draw.color(r, g, b);
    draw.rect(0, 0, TILE_SIZE, TILE_SIZE, true);

    // Add Noise / Details
    for(let i=0; i<40; i++){
        let noise = math.rand(-20, 20);
        draw.color(r + noise, g + noise, b + noise);
        
        if(type === "grass"){
            // Draw grass blades
            let x = math.rand(0, TILE_SIZE);
            let y = math.rand(0, TILE_SIZE);
            draw.line(x, y, x, y-3);
        } else if (type === "rock"){
            // Draw cracks
            let x = math.rand(0, TILE_SIZE);
            let y = math.rand(0, TILE_SIZE);
            draw.rect(x, y, math.rand(2,5), math.rand(2,5), true);
        } else if (type === "water"){
            // Draw waves
            draw.color(255, 255, 255, 0.3);
            let x = math.rand(0, TILE_SIZE);
            let y = math.rand(0, TILE_SIZE);
            draw.line(x, y, x+5, y);
        } else if (type === "lava"){
            // Draw black rocks on lava
            draw.color(20, 20, 20);
            let x = math.rand(0, TILE_SIZE);
            let y = math.rand(0, TILE_SIZE);
            draw.rect(x, y, math.rand(4, 10), math.rand(4, 10), true);
        } else {
            // Simple noise pixels
            draw.plot(math.rand(0, TILE_SIZE), math.rand(0, TILE_SIZE));
        }
    }

    // 2. Create a placeholder Image Object
    // Use createImage to get a clean container without triggering a file load
    let asset = img.createImage(TILE_SIZE, TILE_SIZE);

    // 3. Grab the pixels from screen into the object
    img.grabImage(asset, 0, 0);

    return asset;
}

// --- GAME LOOP ---
function loop(){
    // Update Camera
    let moveSpeed = input.isPressed("Speed") ? 10 : 4;
    
    // Use getValue for analog input support (Gamepad/Keyboard)
    camY -= input.getValue("Up") * moveSpeed;
    camY += input.getValue("Down") * moveSpeed;
    camX -= input.getValue("Left") * moveSpeed;
    camX += input.getValue("Right") * moveSpeed;

    // RTS Edge Scrolling
    const margin = 100;
    const edgeMaxSpeed = input.isPressed("Speed") ? 50 : 20;

    if(mouse.x < margin) {
        camX -= edgeMaxSpeed * Math.min(1, (margin - mouse.x) / margin);
    }
    if(mouse.x > gfx.width - margin) {
        camX += edgeMaxSpeed * Math.min(1, (mouse.x - (gfx.width - margin)) / margin);
    }
    if(mouse.y < margin) {
        camY -= edgeMaxSpeed * Math.min(1, (margin - mouse.y) / margin);
    }
    if(mouse.y > gfx.height - margin) {
        camY += edgeMaxSpeed * Math.min(1, (mouse.y - (gfx.height - margin)) / margin);
    }

    // Update Cursor
    // If mouse moves, it takes priority
    if(mouse.xSpeed !== 0 || mouse.ySpeed !== 0){
        cursorX = mouse.x;
        cursorY = mouse.y;
    }
    // Gamepad adds to cursor position
    cursorX -= input.getValue("CursorLeft") * 10;
    cursorX += input.getValue("CursorRight") * 10;
    cursorY -= input.getValue("CursorUp") * 10;
    cursorY += input.getValue("CursorDown") * 10;

    // Clamp cursor to screen
    cursorX = Math.max(0, Math.min(gfx.width, cursorX));
    cursorY = Math.max(0, Math.min(gfx.height, cursorY));

    // Place Tile Logic
    if(input.isHit("Place")){
        // If mouse clicked, snap cursor to mouse position immediately
        if(mouse.hit(0)){
            cursorX = mouse.x;
            cursorY = mouse.y;
        }

        // Calculate World Coordinates of the cursor
        let worldX = Math.floor((camX + cursorX) / TILE_SIZE);
        let worldY = Math.floor((camY + cursorY) / TILE_SIZE);
        
        // Check if target is water
        let isWater = false;
        let mod = modifiedTiles[`${worldX},${worldY}`];
        
        if(mod === "water"){
            isWater = true;
        } else if(!mod){
            if(getBiome(worldX, worldY) === tiles.water){
                isWater = true;
            }
        }

        if(!isWater){
            // Save modification
            modifiedTiles[`${worldX},${worldY}`] = "lava";
            saveWorld();

            // Spawn Particles
            for(let i=0; i<8; i++){
                particles.push({
                    x: cursorX + (Math.random() - 0.5) * 20,
                    y: cursorY + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4 + -2, // Upward bias
                    life: 1.0
                });
            }
        }
    }

    draw.cls();

    // Render Map
    renderMap();
    renderCursor();
    renderParticles();

    // UI
    drawUI();
}

function renderMap(){
    // Calculate visible range
    const startCol = Math.floor(camX / TILE_SIZE);
    const startRow = Math.floor(camY / TILE_SIZE);
    
    const colsToDraw = Math.ceil(gfx.width / TILE_SIZE) + 1;
    const rowsToDraw = Math.ceil(gfx.height / TILE_SIZE) + 1;

    // Robust offset calculation that handles negative coordinates correctly
    const offsetX = Math.floor(camX / TILE_SIZE) * TILE_SIZE - camX;
    const offsetY = Math.floor(camY / TILE_SIZE) * TILE_SIZE - camY;

    // Loop through visible grid
    for(let y = 0; y < rowsToDraw; y++){
        for(let x = 0; x < colsToDraw; x++){
            
            // World Coordinates
            let worldX = startCol + x;
            let worldY = startRow + y;

            // Check for user modification first
            let tileType = modifiedTiles[`${worldX},${worldY}`];
            let tileImg;
            if(tileType && tiles[tileType]){
                tileImg = tiles[tileType];
            } else {
                tileImg = getBiome(worldX, worldY);
            }

            // Draw
            let drawX = Math.floor(offsetX + (x * TILE_SIZE));
            let drawY = Math.floor(offsetY + (y * TILE_SIZE));

            img.draw(tileImg, drawX, drawY);
        }
    }
}

function getBiome(x, y){
    // Use Perlin Noise for organic terrain
    // We combine two layers (Octaves) for detail
    let n = Noise.perlin2(x * 0.05, y * 0.05);       // Base continent shape
    n += Noise.perlin2(x * 0.1, y * 0.1) * 0.5;      // Details
    
    // n is roughly between -1 and 1
    
    if(n < -0.4) return tiles.water; // Deep water
    if(n < -0.3) return tiles.sand;  // Beach
    if(n < 0.3) return tiles.grass;  // Plains
    if(n < 0.6) return tiles.rock;   // Mountains
    return tiles.snow;               // Peaks
}

function renderCursor(){
    let worldX = Math.floor((camX + cursorX) / TILE_SIZE);
    let worldY = Math.floor((camY + cursorY) / TILE_SIZE);

    let snapX = Math.floor(worldX * TILE_SIZE - camX);
    let snapY = Math.floor(worldY * TILE_SIZE - camY);

    draw.color(255, 255, 255);
    draw.rect(snapX, snapY, TILE_SIZE, TILE_SIZE, false);
    draw.line(snapX + TILE_SIZE/2 - 5, snapY + TILE_SIZE/2, snapX + TILE_SIZE/2 + 5, snapY + TILE_SIZE/2);
    draw.line(snapX + TILE_SIZE/2, snapY + TILE_SIZE/2 - 5, snapX + TILE_SIZE/2, snapY + TILE_SIZE/2 + 5);
}

function renderParticles(){
    for(let i = particles.length - 1; i >= 0; i--){
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        
        if(p.life <= 0){
            particles.splice(i, 1);
            continue;
        }
        
        draw.color(255, 100, 0, p.life);
        draw.rect(p.x, p.y, 4, 4, true);
    }
}

async function saveWorld(){
    // We save both seed and modifications
    await files.saveJSON("world.json", { seed: worldSeed, mods: modifiedTiles });
}

function drawUI(){
    draw.color(0, 0, 0, 0.5);
    draw.rect(0, 0, gfx.width, 40, true);
    
    draw.color(255, 255, 255);
    font.set(fontAsset, 20);
    draw.text(`POS: ${Math.floor(camX)}, ${Math.floor(camY)}`, 10, 10);
    draw.text("ARROWS/WASD/PAD to fly. SHIFT for speed.", 200, 10);
    draw.text("Click/Btn 1/Space to place Lava. Right Stick moves cursor.", 200, 35);
    draw.text(`SEED: ${worldSeed.toFixed(6)}`, 10, 35);
}

document.addEventListener("DOMContentLoaded", main);

// --- PERLIN NOISE IMPLEMENTATION ---
// A compact, dependency-free Perlin Noise implementation
const Noise = {
    perm: new Uint8Array(512),
    grad3: [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],
    
    seed(val) {
        for(let i=0; i<256; i++) this.perm[i] = i;
        // Shuffle
        for(let i=255; i>0; i--) {
            const r = Math.floor((val * (i+1)) % (i+1)); // Simple pseudo-shuffle
            val = Math.sin(val) * 10000; // Mutate seed
            [this.perm[i], this.perm[r]] = [this.perm[r], this.perm[i]];
        }
        // Duplicate for overflow
        for(let i=0; i<256; i++) this.perm[256+i] = this.perm[i];
    },

    dot(g, x, y) { return g[0]*x + g[1]*y; },
    mix(a, b, t) { return (1-t)*a + t*b; },
    fade(t) { return t*t*t*(t*(t*6-15)+10); },

    perlin2(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);

        const gi00 = this.perm[X+this.perm[Y]] % 12;
        const gi01 = this.perm[X+this.perm[Y+1]] % 12;
        const gi10 = this.perm[X+1+this.perm[Y]] % 12;
        const gi11 = this.perm[X+1+this.perm[Y+1]] % 12;

        const n00 = this.dot(this.grad3[gi00], x, y);
        const n01 = this.dot(this.grad3[gi01], x, y-1);
        const n10 = this.dot(this.grad3[gi10], x-1, y);
        const n11 = this.dot(this.grad3[gi11], x-1, y-1);

        const u = this.fade(x);
        const v = this.fade(y);
        
        return this.mix(this.mix(n00, n10, u), this.mix(n01, n11, u), v);
    }
};