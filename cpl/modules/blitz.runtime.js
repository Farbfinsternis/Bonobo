/**
 * BlitzRuntime
 * 
 * Acts as the compatibility layer between compiled BlitzBasic code and the Bonobo engine.
 * Manages handles (Int -> Object), global state, and behavior emulation.
 */
export class BlitzRuntime {
    constructor(bonobo) {
        this.bonobo = bonobo;

        // --- Handle Maps ---
        // BlitzBasic uses Integers to reference resources. We map these IDs to the actual JS objects.
        this.images = new Map();
        this.sounds = new Map();
        this.music = new Map();
        this.fonts = new Map();
        this.files = new Map();

        // --- ID Counters ---
        this.nextImageId = 1;
        this.nextSoundId = 1;
        this.nextMusicId = 1;
        this.nextFontId = 1;
        this.nextFileId = 1;

        // --- Data & Types ---
        this.dataStore = [];
        this.dataPtr = 0;
        this.dataLabels = new Map();
        this.typeLists = new Map();

        // --- Global State ---
        // BlitzBasic keeps state globally (e.g. current drawing color).
        // Bonobo does this too, but the RTL ensures we can intercept/modify if needed.
    }

    /**
     * Resolves a path to a Blob URL if it exists in the virtual asset map.
     */
    _resolvePath(path) {
        if (typeof window !== 'undefined' && window.ASSET_MAP && window.ASSET_MAP[path]) {
            return window.ASSET_MAP[path];
        }
        return path;
    }

    // ==========================================
    // GRAPHICS & DISPLAY
    // ==========================================

    graphics(width, height, depth = 0, mode = 0) {
        // Bonobo initializes graphics at start. 
        // TODO: Implement dynamic resize if supported by engine.
        // For now, we assume the resolution set in init is correct.

        // Hard Reset of Canvas Context to remove any previous transforms (Origin, Scale, etc.)
        if (this.bonobo.gfx) {
            // Update internal engine resolution state to match the new canvas size
            if (this.bonobo.gfx.canvas) {
                this.bonobo.gfx.canvas.width = width;
                this.bonobo.gfx.canvas.height = height;
            }
            if (this.bonobo.gfx.canvasContext) {
                this.bonobo.gfx.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
                this.bonobo.gfx.canvasContext.textBaseline = 'top';
                this.bonobo.gfx.canvasContext.textAlign = 'left';
            }
        }

        this.bonobo.draw.origin(0, 0);
        this.bonobo.draw.viewport(0, 0, width, height);
        this.bonobo.draw.clsColor(0, 0, 0, 1.0);
        this.cls();
        this.bonobo.draw.color(255, 255, 255, 1.0);
    }

    graphicsWidth() {
        return this.bonobo.gfx.width;
    }

    graphicsHeight() {
        return this.bonobo.gfx.height;
    }

    color(r, g, b, a = 1.0) {
        this.bonobo.draw.color(Number(r), Number(g), Number(b), Number(a));
    }

    clsColor(r, g, b, a = 1.0) {
        this.bonobo.draw.clsColor(Number(r), Number(g), Number(b), Number(a));
    }

    cls() {
        this.bonobo.draw.cls();
    }

    async flip() {
        // In a managed engine like Bonobo, the engine loop already handles requestAnimationFrame.
        // Waiting here again would cap the framerate to 30fps (Double-VSync).
        // We just return a resolved promise to satisfy the 'await' in the generated code.
        return Promise.resolve();
    }

    rect(x, y, w, h, solid = 1) {
        // Blitz2D uses top-left coordinates.
        // Assuming Bonobo engine also uses top-left (based on working sample).
        // console.log(`Rect: ${x}, ${y}, ${w}, ${h}, ${solid}`);
        // Ensure solid is treated correctly even if passed as string '0' or '1'
        const isSolid = (solid === 1 || solid === '1' || solid === true || solid === 'true');
        this.bonobo.draw.rect(Number(x), Number(y), Number(w), Number(h), isSolid);
    }

    oval(x, y, w, h, solid = 1) {
        const isSolid = (solid === 1 || solid === '1' || solid === true || solid === 'true');
        this.bonobo.draw.oval(Number(x), Number(y), Number(w), Number(h), isSolid);
    }

    line(x1, y1, x2, y2) {
        this.bonobo.draw.line(Number(x1), Number(y1), Number(x2), Number(y2));
    }

    plot(x, y) {
        this.bonobo.draw.plot(Number(x), Number(y));
    }

    text(x, y, txt, cx = 0, cy = 0) {
        const ctx = this.bonobo.contextOwner.canvasContext;
        if (ctx) {
            const oldAlign = ctx.textAlign;
            const oldBaseline = ctx.textBaseline;
            
            ctx.textAlign = (cx === 1 || cx === '1' || cx === true) ? 'center' : 'left';
            ctx.textBaseline = (cy === 1 || cy === '1' || cy === true) ? 'middle' : 'top';
            
            this.bonobo.draw.text(String(txt), Number(x), Number(y));
            
            ctx.textAlign = oldAlign;
            ctx.textBaseline = oldBaseline;
        }
    }

    origin(x, y) {
        this.bonobo.draw.origin(x, y);
    }

    viewport(x, y, w, h) {
        this.bonobo.draw.viewport(x, y, w, h);
    }

    setAlpha(alpha) {
        this.bonobo.draw.setAlpha(alpha);
    }

    getAlpha() {
        return this.bonobo.draw.getAlpha();
    }

    // ==========================================
    // IMAGES
    // ==========================================

    loadImage(path) {
        const img = this.bonobo.img.load(this._resolvePath(path));
        const id = this.nextImageId++;
        this.images.set(id, img);
        return id;
    }

    loadAnimImage(path, w, h, first, count) {
        const img = this.bonobo.img.load(this._resolvePath(path), w, h, count);
        // TODO: Handle 'first' frame offset if Bonobo supports it
        const id = this.nextImageId++;
        this.images.set(id, img);
        return id;
    }

    drawImage(handle, x, y, frame = 0) {
        const img = this.images.get(handle);
        if (img) {
            this.bonobo.img.draw(img, x, y, frame);
        }
    }

    drawBlock(handle, x, y, frame = 0) {
        // DrawBlock ignores mask color (not yet fully supported in Bonobo, maps to DrawImage)
        this.drawImage(handle, x, y, frame);
    }

    tileImage(handle, x = 0, y = 0, frame = 0) {
        const img = this.images.get(handle);
        if (img) {
            this.bonobo.img.tileImage(img, x, y, frame);
        }
    }

    midHandle(handle) {
        const img = this.images.get(handle);
        if (img) {
            this.bonobo.img.midHandle(img);
        }
    }

    autoMidHandle(enable) {
        this.bonobo.img.autoMidHandle(enable !== 0);
    }

    scaleImage(handle, xScale, yScale) {
        const img = this.images.get(handle);
        if (img) {
            this.bonobo.img.scaleImage(img, xScale, yScale);
        }
    }

    rotateImage(handle, angle) {
        const img = this.images.get(handle);
        if (img) {
            this.bonobo.img.rotateImage(img, angle);
        }
    }

    imageBuffer(handle) {
        const img = this.images.get(handle);
        return img ? img.data : null;
    }

    backBuffer() {
        return this.bonobo.gfx.canvas;
    }

    setBuffer(canvas) {
        if (!canvas) return;

        // If we are switching back to the main screen, restore the Graphics instance as owner
        if (this.bonobo.gfx && canvas === this.bonobo.gfx.canvas) {
            this.bonobo.contextOwner = this.bonobo.gfx;
            return;
        }

        // For image buffers, ensure they have the state container Draw.js expects
        if (!canvas.canvasData) {
            canvas.canvasData = {
                drawColor: "rgba(255,255,255,1)",
                clsColor: "rgba(0,0,0,1)",
                colorValues: { r: 255, g: 255, b: 255, a: 1 },
                origin: { x: 0, y: 0 }
            };
            // Prepare context for viewport clipping logic
            canvas.getContext('2d').save();
        }

        this.bonobo.contextOwner = {
            canvas: canvas,
            canvasContext: canvas.getContext('2d', { willReadFrequently: true }),
            canvasData: canvas.canvasData,
            width: canvas.width,
            height: canvas.height
        };
    }

    createImage(w, h, frames = 1) {
        const img = this.bonobo.img.createImage(w, h);
        const id = this.nextImageId++;
        this.images.set(id, img);
        return id;
    }

    grabImage(handle, x, y) {
        const img = this.images.get(handle);
        if (img) {
            this.bonobo.img.grabImage(img, x, y);
        }
    }

    freeImage(handle) {
        this.images.delete(handle);
    }

    imageWidth(handle) {
        const img = this.images.get(handle);
        return img ? img.width : 0;
    }

    imageHeight(handle) {
        const img = this.images.get(handle);
        return img ? img.height : 0;
    }

    // ==========================================
    // INPUT
    // ==========================================

    async input(promptStr) {
        // Simple HTML Overlay Input implementation
        return new Promise((resolve) => {
            // Create Input Elements
            const overlay = document.createElement('div');
            overlay.style.cssText = "position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:#000; border:1px solid #444; padding:20px; color:#fff; font-family:monospace; z-index:10000; display:flex; flex-direction:column; gap:10px;";
            
            const label = document.createElement('div');
            label.textContent = promptStr ? promptStr : "";
            
            const input = document.createElement('input');
            input.type = "text";
            input.style.cssText = "background:#222; color:#fff; border:1px solid #555; padding:5px; font-family:monospace; outline:none;";
            
            const btn = document.createElement('button');
            btn.textContent = "OK";
            btn.style.cssText = "background:#444; color:#fff; border:none; padding:5px; cursor:pointer;";

            overlay.appendChild(label);
            overlay.appendChild(input);
            overlay.appendChild(btn);
            document.body.appendChild(overlay);

            input.focus();

            const submit = () => {
                const val = input.value;
                document.body.removeChild(overlay);
                // Draw input to screen to simulate console behavior
                this.text(this.bonobo.draw.lastX || 0, this.bonobo.draw.lastY || 0, (promptStr || "") + val);
                resolve(val);
            };

            btn.onclick = submit;
            input.onkeydown = (e) => {
                if (e.key === 'Enter') submit();
                e.stopPropagation(); // Prevent game from handling keys
            };
        });
    }

    keyDown(key) {
        return this.bonobo.keys.keyDown(key) ? 1 : 0;
    }

    keyHit(key) {
        return this.bonobo.keys.keyHit(key) ? 1 : 0;
    }

    mouseDown(button) {
        return this.bonobo.mouse.down(button) ? 1 : 0;
    }

    mouseHit(button) {
        return this.bonobo.mouse.hit(button) ? 1 : 0;
    }

    mouseX() { return this.bonobo.mouse.x; }
    mouseY() { return this.bonobo.mouse.y; }
    mouseZ() { return this.bonobo.mouse.z; }

    flushKeys() { this.bonobo.keys.flushKeys(); }
    flushMouse() { this.bonobo.mouse.flushMouse(); }

    hidePointer() { this.bonobo.mouse.hidePointer(); }
    showPointer() { this.bonobo.mouse.showPointer(); }
    
    mouseXSpeed() { return this.bonobo.mouse.xSpeed; }
    mouseYSpeed() { return this.bonobo.mouse.ySpeed; }
    mouseZSpeed() { return this.bonobo.mouse.zSpeed; }

    waitKey() { return this.bonobo.keys.waitKey(); }
    getKey() { return this.bonobo.keys.getKey(); }

    joyType(port = 0) { return this.bonobo.joy.joyType(port); }
    joyDown(btn, port = 0) { return this.bonobo.joy.joyDown(btn, port); }
    joyHit(btn, port = 0) { return this.bonobo.joy.joyHit(btn, port); }
    joyX(port = 0) { return this.bonobo.joy.joyX(port); }
    joyY(port = 0) { return this.bonobo.joy.joyY(port); }
    joyZ(port = 0) { return this.bonobo.joy.joyAxis(2, port); }

    // ==========================================
    // SOUND & MUSIC
    // ==========================================

    loadSound(path) {
        const snd = this.bonobo.sound.load(this._resolvePath(path));
        const id = this.nextSoundId++;
        this.sounds.set(id, snd);
        return id;
    }

    playSound(handle) {
        const snd = this.sounds.get(handle);
        if (snd) {
            return this.bonobo.sound.play(snd);
        }
        return null;
    }

    loadMusic(path) {
        const mus = this.bonobo.sound.loadMusic(this._resolvePath(path));
        const id = this.nextMusicId++;
        this.music.set(id, mus);
        return id;
    }

    playMusic(handle) {
        const mus = this.music.get(handle);
        if (mus) {
            return this.bonobo.sound.playMusic(mus);
        }
        return null;
    }

    stopChannel(channel) {
        this.bonobo.sound.stopChannel(channel);
    }

    channelPitch(channel, pitch) {
        this.bonobo.sound.channelPitch(channel, pitch);
    }

    channelVolume(channel, volume) {
        this.bonobo.sound.channelVolume(channel, volume);
    }

    channelPan(channel, pan) {
        this.bonobo.sound.channelPan(channel, pan);
    }

    // ==========================================
    // FILES
    // ==========================================

    openFile(path) { return this.bonobo.files.openFile(this._resolvePath(path)); }
    readFile(handle) { return this.bonobo.files.readFile(handle); }
    writeFile(handle, txt) { return this.bonobo.files.writeFile(handle, txt); }
    closeFile(handle) { this.bonobo.files.closeFile(handle); }
    filePos(handle) { return this.bonobo.files.filePos(handle); }
    seekFile(handle, pos) { this.bonobo.files.seekFile(handle, pos); }
    eof(handle) { return this.bonobo.files.eof(handle); }
    
    readDir(path) { return this.bonobo.files.readDir(this._resolvePath(path)); }
    nextFile(handle) { return this.bonobo.files.nextFile(handle); }
    closeDir(handle) { this.bonobo.files.closeDir(handle); }
    currentDir() { return this.bonobo.files.currentDir(); }
    changeDir(path) { return this.bonobo.files.changeDir(path); }
    createDir(path) { return this.bonobo.files.createDir(path); }
    deleteDir(path) { return this.bonobo.files.deleteDir(path); }
    fileType(path) { return this.bonobo.files.fileType(path); }
    fileSize(path) { return this.bonobo.files.fileSize(path); }
    copyFile(src, dest) { return this.bonobo.files.copyFile(src, dest); }
    deleteFile(path) { return this.bonobo.files.deleteFile(path); }

    // ==========================================
    // TIME / SYSTEM
    // ==========================================

    millisecs() {
        return this.bonobo.time.millisecs();
    }

    // ==========================================
    // MATH & STRING (Wrappers)
    // ==========================================

    sin(a) { return this.bonobo.math.sin(a); }
    cos(a) { return this.bonobo.math.cos(a); }
    tan(a) { return this.bonobo.math.tan(a); }
    asin(v) { return this.bonobo.math.asin(v); }
    acos(v) { return this.bonobo.math.acos(v); }
    atan(v) { return this.bonobo.math.atan(v); }
    atan2(y, x) { return this.bonobo.math.atan2(y, x); }
    sqr(v) { return this.bonobo.math.sqr(v); }
    floor(v) { return this.bonobo.math.floor(v); }
    ceil(v) { return this.bonobo.math.ceil(v); }
    abs(v) { return this.bonobo.math.abs(v); }
    sgn(v) { return this.bonobo.math.sgn(v); }
    int(v) { return this.bonobo.math.int(v); }
    float(v) { return this.bonobo.math.float(v); }
    rand(min, max) { return this.bonobo.math.rand(min, max); }
    rnd(min, max) { return this.bonobo.math.rnd(min, max); }
    max(...args) { return this.bonobo.math.max(...args); }
    min(...args) { return this.bonobo.math.min(...args); }

    len(s) { return this.bonobo.str.len(s); }
    left(s, n) { return this.bonobo.str.left(s, n); }
    right(s, n) { return this.bonobo.str.right(s, n); }
    mid(s, start, count) { return this.bonobo.str.mid(s, start, count); }
    upper(s) { return this.bonobo.str.upper(s); }
    lower(s) { return this.bonobo.str.lower(s); }
    trim(s) { return this.bonobo.str.trim(s); }
    replace(s, f, r) { return this.bonobo.str.replace(s, f, r); }
    instr(s, f, start) { return this.bonobo.str.instr(s, f, start); }
    asc(s) { return this.bonobo.str.asc(s); }
    chr(c) { return this.bonobo.str.chr(c); }
    hex(v) { return this.bonobo.str.hex(v); }
    bin(v) { return this.bonobo.str.bin(v); }
    repeat(s, n) { return this.bonobo.str.repeat(s, n); }

    // ==========================================
    // COLLISION
    // ==========================================
    
    rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) { return this.bonobo.collision.rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2); }
    imagesOverlap(h1, x1, y1, h2, x2, y2) { return this.bonobo.collision.imagesOverlap(this.images.get(h1), x1, y1, this.images.get(h2), x2, y2); }
    imagesCollide(h1, x1, y1, f1, h2, x2, y2, f2) { return this.bonobo.collision.imagesCollide(this.images.get(h1), x1, y1, f1, this.images.get(h2), x2, y2, f2); }
    imageRectCollide(h, x, y, f, rx, ry, rw, rh) { return this.bonobo.collision.imageRectCollide(this.images.get(h), x, y, rx, ry, rw, rh); }

    // ==========================================
    // FONT
    // ==========================================

    loadFont(path, name) { 
        const font = this.bonobo.font.load(path, name);
        const id = this.nextFontId++;
        this.fonts.set(id, font);
        return id;
    }
    setFont(handle, size, bold, italic) { 
        const font = this.fonts.get(handle);
        if (font) this.bonobo.font.set(font, size, bold, italic); 
    }
    stringWidth(txt) { return this.bonobo.font.width(txt); }

    // ==========================================
    // DATA & TYPES (Compiler Support)
    // ==========================================

    addData(values) {
        if (Array.isArray(values)) this.dataStore.push(...values);
        else this.dataStore.push(values);
    }

    addLabel(name) {
        this.dataLabels.set(name.toLowerCase(), this.dataStore.length);
    }

    read() {
        if (this.dataPtr < this.dataStore.length) {
            return this.dataStore[this.dataPtr++];
        }
        console.warn("Runtime: Out of Data");
        return 0;
    }

    restore(label) {
        const l = label.toLowerCase();
        if (this.dataLabels.has(l)) {
            this.dataPtr = this.dataLabels.get(l);
        } else {
            this.dataPtr = 0;
        }
    }

    typeAdd(typeName, obj) {
        const t = typeName.toLowerCase();
        if (!this.typeLists.has(t)) this.typeLists.set(t, new Set());
        this.typeLists.get(t).add(obj);
    }

    typeEach(typeName) {
        const t = typeName.toLowerCase();
        if (this.typeLists.has(t)) return Array.from(this.typeLists.get(t));
        return [];
    }

    deleteObj(obj) {
        for (const set of this.typeLists.values()) {
            if (set.delete(obj)) return;
        }
    }

    // ==========================================
    // SYSTEM
    // ==========================================

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}