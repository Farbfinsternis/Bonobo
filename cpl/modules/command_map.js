import { mapBlitzKey, mapBlitzMouse } from './keycodes.js';

const toBool = (val) => {
    if (val === undefined || val === null) return 'false';
    if (val === '1') return 'true';
    if (val === '0') return 'false';
    return `${val} !== 0`;
};

export const commandMap = {
    // Grafik & Display
    'graphics': { target: '// Graphics command handled at init', type: 'code' },
    'setbuffer': { target: '// setbuffer not supported', type: 'code' },
    'backbuffer': { target: '// backbuffer not supported', type: 'code' },
    'cls': '$.draw.cls',
    'flip': { target: '// flip handled by engine', type: 'code' },
    'color': { target: '$.draw.color', params: ['number', 'number', 'number'] },
    'clscolor': { target: '$.draw.clsColor', params: ['number', 'number', 'number'] },
    'rect': {
        target: '$.draw.rect',
        params: ['number', 'number', 'number', 'number', 'number'], // x, y, w, h, solid
        // Blitz: x, y, w, h, solid (0/1) -> Bonobo: x, y, w, h, filled (bool)
        mapArgs: (args) => [args[0], args[1], args[2], args[3], toBool(args[4])]
    },
    'oval': {
        target: '$.draw.oval',
        params: ['number', 'number', 'number', 'number', 'number'],
        mapArgs: (args) => [args[0], args[1], args[2], args[3], toBool(args[4])]
    },
    'line': { target: '$.draw.line', params: ['number', 'number', 'number', 'number'] },
    'plot': { target: '$.draw.plot', params: ['number', 'number'] },
    'text': { 
        target: '$.draw.text', 
        params: ['number', 'number', 'string', 'number', 'number'],
        mapArgs: (args) => [args[2], args[0], args[1]]
    },
    
    // Bilder
    'loadimage': { target: '$.bob.load', params: ['string'] },
    'drawimage': '$.bob.draw',
    'loadanimimage': '$.bob.load', // Simplified mapping
    
    // Input
    'keydown': { target: '$.keys.keyDown', mapArgs: (args) => [mapBlitzKey(args[0])] },
    'keyhit': { target: '$.keys.keyHit', mapArgs: (args) => [mapBlitzKey(args[0])] },
    'mousedown': { target: '$.mouse.down', mapArgs: (args) => [mapBlitzMouse(args[0])] },
    'mousex': { target: '$.mouse.x', type: 'property' }, // Property getter, no ()
    'mousey': { target: '$.mouse.y', type: 'property' },
    'mousehit': { target: '$.mouse.hit', mapArgs: (args) => [mapBlitzMouse(args[0])] },
    'waitkey': { target: '// waitkey not supported', type: 'code' },

    // Mathematik (Mapping auf JS Math)
    'sin': 'Math.sin', 'cos': 'Math.cos', 'tan': 'Math.tan',
    'asin': 'Math.asin', 'acos': 'Math.acos', 'atan': 'Math.atan', 'atan2': 'Math.atan2',
    'sqr': 'Math.sqrt', 'sqrt': 'Math.sqrt',
    'floor': 'Math.floor', 'ceil': 'Math.ceil', 'abs': 'Math.abs',
    'log': 'Math.log', 'exp': 'Math.exp', 'pow': 'Math.pow',
    
    // Spezielles
    'rand': {
        target: '$.math.rand',
        params: ['number', 'number'],
        // Blitz: Rand(max) or Rand(min, max) -> Bonobo: rand(min, max)
        mapArgs: (args) => args.length === 1 ? ['1', args[0]] : args
    }
};