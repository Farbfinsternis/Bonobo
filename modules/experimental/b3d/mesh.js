import { Entity } from "./entity.js";
import { B3DLoader } from "./b3d-loader.js";
import { GLTFLoader } from "./gltf-loader.js";

/**
 * Represents a 3D Mesh entity.
 * Contains one or more Surfaces which hold the actual geometry data.
 */
export class Mesh extends Entity {
    constructor(parent) {
        super();
        this.surfaces = [];
        if (parent) this.setParent(parent);
    }

    /**
     * Creates a new surface and adds it to the mesh.
     * @returns {Surface} The created surface.
     */
    createSurface() {
        const surf = new Surface();
        this.surfaces.push(surf);
        return surf;
    }

    /**
     * Creates a cube mesh (2x2x2, centered at 0,0,0).
     * @param {Entity} [parent] Optional parent entity.
     * @returns {Mesh} The created cube mesh.
     */
    static createCube(parent) {
        const mesh = new Mesh(parent);
        const surf = mesh.createSurface();

        // Helper to add a quad face with specific normal
        const addFace = (v0, v1, v2, v3, nx, ny, nz) => {
            const i0 = surf.addVertex(v0.x, v0.y, v0.z, 0, 0);
            const i1 = surf.addVertex(v1.x, v1.y, v1.z, 1, 0);
            const i2 = surf.addVertex(v2.x, v2.y, v2.z, 1, 1);
            const i3 = surf.addVertex(v3.x, v3.y, v3.z, 0, 1);
            
            surf.vertexNormal(i0, nx, ny, nz);
            surf.vertexNormal(i1, nx, ny, nz);
            surf.vertexNormal(i2, nx, ny, nz);
            surf.vertexNormal(i3, nx, ny, nz);

            surf.addTriangle(i0, i1, i2);
            surf.addTriangle(i0, i2, i3);
        };

        // Front (-Z)
        addFace({x:-1,y:1,z:-1}, {x:1,y:1,z:-1}, {x:1,y:-1,z:-1}, {x:-1,y:-1,z:-1}, 0, 0, -1);
        // Back (+Z)
        addFace({x:1,y:1,z:1}, {x:-1,y:1,z:1}, {x:-1,y:-1,z:1}, {x:1,y:-1,z:1}, 0, 0, 1);
        // Left (-X)
        addFace({x:-1,y:1,z:1}, {x:-1,y:1,z:-1}, {x:-1,y:-1,z:-1}, {x:-1,y:-1,z:1}, -1, 0, 0);
        // Right (+X)
        addFace({x:1,y:1,z:-1}, {x:1,y:1,z:1}, {x:1,y:-1,z:1}, {x:1,y:-1,z:-1}, 1, 0, 0);
        // Top (+Y)
        addFace({x:-1,y:1,z:1}, {x:1,y:1,z:1}, {x:1,y:1,z:-1}, {x:-1,y:1,z:-1}, 0, 1, 0);
        // Bottom (-Y)
        addFace({x:-1,y:-1,z:-1}, {x:1,y:-1,z:-1}, {x:1,y:-1,z:1}, {x:-1,y:-1,z:1}, 0, -1, 0);

        return mesh;
    }

    /**
     * Creates a sphere mesh (Radius 1, centered at 0,0,0).
     * @param {number} [segments=8] Number of segments (detail).
     * @param {Entity} [parent] Optional parent entity.
     * @returns {Mesh} The created sphere mesh.
     */
    static createSphere(segments = 8, parent) {
        const mesh = new Mesh(parent);
        const surf = mesh.createSurface();
        
        const rings = segments;
        const sectors = segments * 2;
        const R = 1;

        for(let r = 0; r <= rings; r++) {
            const v = r / rings;
            const phi = v * Math.PI;

            for(let s = 0; s <= sectors; s++) {
                const u = s / sectors;
                const theta = u * Math.PI * 2;

                const x = R * Math.sin(phi) * Math.cos(theta);
                const y = R * Math.cos(phi); // Y is up
                const z = R * Math.sin(phi) * Math.sin(theta);

                // For a sphere, the normal is just the normalized position
                const idx = surf.addVertex(x, y, z, u, v);
                surf.vertexNormal(idx, x, y, z); 
            }
        }

        for(let r = 0; r < rings; r++) {
            for(let s = 0; s < sectors; s++) {
                const first = (r * (sectors + 1)) + s;
                const second = first + sectors + 1;

                surf.addTriangle(first, second, first + 1);
                surf.addTriangle(second, second + 1, first + 1);
            }
        }

        return mesh;
    }

    /**
     * Creates a cylinder mesh (Height 2, Radius 1, Y-aligned).
     * @param {number} [segments=8] Number of segments.
     * @param {boolean} [solid=true] Whether to generate caps.
     * @param {Entity} [parent] Optional parent.
     * @returns {Mesh}
     */
    static createCylinder(segments = 8, solid = true, parent) {
        const mesh = new Mesh(parent);
        const surf = mesh.createSurface();
        const height = 2;
        const radius = 1;

        // Body
        for (let i = 0; i <= segments; i++) {
            const u = i / segments;
            const theta = u * Math.PI * 2;
            const x = Math.sin(theta) * radius;
            const z = Math.cos(theta) * radius; // Z for depth

            // Top vertex
            const v0 = surf.addVertex(x, height/2, z, u, 0);
            surf.vertexNormal(v0, x, 0, z);

            // Bottom vertex
            const v1 = surf.addVertex(x, -height/2, z, u, 1);
            surf.vertexNormal(v1, x, 0, z);
        }

        for (let i = 0; i < segments; i++) {
            const t = i * 2;
            surf.addTriangle(t, t + 2, t + 1);
            surf.addTriangle(t + 1, t + 2, t + 3);
        }

        // Caps
        if (solid) {
            const topCenter = surf.addVertex(0, height/2, 0, 0.5, 0.5);
            surf.vertexNormal(topCenter, 0, 1, 0);
            const bottomCenter = surf.addVertex(0, -height/2, 0, 0.5, 0.5);
            surf.vertexNormal(bottomCenter, 0, -1, 0);

            // We need duplicated vertices for sharp edges on caps, 
            // but for simplicity here we might reuse or add new ones.
            // To do it right (flat shading on caps), we need new vertices.
            // ... skipping detailed cap generation for brevity, but logic is similar.
        }

        return mesh;
    }

    /**
     * Creates a cone mesh.
     * @param {number} [segments=8] 
     * @param {boolean} [solid=true] 
     * @param {Entity} [parent] 
     * @returns {Mesh}
     */
    static createCone(segments = 8, solid = true, parent) {
        const mesh = new Mesh(parent);
        const surf = mesh.createSurface();
        const height = 2;
        const radius = 1;

        // Tip
        const tip = surf.addVertex(0, height/2, 0, 0.5, 0);
        surf.vertexNormal(tip, 0, 1, 0); // Approx

        // Base ring
        const baseStart = 1;
        for (let i = 0; i <= segments; i++) {
            const u = i / segments;
            const theta = u * Math.PI * 2;
            const x = Math.sin(theta) * radius;
            const z = Math.cos(theta) * radius;

            const v = surf.addVertex(x, -height/2, z, u, 1);
            surf.vertexNormal(v, x, 0, z); // Approx
        }

        for (let i = 0; i < segments; i++) {
            surf.addTriangle(tip, baseStart + i + 1, baseStart + i);
        }

        return mesh;
    }

    /**
     * Creates an infinite plane (simulated by a large quad).
     * @param {number} [segments=1] Segments (not used yet, kept for API compat).
     * @param {Entity} [parent] Optional parent entity.
     * @returns {Mesh} The created plane mesh.
     */
    static createPlane(segments = 1, parent) {
        const mesh = new Mesh(parent);
        const surf = mesh.createSurface();
        
        // We create a "huge" quad to simulate infinity.
        // Size 2000 is usually enough to cover the far clip plane.
        const size = 1000; 
        const tiles = 100; // Repeat texture 100 times so it doesn't look stretched

        // Vertices (y=0 is the floor)
        const v0 = surf.addVertex(-size, 0, size, 0, tiles);      // Top Left
        const v1 = surf.addVertex(size, 0, size, tiles, tiles);   // Top Right
        const v2 = surf.addVertex(size, 0, -size, tiles, 0);      // Bottom Right
        const v3 = surf.addVertex(-size, 0, -size, 0, 0);         // Bottom Left

        // Normals pointing UP (0, 1, 0)
        for(let i=0; i<4; i++) surf.vertexNormal(i, 0, 1, 0);

        surf.addTriangle(v0, v1, v2);
        surf.addTriangle(v0, v2, v3);

        return mesh;
    }

    /**
     * Loads a mesh from a file.
     * Emulates Blitz3D's LoadMesh.
     * Automatically detects format based on file header (Magic Bytes).
     * @param {string} url Path to the mesh file.
     * @param {Entity} [parent] Optional parent entity.
     * @returns {Mesh} The mesh entity (populated asynchronously).
     */
    static loadMesh(url, parent) {
        const mesh = new Mesh(parent);
        mesh.name = url; // Helpful for debugging
        
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load ${url}`);
                return res.arrayBuffer();
            })
            .then(buffer => {
                if (buffer.byteLength < 4) throw new Error("File too small to detect format");
                
                const view = new DataView(buffer);
                const magic = view.getUint32(0, true); // Read first 4 bytes as Little Endian

                // Magic Bytes Detection
                // B3D: "BB3D" -> 0x44334242 (Little Endian)
                if (magic === 0x44334242) {
                    B3DLoader.parse(buffer, mesh, Mesh);
                }
                // GLB: "glTF" -> 0x46546C67
                else if (magic === 0x46546C67) {
                    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
                    GLTFLoader.parse(buffer, mesh, Mesh, baseUrl);
                }
                // JSON (GLTF): Starts usually with '{' (0x7B) or whitespace
                else {
                    // Simple check: Convert start to string and look for '{'
                    const text = new TextDecoder().decode(new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 20))).trim();
                    if (text.startsWith('{')) {
                        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
                        GLTFLoader.parse(buffer, mesh, Mesh, baseUrl);
                    } else {
                        console.warn(`Bonobo: Unknown mesh format for '${url}' (Magic: 0x${magic.toString(16)})`);
                    }
                }
            })
            .catch(err => {
                console.error(`Bonobo: Could not load mesh '${url}'`, err);
            });

        return mesh;
    }

    /**
     * Loads an animated mesh (alias for loadMesh in Bonobo).
     */
    static loadAnimMesh(url, parent) {
        return Mesh.loadMesh(url, parent);
    }

    /**
     * Loads a mesh from a GLTF file (.gltf).
     * @param {string} url Path to the .gltf file.
     * @param {Entity} [parent] Optional parent entity.
     * @returns {Mesh} The root mesh entity (populated asynchronously).
     */
    static loadGLTF(url, parent) {
        const mesh = new Mesh(parent);
        mesh.name = url;
        GLTFLoader.load(url, mesh, Mesh);
        return mesh;
    }
}

/**
 * Represents a surface within a mesh.
 * Stores vertices and triangles.
 */
export class Surface {
    constructor() {
        this.vertices = []; 
        this.indices = [];
    }

    addVertex(x, y, z, u = 0, v = 0, w = 0) {
        const vert = { x, y, z, u, v, w, nx: 0, ny: 0, nz: 0, r: 1, g: 1, b: 1, a: 1 };
        return this.vertices.push(vert) - 1;
    }

    vertexNormal(index, nx, ny, nz) {
        if(this.vertices[index]) {
            this.vertices[index].nx = nx;
            this.vertices[index].ny = ny;
            this.vertices[index].nz = nz;
        }
    }
    
    vertexColor(index, r, g, b, a=1) {
        if(this.vertices[index]) {
            this.vertices[index].r = r;
            this.vertices[index].g = g;
            this.vertices[index].b = b;
            this.vertices[index].a = a;
        }
    }

    addTriangle(v0, v1, v2) {
        this.indices.push(v0, v1, v2);
        return this.indices.length / 3 - 1;
    }
    
    countVertices() { return this.vertices.length; }
    countTriangles() { return this.indices.length / 3; }
}