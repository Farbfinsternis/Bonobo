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
        in vec4 a_tangent;
        in vec4 a_color;
        in vec2 a_uv;
        in vec4 a_joints;
        in vec4 a_weights;
        
        uniform mat4 u_model;
        uniform mat4 u_view;
        uniform mat4 u_projection;
        uniform mat4 u_boneMatrices[64];
        uniform int u_useSkinning;
        
        out vec4 v_color;
        out vec3 v_normal;
        out mat3 v_tbn;
        out vec2 v_uv;
        out vec3 v_fragPos;

        void main() {
            vec4 localPos = a_position;
            vec3 localNormal = a_normal;
            vec3 localTangent = a_tangent.xyz;

            if (u_useSkinning == 1) {
                mat4 skinMatrix = 
                    u_boneMatrices[int(a_joints.x)] * a_weights.x +
                    u_boneMatrices[int(a_joints.y)] * a_weights.y +
                    u_boneMatrices[int(a_joints.z)] * a_weights.z +
                    u_boneMatrices[int(a_joints.w)] * a_weights.w;

                localPos = skinMatrix * localPos;
                localNormal = mat3(skinMatrix) * localNormal;
                localTangent = mat3(skinMatrix) * localTangent;
            }

            vec4 worldPos = u_model * localPos;
            gl_Position = u_projection * u_view * worldPos;
            v_color = a_color;
            v_fragPos = worldPos.xyz;
            
            vec3 T = normalize(vec3(u_model * vec4(localTangent, 0.0)));
            vec3 N = normalize(vec3(u_model * vec4(localNormal, 0.0)));
            vec3 B = cross(N, T) * a_tangent.w;
            v_tbn = mat3(T, B, N);
            v_normal = N;
            v_uv = a_uv;
        }`;
    }

    static get defaultFragmentShader() {
        return `#version 300 es
        precision mediump float;
        
        in vec4 v_color;
        in vec3 v_normal;
        in mat3 v_tbn;
        in vec2 v_uv;
        in vec3 v_fragPos;
        
        uniform vec3 u_lightPos;
        uniform vec3 u_lightColor;
        uniform vec3 u_ambientLight;
        uniform vec3 u_viewPos;
        uniform vec4 u_entityColor;
        uniform sampler2D u_texture;
        uniform int u_useTexture;
        uniform sampler2D u_normalTexture;
        uniform int u_useNormalTexture;
        uniform sampler2D u_roughnessTexture;
        uniform int u_useRoughnessTexture;
        uniform sampler2D u_occlusionTexture;
        uniform int u_useOcclusionTexture;
        uniform sampler2D u_emissiveTexture;
        uniform int u_useEmissiveTexture;
        uniform vec3 u_emissiveFactor;
        uniform float u_metallic;
        uniform float u_roughness;
        uniform samplerCube u_envMap;
        uniform int u_useEnvMap;

        out vec4 outColor;

        void main() {
            vec3 normal = normalize(v_normal);

            if (u_useNormalTexture == 1) {
                vec3 mapNormal = texture(u_normalTexture, v_uv).rgb;
                mapNormal = mapNormal * 2.0 - 1.0;
                normal = normalize(v_tbn * mapNormal);
            }

            float roughness = u_roughness;
            float metallic = u_metallic;
            if (u_useRoughnessTexture == 1) {
                vec4 rm = texture(u_roughnessTexture, v_uv);
                roughness = rm.g; // GLTF: Green = Roughness
                metallic = rm.b;  // GLTF: Blue = Metallic
            }

            float ao = 1.0;
            if (u_useOcclusionTexture == 1) {
                ao = texture(u_occlusionTexture, v_uv).r;
            }

            vec3 emissive = vec3(0.0);
            if (u_useEmissiveTexture == 1) {
                emissive = texture(u_emissiveTexture, v_uv).rgb;
            }
            // Add static emissive factor (default is 0,0,0 if not set)
            emissive += u_emissiveFactor;

            // Point light direction (simplified)
            vec3 lightDir = normalize(u_lightPos); 
            float diff = max(dot(normal, lightDir), 0.0);
            
            // Specular (Blinn-Phong approximation based on roughness)
            vec3 viewDir = normalize(u_viewPos - v_fragPos);
            vec3 halfwayDir = normalize(lightDir + viewDir);
            // Roughness 0 = shiny (high power), 1 = dull (low power)
            float shininess = (1.0 - roughness) * 64.0 + 1.0; 
            float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);
            // Metallic affects specular color (metals have colored specular, dielectrics white)
            vec3 specularColor = mix(vec3(1.0), u_entityColor.rgb, metallic); 
            vec3 specular = u_lightColor * spec * specularColor * (1.0 - roughness);

            vec3 ambient = u_ambientLight * ao;
            vec3 diffuse = u_lightColor * diff * (1.0 - metallic); // Metals have little diffuse
            
            vec4 texColor = vec4(1.0);
            if (u_useTexture == 1) {
                texColor = texture(u_texture, v_uv);
            }
            
            vec4 baseColor = v_color * u_entityColor * texColor;
            
            // IBL / Reflection
            vec3 reflection = vec3(0.0);
            if (u_useEnvMap == 1) {
                vec3 viewDir = normalize(u_viewPos - v_fragPos);
                vec3 reflectDir = reflect(-viewDir, normal);
                vec3 envColor = texture(u_envMap, reflectDir).rgb;
                
                // Fresnel Schlick approximation
                vec3 F0 = vec3(0.04); 
                F0 = mix(F0, baseColor.rgb, metallic);
                float NdotV = max(dot(normal, viewDir), 0.0);
                vec3 F = F0 + (1.0 - F0) * pow(1.0 - NdotV, 5.0);
                
                reflection = envColor * F;
                // Simple roughness attenuation
                reflection *= (1.0 - roughness);
            }

            vec3 finalColor = baseColor.rgb * (ambient + diffuse) + specular + emissive + reflection;
            outColor = vec4(finalColor, baseColor.a);
        }`;
    }
}