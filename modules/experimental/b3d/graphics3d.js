import { Shader } from "./shader.js";
import { Entity } from "./entity.js";
import { Camera } from "./camera.js";
import { Mesh } from "./mesh.js";
import { Light } from "./light.js";
import { Skybox } from "./skybox.js";
import { Matrix4 } from "./matrix.js";

/**
 * Experimental 3D Graphics module (B3D style).
 * Manages a WebGL context for 3D and an overlay 2D context for legacy modules.
 */
export class Graphics3D {
    constructor(width = 640, height = 480, bonobo) {
        if (width === "*" && typeof height === "object") {
            bonobo = height;
        }

        this.bonobo = bonobo;
        bonobo.contextOwner = this;
        this.canvasData = {};
        this.initCanvas(width, height);
        this.viewMatrix = new Matrix4();
        this.tempMatrix = new Matrix4(); // Scratchpad for calculations
        this.inverseModelMatrix = new Matrix4();
    }

    initCanvas(width, height) {
        // Container div to hold both canvases
        this.container = document.createElement("div");
        this.container.style.position = "relative";
        this.container.style.width = "100%";
        this.container.style.height = "100%";
        this.container.style.overflow = "hidden";

        // 1. WebGL Canvas (Background)
        this.canvas3D = document.createElement("canvas");
        this.canvas3D.style.position = "absolute";
        this.canvas3D.style.top = "0";
        this.canvas3D.style.left = "0";
        this.canvas3D.style.zIndex = "0";
        this.gl = this.canvas3D.getContext("webgl2");

        if (!this.gl) {
            console.error("WebGL2 not supported");
        }

        // 2. 2D Canvas (Foreground / HUD)
        this.canvas2D = document.createElement("canvas");
        this.canvas2D.style.position = "absolute";
        this.canvas2D.style.top = "0";
        this.canvas2D.style.left = "0";
        this.canvas2D.style.zIndex = "1";
        this.canvas2D.style.pointerEvents = "none"; // Let clicks pass through to 3D canvas if needed, or handle input on container
        
        // Existing modules expect 'this.canvasData.element' and 'this.canvasData.context'
        // We map them to the 2D canvas so Draw/Image/Font modules work out-of-the-box.
        this.canvasData.element = this.canvas2D; 
        this.canvasData.context = this.canvas2D.getContext("2d", { willReadFrequently: true });
        
        // Input needs to be captured on the container or the top canvas. 
        // Since Mouse module attaches to canvasData.element, it attaches to 2D canvas.
        // We need to ensure the 2D canvas accepts pointer events if we want UI interaction.
        this.canvasData.element.style.pointerEvents = "auto"; 
        this.canvasData.element.tabIndex = 1; // Focusable for keyboard
        this.canvasData.element.style.outline = "none";

        // Append to container
        this.container.appendChild(this.canvas3D);
        this.container.appendChild(this.canvas2D);

        // Handle Resizing
        if (width === "*") {
            this.resize("*");
            window.addEventListener("resize", () => this.resize("*"));
        } else {
            this.resize(width, height);
        }

        // Initialize default states for 2D
        this.canvasData.clsColor = "rgba(0,0,0,0)"; // Transparent clear for 2D so 3D shows through
        this.canvasData.drawColor = "rgba(255,255,255,1)";
        this.canvasData.colorValues = { r: 255, g: 255, b: 255, a: 1 };
        this.canvasData.origin = { x: 0, y: 0 };

        // Inject container into DOM
        this.bonobo.canvasToDOM(this.container);
        this.canvasData.element.focus();

        this.initShaders();
    }

    resize(w, h) {
        const width = w === "*" ? window.innerWidth : w;
        const height = w === "*" ? window.innerHeight : h;

        this.width = width;
        this.height = height;

        // Resize 3D
        this.canvas3D.width = width;
        this.canvas3D.height = height;
        if(this.gl) this.gl.viewport(0, 0, width, height);

        // Resize 2D
        this.canvas2D.width = width;
        this.canvas2D.height = height;
        
        // Restore 2D context state after resize (Canvas resets state on resize)
        if(this.canvasData.context) {
            this.canvasData.context.fillStyle = this.canvasData.drawColor;
            this.canvasData.context.strokeStyle = this.canvasData.drawColor;
            this.canvasData.context.textBaseline = "top";
        }
    }

    initShaders() {
        this.defaultShader = new Shader(this.gl, Shader.defaultVertexShader, Shader.defaultFragmentShader);
    }

    // Override cls to clear both
    cls() {
        // Clear 2D (Transparent)
        this.canvasData.context.clearRect(0, 0, this.width, this.height);
        
        // Clear 3D (Black or Sky color)
        if (this.gl) {
            this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // TODO: Make configurable
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        }
    }
    
    // B3D specific methods would go here (RenderWorld, CreateCube, etc.)
    renderWorld() {
        if (!this.gl || !this.defaultShader) return;

        // 1. Update all matrices in the scene graph
        for (const root of Entity.roots) {
            root.updateMatrices();
        }

        // 2. Find the active camera (simple approach: take the first one found)
        let camera = null;
        const findCamera = (entities) => {
            for (const e of entities) {
                if (e instanceof Camera) return e;
                if (e.children.length > 0) {
                    const c = findCamera(e.children);
                    if (c) return c;
                }
            }
            return null;
        };
        camera = findCamera(Entity.roots);

        // Find first light (for now only one supported in basic shader)
        let light = null;
        const findLight = (entities) => {
            for (const e of entities) {
                if (e instanceof Light) return e;
                if (e.children.length > 0) {
                    const l = findLight(e.children);
                    if (l) return l;
                }
            }
            return null;
        };
        light = findLight(Entity.roots);

        // Find Skybox (if any)
        let skybox = null;
        const findSkybox = (entities) => {
            for (const e of entities) {
                if (e instanceof Skybox && e.visible) return e;
                if (e.children.length > 0) {
                    const s = findSkybox(e.children);
                    if (s) return s;
                }
            }
            return null;
        };
        skybox = findSkybox(Entity.roots);

        if (!camera) return; // No camera, nothing to render

        // 3. Setup Camera
        camera.updateProjection(this.width, this.height);
        
        // View Matrix is the inverse of the Camera's World Matrix
        // We need to invert the camera's world matrix to get the view matrix
        // Since we added invert() to Matrix4, we can use it (conceptually).
        // However, Matrix4.invert operates in place. We should clone first.
        // But our Matrix4 class structure is simple. Let's create a temp Matrix4.
        // TODO: Add clone() to Matrix4 properly or use a static helper.
        // For now, let's assume we have a way to invert.
        // Since we don't have a clean clone yet, let's just use the data directly if we had a helper.
        // Wait, we added invert() to Matrix4 in the previous step.
        // Let's create a temporary matrix object to hold the view matrix.
        this.viewMatrix.copy(camera.worldMatrix);
        this.viewMatrix.invert();

        // Clear with Camera Color
        if (this.gl) {
            this.gl.clearColor(camera.clsColorValues.r, camera.clsColorValues.g, camera.clsColorValues.b, 1.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        }

        // 4. Render Loop
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        
        this.defaultShader.use();
        
        // Initialize Sampler Slots to avoid conflicts (sampler2D vs samplerCube on Unit 0)
        const s = this.defaultShader.uniforms;
        if (s["u_texture"]) this.gl.uniform1i(s["u_texture"], 0);
        if (s["u_normalTexture"]) this.gl.uniform1i(s["u_normalTexture"], 1);
        if (s["u_roughnessTexture"]) this.gl.uniform1i(s["u_roughnessTexture"], 2);
        if (s["u_occlusionTexture"]) this.gl.uniform1i(s["u_occlusionTexture"], 3);
        if (s["u_emissiveTexture"]) this.gl.uniform1i(s["u_emissiveTexture"], 4);
        if (s["u_envMap"]) this.gl.uniform1i(s["u_envMap"], 5);

        // Set Global Uniforms
        const uProjection = this.defaultShader.uniforms["u_projection"];
        const uView = this.defaultShader.uniforms["u_view"];
        const uLightPos = this.defaultShader.uniforms["u_lightPos"];
        const uLightColor = this.defaultShader.uniforms["u_lightColor"];
        const uAmbientLight = this.defaultShader.uniforms["u_ambientLight"];
        const uViewPos = this.defaultShader.uniforms["u_viewPos"];
        
        this.gl.uniformMatrix4fv(uProjection, false, camera.projectionMatrix.data);
        this.gl.uniformMatrix4fv(uView, false, this.viewMatrix.data);
        this.gl.uniform3f(uAmbientLight, Light.ambient.r, Light.ambient.g, Light.ambient.b);

        if (light) {
            this.gl.uniform3f(uLightPos, light.x, light.y, light.z);
            this.gl.uniform3f(uLightColor, light.colorValues.r, light.colorValues.g, light.colorValues.b);
        } else {
            this.gl.uniform3f(uLightPos, 0, 10, 0);
            this.gl.uniform3f(uLightColor, 1, 1, 1);
        }

        // Camera Position (from World Matrix translation)
        this.gl.uniform3f(uViewPos, camera.worldMatrix.data[12], camera.worldMatrix.data[13], camera.worldMatrix.data[14]);

        // 4a. Render Skybox (First, no depth write)
        if (skybox) {
            // Center skybox on camera
            skybox.position(camera.worldMatrix.data[12], camera.worldMatrix.data[13], camera.worldMatrix.data[14]);
            skybox.updateMatrices();
            
            this.gl.depthMask(false); // Don't write to depth buffer
            this.renderMesh(skybox);
            this.gl.depthMask(true); // Re-enable depth write
        }

        // 4b. Render Scene
        const renderEntity = (entity) => {
            if (!entity.visible) return;
            if (entity instanceof Skybox) return; // Skip skybox in normal pass

            if (entity instanceof Mesh) {
                this.renderMesh(entity);
            }
            for (const child of entity.children) {
                renderEntity(child);
            }
        };

        for (const root of Entity.roots) {
            renderEntity(root);
        }
    }

    renderMesh(mesh) {
        const gl = this.gl;
        const shader = this.defaultShader;

        // Set Model Matrix
        gl.uniformMatrix4fv(shader.uniforms["u_model"], false, mesh.worldMatrix.data);

        // Set Entity Color
        gl.uniform4f(shader.uniforms["u_entityColor"], mesh.color.r, mesh.color.g, mesh.color.b, mesh.color.a);

        // Set Emissive Factor
        gl.uniform3f(shader.uniforms["u_emissiveFactor"], mesh.emissiveColor.r, mesh.emissiveColor.g, mesh.emissiveColor.b);

        // Set PBR Factors
        gl.uniform1f(shader.uniforms["u_metallic"], mesh.metallic);
        gl.uniform1f(shader.uniforms["u_roughness"], mesh.roughness);

        // Skinning / Bone Matrices
        if (mesh.skin && mesh.skin.joints && mesh.skin.joints.length > 0) {
            gl.uniform1i(shader.uniforms["u_useSkinning"], 1);
            
            // Calculate Bone Matrices
            // jointMatrix[i] = inverse(mesh.worldMatrix) * joint[i].worldMatrix * inverseBindMatrix[i]
            // Result is a transform from Mesh Space (Bind Pose) -> Mesh Space (Current Pose)
            // The shader then applies u_model (mesh.worldMatrix) to get to World Space.
            
            this.inverseModelMatrix.copy(mesh.worldMatrix).invert();
            
            const boneData = new Float32Array(mesh.skin.joints.length * 16);
            const bindMat = this.tempMatrix; // Reuse temp matrix container

            for (let i = 0; i < mesh.skin.joints.length; i++) {
                const joint = mesh.skin.joints[i];
                
                // Start with Inverse Model Matrix
                const m = new Matrix4(); // TODO: Optimize this allocation out later with a pool or static helper
                m.copy(this.inverseModelMatrix);
                
                // Multiply by Joint World Matrix
                if (joint) m.multiply(joint.worldMatrix);
                
                // Multiply by Inverse Bind Matrix
                if (mesh.skin.inverseBindMatrices) {
                    bindMat.data.set(mesh.skin.inverseBindMatrices.subarray(i * 16, i * 16 + 16));
                    m.multiply(bindMat);
                }
                
                boneData.set(m.data, i * 16);
            }
            
            gl.uniformMatrix4fv(shader.uniforms["u_boneMatrices"], false, boneData);
        } else {
            gl.uniform1i(shader.uniforms["u_useSkinning"], 0);
        }

        // Texture Handling
        if (mesh.texture && mesh.texture.loaded) {
            if (!mesh.texture.glTexture) {
                // Create WebGL texture
                const tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mesh.texture.image);
                gl.generateMipmap(gl.TEXTURE_2D);
                // Optional: Set filtering parameters
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                mesh.texture.glTexture = tex;
            }
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, mesh.texture.glTexture);
            gl.uniform1i(shader.uniforms["u_texture"], 0);
            gl.uniform1i(shader.uniforms["u_useTexture"], 1);
        } else {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.uniform1i(shader.uniforms["u_useTexture"], 0);
        }

        // Normal Map Handling
        if (mesh.normalTexture && mesh.normalTexture.loaded) {
            if (!mesh.normalTexture.glTexture) {
                const tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mesh.normalTexture.image);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                mesh.normalTexture.glTexture = tex;
            }
            
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, mesh.normalTexture.glTexture);
            gl.uniform1i(shader.uniforms["u_normalTexture"], 1);
            gl.uniform1i(shader.uniforms["u_useNormalTexture"], 1);
        } else {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.uniform1i(shader.uniforms["u_useNormalTexture"], 0);
        }

        // Roughness/Metallic Map Handling
        if (mesh.roughnessTexture && mesh.roughnessTexture.loaded) {
            if (!mesh.roughnessTexture.glTexture) {
                const tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mesh.roughnessTexture.image);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                mesh.roughnessTexture.glTexture = tex;
            }
            
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, mesh.roughnessTexture.glTexture);
            gl.uniform1i(shader.uniforms["u_roughnessTexture"], 2);
            gl.uniform1i(shader.uniforms["u_useRoughnessTexture"], 1);
        } else {
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.uniform1i(shader.uniforms["u_useRoughnessTexture"], 0);
        }

        // Occlusion Map Handling
        if (mesh.occlusionTexture && mesh.occlusionTexture.loaded) {
            if (!mesh.occlusionTexture.glTexture) {
                const tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mesh.occlusionTexture.image);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                mesh.occlusionTexture.glTexture = tex;
            }
            
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, mesh.occlusionTexture.glTexture);
            gl.uniform1i(shader.uniforms["u_occlusionTexture"], 3);
            gl.uniform1i(shader.uniforms["u_useOcclusionTexture"], 1);
        } else {
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.uniform1i(shader.uniforms["u_useOcclusionTexture"], 0);
        }

        // Emissive Map Handling
        if (mesh.emissiveTexture && mesh.emissiveTexture.loaded) {
            if (!mesh.emissiveTexture.glTexture) {
                const tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mesh.emissiveTexture.image);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                mesh.emissiveTexture.glTexture = tex;
            }
            
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, mesh.emissiveTexture.glTexture);
            gl.uniform1i(shader.uniforms["u_emissiveTexture"], 4);
            gl.uniform1i(shader.uniforms["u_useEmissiveTexture"], 1);
        } else {
            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.uniform1i(shader.uniforms["u_useEmissiveTexture"], 0);
        }

        // Environment Map (CubeMap) Handling
        if (mesh.envMap && mesh.envMap.loaded && mesh.envMap.isCubeMap) {
            if (!mesh.envMap.glTexture) {
                const tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
                const targets = [
                    gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                    gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                    gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                ];
                for(let i=0; i<6; i++) {
                    gl.texImage2D(targets[i], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mesh.envMap.images[i]);
                }
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                mesh.envMap.glTexture = tex;
            }
            
            gl.activeTexture(gl.TEXTURE5);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, mesh.envMap.glTexture);
            gl.uniform1i(shader.uniforms["u_envMap"], 5);
            gl.uniform1i(shader.uniforms["u_useEnvMap"], 1);
        } else {
            gl.activeTexture(gl.TEXTURE5);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
            gl.uniform1i(shader.uniforms["u_useEnvMap"], 0);
        }

        for (const surf of mesh.surfaces) {
            // Lazy init buffers
            if (!surf.glData) {
                surf.glData = {};
                // Vertices (Interleaved: x,y,z, u,v, nx,ny,nz, tx,ty,tz,tw, r,g,b,a, j0,j1,j2,j3, w0,w1,w2,w3)
                // Current Surface structure is array of objects. We need Float32Array.
                const vertexData = [];
                for(const v of surf.vertices) {
                    vertexData.push(v.x, v.y, v.z);
                    vertexData.push(v.u, v.v);
                    vertexData.push(v.nx, v.ny, v.nz);
                    vertexData.push(v.tx, v.ty, v.tz, v.tw);
                    vertexData.push(v.r, v.g, v.b, v.a);
                    
                    if (v.joints && v.weights) {
                        vertexData.push(...v.joints);
                        vertexData.push(...v.weights);
                    } else {
                        vertexData.push(0, 0, 0, 0);
                        vertexData.push(0, 0, 0, 0);
                    }
                }
                surf.glData.vbo = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, surf.glData.vbo);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

                surf.glData.ibo = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surf.glData.ibo);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(surf.indices), gl.STATIC_DRAW);
                
                surf.glData.count = surf.indices.length;
            }

            // Bind Buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, surf.glData.vbo);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surf.glData.ibo);

            // Setup Attributes (Stride = 24 floats: 3 pos, 2 uv, 3 norm, 4 tan, 4 color, 4 joints, 4 weights)
            const stride = 24 * 4;
            
            // Position (Offset 0)
            gl.enableVertexAttribArray(shader.attribs["a_position"]);
            gl.vertexAttribPointer(shader.attribs["a_position"], 3, gl.FLOAT, false, stride, 0);

            // UV (Offset 3*4 = 12)
            if (shader.attribs["a_uv"] !== undefined && shader.attribs["a_uv"] !== -1) {
                gl.enableVertexAttribArray(shader.attribs["a_uv"]);
                gl.vertexAttribPointer(shader.attribs["a_uv"], 2, gl.FLOAT, false, stride, 3 * 4);
            }

            // Normal (Offset 5*4 = 20)
            if (shader.attribs["a_normal"] !== undefined && shader.attribs["a_normal"] !== -1) {
                gl.enableVertexAttribArray(shader.attribs["a_normal"]);
                gl.vertexAttribPointer(shader.attribs["a_normal"], 3, gl.FLOAT, false, stride, 5 * 4);
            }

            // Tangent (Offset 8*4 = 32)
            if (shader.attribs["a_tangent"] !== undefined && shader.attribs["a_tangent"] !== -1) {
                gl.enableVertexAttribArray(shader.attribs["a_tangent"]);
                gl.vertexAttribPointer(shader.attribs["a_tangent"], 4, gl.FLOAT, false, stride, 8 * 4);
            }

            // Color (Offset 12*4 = 48)
            if (shader.attribs["a_color"] !== undefined && shader.attribs["a_color"] !== -1) {
                gl.enableVertexAttribArray(shader.attribs["a_color"]);
                gl.vertexAttribPointer(shader.attribs["a_color"], 4, gl.FLOAT, false, stride, 12 * 4);
            }

            // Joints (Offset 16*4 = 64)
            if (shader.attribs["a_joints"] !== undefined && shader.attribs["a_joints"] !== -1) {
                gl.enableVertexAttribArray(shader.attribs["a_joints"]);
                gl.vertexAttribPointer(shader.attribs["a_joints"], 4, gl.FLOAT, false, stride, 16 * 4);
            }

            // Weights (Offset 20*4 = 80)
            if (shader.attribs["a_weights"] !== undefined && shader.attribs["a_weights"] !== -1) {
                gl.enableVertexAttribArray(shader.attribs["a_weights"]);
                gl.vertexAttribPointer(shader.attribs["a_weights"], 4, gl.FLOAT, false, stride, 20 * 4);
            }

            // Draw
            gl.drawElements(gl.TRIANGLES, surf.glData.count, gl.UNSIGNED_SHORT, 0);
        }
    }

    /**
     * Updates the world state and schedules the next frame.
     * @param {Function} [loopCallback] Optional callback for the game loop.
     */
    updateWorld(loopCallback) {
        if (loopCallback) requestAnimationFrame(loopCallback);
    }
}