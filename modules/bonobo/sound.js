import { Utils } from "../../lib/modules/utils.js";

/**
 * Manages loading and playing of sound effects via Web Audio API.
 */
export class Sound{
    constructor(bonobo){
        this.bonobo = bonobo;
        // Initialize Web Audio API Context
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    /**
     * Loads a sound file.
     * @param {string} path Path to the sound file.
     * @returns {Snd} The sound object container.
     */
    load(path){
        let snd = new Snd();
        
        this.bonobo.utils.loadFile(path, Utils.TYPES.SOUND).then(arrayBuffer => {
            this.ctx.decodeAudioData(arrayBuffer).then(audioBuffer => {
                snd.buffer = audioBuffer;
                snd.loaded = true;
            });
        });

        return snd;
    }

    /**
     * Plays a sound object.
     * @param {Snd} snd The sound object to play.
     * @param {number} [volume=1.0] Volume (0.0 to 1.0).
     * @param {number} [pan=0.0] Stereo panning (-1.0 left to 1.0 right).
     * @param {boolean} [loop=false] Whether to loop the sound.
     * @returns {AudioBufferSourceNode|null} The audio source node (can be used to stop sound).
     */
    play(snd, volume = 1.0, pan = 0.0, loop = false){
        if(!snd.loaded) return null;

        // Browser Policy: AudioContext must be resumed after user interaction
        if(this.ctx.state === 'suspended'){
            this.ctx.resume();
        }

        let source = this.ctx.createBufferSource();
        source.buffer = snd.buffer;
        source.loop = loop;

        let gainNode = this.ctx.createGain();
        gainNode.gain.value = volume;

        let panner = this.ctx.createStereoPanner();
        panner.pan.value = pan;

        // Routing: Source -> Gain (Volume) -> Panner (L/R) -> Output
        source.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.ctx.destination);

        source.start(0);
        return source; // Return as "Channel" if you want to call stop()
    }
}

class Snd{
    constructor(){
        this.buffer = null;
        this.loaded = false;
    }
}