/**
 * Bank Module for Bonobo
 * Provides raw memory access using ArrayBuffer and DataView.
 * This module is independent of the ApeShift compiler.
 */
export class Bank {
    constructor(size) {
        this.buffer = new ArrayBuffer(size);
        this.view = new DataView(this.buffer);
        this.littleEndian = true; // Standard for Blitz-like behavior
    }

    get size() {
        return this.buffer.byteLength;
    }

    /**
     * Resizes the bank while preserving existing data.
     */
    resize(newSize) {
        const newBuffer = new ArrayBuffer(newSize);
        const oldBytes = new Uint8Array(this.buffer);
        const newBytes = new Uint8Array(newBuffer);
        
        newBytes.set(oldBytes.slice(0, Math.min(this.buffer.byteLength, newSize)));
        
        this.buffer = newBuffer;
        this.view = new DataView(this.buffer);
    }

    // --- Peek Methods ---
    peekByte(offset) { return this.view.getUint8(offset); }
    peekShort(offset) { return this.view.getInt16(offset, this.littleEndian); }
    peekInt(offset) { return this.view.getInt32(offset, this.littleEndian); }
    peekFloat(offset) { return this.view.getFloat32(offset, this.littleEndian); }

    // --- Poke Methods ---
    pokeByte(offset, value) { this.view.setUint8(offset, value); }
    pokeShort(offset, value) { this.view.setInt16(offset, value, this.littleEndian); }
    pokeInt(offset, value) { this.view.setInt32(offset, value, this.littleEndian); }
    pokeFloat(offset, value) { this.view.setFloat32(offset, value, this.littleEndian); }

    /**
     * Copies data from another bank.
     */
    copy(srcBank, srcOffset, destOffset, count) {
        const srcBytes = new Uint8Array(srcBank.buffer, srcOffset, count);
        const destBytes = new Uint8Array(this.buffer, destOffset, count);
        destBytes.set(srcBytes);
    }
    
    /**
     * Returns the underlying ArrayBuffer.
     */
    getBuffer() {
        return this.buffer;
    }
}