/**
 * FileStream Module
 * Handles binary read/write operations using DataView.
 * Follows BlitzBasic's Little-Endian convention.
 */
export class FileStream {
    constructor(arrayBuffer) {
        this.buffer = arrayBuffer || new ArrayBuffer(0);
        this.view = new DataView(this.buffer);
        this.pos = 0;
        this.littleEndian = true; // BlitzBasic is Little-Endian
    }

    readInt() {
        const val = this.view.getInt32(this.pos, this.littleEndian);
        this.pos += 4;
        return val;
    }

    writeInt(val) {
        this.view.setInt32(this.pos, val, this.littleEndian);
        this.pos += 4;
    }

    readShort() {
        const val = this.view.getInt16(this.pos, this.littleEndian);
        this.pos += 2;
        return val;
    }

    writeShort(val) {
        this.view.setInt16(this.pos, val, this.littleEndian);
        this.pos += 2;
    }

    readFloat() {
        const val = this.view.getFloat32(this.pos, this.littleEndian);
        this.pos += 4;
        return val;
    }

    writeFloat(val) {
        this.view.setFloat32(this.pos, val, this.littleEndian);
        this.pos += 4;
    }

    readByte() {
        return this.view.getUint8(this.pos++);
    }

    writeByte(val) {
        this.view.setUint8(this.pos++, val);
    }

    readString() {
        const len = this.readInt();
        let str = "";
        for (let i = 0; i < len; i++) {
            str += String.fromCharCode(this.readByte());
        }
        return str;
    }

    writeString(str) {
        this.writeInt(str.length);
        for (let i = 0; i < str.length; i++) {
            this.writeByte(str.charCodeAt(i));
        }
    }

    readLine() {
        let str = "";
        while (!this.eof) {
            const char = this.readByte();
            if (char === 10) break; // \n
            if (char === 13) { // \r
                if (this.pos < this.buffer.byteLength && this.view.getUint8(this.pos) === 10) this.pos++;
                break;
            }
            str += String.fromCharCode(char);
        }
        return str;
    }

    writeLine(str) {
        for (let i = 0; i < str.length; i++) this.writeByte(str.charCodeAt(i));
        this.writeByte(10); // \n
    }

    seek(position) {
        this.pos = Math.max(0, Math.min(position, this.buffer.byteLength));
    }

    get eof() {
        return this.pos >= this.buffer.byteLength;
    }
}