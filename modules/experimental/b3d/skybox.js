import { Mesh } from "./mesh.js";

/**
 * Represents a Skybox.
 * In Blitz3D, this was often simulated by a cube parented to the camera.
 * Here we treat it as a special Mesh that the renderer handles (centering on camera, depth write off).
 */
export class Skybox extends Mesh {
    constructor(parent) {
        super(parent);
        this.name = "Skybox";
        
        // Create a cube with inverted faces (so we see it from the inside)
        const surf = this.createSurface();
        
        // Helper to add a quad face (inverted winding order for inside view)
        const addFace = (v0, v1, v2, v3, nx, ny, nz) => {
            // UVs are mapped 0..1 for each face
            const i0 = surf.addVertex(v0.x, v0.y, v0.z, 0, 0);
            const i1 = surf.addVertex(v1.x, v1.y, v1.z, 1, 0);
            const i2 = surf.addVertex(v2.x, v2.y, v2.z, 1, 1);
            const i3 = surf.addVertex(v3.x, v3.y, v3.z, 0, 1);
            
            surf.vertexNormal(i0, nx, ny, nz);
            surf.vertexNormal(i1, nx, ny, nz);
            surf.vertexNormal(i2, nx, ny, nz);
            surf.vertexNormal(i3, nx, ny, nz);
            
            // Inverted winding: 0, 2, 1 instead of 0, 1, 2 to face inward
            surf.addTriangle(i0, i2, i1);
            surf.addTriangle(i0, i3, i2);
        };

        // Vertices for a 1x1x1 cube
        const v = [
            {x:-1,y:1,z:-1}, {x:1,y:1,z:-1}, {x:1,y:-1,z:-1}, {x:-1,y:-1,z:-1}, // Front
            {x:1,y:1,z:1}, {x:-1,y:1,z:1}, {x:-1,y:-1,z:1}, {x:1,y:-1,z:1}  // Back
        ];

        // Normals point inward because we are inside the box
        // Front (-Z) -> Normal +Z
        addFace(v[0], v[1], v[2], v[3], 0, 0, 1);
        // Back (+Z) -> Normal -Z
        addFace(v[4], v[5], v[6], v[7], 0, 0, -1);
        // Left (-X) -> Normal +X
        addFace(v[5], v[0], v[3], v[6], 1, 0, 0);
        // Right (+X) -> Normal -X
        addFace(v[1], v[4], v[7], v[2], -1, 0, 0);
        // Top (+Y) -> Normal -Y
        addFace(v[5], v[4], v[1], v[0], 0, -1, 0);
        // Bottom (-Y) -> Normal +Y
        addFace(v[3], v[2], v[7], v[6], 0, 1, 0);
        
        // Scale it up a bit so it doesn't clip with near plane immediately
        // The renderer will handle the "infinite distance" illusion by disabling depth writes
        this.scale(500, 500, 500); 

        // Skyboxes should be unlit (no diffuse, no specular)
        this.entityColor(0, 0, 0);
        this.entityPBR(0.0, 1.0); // Fully rough to prevent specular highlights
    }
}