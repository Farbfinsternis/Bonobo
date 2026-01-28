/**
 * A 4x4 Matrix class for 3D calculations.
 * Stored in column-major order (WebGL standard).
 */
export class Matrix4 {
    constructor() {
        this.data = new Float32Array(16);
        this.identity();
    }

    /**
     * Resets this matrix to the identity matrix.
     */
    identity() {
        this.data.fill(0);
        this.data[0] = 1;
        this.data[5] = 1;
        this.data[10] = 1;
        this.data[15] = 1;
        return this;
    }

    /**
     * Copies data from another matrix.
     * @param {Matrix4} m
     */
    copy(m) {
        this.data.set(m.data);
        return this;
    }

    /**
     * Multiplies this matrix by another matrix (this = this * m).
     * @param {Matrix4} m
     */
    multiply(m) {
        const a = this.data;
        const b = m.data;
        const out = new Float32Array(16);

        // Row 0
        out[0] = a[0] * b[0] + a[4] * b[1] + a[8] * b[2] + a[12] * b[3];
        out[4] = a[0] * b[4] + a[4] * b[5] + a[8] * b[6] + a[12] * b[7];
        out[8] = a[0] * b[8] + a[4] * b[9] + a[8] * b[10] + a[12] * b[11];
        out[12] = a[0] * b[12] + a[4] * b[13] + a[8] * b[14] + a[12] * b[15];

        // Row 1
        out[1] = a[1] * b[0] + a[5] * b[1] + a[9] * b[2] + a[13] * b[3];
        out[5] = a[1] * b[4] + a[5] * b[5] + a[9] * b[6] + a[13] * b[7];
        out[9] = a[1] * b[8] + a[5] * b[9] + a[9] * b[10] + a[13] * b[11];
        out[13] = a[1] * b[12] + a[5] * b[13] + a[9] * b[14] + a[13] * b[15];

        // Row 2
        out[2] = a[2] * b[0] + a[6] * b[1] + a[10] * b[2] + a[14] * b[3];
        out[6] = a[2] * b[4] + a[6] * b[5] + a[10] * b[6] + a[14] * b[7];
        out[10] = a[2] * b[8] + a[6] * b[9] + a[10] * b[10] + a[14] * b[11];
        out[14] = a[2] * b[12] + a[6] * b[13] + a[10] * b[14] + a[14] * b[15];

        // Row 3
        out[3] = a[3] * b[0] + a[7] * b[1] + a[11] * b[2] + a[15] * b[3];
        out[7] = a[3] * b[4] + a[7] * b[5] + a[11] * b[6] + a[15] * b[7];
        out[11] = a[3] * b[8] + a[7] * b[9] + a[11] * b[10] + a[15] * b[11];
        out[15] = a[3] * b[12] + a[7] * b[13] + a[11] * b[14] + a[15] * b[15];

        this.data.set(out);
        return this;
    }

    /**
     * Translates the matrix.
     */
    translate(x, y, z) {
        const m = new Matrix4();
        m.data[12] = x;
        m.data[13] = y;
        m.data[14] = z;
        this.multiply(m);
        return this;
    }

    /**
     * Scales the matrix.
     */
    scale(x, y, z) {
        const m = new Matrix4();
        m.data[0] = x;
        m.data[5] = y;
        m.data[10] = z;
        this.multiply(m);
        return this;
    }

    /**
     * Rotates the matrix around the X axis.
     */
    rotateX(angle) {
        const rad = angle * Math.PI / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const m = new Matrix4();
        m.data[5] = c;
        m.data[6] = s;
        m.data[9] = -s;
        m.data[10] = c;
        this.multiply(m);
        return this;
    }

    /**
     * Rotates the matrix around the Y axis.
     */
    rotateY(angle) {
        const rad = angle * Math.PI / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const m = new Matrix4();
        m.data[0] = c;
        m.data[2] = -s;
        m.data[8] = s;
        m.data[10] = c;
        this.multiply(m);
        return this;
    }

    /**
     * Rotates the matrix around the Z axis.
     */
    rotateZ(angle) {
        const rad = angle * Math.PI / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const m = new Matrix4();
        m.data[0] = c;
        m.data[1] = s;
        m.data[4] = -s;
        m.data[5] = c;
        this.multiply(m);
        return this;
    }
    
    /**
     * Sets the matrix to a perspective projection.
     */
    perspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov * Math.PI / 360);
        const rangeInv = 1.0 / (near - far);

        this.data.fill(0);
        this.data[0] = f / aspect;
        this.data[5] = f;
        this.data[10] = (near + far) * rangeInv;
        this.data[11] = -1;
        this.data[14] = near * far * rangeInv * 2;
        this.data[15] = 0;
        return this;
    }

    /**
     * Inverts this matrix.
     * Necessary for calculating the Camera View Matrix.
     */
    invert() {
        const a = this.data;
        const out = new Float32Array(16);

        const n11 = a[0], n12 = a[4], n13 = a[8], n14 = a[12];
        const n21 = a[1], n22 = a[5], n23 = a[9], n24 = a[13];
        const n31 = a[2], n32 = a[6], n33 = a[10], n34 = a[14];
        const n41 = a[3], n42 = a[7], n43 = a[11], n44 = a[15];

        out[0] = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
        out[4] = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
        out[8] = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
        out[12] = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;
        out[1] = n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44;
        out[5] = n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44;
        out[9] = n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44;
        out[13] = n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34;
        out[2] = n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44;
        out[6] = n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44;
        out[10] = n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44;
        out[14] = n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34;
        out[3] = n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43;
        out[7] = n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43;
        out[11] = n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43;
        out[15] = n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33;

        const det = n11 * out[0] + n21 * out[4] + n31 * out[8] + n41 * out[12];

        if (det === 0) return this;

        const detInv = 1.0 / det;

        for (let i = 0; i < 16; i++) {
            this.data[i] = out[i] * detInv;
        }

        return this;
    }
}