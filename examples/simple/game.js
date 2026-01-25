import { Bonobo } from "../../lib/bonobo.js";
// Import the core modules (Graphics, Input, etc.) into the '$' namespace for easy access
import * as $ from "../../modules/bonobo/bonobo-modules.js";
// Import optional modules explicitly (like BOBs for sprites)
import { Bob } from "../../modules/bobs/bob.js";
import { AssetsManager } from "../../modules/assets/assets.js";
import { TileMap } from "../../modules/tilemap/tilemap.js";

// --- GLOBAL VARIABLES ---
// variables for Bonobo modules
let bonobo, keys, mouse, gfx, bob, sound, font, assets, collision, joy, map;

// variables for our game
let ship, enemy, shootSnd, bulletImg, fnt, lastShot = 0, bullets = [];

// --- MAIN SETUP ---
function main(){
    // 1. Initialize the core engine
    // Instead of a class, we pass a simple object that points to our loop function
    bonobo = new Bonobo({ loop: loop });
    assets = new AssetsManager(bonobo);

    // 2. Initialize the modules
    // Use the helper to init all core modules at once
    ({ keys, mouse, gfx, sound, font, collision, joy } = $.init(bonobo, "*"));
    
    bob = new Bob(bonobo);
    map = new TileMap(bonobo);

    // Configure
    bob.autoMidHandle(true);
    gfx.clsColor(0, 50, 100);
    
    // 3. Create Assets
    ship = {
        image : bob.load("assets/ship.png"),
        x : 0,
        y : 0
    }
    enemy = {
        image : bob.load("assets/ship.png"),
        x : 320,
        y : -50
    }
    enemy.image.scaleY = -1; // Mirror the enemy vertically
    shootSnd = sound.load("assets/shoot.wav");
    bulletImg = bob.load("assets/bullet.png");
	fnt = font.load("assets/SmoochSans-Bold.ttf", "SmoochSans");
    // map.load("assets/level.json"); // Load map here once one exists

    // 4. Start the engine
    bonobo.start();
}

// --- GAME LOOP ---
function loop(){
    // Clear screen
    gfx.cls();

    if(!assets.isReady){
        // Draw a simple loading bar
        let barW = 200;
        let barH = 20;
        let x = (gfx.width - barW) / 2;
        let y = (gfx.height - barH) / 2;

        gfx.color(255, 255, 255);
        gfx.rect(x, y, barW, barH, false); // Outline
        
        if(assets.progress > 0){
            gfx.rect(x + 2, y + 2, (barW - 4) * assets.progress, barH - 4, true); // Fill
        }
        return;
    }

	font.set(fnt, 36);
    
    // Draw map (e.g. Layer "Background")
    // map.draw("Background", 0, 0);

    // Logic
    ship.x += joy.joyX(0) * 5;
    ship.y += joy.joyY(0) * 5;

    // Enemy Logic
    enemy.y += 2;
    if(enemy.y > gfx.height + 50) enemy.y = -50;

    if(joy.joyDown(0)){
        if(performance.now() - lastShot > 200){
            sound.play(shootSnd);
            lastShot = performance.now();
            bullets.push({ x: ship.x, y: ship.y });
        }
    }
    
    // Update and draw bullets
    for(let i = bullets.length - 1; i >= 0; i--){
        let b = bullets[i];
        b.y -= 10;
        bob.draw(bulletImg, b.x, b.y);
        
        if(b.y < -50) bullets.splice(i, 1);
    }

    // Draw some primitives
    gfx.color(255, 255, 0);
    gfx.rect(10, 10, 50, 50, false); // Outline rect

    // Draw
    bob.draw(ship.image, ship.x, ship.y);
    bob.draw(enemy.image, enemy.x, enemy.y);

    // Collision Check
    if(collision.imagesCollide(ship.image, ship.x, ship.y, 0, enemy.image, enemy.x, enemy.y, 0)){
        gfx.color(255, 255, 255);
        let box1 = collision.getBoundingBox(ship.image, ship.x, ship.y);
        let box2 = collision.getBoundingBox(enemy.image, enemy.x, enemy.y);
        gfx.rect(box1.x, box1.y, box1.width, box1.height, false);
        gfx.rect(box2.x, box2.y, box2.width, box2.height, false);
    }

	font.draw("Hello Bonobo!", 10, 10);
}

// Wait for the web page to fully load, then start
document.addEventListener("DOMContentLoaded", main);