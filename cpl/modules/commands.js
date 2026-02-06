// c:\xampp\htdocs\test\cpl\modules\commands.js
export const commands = new Set([
    // Grafik & Display (2D)
    "graphics", "setbuffer", "backbuffer", "frontbuffer", "cls", "flip", 
    "clsColor", "color", "rect", "oval", "line", "plot", "text",
    "loadimage", "drawimage", "drawblock", "tileimage", "tileblock", 
    "maskimage", "handleimage", "midhandle", "autoimage",
    
    // Input
    "input", "print", "write", "keydown", "keyhit", "waitkey", "flushkeys",
    "mousex", "mousey", "mousexspeed", "mouseyspeed", "mousehit", "mousedown",
    "joyx", "joyy", "joyhit", "joydown",
    
    // Sound
    "loadsound", "playsound", "loopsound", "soundpitch", "soundvolume", "soundpan",
    
    // System & Zeit
    "delay", "millisecs", "systemproperty", "date", "time", "timer",
    
    // Dateioperationen
    "readfile", "writefile", "openfile", "closefile", "filepos", "seekfile",
    "readline", "writeline", "readint", "writeint", "readfloat", "writefloat",
    "readstring", "writestring", "eof"
]);
