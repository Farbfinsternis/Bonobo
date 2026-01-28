/**
 * Handles WebGL Shader compilation and linking.
 */
export class Shader {
    constructor(gl, vsSource, fsSource) {
        this.gl = gl;
        this.program = this.initShaderProgram(gl, vsSource, fsSource);
        this.attribs = {};
        this.uniforms = {};
        
        if (this.program) {
            this.detectAttributesAndUniforms();
        }
    }

    initShaderProgram(gl, vsSource, fsSource) {
        const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        if (!vertexShader || !fragmentShader) return null;

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return shaderProgram;
    }

    loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    detectAttributesAndUniforms() {
        const gl = this.gl;
        const numAttribs = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttribs; ++i) {
            const info = gl.getActiveAttrib(this.program, i);
            this.attribs[info.name] = gl.getAttribLocation(this.program, info.name);
        }

        const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; ++i) {
            const info = gl.getActiveUniform(this.program, i);
            this.uniforms[info.name] = gl.getUniformLocation(this.program, info.name);
        }
    }

    use() {
        this.gl.useProgram(this.program);
    }

    static get defaultVertexShader() {
        return `#version 300 es
        in vec4 a_position;
        in vec3 a_normal;
        in vec4 a_color;
        in vec2 a_uv;
        
        uniform mat4 u_model;
        uniform mat4 u_view;
        uniform mat4 u_projection;
        
        out vec4 v_color;
        out vec3 v_normal;
        out vec2 v_uv;

        void main() {
            gl_Position = u_projection * u_view * u_model * a_position;
            v_color = a_color;
            v_normal = (u_model * vec4(a_normal, 0.0)).xyz;
            v_uv = a_uv;
        }`;
    }

    static get defaultFragmentShader() {
        return `#version 300 es
        precision mediump float;
        
        in vec4 v_color;
        in vec3 v_normal;
        in vec2 v_uv;
        
        uniform vec3 u_lightPos;
        uniform vec3 u_lightColor;
        uniform vec3 u_ambientLight;
        uniform vec4 u_entityColor;
        uniform sampler2D u_texture;
        uniform int u_useTexture;

        out vec4 outColor;

        void main() {
            vec3 normal = normalize(v_normal);
            // Point light direction (simplified)
            vec3 lightDir = normalize(u_lightPos); 
            float diff = max(dot(normal, lightDir), 0.0);
            vec3 ambient = u_ambientLight;
            vec3 diffuse = u_lightColor * diff;
            
            vec4 texColor = vec4(1.0);
            if (u_useTexture == 1) {
                texColor = texture(u_texture, v_uv);
            }
            
            vec4 baseColor = v_color * u_entityColor * texColor;
            
            outColor = vec4(baseColor.rgb * (ambient + diffuse), baseColor.a);
        }`;
    }
}