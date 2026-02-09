import { mapBlitzKey, mapBlitzMouse } from './keycodes.js';

const toBool = (val) => {
    if (val === undefined || val === null) return 'false';
    if (val === '1') return 'true';
    if (val === '0') return 'false';
    return `${val} !== 0`;
};

export const commandMap = {
    // Grafik & Display
    'graphics': { target: '$.rtl.graphics', params: ['number', 'number', 'number', 'number'], mapArgs: (args) => [args[0], args[1], args[2] || '0', args[3] || '0'], returnType: 'void' },
    'graphicswidth': { target: '$.rtl.graphicsWidth', type: 'function', returnType: 'number' },
    'graphicsheight': { target: '$.rtl.graphicsHeight', type: 'function', returnType: 'number' },
    'setbuffer': { target: '$.rtl.setBuffer', params: ['number'], returnType: 'void' },
    'backbuffer': { target: '$.rtl.backBuffer', type: 'function', returnType: 'number' },
    'frontbuffer': { target: 'frontbuffer', type: 'unsupported' },
    'imagebuffer': { target: '$.rtl.imageBuffer', params: ['number'], returnType: 'number' },

    /*
       Fehlende Graphics-Methoden (TODO in graphics.js):
       - EndGraphics
       - GraphicsDepth
       - GraphicsModeExists
       - CountGfxModes, GfxModeWidth, GfxModeHeight, GfxModeDepth
       - GraphicsBuffer, LoadBuffer, SaveBuffer, BufferDirty
    */

    'cls': { target: '$.rtl.cls', returnType: 'void' },
    'flip': { target: 'await $.rtl.flip()', type: 'code', returnType: 'void' },
    'color': { 
        target: '$.rtl.color', 
        params: ['number', 'number', 'number', 'number'],
        mapArgs: (args) => [args[0], args[1], args[2], args[3] || '1'],
        returnType: 'void'
    },
    'clscolor': { 
        target: '$.rtl.clsColor', 
        params: ['number', 'number', 'number', 'number'],
        mapArgs: (args) => [args[0], args[1], args[2], args[3] || '1'],
        returnType: 'void'
    },
    'rect': {
        target: '$.rtl.rect',
        params: ['number', 'number', 'number', 'number', 'number'], // x, y, w, h, solid
        // Blitz: x, y, w, h, solid (0/1) -> Bonobo: x, y, w, h, filled (bool)
        mapArgs: (args) => [args[0], args[1], args[2], args[3], toBool(args[4] || '1')],
        returnType: 'void'
    },
    'oval': {
        target: '$.rtl.oval',
        params: ['number', 'number', 'number', 'number', 'number'],
        mapArgs: (args) => [args[0], args[1], args[2], args[3], toBool(args[4] || '1')],
        returnType: 'void'
    },
    'line': { target: '$.rtl.line', params: ['number', 'number', 'number', 'number'], returnType: 'void' },
    'plot': { target: '$.rtl.plot', params: ['number', 'number'], returnType: 'void' },
    'text': { 
        target: '$.rtl.text', 
        params: ['number', 'number', 'string', 'number', 'number'],
        mapArgs: (args) => [args[0], args[1], args[2], args[3] || '0', args[4] || '0'],
        returnType: 'void'
        // TODO: Blitz2D supports optional center_x, center_y parameters
    },
    'origin': { target: '$.rtl.origin', params: ['number', 'number'], returnType: 'void' },
    'viewport': { target: '$.rtl.viewport', params: ['number', 'number', 'number', 'number'], returnType: 'void' },
    'setalpha': { target: '$.rtl.setAlpha', params: ['number'], returnType: 'void' },
    'getalpha': { target: '$.rtl.getAlpha', type: 'function', returnType: 'number' },
    'drawblock': { target: '$.rtl.drawBlock', params: ['number', 'number', 'number', 'number'], returnType: 'void' },
    'tileimage': { target: '$.rtl.tileImage', params: ['number', 'number', 'number', 'number'], returnType: 'void' },
    'tileblock': { target: '$.rtl.tileImage', params: ['number', 'number', 'number', 'number'], returnType: 'void' },
    'maskimage': { target: 'maskimage', type: 'unsupported' },
    'handleimage': { target: 'handleimage', type: 'unsupported' },
    'midhandle': { target: '$.rtl.midHandle', params: ['number'], returnType: 'void' },
    'automidhandle': { 
        target: '$.rtl.autoMidHandle', 
        params: ['number'],
        mapArgs: (args) => [toBool(args[0])],
        returnType: 'void'
    },
    
    // Bilder
    'loadimage': { target: '$.rtl.loadImage', params: ['string'], returnType: 'number' },
    'drawimage': { 
        target: '$.rtl.drawImage', 
        params: ['number', 'number', 'number', 'number'], returnType: 'void'
    },
    'loadanimimage': {
        target: '$.rtl.loadAnimImage',
        params: ['string', 'number', 'number', 'number', 'number'], // path, w, h, first, count
        mapArgs: (args) => [args[0], args[1], args[2], args[3], args[4]],
        returnType: 'number'
    },
    'createimage': { target: '$.rtl.createImage', params: ['number', 'number', 'number'], returnType: 'number' }, // TODO: Blitz2D supports 'frames' parameter
    'scaleimage': { target: '$.rtl.scaleImage', params: ['number', 'number', 'number'], returnType: 'void' },
    'rotateimage': { target: '$.rtl.rotateImage', params: ['number', 'number'], returnType: 'void' },
    'grabimage': { target: '$.rtl.grabImage', params: ['number', 'number', 'number'], returnType: 'void' }, // TODO: Blitz2D supports 'frame' parameter
    
    /* 
       Fehlende Image-Methoden (TODO in image.js):
       - MaskImage (Color Keying)
       - HandleImage (Setzen eines beliebigen Handles)
       - ImageWidth (Getter)
       - ImageHeight (Getter)
       - ImageXHandle (Getter)
       - ImageYHandle (Getter)
       - ResizeImage (Buffer resize)
       - CopyImage
       - SaveImage
       - FreeImage
       - ImageBuffer
    */
    
    // Input
    'input': { target: 'await $.rtl.input', params: ['string'], type: 'code', returnType: 'string' },
    'print': { target: 'console.log', params: ['string'], returnType: 'void' },
    'write': { target: 'console.log', params: ['string'], returnType: 'void' },
    'keydown': { target: '$.rtl.keyDown', mapArgs: (args) => [mapBlitzKey(args[0])], returnType: 'boolean' },
    'keyhit': { target: '$.rtl.keyHit', mapArgs: (args) => [mapBlitzKey(args[0])], returnType: 'boolean' },
    'mousedown': { target: '$.rtl.mouseDown', mapArgs: (args) => [mapBlitzMouse(args[0])], returnType: 'boolean' },
    'mousex': { target: '$.rtl.mouseX', type: 'function', returnType: 'number' },
    'mousey': { target: '$.rtl.mouseY', type: 'function', returnType: 'number' },
    'mousez': { target: '$.rtl.mouseZ', type: 'function', returnType: 'number' },
    'mousehit': { target: '$.rtl.mouseHit', mapArgs: (args) => [mapBlitzMouse(args[0])], returnType: 'boolean' },
    'waitkey': { target: '$.rtl.waitKey', type: 'function', returnType: 'number' },
    'getkey': { target: '$.rtl.getKey', type: 'function', returnType: 'number' },
    'flushkeys': { target: '$.rtl.flushKeys', type: 'function', returnType: 'void' },
    'flushmouse': { target: '$.rtl.flushMouse', type: 'function', returnType: 'void' },
    'mousexspeed': { target: '$.rtl.mouseXSpeed', type: 'function', returnType: 'number' },
    'mouseyspeed': { target: '$.rtl.mouseYSpeed', type: 'function', returnType: 'number' },
    'mousezspeed': { target: '$.rtl.mouseZSpeed', type: 'function', returnType: 'number' },
    'hidepointer': { target: '$.rtl.hidePointer', type: 'function', returnType: 'void' },
    'showpointer': { target: '$.rtl.showPointer', type: 'function', returnType: 'void' },

    /*
       Fehlende Mouse-Methoden (TODO in mouse.js):
       - MoveMouse (Set cursor position)
       - MouseWait
    */

    'joytype': { target: '$.rtl.joyType', params: ['number'], mapArgs: (args) => [args[0] || '0'], returnType: 'number' }, // TODO: Blitz returns Int (0=None, 1=Digital, 2=Analog), Bonobo returns String ID
    'joyx': { target: '$.rtl.joyX', params: ['number'], mapArgs: (args) => [args[0] || '0'], returnType: 'number' },
    'joyy': { target: '$.rtl.joyY', params: ['number'], mapArgs: (args) => [args[0] || '0'], returnType: 'number' },
    'joyz': { target: '$.rtl.joyZ', params: ['number'], mapArgs: (args) => [args[0] || '0'], returnType: 'number' }, // Mapped to Axis 2
    'joyhit': { target: '$.rtl.joyHit', params: ['number', 'number'], mapArgs: (args) => [args[0], args[1] || '0'], returnType: 'boolean' },
    'joydown': { target: '$.rtl.joyDown', params: ['number', 'number'], mapArgs: (args) => [args[0], args[1] || '0'], returnType: 'boolean' },

    /*
       Fehlende Input-Methoden (TODO in keyboard.js / engine):
       - Input (Read line from console/overlay)
    */

    /*
       Fehlende Joy-Methoden (TODO in joy.js):
       - JoyXDir, JoyYDir, JoyZDir, JoyUDir, JoyVDir (Digital directions)
       - JoyU, JoyV, JoyPitch, JoyYaw, JoyRoll (Additional axes)
       - JoyHat (POV Hat)
       - FlushJoy
       - WaitJoy
    */

    // Mathematik (Mapping auf JS Math)
    'sin': { target: '$.rtl.sin', params: ['number'], returnType: 'number' }, // Degrees
    'cos': { target: '$.rtl.cos', params: ['number'], returnType: 'number' },
    'tan': { target: '$.rtl.tan', params: ['number'], returnType: 'number' },
    'asin': { target: '$.rtl.asin', params: ['number'], returnType: 'number' },
    'acos': { target: '$.rtl.acos', params: ['number'], returnType: 'number' },
    'atan': { target: '$.rtl.atan', params: ['number'], returnType: 'number' },
    'atan2': { target: '$.rtl.atan2', params: ['number', 'number'], returnType: 'number' },
    'sqr': { target: '$.rtl.sqr', params: ['number'], returnType: 'number' },
    'sqrt': { target: '$.rtl.sqr', params: ['number'], returnType: 'number' },
    'floor': { target: '$.rtl.floor', params: ['number'], returnType: 'number' },
    'ceil': { target: '$.rtl.ceil', params: ['number'], returnType: 'number' },
    'abs': { target: '$.rtl.abs', params: ['number'], returnType: 'number' },
    'sgn': { target: '$.rtl.sgn', params: ['number'], returnType: 'number' },
    'int': { target: '$.rtl.int', params: ['number'], returnType: 'number' },
    'float': { target: '$.rtl.float', params: ['number'], returnType: 'number' },
    'rnd': { target: '$.rtl.rnd', params: ['number', 'number'], returnType: 'number' }, // Supports rnd(max) and rnd(min, max)
    'max': { target: '$.rtl.max', params: ['number', 'number'], returnType: 'number' },
    'min': { target: '$.rtl.min', params: ['number', 'number'], returnType: 'number' },
    
    'log': { target: 'Math.log', returnType: 'number' }, 
    'log10': { target: '$.rtl.log10', params: ['number'], returnType: 'number' },
    'exp': { target: 'Math.exp', returnType: 'number' }, 
    'pow': { target: 'Math.pow', returnType: 'number' },
    'seedrnd': { target: '$.rtl.seedRnd', params: ['number'], returnType: 'void' },
    'rndseed': { target: '$.rtl.rndSeed', type: 'function', returnType: 'number' },
    
    // Strings
    'len': { target: '$.rtl.len', params: ['string'], returnType: 'number' },
    'left': { target: '$.rtl.left', params: ['string', 'number'], returnType: 'string' },
    'right': { target: '$.rtl.right', params: ['string', 'number'], returnType: 'string' },
    'mid': { target: '$.rtl.mid', params: ['string', 'number', 'number'], returnType: 'string' },
    'upper': { target: '$.rtl.upper', params: ['string'], returnType: 'string' },
    'lower': { target: '$.rtl.lower', params: ['string'], returnType: 'string' },
    'trim': { target: '$.rtl.trim', params: ['string'], returnType: 'string' },
    'replace': { target: '$.rtl.replace', params: ['string', 'string', 'string'], returnType: 'string' },
    'instr': { target: '$.rtl.instr', params: ['string', 'string', 'number'], returnType: 'number' },
    'asc': { target: '$.rtl.asc', params: ['string'], returnType: 'number' },
    'chr': { target: '$.rtl.chr', params: ['number'], returnType: 'string' },
    'hex': { target: '$.rtl.hex', params: ['number'], returnType: 'string' },
    'bin': { target: '$.rtl.bin', params: ['number'], returnType: 'string' },
    'string': { target: '$.rtl.repeat', params: ['string', 'number'], returnType: 'string' },

    /*
       Fehlende String-Methoden (TODO in string.js):
       - LSet, RSet (Padding)
       - Str (Number to String explicit)
       - Val (String to Number explicit)
    */

    // Kollision
    'rectsoverlap': { target: '$.rtl.rectsOverlap', params: ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'], returnType: 'boolean' },
    'imagesoverlap': { target: '$.rtl.imagesOverlap', params: ['number', 'number', 'number', 'number', 'number', 'number'], returnType: 'boolean' },
    'imagescollide': { target: '$.rtl.imagesCollide', params: ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'], returnType: 'boolean' },
    'imagecolliderect': { 
        target: '$.rtl.imageRectCollide', 
        params: ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'], // img, x, y, frame, rx, ry, rw, rh
        mapArgs: (args) => [args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]],
        returnType: 'boolean'
    },
    'imagerectoverlap': { target: '$.rtl.imageRectCollide', params: ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'], returnType: 'boolean' },

    // Sound
    'loadsound': { target: '$.rtl.loadSound', params: ['string'], returnType: 'number' },
    'playsound': { target: '$.rtl.playSound', params: ['number'], returnType: 'number' },
    'loopsound': { target: 'loopsound', type: 'unsupported' },
    'soundpitch': { target: '$.rtl.channelPitch', params: ['number', 'number'], returnType: 'void' }, // TODO: Blitz2D applies to Sound object, not Channel. Signature mismatch.
    'soundvolume': { target: '$.rtl.channelVolume', params: ['number', 'number'], returnType: 'void' }, // TODO: Blitz2D applies to Sound object, not Channel. Signature mismatch.
    'soundpan': { target: '$.rtl.channelPan', params: ['number', 'number'], returnType: 'void' }, // TODO: Blitz2D applies to Sound object, not Channel. Signature mismatch.
    'stopchannel': { target: '$.rtl.stopChannel', params: ['number'], returnType: 'void' },
    
    'loadmusic': { target: '$.rtl.loadMusic', params: ['string'], returnType: 'number' },
    'playmusic': { target: '$.rtl.playMusic', params: ['number'], returnType: 'number' }, // TODO: Blitz2D PlayMusic takes a filename (String), Bonobo takes a Music object.
    
    'channelpitch': { target: '$.rtl.channelPitch', params: ['number', 'number'], returnType: 'void' },
    'channelvolume': { target: '$.rtl.channelVolume', params: ['number', 'number'], returnType: 'void' },
    'channelpan': { target: '$.rtl.channelPan', params: ['number', 'number'], returnType: 'void' },

    /*
       Fehlende Sound-Methoden (TODO in sound.js):
       - FreeSound
       - LoopSound (Set loop mode for Sound object)
       - ChannelPlaying
       - PauseChannel, ResumeChannel
    */

    // Text & Font
    'loadfont': { target: '$.rtl.loadFont', params: ['string', 'string'], returnType: 'number' }, // Note: Params differ from Blitz. Blitz: name, height, bold, italic, underline
    'setfont': { 
        target: '$.rtl.setFont', 
        params: ['number', 'number', 'number', 'number'],
        mapArgs: (args) => [args[0], args[1] || 'undefined', toBool(args[2]), toBool(args[3])],
        returnType: 'void'
        // TODO: Blitz2D SetFont only takes font_handle. Size/Style are set at LoadFont.
    },
    'stringwidth': { target: '$.rtl.stringWidth', params: ['string'], returnType: 'number' },
    'stringheight': { target: '12', type: 'code', returnType: 'number' }, // Placeholder fixed height

    /*
       Fehlende Font-Methoden (TODO in font.js):
       - FreeFont
       - FontWidth, FontHeight
       - StringHeight (Implementation)
    */

    // System & Zeit
    'delay': { target: 'await $.rtl.delay', params: ['number'], returnType: 'void' },
    'millisecs': { target: '$.rtl.millisecs', type: 'function', returnType: 'number' },
    'systemproperty': { target: '""', type: 'code', returnType: 'string' },
    'date': { target: 'new Date().toLocaleDateString()', type: 'code', returnType: 'string' }, // TODO: Blitz2D uses CurrentDate()
    'time': { target: 'new Date().toLocaleTimeString()', type: 'code', returnType: 'string' }, // TODO: Blitz2D uses CurrentTime()
    'timer': { target: '0', type: 'code', returnType: 'number' },

    /*
       Fehlende Time/System-Methoden (TODO in time.js):
       - Delay (Async sleep)
       - CurrentDate, CurrentTime
       - CreateTimer, WaitTimer, FreeTimer, TimerTicks
       - SystemProperty
    */

    // Dateioperationen
    'readfile': { target: '$.rtl.openFile', params: ['string'], returnType: 'number' },
    'writefile': { target: '$.rtl.openFile', params: ['string'], returnType: 'number' },
    'openfile': { target: '$.rtl.openFile', params: ['string'], returnType: 'number' },
    'closefile': { target: '$.rtl.closeFile', params: ['number'], returnType: 'void' },
    'filepos': { target: '$.rtl.filePos', params: ['number'], returnType: 'number' },
    'seekfile': { target: '$.rtl.seekFile', params: ['number', 'number'], returnType: 'void' },
    'readline': { target: '$.rtl.readFile', params: ['number'], returnType: 'string' }, // Note: Engine.readFile reads a line
    'writeline': { target: '$.rtl.writeFile', params: ['number', 'string'], returnType: 'void' },
    'eof': { target: '$.rtl.eof', params: ['number'], returnType: 'boolean' },
    
    'readdir': { target: '$.rtl.readDir', params: ['string'], returnType: 'number' },
    'nextfile': { target: '$.rtl.nextFile', params: ['number'], returnType: 'string' },
    'closedir': { target: '$.rtl.closeDir', params: ['number'], returnType: 'void' },
    'currentdir': { target: '$.rtl.currentDir', type: 'function', returnType: 'string' },
    'changedir': { target: '$.rtl.changeDir', params: ['string'], returnType: 'void' },
    'createdir': { target: '$.rtl.createDir', params: ['string'], returnType: 'void' },
    'deletedir': { target: '$.rtl.deleteDir', params: ['string'], returnType: 'void' },
    'filetype': { target: '$.rtl.fileType', params: ['string'], returnType: 'number' },
    'filesize': { target: '$.rtl.fileSize', params: ['string'], returnType: 'number' },
    'copyfile': { target: '$.rtl.copyFile', params: ['string', 'string'], returnType: 'void' },
    'deletefile': { target: '$.rtl.deleteFile', params: ['string'], returnType: 'void' },

    /*
       Fehlende File-Methoden (TODO in file.js):
       - ReadInt, WriteInt, ReadFloat, WriteFloat
       - ReadString (Binary), WriteString (Binary)
       - ReadByte, WriteByte, ReadShort, WriteShort
       - ReadBytes, WriteBytes (Bank operations)
       - FileAvail
    */

    'readint': { target: '$.rtl.readInt', params: ['number'], returnType: 'number' },
    'writeint': { target: '$.rtl.writeInt', params: ['number', 'number'], returnType: 'void' },
    'readfloat': { target: '$.rtl.readFloat', params: ['number'], returnType: 'number' },
    'writefloat': { target: '$.rtl.writeFloat', params: ['number', 'number'], returnType: 'void' },
    'readstring': { target: '$.rtl.readString', params: ['number'], returnType: 'string' },
    'writestring': { target: '$.rtl.writeString', params: ['number', 'string'], returnType: 'void' },
    'readbyte': { target: '$.rtl.readByte', params: ['number'], returnType: 'number' },
    'writebyte': { target: '$.rtl.writeByte', params: ['number', 'number'], returnType: 'void' },

    // Banks
    'createbank': { target: '$.rtl.createBank', params: ['number'], returnType: 'number' },
    'freebank': { target: '$.rtl.freeBank', params: ['number'], returnType: 'void' },
    'banksize': { target: '$.rtl.bankSize', params: ['number'], returnType: 'number' },
    'resizebank': { target: '$.rtl.resizeBank', params: ['number', 'number'], returnType: 'void' },
    'peekbyte': { target: '$.rtl.peekByte', params: ['number', 'number'], returnType: 'number' },
    'pokebyte': { target: '$.rtl.pokeByte', params: ['number', 'number', 'number'], returnType: 'void' },
    'peekshort': { target: '$.rtl.peekShort', params: ['number', 'number'], returnType: 'number' },
    'pokeshort': { target: '$.rtl.pokeShort', params: ['number', 'number', 'number'], returnType: 'void' },
    'peekint': { target: '$.rtl.peekInt', params: ['number', 'number'], returnType: 'number' },
    'pokeint': { target: '$.rtl.pokeInt', params: ['number', 'number', 'number'], returnType: 'void' },
    'peekfloat': { target: '$.rtl.peekFloat', params: ['number', 'number'], returnType: 'number' },
    'pokefloat': { target: '$.rtl.pokeFloat', params: ['number', 'number', 'number'], returnType: 'void' },
    'copybank': { target: '$.rtl.copyBank', params: ['number', 'number', 'number', 'number', 'number'], returnType: 'void' },

    // Type Collections
    'first': { target: '$.rtl.first', params: ['object'], returnType: 'object' },
    'last': { target: '$.rtl.last', params: ['object'], returnType: 'object' },
    'after': { target: '$.rtl.after', params: ['object'], returnType: 'object' },
    'before': { target: '$.rtl.before', params: ['object'], returnType: 'object' },

    // Memory
    'delete': { target: '$.rtl.deleteObj', params: ['object'], returnType: 'void' },

    // Spezielles
    'rand': {
        target: '$.rtl.rand',
        params: ['number', 'number'],
        // Blitz: Rand(max) or Rand(min, max) -> Bonobo: rand(min, max)
        mapArgs: (args) => args.length === 1 ? ['1', args[0]] : args,
        returnType: 'number'
    }
};