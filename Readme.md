# Bonobo Engine & ApeShift Compiler

### Development Note
This project combines the further development of the **jBB** framework with modern AI support. While the **Bonobo Engine** is based on the jBB core developed entirely by the author, **Gemini Code Assist** is specifically used for the highly specialized logic of the compiler (**ApeShift**). The experienced lead developer directs the architecture and oversees all code reviews, while the AI acts as a specialized assistant for complex grammar transformations.

---

## Bonobo: The Engine

### What is Bonobo?
Bonobo is a modern game engine for the web. It is the logical evolution of the **jBB** framework and combines the intuitive logic of classic game programming with the power of modern web technologies.

### What can Bonobo do?
Bonobo provides a complete infrastructure for 2D games (and experimental 3D):
*   **Graphics:** Abstraction of HTML5 Canvas 2D and WebGL, including offscreen rendering and automatic fullscreen support.
*   **Input:** A hybrid system that switches seamlessly between keyboard, mouse, and gamepad (with deadzones).
*   **File System:** A Virtual File System (VFS) that transparently manages local storage and server assets.
*   **Audio:** Clean integration of the Web Audio API for sound effects and music.
*   **Mathematics:** A deterministic pseudo-random number generator (PRNG) and Blitz-compatible math utilities.

### How does Bonobo work?
Bonobo is based on a strictly modular structure using modern ES modules and classes. The heart of the engine is a powerful rendering system that hides the complexity of browser APIs behind simple commands. By utilizing Async/Await for asset loading, a smooth program flow without blocking load times is guaranteed.

### Why does Bonobo exist?
Bonobo is a homage to the era of **BlitzBasic**. This language introduced countless children and teenagers to programming because its simplicity was captivating: a few lines of code were enough to conjure something onto the screen. Bonobo brings this feeling back to modern times and eliminates the unnecessary "boilerplate" code of today's frameworks.

### Who is Bonobo for?
Bonobo is aimed at developers looking for a lean engine for fast prototypes or retro projects, as well as programmers who want to maintain full control over their code without dealing with the details of browser APIs.

---

## ApeShift: The Compiler

### What does ApeShift do?
ApeShift is a specialized compiler that analyzes source code in BlitzBasic syntax (Blitz2D) and translates it into high-performance JavaScript for the Bonobo engine. It serves as a bridge between the classic BASIC world and the modern web.

### What can ApeShift do?
The compiler utilizes an advanced multi-pass architecture:
1.  **Lexing & Parsing:** Generation of a precise Abstract Syntax Tree (AST).
2.  **Hoisting:** Automatic relocation of types, functions, and data to the beginning of the program.
3.  **Async Transformation:** Automated detection and propagation of `async/await` status throughout the entire call stack (solving the "Function Color" problem).
4.  **Type Inference:** A robust system for detecting data types based on suffixes and command metadata.
5.  **RTL Integration:** A dedicated Runtime Library (`blitz.runtime.js`) emulates BlitzBasic behavior (handles, global state, type collections) on top of the Bonobo engine.

### Who is ApeShift for?
ApeShift is for everyone who wants to revive their old BlitzBasic projects in the browser or who loves the unbeatably simple syntax of BASIC but wants to leverage the reach of modern web browsers.

---

## The Future: Roadmap to 100% Compatibility

Our declared goal is **100% compatibility with Blitz2D**.

**Current Status:**
*   **ApeShift (Syntax & Logic): ~90%** (Core language features, types, arrays, and async handling are stable).
*   **Bonobo (Command Set & API): ~80%** (Graphics, sound, and input cover most games).

**Next Steps:**

*   **Language Features:** Implementation of a state-machine transformation for `Goto` and `Gosub` to enable jumps within functions.
*   **Memory Management:** Full support for the `Bank` system and binary file operations (`ReadInt`, `WriteInt`, etc.) via `DataView`.
*   **Graphics Hardening:** Implementation of pixel manipulation (`ReadPixel`/`WritePixel`) and pixel-perfect collision detection.
*   **Type Collections:** Full emulation of the linked lists for Blitz types (`First`, `Last`, `After`, `Before`, `Insert`).

---

## Structure

*   `/lib`: The core of the Bonobo Engine.
*   `/modules/bonobo`: Standard modules (Graphics, Input, Sound, Bank, FileStream).
*   `/cpl`: The ApeShift Compiler including the Web IDE.
*   `/cpl/modules/blitz.runtime.js`: The compatibility layer (RTL).
*   `/examples`: Sample projects for native Bonobo development and ApeShift compilations.

You can find the interactive playground at: **https://farbfinsternis.tv/bonobo/cpl/**
```
