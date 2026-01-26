import { Bonobo } from "../../lib/bonobo.js";
// Import the core modules (Graphics, Input, etc.) into the '$' namespace for easy access
import * as $ from "../../modules/bonobo/bonobo-modules.js";
// Import optional modules explicitly (like BOBs for sprites)
import { Bob } from "../../modules/bobs/bob.js";
import { AssetsManager } from "../../modules/assets/assets.js";
import { TileMap } from "../../modules/tilemap/tilemap.js";

// --- GLOBAL VARIABLES ---
// variables for Bonobo modules
let bonobo, keys, mouse, gfx, bob, sound, font, assets, collision, joy, map, draw, file;

// variables for our game
let ship, enemy, shootSnd, bulletImg, fnt, lastShot = 0, bullets = [], explosions = [];
let state = "MENU"; // MENU, GAME, GAMEOVER
let score = 0;
let highScore = 0;

// --- MAIN SETUP ---
async function main(){
    // 1. Initialize the core engine
    // Instead of a class, we pass a simple object that points to our loop function
    bonobo = new Bonobo({ loop: loop });
    bonobo.appName("Fancy Space Shooter Game");
    assets = new AssetsManager(bonobo);

    // 2. Initialize the modules
    // Use the helper to init all core modules at once
    ({ keys, mouse, gfx, draw, sound, font, collision, joy, file } = $.init(bonobo, "*"));
    
    bob = new Bob(bonobo);
    map = new TileMap(bonobo);

    // Configure
    bob.autoMidHandle(true);
    draw.clsColor(0, 50, 100);
    mouse.hidePointer();
    
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
    
    // Load Highscore from VFS
    const hsData = await file.loadJSON("highscore.json");
    if(hsData && hsData.score) highScore = hsData.score;

    // 4. Start the engine
    bonobo.start();
}

// --- GAME LOOP ---
function loop(){
    // Clear screen
    draw.cls();

    if(!assets.isReady){
        // Draw a simple loading bar
        let barW = 200;
        let barH = 20;
        let x = (gfx.width - barW) / 2;
        let y = (gfx.height - barH) / 2;

        draw.color(255, 255, 255);
        draw.rect(x, y, barW, barH, false); // Outline
        
        if(assets.progress > 0){
            draw.rect(x + 2, y + 2, (barW - 4) * assets.progress, barH - 4, true); // Fill
        }
        return;
    }

    if(state === "MENU"){
        updateMenu();
    } else if(state === "GAME"){
        updateGame();
    } else if(state === "GAMEOVER"){
        updateGameOver();
    }
}

// --- STATE FUNCTIONS ---

function updateGame(){
    draw.color(255, 255, 255);
    font.align("left", "top");
    font.set(fnt, 36);
    font.draw("Score: " + score, 10, 10);

    // Ship Movement (Keyboard + Gamepad)
    let dx = joy.joyX(0);
    if(keys.keyDown("KEY_LEFT")) dx = -1;
    if(keys.keyDown("KEY_RIGHT")) dx = 1;
    ship.x += dx * 5;
    
    // Clamp ship to screen
    if(ship.x < 0) ship.x = 0;
    if(ship.x > gfx.width - 32) ship.x = gfx.width - 32;

    // Enemy Logic
    if(joy.joyDown(0) || keys.keyDown("KEY_SPACEBAR")){
        if(performance.now() - lastShot > 200){
            sound.playAt(shootSnd, ship.x, ship.y);
            lastShot = performance.now();
            bullets.push({ x: ship.x, y: ship.y });
        }
    }
    
    // Move Enemy
    enemy.y += 2 + (score * 0.1); // Increase difficulty
    if(enemy.y > gfx.height + 50){
        enemy.y = -50;
        enemy.x = Math.random() * (gfx.width - 32);
    }

    // Update and draw bullets
    for(let i = bullets.length - 1; i >= 0; i--){
        let b = bullets[i];
        b.y -= 10;
        bob.draw(bulletImg, b.x, b.y);
        
        // Collision Bullet vs Enemy
        if(collision.imagesCollide(bulletImg, b.x, b.y, 0, enemy.image, enemy.x, enemy.y, 0)){
            score++;
            bullets.splice(i, 1);
            
            // Spawn Explosion
            for(let k=0; k<20; k++){
                explosions.push({
                    x: enemy.x + 16,
                    y: enemy.y + 16,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 1.0
                });
            }
            
            enemy.y = -50;
            enemy.x = Math.random() * (gfx.width - 32);
            continue;
        }

        if(b.y < -50) bullets.splice(i, 1);
    }

    // Draw Explosions
    for(let i = explosions.length - 1; i >= 0; i--){
        let p = explosions[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        
        if(p.life <= 0){
            explosions.splice(i, 1);
            continue;
        }
        
        draw.color(255, 200, 50, p.life);
        draw.rect(p.x, p.y, 4, 4, true);
    }

    // Draw
    bob.draw(ship.image, ship.x, ship.y);
    bob.draw(enemy.image, enemy.x, enemy.y);

    // Collision Ship vs Enemy
    if(collision.imagesCollide(ship.image, ship.x, ship.y, 0, enemy.image, enemy.x, enemy.y, 0)){
        setGameOver();
    }
}

function updateMenu(){
    draw.color(255, 255, 255);
    font.align("center", "middle");
    
    font.set(fnt, 60, true);
    font.draw("SPACE SHOOTER", gfx.width/2, gfx.height/3);
    
    font.set(fnt, 30);
    font.draw("Press SPACE to Start", gfx.width/2, gfx.height/2);
    
    font.set(fnt, 20);
    font.draw("Highscore: " + highScore, gfx.width/2, gfx.height/2 + 50);

    if(keys.keyHit("KEY_SPACEBAR") || joy.joyHit(0)){
        resetGame();
        state = "GAME";
    }
}

function updateGameOver(){
    draw.color(255, 255, 255);
    font.align("center", "middle");
    font.set(fnt, 60, true);
    font.draw("GAME OVER", gfx.width/2, gfx.height/3);
    
    font.set(fnt, 30);
    font.draw("Score: " + score, gfx.width/2, gfx.height/2);
    font.draw("Press SPACE to Menu", gfx.width/2, gfx.height/2 + 50);

    if(keys.keyHit("KEY_SPACEBAR") || joy.joyHit(0)){
        state = "MENU";
    }
}

function resetGame(){
    score = 0;
    bullets = [];
    explosions = [];
    ship.x = gfx.width / 2 - 16;
    ship.y = gfx.height - 100;
    enemy.y = -50;
    enemy.x = Math.random() * (gfx.width - 32);
}

// Wait for the web page to fully load, then start

function setGameOver(){
    state = "GAMEOVER";
    if(score > highScore){
        highScore = score;
        // Save new highscore to VFS
        file.saveJSON("highscore.json", { score: highScore });
    }
}
document.addEventListener("DOMContentLoaded", main);