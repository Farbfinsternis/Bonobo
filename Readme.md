# Bonobo Engine 🐵

**Modern JavaScript Game Engine with a Retro Soul.**

Bonobo is the spiritual successor to [jBB](https://github.com/Farbfinsternis/jBB). It aims to bring back the fun and simplicity of coding in **BlitzBasic** (Amiga/PC), but built on a robust, modern web architecture.

## 🚀 Philosophy

*   **Retro Feeling:** Write code that feels like 1995. Simple commands like `cls()`, `rect()`, and `load()` let you focus on the game, not the boilerplate.
*   **Modern Tech:** Under the hood, Bonobo uses ES Modules, Classes, Async/Await, and the Web Audio API.
*   **Modular:** Only load what you need. The core is slim; features like Tilemaps or Sprites (BOBs) are optional modules.

## ✨ Features

*   **Core Architecture:**
    *   Modular plugin system.
    *   **Virtual File System (VFS):** Supports overlaying local storage data over server files (great for mods/configs).
    *   **Asset Manager:** Automatic tracking of loading progress for loading screens.
    *   **Error Handling:** Centralized logging system.

*   **Graphics:**
    *   HTML5 Canvas 2D abstraction.
    *   Fullscreen support via simple wildcard (`*`).
    *   **BOBs (Blitter Objects):** Advanced sprites with animation support and auto-centering (`midHandle`).
    *   **Tilemaps:** Support for Tiled JSON maps with viewport culling.
    *   Primitives (Rects, Lines, Colors).

*   **Input:**
    *   **Keyboard:** With `keyDown` (continuous) and `keyHit` (one-shot) support.
    *   **Mouse:** Position tracking and button states.
    *   **Gamepad (Joy):** Full Gamepad API support with deadzones.

*   **Audio:**
    *   Web Audio API wrapper for sound effects.

*   **Utils:**
    *   Math helper (BlitzBasic style `Rand`, `Int`, `Float`).
    *   Collision detection (AABB & Pixel-Perfect).

## 🛠️ Getting Started

Check out the `examples/simple/game.js` to see Bonobo in action.

### The "BlitzBasic" Style
Bonobo allows you to write code in a procedural style within a game loop, avoiding complex class structures in your game logic if you prefer.

```javascript
function loop(){
    gfx.cls();
    
    if(keys.keyDown("KEY_RIGHT")) ship.x += 5;
    
    bob.draw(ship.image, ship.x, ship.y);
}
```

## 📂 Structure

*   `/lib`: The core engine code (`bonobo.js`, `utils.js`).
*   `/modules`: Feature modules.
    *   `/bonobo`: The standard toolbelt (Graphics, Input, Sound).
    *   `/bobs`: Sprite handling.
    *   `/tilemap`: Tiled map loader.
    *   `/assets`: Asset management.
*   `/examples`: Sample projects.
```

### 2. Wie du das Repo updatest

Da du jetzt Änderungen hast (die neue README und die Anpassungen an den Modulen), musst du diese an GitHub senden. Das ist der Standard-Workflow, den du ab jetzt immer machst:

1.  **Terminal öffnen** (in `g:\dev\projects\bonobo`).
2.  **Dateien hinzufügen:**
   Damit sagst du Git: "Merk dir alle Änderungen in allen Dateien".
   ```bash
   git add .
   ```
3.  **Commit erstellen:**
   Damit verpackst du die Änderungen in ein Paket mit einem Namen.
   ```bash
   git commit -m "Add README and TileMap module"
   ```
4.  **Hochladen (Push):**
   Damit schiebst du das Paket auf den GitHub-Server.
   ```bash
   git push
   ```

Das war's! Wenn du jetzt auf deine GitHub-Seite gehst, siehst du die neue README schön formatiert auf der Startseite.

<!--
[PROMPT_SUGGESTION]Wie kann ich GitHub Pages aktivieren, damit man die Beispiele direkt im Browser spielen kann?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]Lass uns ein einfaches Partikel-System bauen, um Explosionen darzustellen.[/PROMPT_SUGGESTION]
