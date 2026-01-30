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
        
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
        const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
        const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
        const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

        a[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
        a[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
        a[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
        a[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;

        a[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
        a[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
        a[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
        a[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;

        a[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
        a[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
        a[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
        a[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;

        a[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
        a[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
        a[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
        a[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;

        return this;
    }

    /**
     * Translates the matrix.
     */
    translate(x, y, z) {
        const a = this.data;
        // Apply translation directly to the current matrix (equivalent to post-multiply)
        a[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        a[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        a[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        a[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        return this;
    }

    /**
     * Scales the matrix.
     */
    scale(x, y, z) {
        const a = this.data;
        a[0] *= x; a[1] *= x; a[2] *= x; a[3] *= x;
        a[4] *= y; a[5] *= y; a[6] *= y; a[7] *= y;
        a[8] *= z; a[9] *= z; a[10] *= z; a[11] *= z;
        return this;
    }

    /**
     * Rotates the matrix around the X axis.
     */
    rotateX(angle) {
        const rad = angle * Math.PI / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const a = this.data;
        
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];

        a[4] = a10 * c + a20 * s;
        a[5] = a11 * c + a21 * s;
        a[6] = a12 * c + a22 * s;
        a[7] = a13 * c + a23 * s;

        a[8] = a10 * -s + a20 * c;
        a[9] = a11 * -s + a21 * c;
        a[10] = a12 * -s + a22 * c;
        a[11] = a13 * -s + a23 * c;

        return this;
    }

    /**
     * Rotates the matrix around the Y axis.
     */
    rotateY(angle) {
        const rad = angle * Math.PI / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const a = this.data;

        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];

        a[0] = a00 * c + a20 * -s;
        a[1] = a01 * c + a21 * -s;
        a[2] = a02 * c + a22 * -s;
        a[3] = a03 * c + a23 * -s;

        a[8] = a00 * s + a20 * c;
        a[9] = a01 * s + a21 * c;
        a[10] = a02 * s + a22 * c;
        a[11] = a03 * s + a23 * c;

        return this;
    }

    /**
     * Rotates the matrix around the Z axis.
     */
    rotateZ(angle) {
        const rad = angle * Math.PI / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const a = this.data;

        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];

        a[0] = a00 * c + a10 * s;
        a[1] = a01 * c + a11 * s;
        a[2] = a02 * c + a12 * s;
        a[3] = a03 * c + a13 * s;

        a[4] = a00 * -s + a10 * c;
        a[5] = a01 * -s + a11 * c;
        a[6] = a02 * -s + a12 * c;
        a[7] = a03 * -s + a13 * c;

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

        const n11 = a[0], n12 = a[4], n13 = a[8], n14 = a[12];
        const n21 = a[1], n22 = a[5], n23 = a[9], n24 = a[13];
        const n31 = a[2], n32 = a[6], n33 = a[10], n34 = a[14];
        const n41 = a[3], n42 = a[7], n43 = a[11], n44 = a[15];

        const t0 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
        const t4 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
        const t8 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
        const t12 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;
        const t1 = n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44;
        const t5 = n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44;
        const t9 = n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44;
        const t13 = n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34;
        const t2 = n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44;
        const t6 = n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44;
        const t10 = n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44;
        const t14 = n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34;
        const t3 = n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43;
        const t7 = n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43;
        const t11 = n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43;
        const t15 = n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33;

        const det = n11 * t0 + n21 * t4 + n31 * t8 + n41 * t12;

        if (det === 0) return this;

        const detInv = 1.0 / det;

        a[0] = t0 * detInv;
        a[1] = t1 * detInv;
        a[2] = t2 * detInv;
        a[3] = t3 * detInv;
        a[4] = t4 * detInv;
        a[5] = t5 * detInv;
        a[6] = t6 * detInv;
        a[7] = t7 * detInv;
        a[8] = t8 * detInv;
        a[9] = t9 * detInv;
        a[10] = t10 * detInv;
        a[11] = t11 * detInv;
        a[12] = t12 * detInv;
        a[13] = t13 * detInv;
        a[14] = t14 * detInv;
        a[15] = t15 * detInv;

        return this;
    }
}