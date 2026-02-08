import { mapBlitzKey, mapBlitzMouse } from './keycodes.js';

const toBool = (val) => {
    if (val === undefined || val === null) return 'false';
    if (val === '1') return 'true';
    if (val === '0') return 'false';
    return `${val} !== 0`;
};

export const commandMap = {
    // Grafik & Display
    'graphics': { target: '$.rtl.graphics', params: ['number', 'number', 'number', 'number'], mapArgs: (args) => [args[0], args[1], args[2] || '0', args[3] || '0'] },
    'graphicswidth': { target: '$.rtl.graphicsWidth', type: 'function' },
    'graphicsheight': { target: '$.rtl.graphicsHeight', type: 'function' },
    'setbuffer': { target: '$.rtl.setBuffer', params: ['number'] },
    'backbuffer': { target: '$.rtl.backBuffer', type: 'function' },
    'frontbuffer': { target: '// frontbuffer not supported', type: 'code' },
    'imagebuffer': { target: '$.rtl.imageBuffer', params: ['number'] },

    /*
       Fehlende Graphics-Methoden (TODO in graphics.js):
       - EndGraphics
       - GraphicsDepth
       - GraphicsModeExists
       - CountGfxModes, GfxModeWidth, GfxModeHeight, GfxModeDepth
       - GraphicsBuffer, LoadBuffer, SaveBuffer, BufferDirty
    */

    'cls': '$.rtl.cls',
    'flip': { target: 'await $.rtl.flip()', type: 'code' },
    'color': { 
        target: '$.rtl.color', 
        params: ['number', 'number', 'number', 'number'],
        mapArgs: (args) => [args[0], args[1], args[2], args[3] || '1']
    },
    'clscolor': { 
        target: '$.rtl.clsColor', 
        params: ['number', 'number', 'number', 'number'],
        mapArgs: (args) => [args[0], args[1], args[2], args[3] || '1']
    },
    'rect': {
        target: '$.rtl.rect',
        params: ['number', 'number', 'number', 'number', 'number'], // x, y, w, h, solid
        // Blitz: x, y, w, h, solid (0/1) -> Bonobo: x, y, w, h, filled (bool)
        mapArgs: (args) => [args[0], args[1], args[2], args[3], toBool(args[4] || '1')]
    },
    'oval': {
        target: '$.rtl.oval',
        params: ['number', 'number', 'number', 'number', 'number'],
        mapArgs: (args) => [args[0], args[1], args[2], args[3], toBool(args[4] || '1')]
    },
    'line': { target: '$.rtl.line', params: ['number', 'number', 'number', 'number'] },
    'plot': { target: '$.rtl.plot', params: ['number', 'number'] },
    'text': { 
        target: '$.rtl.text', 
        params: ['number', 'number', 'string', 'number', 'number'],
        mapArgs: (args) => [args[0], args[1], args[2], args[3] || '0', args[4] || '0'],
        // TODO: Blitz2D supports optional center_x, center_y parameters
    },
    'origin': { target: '$.rtl.origin', params: ['number', 'number'] },
    'viewport': { target: '$.rtl.viewport', params: ['number', 'number', 'number', 'number'] },
    'setalpha': { target: '$.rtl.setAlpha', params: ['number'] },
    'getalpha': { target: '$.rtl.getAlpha', type: 'function' },
    'drawblock': { target: '$.rtl.drawBlock', params: ['number', 'number', 'number', 'number'] }, // TODO: Blitz2D DrawBlock ignores mask
    'tileimage': { target: '$.rtl.tileImage', params: ['number', 'number', 'number', 'number'] }, // TODO: Blitz2D x, y are optional
    'tileblock': { target: '$.rtl.tileImage', params: ['number', 'number', 'number', 'number'] }, // TODO: Blitz2D x, y are optional
    'maskimage': { target: '// maskimage not implemented', type: 'code' },
    'handleimage': { target: '// handleimage not implemented', type: 'code' },
    'midhandle': { target: '$.rtl.midHandle', params: ['number'] },
    'automidhandle': { 
        target: '$.rtl.autoMidHandle', 
        params: ['number'],
        mapArgs: (args) => [toBool(args[0])]
    },
    
    // Bilder
    'loadimage': { target: '$.rtl.loadImage', params: ['string'] },
    'drawimage': { 
        target: '$.rtl.drawImage', 
        params: ['number', 'number', 'number', 'number'] 
    },
    'loadanimimage': {
        target: '$.rtl.loadAnimImage',
        params: ['string', 'number', 'number', 'number', 'number'], // path, w, h, first, count
        mapArgs: (args) => [args[0], args[1], args[2], args[3], args[4]]
    },
    'createimage': { target: '$.rtl.createImage', params: ['number', 'number', 'number'] }, // TODO: Blitz2D supports 'frames' parameter
    'scaleimage': { target: '$.rtl.scaleImage', params: ['number', 'number', 'number'] },
    'rotateimage': { target: '$.rtl.rotateImage', params: ['number', 'number'] },
    'grabimage': { target: '$.rtl.grabImage', params: ['number', 'number', 'number'] }, // TODO: Blitz2D supports 'frame' parameter
    
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
    'input': { target: 'await $.rtl.input', params: ['string'], type: 'code' },
    'print': { target: 'console.log', params: ['string'] },
    'write': { target: 'console.log', params: ['string'] },
    'keydown': { target: '$.rtl.keyDown', mapArgs: (args) => [mapBlitzKey(args[0])] },
    'keyhit': { target: '$.rtl.keyHit', mapArgs: (args) => [mapBlitzKey(args[0])] }, // TODO: Blitz returns hit count (Int), Bonobo returns Bool
    'mousedown': { target: '$.rtl.mouseDown', mapArgs: (args) => [mapBlitzMouse(args[0])] },
    'mousex': { target: '$.rtl.mouseX', type: 'function' },
    'mousey': { target: '$.rtl.mouseY', type: 'function' },
    'mousez': { target: '$.rtl.mouseZ', type: 'function' },
    'mousehit': { target: '$.rtl.mouseHit', mapArgs: (args) => [mapBlitzMouse(args[0])] },
    'waitkey': { target: '$.rtl.waitKey', type: 'function' }, // TODO: Blitz returns Scancode (Int) and blocks. Bonobo returns Promise<String>.
    'getkey': { target: '$.rtl.getKey', type: 'function' }, // TODO: Blitz returns ASCII (Int), Bonobo returns String char.
    'flushkeys': { target: '$.rtl.flushKeys', type: 'function' },
    'flushmouse': { target: '$.rtl.flushMouse', type: 'function' },
    'mousexspeed': { target: '$.rtl.mouseXSpeed', type: 'function' },
    'mouseyspeed': { target: '$.rtl.mouseYSpeed', type: 'function' },
    'mousezspeed': { target: '$.rtl.mouseZSpeed', type: 'function' },
    'hidepointer': { target: '$.rtl.hidePointer', type: 'function' },
    'showpointer': { target: '$.rtl.showPointer', type: 'function' },

    /*
       Fehlende Mouse-Methoden (TODO in mouse.js):
       - MoveMouse (Set cursor position)
       - MouseWait
    */

    'joytype': { target: '$.rtl.joyType', params: ['number'], mapArgs: (args) => [args[0] || '0'] }, // TODO: Blitz returns Int (0=None, 1=Digital, 2=Analog), Bonobo returns String ID
    'joyx': { target: '$.rtl.joyX', params: ['number'], mapArgs: (args) => [args[0] || '0'] },
    'joyy': { target: '$.rtl.joyY', params: ['number'], mapArgs: (args) => [args[0] || '0'] },
    'joyz': { target: '$.rtl.joyZ', params: ['number'], mapArgs: (args) => [args[0] || '0'] }, // Mapped to Axis 2
    'joyhit': { target: '$.rtl.joyHit', params: ['number', 'number'], mapArgs: (args) => [args[0], args[1] || '0'] },
    'joydown': { target: '$.rtl.joyDown', params: ['number', 'number'], mapArgs: (args) => [args[0], args[1] || '0'] },

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
    'sin': { target: '$.rtl.sin', params: ['number'] }, // Degrees
    'cos': { target: '$.rtl.cos', params: ['number'] },
    'tan': { target: '$.rtl.tan', params: ['number'] },
    'asin': { target: '$.rtl.asin', params: ['number'] },
    'acos': { target: '$.rtl.acos', params: ['number'] },
    'atan': { target: '$.rtl.atan', params: ['number'] },
    'atan2': { target: '$.rtl.atan2', params: ['number', 'number'] },
    'sqr': { target: '$.rtl.sqr', params: ['number'] },
    'sqrt': { target: '$.rtl.sqr', params: ['number'] },
    'floor': { target: '$.rtl.floor', params: ['number'] },
    'ceil': { target: '$.rtl.ceil', params: ['number'] },
    'abs': { target: '$.rtl.abs', params: ['number'] },
    'sgn': { target: '$.rtl.sgn', params: ['number'] },
    'int': { target: '$.rtl.int', params: ['number'] },
    'float': { target: '$.rtl.float', params: ['number'] },
    'rnd': { target: '$.rtl.rnd', params: ['number', 'number'] }, // Supports rnd(max) and rnd(min, max)
    'max': { target: '$.rtl.max', params: ['number', 'number'] },
    'min': { target: '$.rtl.min', params: ['number', 'number'] },
    
    'log': 'Math.log', 'exp': 'Math.exp', 'pow': 'Math.pow',
    // TODO: Log10, SeedRnd, RndSeed missing in math.js
    
    // Strings
    'len': { target: '$.rtl.len', params: ['string'] },
    'left': { target: '$.rtl.left', params: ['string', 'number'] },
    'right': { target: '$.rtl.right', params: ['string', 'number'] },
    'mid': { target: '$.rtl.mid', params: ['string', 'number', 'number'] }, // count is optional
    'upper': { target: '$.rtl.upper', params: ['string'] },
    'lower': { target: '$.rtl.lower', params: ['string'] },
    'trim': { target: '$.rtl.trim', params: ['string'] },
    'replace': { target: '$.rtl.replace', params: ['string', 'string', 'string'] },
    'instr': { target: '$.rtl.instr', params: ['string', 'string', 'number'] }, // start is optional
    'asc': { target: '$.rtl.asc', params: ['string'] },
    'chr': { target: '$.rtl.chr', params: ['number'] },
    'hex': { target: '$.rtl.hex', params: ['number'] },
    'bin': { target: '$.rtl.bin', params: ['number'] },
    'string': { target: '$.rtl.repeat', params: ['string', 'number'] },

    /*
       Fehlende String-Methoden (TODO in string.js):
       - LSet, RSet (Padding)
       - Str (Number to String explicit)
       - Val (String to Number explicit)
    */

    // Kollision
    'rectsoverlap': { target: '$.rtl.rectsOverlap', params: ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'] },
    'imagesoverlap': { target: '$.rtl.imagesOverlap', params: ['number', 'number', 'number', 'number', 'number', 'number'] },
    'imagescollide': { target: '$.rtl.imagesCollide', params: ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'] },
    'imagecolliderect': { 
        target: '$.rtl.imageRectCollide', 
        params: ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'], // img, x, y, frame, rx, ry, rw, rh
        mapArgs: (args) => [args[0], args[1], args[2], args[4], args[5], args[6], args[7]] // skip frame
    },
    'imagerectoverlap': { target: '$.rtl.imageRectCollide', params: ['number', 'number', 'number', 'number', 'number', 'number', 'number'] },

    // Sound
    'loadsound': { target: '$.rtl.loadSound', params: ['string'] },
    'playsound': { target: '$.rtl.playSound', params: ['number'] },
    'loopsound': { target: '// loopsound not implemented', type: 'code' },
    'soundpitch': { target: '$.rtl.channelPitch', params: ['number', 'number'] }, // TODO: Blitz2D applies to Sound object, not Channel. Signature mismatch.
    'soundvolume': { target: '$.rtl.channelVolume', params: ['number', 'number'] }, // TODO: Blitz2D applies to Sound object, not Channel. Signature mismatch.
    'soundpan': { target: '$.rtl.channelPan', params: ['number', 'number'] }, // TODO: Blitz2D applies to Sound object, not Channel. Signature mismatch.
    'stopchannel': { target: '$.rtl.stopChannel', params: ['number'] },
    
    'loadmusic': { target: '$.rtl.loadMusic', params: ['string'] },
    'playmusic': { target: '$.rtl.playMusic', params: ['number'] }, // TODO: Blitz2D PlayMusic takes a filename (String), Bonobo takes a Music object.
    
    'channelpitch': { target: '$.rtl.channelPitch', params: ['number', 'number'] },
    'channelvolume': { target: '$.rtl.channelVolume', params: ['number', 'number'] },
    'channelpan': { target: '$.rtl.channelPan', params: ['number', 'number'] },

    /*
       Fehlende Sound-Methoden (TODO in sound.js):
       - FreeSound
       - LoopSound (Set loop mode for Sound object)
       - ChannelPlaying
       - PauseChannel, ResumeChannel
    */

    // Text & Font
    'loadfont': { target: '$.rtl.loadFont', params: ['string', 'string'] }, // Note: Params differ from Blitz. Blitz: name, height, bold, italic, underline
    'setfont': { 
        target: '$.rtl.setFont', 
        params: ['number', 'number', 'number', 'number'],
        mapArgs: (args) => [args[0], args[1] || 'undefined', toBool(args[2]), toBool(args[3])]
        // TODO: Blitz2D SetFont only takes font_handle. Size/Style are set at LoadFont.
    },
    'stringwidth': { target: '$.rtl.stringWidth', params: ['string'] },
    'stringheight': { target: '12', type: 'code' }, // Placeholder fixed height

    /*
       Fehlende Font-Methoden (TODO in font.js):
       - FreeFont
       - FontWidth, FontHeight
       - StringHeight (Implementation)
    */

    // System & Zeit
    'delay': { target: 'await $.rtl.delay', params: ['number'] },
    'millisecs': { target: '$.rtl.millisecs', type: 'function' },
    'systemproperty': { target: '""', type: 'code' },
    'date': { target: 'new Date().toLocaleDateString()', type: 'code' }, // TODO: Blitz2D uses CurrentDate()
    'time': { target: 'new Date().toLocaleTimeString()', type: 'code' }, // TODO: Blitz2D uses CurrentTime()
    'timer': { target: '0', type: 'code' },

    /*
       Fehlende Time/System-Methoden (TODO in time.js):
       - Delay (Async sleep)
       - CurrentDate, CurrentTime
       - CreateTimer, WaitTimer, FreeTimer, TimerTicks
       - SystemProperty
    */

    // Dateioperationen
    'readfile': { target: '$.rtl.openFile', params: ['string'] },
    'writefile': { target: '$.rtl.openFile', params: ['string'] },
    'openfile': { target: '$.rtl.openFile', params: ['string'] },
    'closefile': { target: '$.rtl.closeFile', params: ['number'] },
    'filepos': { target: '$.rtl.filePos', params: ['number'] },
    'seekfile': { target: '$.rtl.seekFile', params: ['number', 'number'] },
    'readline': { target: '$.rtl.readFile', params: ['number'] }, // Note: Engine.readFile reads a line
    'writeline': { target: '$.rtl.writeFile', params: ['number', 'string'] },
    'eof': { target: '$.rtl.eof', params: ['number'] },
    
    'readdir': { target: '$.rtl.readDir', params: ['string'] },
    'nextfile': { target: '$.rtl.nextFile', params: ['number'] },
    'closedir': { target: '$.rtl.closeDir', params: ['number'] },
    'currentdir': { target: '$.rtl.currentDir', type: 'function' },
    'changedir': { target: '$.rtl.changeDir', params: ['string'] },
    'createdir': { target: '$.rtl.createDir', params: ['string'] },
    'deletedir': { target: '$.rtl.deleteDir', params: ['string'] },
    'filetype': { target: '$.rtl.fileType', params: ['string'] },
    'filesize': { target: '$.rtl.fileSize', params: ['string'] },
    'copyfile': { target: '$.rtl.copyFile', params: ['string', 'string'] },
    'deletefile': { target: '$.rtl.deleteFile', params: ['string'] },

    /*
       Fehlende File-Methoden (TODO in file.js):
       - ReadInt, WriteInt, ReadFloat, WriteFloat
       - ReadString (Binary), WriteString (Binary)
       - ReadByte, WriteByte, ReadShort, WriteShort
       - ReadBytes, WriteBytes (Bank operations)
       - FileAvail
    */

    'readint': { target: '0', type: 'code' },
    'writeint': { target: '// writeint', type: 'code' },
    'readfloat': { target: '0.0', type: 'code' },
    'writefloat': { target: '// writefloat', type: 'code' },
    'readstring': { target: '""', type: 'code' },
    'writestring': { target: '// writestring', type: 'code' },

    // Memory
    'delete': { target: '$.rtl.deleteObj', params: ['object'] },

    // Spezielles
    'rand': {
        target: '$.rtl.rand',
        params: ['number', 'number'],
        // Blitz: Rand(max) or Rand(min, max) -> Bonobo: rand(min, max)
        mapArgs: (args) => args.length === 1 ? ['1', args[0]] : args
    }
};