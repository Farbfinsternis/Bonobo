/**
 * BlitzRuntime
 * 
 * Acts as the compatibility layer between compiled BlitzBasic code and the Bonobo engine.
 * Manages handles (Int -> Object), global state, and behavior emulation.
 */
import { FileStream } from "../../modules/bonobo/file-stream.js";
import { Bank } from "../../modules/bonobo/bank.js";

export class BlitzRuntime {
    constructor(bonobo, modules) {
        this.bonobo = bonobo;
        this.modules = modules;

        // --- Handle Maps ---
        // BlitzBasic uses Integers to reference resources. We map these IDs to the actual JS objects.
        this.images = new Map();
        this.sounds = new Map();
        this.music = new Map();
        this.fonts = new Map();
        this.files = new Map();
        this.banks = new Map();

        // --- ID Counters ---
        this.nextImageId = 1;
        this.nextSoundId = 1;
        this.nextMusicId = 1;
        this.nextFontId = 1;
        this.nextFileId = 1;
        this.nextBankId = 1;

        // --- Data & Types ---
        this.dataStore = [];
        this.dataPtr = 0;
        this.dataLabels = new Map();

        // --- Global State ---
        // BlitzBasic keeps state globally (e.g. current drawing color).
        // Bonobo does this too, but the RTL ensures we can intercept/modify if needed.
    }

    /**
     * Updates all input modules. Called by the compiler at the end of the loop.
     */
    update() {
        this.modules.keys?.update();
        this.modules.mouse?.update();
        this.modules.joy?.update();
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
        const gfx = this.modules.gfx;
        if (gfx) {
            // Update internal engine resolution state to match the new canvas size
            if (gfx.canvas) {
                gfx.canvas.width = width;
                gfx.canvas.height = height;
            }
            if (gfx.canvasContext) {
                gfx.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
                gfx.canvasContext.textBaseline = 'top';
                gfx.canvasContext.textAlign = 'left';
            }
        }

        this.modules.draw.origin(0, 0);
        this.modules.draw.viewport(0, 0, width, height);
        this.modules.draw.clsColor(0, 0, 0, 1.0);
        this.cls();
        this.modules.draw.color(255, 255, 255, 1.0);
    }

    graphicsWidth() {
        return this.modules.gfx.width;
    }

    graphicsHeight() {
        return this.modules.gfx.height;
    }

    color(r, g, b, a = 1.0) {
        this.modules.draw.color(Number(r), Number(g), Number(b), Number(a));
    }

    clsColor(r, g, b, a = 1.0) {
        this.modules.draw.clsColor(Number(r), Number(g), Number(b), Number(a));
    }

    cls() {
        this.modules.draw.cls();
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
        this.modules.draw.rect(Number(x), Number(y), Number(w), Number(h), isSolid);
    }

    oval(x, y, w, h, solid = 1) {
        const isSolid = (solid === 1 || solid === '1' || solid === true || solid === 'true');
        this.modules.draw.oval(Number(x), Number(y), Number(w), Number(h), isSolid);
    }

    line(x1, y1, x2, y2) {
        this.modules.draw.line(Number(x1), Number(y1), Number(x2), Number(y2));
    }

    plot(x, y) {
        this.modules.draw.plot(Number(x), Number(y));
    }

    text(x, y, txt, cx = 0, cy = 0) {
        const ctx = this.bonobo.contextOwner.canvasContext;
        if (ctx) {
            const oldAlign = ctx.textAlign;
            const oldBaseline = ctx.textBaseline;
            
            ctx.textAlign = (cx === 1 || cx === '1' || cx === true) ? 'center' : 'left';
            ctx.textBaseline = (cy === 1 || cy === '1' || cy === true) ? 'middle' : 'top';
            
            this.modules.draw.text(String(txt), Number(x), Number(y));
            
            ctx.textAlign = oldAlign;
            ctx.textBaseline = oldBaseline;
        }
    }

    origin(x, y) {
        this.modules.draw.origin(x, y);
    }

    viewport(x, y, w, h) {
        this.modules.draw.viewport(x, y, w, h);
    }

    setAlpha(alpha) {
        this.modules.draw.setAlpha(alpha);
    }

    getAlpha() {
        return this.modules.draw.getAlpha();
    }

    // ==========================================
    // IMAGES
    // ==========================================

    loadImage(path) {
        const img = this.modules.img.load(this._resolvePath(path));
        const id = this.nextImageId++;
        this.images.set(id, img);
        return id;
    }

    loadAnimImage(path, w, h, first, count) {
        const img = this.modules.img.load(this._resolvePath(path), w, h, count);
        // TODO: Handle 'first' frame offset if Bonobo supports it
        const id = this.nextImageId++;
        this.images.set(id, img);
        return id;
    }

    drawImage(handle, x, y, frame = 0) {
        const img = this.images.get(handle);
        if (img) {
            this.modules.img.draw(img, x, y, frame);
        }
    }

    drawBlock(handle, x, y, frame = 0) {
        // DrawBlock ignores mask color (not yet fully supported in Bonobo, maps to DrawImage)
        this.drawImage(handle, x, y, frame);
    }

    tileImage(handle, x = 0, y = 0, frame = 0) {
        const img = this.images.get(handle);
        if (img) {
            this.modules.img.tileImage(img, x, y, frame);
        }
    }

    midHandle(handle) {
        const img = this.images.get(handle);
        if (img) {
            this.modules.img.midHandle(img);
        }
    }

    autoMidHandle(enable) {
        this.modules.img.autoMidHandle(enable !== 0);
    }

    scaleImage(handle, xScale, yScale) {
        const img = this.images.get(handle);
        if (img) {
            this.modules.img.scaleImage(img, xScale, yScale);
        }
    }

    rotateImage(handle, angle) {
        const img = this.images.get(handle);
        if (img) {
            this.modules.img.rotateImage(img, angle);
        }
    }

    imageBuffer(handle) {
        const img = this.images.get(handle);
        return img ? img.data : null;
    }

    backBuffer() {
        return this.modules.gfx.canvas;
    }

    setBuffer(canvas) {
        if (!canvas) return;

        // If we are switching back to the main screen, restore the Graphics instance as owner
        if (this.modules.gfx && canvas === this.modules.gfx.canvas) {
            this.bonobo.contextOwner = this.modules.gfx;
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
        const img = this.modules.img.createImage(w, h);
        const id = this.nextImageId++;
        this.images.set(id, img);
        return id;
    }

    grabImage(handle, x, y) {
        const img = this.images.get(handle);
        if (img) {
            this.modules.img.grabImage(img, x, y);
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
                this.text(this.modules.draw.lastX || 0, this.modules.draw.lastY || 0, (promptStr || "") + val);
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
        return this.modules.keys.keyDown(key) ? 1 : 0;
    }

    keyHit(key) {
        return this.modules.keys.keyHit(key) ? 1 : 0;
    }

    mouseDown(button) {
        return this.modules.mouse.down(button) ? 1 : 0;
    }

    mouseHit(button) {
        return this.modules.mouse.hit(button) ? 1 : 0;
    }

    mouseX() { return this.modules.mouse.x; }
    mouseY() { return this.modules.mouse.y; }
    mouseZ() { return this.modules.mouse.z; }

    flushKeys() { this.modules.keys.flushKeys(); }
    flushMouse() { this.modules.mouse.flushMouse(); }

    hidePointer() { this.modules.mouse.hidePointer(); }
    showPointer() { this.modules.mouse.showPointer(); }
    
    mouseXSpeed() { return this.modules.mouse.xSpeed; }
    mouseYSpeed() { return this.modules.mouse.ySpeed; }
    mouseZSpeed() { return this.modules.mouse.zSpeed; }

    waitKey() { return this.modules.keys.waitKey(); }
    getKey() { return this.modules.keys.getKey(); }

    joyType(port = 0) { return this.modules.joy.joyType(port); }
    joyDown(btn, port = 0) { return this.modules.joy.joyDown(btn, port); }
    joyHit(btn, port = 0) { return this.modules.joy.joyHit(btn, port); }
    joyX(port = 0) { return this.modules.joy.joyX(port); }
    joyY(port = 0) { return this.modules.joy.joyY(port); }
    joyZ(port = 0) { return this.modules.joy.joyAxis(2, port); }

    // ==========================================
    // SOUND & MUSIC
    // ==========================================

    loadSound(path) {
        const snd = this.modules.sound.load(this._resolvePath(path));
        const id = this.nextSoundId++;
        this.sounds.set(id, snd);
        return id;
    }

    playSound(handle) {
        const snd = this.sounds.get(handle);
        if (snd) {
            return this.modules.sound.play(snd);
        }
        return null;
    }

    loadMusic(path) {
        const mus = this.modules.sound.loadMusic(this._resolvePath(path));
        const id = this.nextMusicId++;
        this.music.set(id, mus);
        return id;
    }

    playMusic(handle) {
        const mus = this.music.get(handle);
        if (mus) {
            return this.modules.sound.playMusic(mus);
        }
        return null;
    }

    stopChannel(channel) {
        this.modules.sound.stopChannel(channel);
    }

    channelPitch(channel, pitch) {
        this.modules.sound.channelPitch(channel, pitch);
    }

    channelVolume(channel, volume) {
        this.modules.sound.channelVolume(channel, volume);
    }

    channelPan(channel, pan) {
        this.modules.sound.channelPan(channel, pan);
    }

    // ==========================================
    // FILES
    // ==========================================

    openFile(path) {
        const buffer = this.bonobo.utils.vfs.getBuffer(this._resolvePath(path));
        if (!buffer) return 0;
        const stream = new FileStream(buffer);
        const id = this.nextFileId++;
        this.files.set(id, stream);
        return id;
    }

    closeFile(handle) { this.files.delete(handle); }
    readFile(handle) { return this.files.get(handle)?.readLine() || ""; }
    writeFile(handle, txt) { this.files.get(handle)?.writeLine(txt); }
    filePos(handle) { return this.files.get(handle)?.pos || 0; }
    seekFile(handle, pos) { this.files.get(handle)?.seek(pos); }
    eof(handle) { 
        const s = this.files.get(handle);
        return s ? s.eof : true;
    }
    
    // Directory operations still use bonobo.files as they are high-level VFS tasks
    readDir(path) { return this.modules.files.readDir(this._resolvePath(path)); }
    nextFile(handle) { return this.modules.files.nextFile(handle); }
    closeDir(handle) { this.modules.files.closeDir(handle); }
    currentDir() { return this.modules.files.currentDir(); }
    changeDir(path) { return this.modules.files.changeDir(path); }
    createDir(path) { return this.modules.files.createDir(path); }
    deleteDir(path) { return this.modules.files.deleteDir(path); }
    fileType(path) { return this.modules.files.fileType(path); }
    fileSize(path) { return this.modules.files.fileSize(path); }
    copyFile(src, dest) { return this.modules.files.copyFile(src, dest); }
    deleteFile(path) { return this.modules.files.deleteFile(path); }

    readInt(handle) { return this.files.get(handle)?.readInt() || 0; }
    writeInt(handle, val) { this.files.get(handle)?.writeInt(val); }
    readShort(handle) { return this.files.get(handle)?.readShort() || 0; }
    writeShort(handle, val) { this.files.get(handle)?.writeShort(val); }
    readFloat(handle) { return this.files.get(handle)?.readFloat() || 0.0; }
    writeFloat(handle, val) { this.files.get(handle)?.writeFloat(val); }
    readByte(handle) { return this.files.get(handle)?.readByte() || 0; }
    writeByte(handle, val) { this.files.get(handle)?.writeByte(val); }
    readString(handle) { return this.files.get(handle)?.readString() || ""; }
    writeString(handle, val) { this.files.get(handle)?.writeString(val); }

    // ==========================================
    // BANKS
    // ==========================================

    createBank(size) {
        const bank = new Bank(size);
        const id = this.nextBankId++;
        this.banks.set(id, bank);
        return id;
    }

    freeBank(handle) { this.banks.delete(handle); }
    bankSize(handle) { return this.banks.get(handle)?.size || 0; }
    resizeBank(handle, size) { this.banks.get(handle)?.resize(size); }

    peekByte(handle, offset) { return this.banks.get(handle)?.peekByte(offset) || 0; }
    pokeByte(handle, offset, val) { this.banks.get(handle)?.pokeByte(offset, val); }
    peekShort(handle, offset) { return this.banks.get(handle)?.peekShort(offset) || 0; }
    pokeShort(handle, offset, val) { this.banks.get(handle)?.pokeShort(offset, val); }
    peekInt(handle, offset) { return this.banks.get(handle)?.peekInt(offset) || 0; }
    pokeInt(handle, offset, val) { this.banks.get(handle)?.pokeInt(offset, val); }
    peekFloat(handle, offset) { return this.banks.get(handle)?.peekFloat(offset) || 0.0; }
    pokeFloat(handle, offset, val) { this.banks.get(handle)?.pokeFloat(offset, val); }

    copyBank(srcHandle, srcOffset, destHandle, destOffset, count) {
        const src = this.banks.get(srcHandle);
        const dest = this.banks.get(destHandle);
        if (src && dest) dest.copy(src, srcOffset, destOffset, count);
    }

    // ==========================================
    // TIME / SYSTEM
    // ==========================================

    millisecs() {
        return this.modules.time.millisecs();
    }

    // ==========================================
    // MATH & STRING (Wrappers)
    // ==========================================

    sin(a) { return this.modules.math.sin(a); }
    cos(a) { return this.modules.math.cos(a); }
    tan(a) { return this.modules.math.tan(a); }
    asin(v) { return this.modules.math.asin(v); }
    acos(v) { return this.modules.math.acos(v); }
    atan(v) { return this.modules.math.atan(v); }
    atan2(y, x) { return this.modules.math.atan2(y, x); }
    sqr(v) { return this.modules.math.sqr(v); }
    floor(v) { return this.modules.math.floor(v); }
    ceil(v) { return this.modules.math.ceil(v); }
    abs(v) { return this.modules.math.abs(v); }
    sgn(v) { return this.modules.math.sgn(v); }
    int(v) { return this.modules.math.int(v); }
    float(v) { return this.modules.math.float(v); }
    rand(min, max) { return this.modules.math.rand(min, max); }
    rnd(min, max) { return this.modules.math.rnd(min, max); }
    seedRnd(seed) { this.modules.math.seedRnd(seed); }
    rndSeed() { return this.modules.math.seed; }
    max(...args) { return this.modules.math.max(...args); }
    min(...args) { return this.modules.math.min(...args); }

    len(s) { return this.modules.str.len(s); }
    left(s, n) { return this.modules.str.left(s, n); }
    right(s, n) { return this.modules.str.right(s, n); }
    mid(s, start, count) { return this.modules.str.mid(s, start, count); }
    upper(s) { return this.modules.str.upper(s); }
    lower(s) { return this.modules.str.lower(s); }
    trim(s) { return this.modules.str.trim(s); }
    replace(s, f, r) { return this.modules.str.replace(s, f, r); }
    instr(s, f, start) { return this.modules.str.instr(s, f, start); }
    asc(s) { return this.modules.str.asc(s); }
    chr(c) { return this.modules.str.chr(c); }
    hex(v) { return this.modules.str.hex(v); }
    bin(v) { return this.modules.str.bin(v); }
    repeat(s, n) { return this.modules.str.repeat(s, n); }

    // ==========================================
    // COLLISION
    // ==========================================
    
    rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) { return this.modules.collision.rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2); }
    imagesOverlap(h1, x1, y1, h2, x2, y2) { return this.modules.collision.imagesOverlap(this.images.get(h1), x1, y1, this.images.get(h2), x2, y2); }
    imagesCollide(h1, x1, y1, f1, h2, x2, y2, f2) { return this.modules.collision.imagesCollide(this.images.get(h1), x1, y1, f1, this.images.get(h2), x2, y2, f2); }
    imageRectCollide(h, x, y, f, rx, ry, rw, rh) { return this.modules.collision.imageRectCollide(this.images.get(h), x, y, rx, ry, rw, rh); }

    // ==========================================
    // FONT
    // ==========================================

    loadFont(path, name) { 
        const font = this.modules.font.load(path, name);
        const id = this.nextFontId++;
        this.fonts.set(id, font);
        return id;
    }
    setFont(handle, size, bold, italic) { 
        const font = this.fonts.get(handle);
        if (font) this.modules.font.set(font, size, bold, italic); 
    }
    stringWidth(txt) { return this.modules.font.width(txt); }

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

    deleteObj(obj) {
        if (!obj || !obj.constructor || !obj.constructor.list) return;
        const idx = obj.constructor.list.indexOf(obj);
        if (idx !== -1) obj.constructor.list.splice(idx, 1);
    }

    first(typeObj) {
        return (typeObj && typeObj.list) ? typeObj.list[0] : null;
    }

    last(typeObj) {
        return (typeObj && typeObj.list) ? typeObj.list[typeObj.list.length - 1] : null;
    }

    after(obj) {
        if (!obj || !obj.constructor || !obj.constructor.list) return null;
        const list = obj.constructor.list;
        const idx = list.indexOf(obj);
        return (idx !== -1 && idx < list.length - 1) ? list[idx + 1] : null;
    }

    before(obj) {
        if (!obj || !obj.constructor || !obj.constructor.list) return null;
        const list = obj.constructor.list;
        const idx = list.indexOf(obj);
        return (idx > 0) ? list[idx - 1] : null;
    }

    insert(obj, target, isBefore) {
        if (!obj || !target || obj.constructor !== target.constructor) return;
        const list = obj.constructor.list;
        if (!list) return;

        const objIdx = list.indexOf(obj);
        if (objIdx !== -1) list.splice(objIdx, 1);

        const targetIdx = list.indexOf(target);
        if (targetIdx === -1) {
            list.push(obj);
            return;
        }

        if (isBefore) {
            list.splice(targetIdx, 0, obj);
        } else {
            list.splice(targetIdx + 1, 0, obj);
        }
    }

    // ==========================================
    // SYSTEM
    // ==========================================

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}