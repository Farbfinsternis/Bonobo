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
     * Loads a sound file (SFX) into memory.
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
     * Loads a music file for streaming.
     * @param {string} path Path to the music file.
     * @returns {Mus} The music object container.
     */
    loadMusic(path){
        let mus = new Mus();
        // We use IMAGE type to ensure we get a Blob, which we can stream via ObjectURL
        this.bonobo.utils.loadFile(path, Utils.TYPES.IMAGE).then(blob => {
            if(blob instanceof Blob){
                mus.element = new Audio(URL.createObjectURL(blob));
                mus.loaded = true;
            }
        });
        return mus;
    }

    /**
     * Plays a sound object.
     * @param {Snd} snd The sound object to play.
     * @param {number} [volume=1.0] Volume (0.0 to 1.0).
     * @param {number} [pan=0.0] Stereo panning (-1.0 left to 1.0 right).
     * @param {boolean} [loop=false] Whether to loop the sound.
     * @returns {AudioBufferSourceNode|null} The audio source node (channel).
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
        
        // Attach nodes to source to allow dynamic control
        source.gainNode = gainNode;
        source.pannerNode = panner;

        return source; // Return as "Channel"
    }

    /**
     * Plays a sound with automatic panning based on screen coordinates.
     * @param {Snd} snd The sound object to play.
     * @param {number} x The X-coordinate of the sound source.
     * @param {number} y The Y-coordinate of the sound source.
     * @param {number} [volume=1.0] Volume (0.0 to 1.0).
     * @param {boolean} [loop=false] Whether to loop the sound.
     * @returns {AudioBufferSourceNode|null} The audio source node (channel).
     */
    playAt(snd, x, y, volume = 1.0, loop = false){
        let pan = 0.0;
        if(this.bonobo.contextOwner){
            const width = this.bonobo.contextOwner.width;
            pan = Math.max(-1.0, Math.min(1.0, ((x / width) * 2) - 1));
        }
        return this.play(snd, volume, pan, loop);
    }

    /**
     * Plays a music object.
     * @param {Mus} music The music object to play.
     * @param {number} [volume=1.0] Volume (0.0 to 1.0).
     * @param {boolean} [loop=true] Whether to loop the music.
     * @returns {HTMLAudioElement|null} The audio element (channel).
     */
    playMusic(music, volume = 1.0, loop = true){
        if(!music.loaded || !music.element) return null;

        music.element.volume = volume;
        music.element.loop = loop;
        music.element.play().catch(e => {
            this.bonobo.utils.error.warn(`Bonobo Sound: Could not play music. ${e}`);
        });
        
        return music.element;
    }

    /**
     * Sets the pitch (playback rate) of a sound channel in Hertz.
     * @param {AudioBufferSourceNode} channel The sound channel returned by play().
     * @param {number} hertz The new frequency in Hertz.
     */
    channelPitch(channel, hertz){
        if(channel && channel.buffer && channel.playbackRate){
            // Calculate ratio: desired_hz / base_hz
            channel.playbackRate.value = hertz / channel.buffer.sampleRate;
        }
    }

    /**
     * Sets the volume of a playing channel.
     * @param {AudioBufferSourceNode|HTMLAudioElement} channel The channel.
     * @param {number} volume Volume (0.0 to 1.0).
     */
    channelVolume(channel, volume){
        if(!channel) return;
        if(channel.gainNode){
            // Web Audio (SFX)
            channel.gainNode.gain.value = volume;
        } else if (channel.volume !== undefined) {
            // HTML Audio (Music)
            channel.volume = volume;
        }
    }

    /**
     * Sets the stereo panning of a playing channel.
     * @param {AudioBufferSourceNode} channel The channel.
     * @param {number} pan Pan value (-1.0 to 1.0).
     */
    channelPan(channel, pan){
        if(!channel) return;
        if(channel.pannerNode){
            channel.pannerNode.pan.value = pan;
        }
    }

    /**
     * Stops a playing sound or music channel.
     * @param {AudioBufferSourceNode|HTMLAudioElement} channel The channel to stop.
     */
    stopChannel(channel){
        if(!channel) return;

        if(typeof channel.stop === 'function'){
            // It's a Web Audio Node (Sound)
            try{
                channel.stop();
            }catch(e){
                // Ignore if already stopped
            }
        }else if(typeof channel.pause === 'function'){
            // It's an HTML Audio Element (Music)
            channel.pause();
            channel.currentTime = 0;
        }
    }
}

class Snd{
    constructor(){
        this.buffer = null;
        this.loaded = false;
    }
}

class Mus{
    constructor(){
        this.element = null;
        this.loaded = false;
    }
}