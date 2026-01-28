import { Shader } from "./shader.js";
import { Entity } from "./entity.js";
import { Camera } from "./camera.js";
import { Mesh } from "./mesh.js";
import { Light } from "./light.js";
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

        if (!camera) return; // No camera, nothing to render

        // 3. Setup Camera
        camera.updateProjection(this.width, this.height);
        
        // View Matrix is the inverse of the Camera's World Matrix
        const viewMatrix = new Float32Array(camera.worldMatrix.data);
        // We need to invert the camera's world matrix to get the view matrix
        // Since we added invert() to Matrix4, we can use it (conceptually).
        // However, Matrix4.invert operates in place. We should clone first.
        // But our Matrix4 class structure is simple. Let's create a temp Matrix4.
        // TODO: Add clone() to Matrix4 properly or use a static helper.
        // For now, let's assume we have a way to invert.
        // Since we don't have a clean clone yet, let's just use the data directly if we had a helper.
        // Wait, we added invert() to Matrix4 in the previous step.
        // Let's create a temporary matrix object to hold the view matrix.
        const viewMatObj = new Matrix4();
        viewMatObj.copy(camera.worldMatrix);
        viewMatObj.invert();

        // Clear with Camera Color
        if (this.gl) {
            this.gl.clearColor(camera.clsColorValues.r, camera.clsColorValues.g, camera.clsColorValues.b, 1.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        }

        // 4. Render Loop
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        
        this.defaultShader.use();
        
        // Set Global Uniforms
        const uProjection = this.defaultShader.uniforms["u_projection"];
        const uView = this.defaultShader.uniforms["u_view"];
        const uLightPos = this.defaultShader.uniforms["u_lightPos"];
        const uLightColor = this.defaultShader.uniforms["u_lightColor"];
        const uAmbientLight = this.defaultShader.uniforms["u_ambientLight"];
        
        this.gl.uniformMatrix4fv(uProjection, false, camera.projectionMatrix.data);
        this.gl.uniformMatrix4fv(uView, false, viewMatObj.data);
        this.gl.uniform3f(uAmbientLight, Light.ambient.r, Light.ambient.g, Light.ambient.b);

        if (light) {
            this.gl.uniform3f(uLightPos, light.x, light.y, light.z);
            this.gl.uniform3f(uLightColor, light.colorValues.r, light.colorValues.g, light.colorValues.b);
        } else {
            this.gl.uniform3f(uLightPos, 0, 10, 0);
            this.gl.uniform3f(uLightColor, 1, 1, 1);
        }

        const renderEntity = (entity) => {
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
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.uniform1i(shader.uniforms["u_useTexture"], 0);
        }

        for (const surf of mesh.surfaces) {
            // Lazy init buffers
            if (!surf.glData) {
                surf.glData = {};
                // Vertices (Interleaved: x,y,z, u,v, nx,ny,nz, r,g,b,a)
                // Current Surface structure is array of objects. We need Float32Array.
                const vertexData = [];
                for(const v of surf.vertices) {
                    vertexData.push(v.x, v.y, v.z);
                    vertexData.push(v.u, v.v);
                    vertexData.push(v.nx, v.ny, v.nz);
                    vertexData.push(v.r, v.g, v.b, v.a);
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

            // Setup Attributes (Stride = 12 floats: 3 pos, 2 uv, 3 norm, 4 color)
            const stride = 12 * 4;
            
            // Position (Offset 0)
            gl.enableVertexAttribArray(shader.attribs["a_position"]);
            gl.vertexAttribPointer(shader.attribs["a_position"], 3, gl.FLOAT, false, stride, 0);

            // UV (Offset 3*4 = 12)
            if (shader.attribs["a_uv"] !== -1) {
                gl.enableVertexAttribArray(shader.attribs["a_uv"]);
                gl.vertexAttribPointer(shader.attribs["a_uv"], 2, gl.FLOAT, false, stride, 3 * 4);
            }

            // Normal (Offset 5*4 = 20)
            if (shader.attribs["a_normal"] !== -1) {
                gl.enableVertexAttribArray(shader.attribs["a_normal"]);
                gl.vertexAttribPointer(shader.attribs["a_normal"], 3, gl.FLOAT, false, stride, 5 * 4);
            }

            // Color (Offset 8*4 = 32)
            if (shader.attribs["a_color"] !== -1) {
                gl.enableVertexAttribArray(shader.attribs["a_color"]);
                gl.vertexAttribPointer(shader.attribs["a_color"], 4, gl.FLOAT, false, stride, 8 * 4);
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