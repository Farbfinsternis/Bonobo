import { Texture } from "./texture.js";

/**
 * Handles loading of GLTF 2.0 models (JSON .gltf and Binary .glb).
 */
export class GLTFLoader {
    /**
     * Loads a GLTF file.
     * @param {string} url 
     * @param {Mesh} rootEntity The root entity to attach loaded nodes to.
     * @param {typeof Mesh} MeshClass Constructor for creating new meshes.
     */
    static async load(url, rootEntity, MeshClass) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const arrayBuffer = await response.arrayBuffer();
            const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
            
            await this.parse(arrayBuffer, rootEntity, MeshClass, baseUrl);
        } catch (err) {
            console.error(`Bonobo: Could not load GLTF '${url}'`, err);
        }
    }

    static async parse(arrayBuffer, rootEntity, MeshClass, baseUrl) {
        try {
            const dataView = new DataView(arrayBuffer);
            let gltf;
            const buffers = [];

            // Check for GLB Magic (0x46546C67)
            if (dataView.byteLength >= 12 && dataView.getUint32(0, true) === 0x46546C67) {
                const version = dataView.getUint32(4, true);
                const length = dataView.getUint32(8, true);

                if (version !== 2) throw new Error(`Unsupported GLTF version: ${version}`);

                let offset = 12;
                while (offset < length) {
                    const chunkLength = dataView.getUint32(offset, true);
                    const chunkType = dataView.getUint32(offset + 4, true);
                    offset += 8;

                    if (chunkType === 0x4E4F534A) { // JSON
                        const jsonBytes = new Uint8Array(arrayBuffer, offset, chunkLength);
                        const jsonText = new TextDecoder().decode(jsonBytes);
                        gltf = JSON.parse(jsonText);
                    } else if (chunkType === 0x004E4942) { // BIN
                        buffers[0] = arrayBuffer.slice(offset, offset + chunkLength);
                    }
                    
                    offset += chunkLength;
                }
            } else {
                // Standard JSON
                const text = new TextDecoder().decode(arrayBuffer);
                gltf = JSON.parse(text);
            }

            if (!gltf) throw new Error("Failed to parse GLTF");

            // Load External Buffers
            if (gltf.buffers) {
                for (let i = 0; i < gltf.buffers.length; i++) {
                    const bufferDef = gltf.buffers[i];
                    if (bufferDef.uri) {
                        const bufferUrl = bufferDef.uri.startsWith('data:') ? bufferDef.uri : baseUrl + bufferDef.uri;
                        const res = await fetch(bufferUrl);
                        buffers[i] = await res.arrayBuffer();
                    }
                }
            }

            // Load Images
            const images = [];
            if (gltf.images) {
                for (let i = 0; i < gltf.images.length; i++) {
                    const imgDef = gltf.images[i];
                    let imgUrl;
                    if (imgDef.uri) {
                        imgUrl = imgDef.uri.startsWith('data:') ? imgDef.uri : baseUrl + imgDef.uri;
                    } else if (imgDef.bufferView !== undefined) {
                        const bufferView = gltf.bufferViews[imgDef.bufferView];
                        const buffer = buffers[bufferView.buffer];
                        const offset = (bufferView.byteOffset || 0);
                        const length = bufferView.byteLength;
                        const blob = new Blob([new Uint8Array(buffer, offset, length)], { type: imgDef.mimeType || 'image/png' });
                        imgUrl = URL.createObjectURL(blob);
                    }
                    
                    if (imgUrl) {
                        images[i] = new Texture(imgUrl);
                    }
                }
            }

            // Load Textures
            const textures = [];
            if (gltf.textures) {
                for (let i = 0; i < gltf.textures.length; i++) {
                    const texDef = gltf.textures[i];
                    if (texDef.source !== undefined) {
                        textures[i] = images[texDef.source];
                    }
                }
            }

            // Load Materials
            const materials = [];
            if (gltf.materials) {
                for (let i = 0; i < gltf.materials.length; i++) {
                    const matDef = gltf.materials[i];
                    const mat = { texture: null, color: null };
                    
                    if (matDef.pbrMetallicRoughness) {
                        const pbr = matDef.pbrMetallicRoughness;
                        if (pbr.baseColorTexture !== undefined) {
                            mat.texture = textures[pbr.baseColorTexture.index];
                        }
                        if (pbr.baseColorFactor) {
                            mat.color = pbr.baseColorFactor;
                        }
                    }
                    materials[i] = mat;
                }
            }

            // Helper to get accessor data
            const getAccessorData = (accessorIndex) => {
                const accessor = gltf.accessors[accessorIndex];
                const bufferView = gltf.bufferViews[accessor.bufferView];
                const buffer = buffers[bufferView.buffer];
                
                const byteOffset = (accessor.byteOffset || 0) + (bufferView.byteOffset || 0);
                
                return {
                    buffer,
                    byteOffset,
                    count: accessor.count,
                    componentType: accessor.componentType,
                    type: accessor.type
                };
            };

            // Process Nodes recursively
            const processNode = (nodeIndex, parent) => {
                const nodeDef = gltf.nodes[nodeIndex];
                let entity;

                // Create Entity (Mesh or empty Node)
                entity = new MeshClass(parent);
                if (nodeDef.name) entity.name = nodeDef.name;

                // Apply Transform
                if (nodeDef.translation) {
                    entity.position(nodeDef.translation[0], nodeDef.translation[1], nodeDef.translation[2]);
                }
                if (nodeDef.scale) {
                    entity.scale(nodeDef.scale[0], nodeDef.scale[1], nodeDef.scale[2]);
                }
                // TODO: Handle Rotation (GLTF uses Quaternions, Entity uses Euler)
                // if (nodeDef.rotation) { ... }

                // Load Mesh Data
                if (nodeDef.mesh !== undefined) {
                    const meshDef = gltf.meshes[nodeDef.mesh];
                    
                    for (const primitive of meshDef.primitives) {
                        const surface = entity.createSurface();
                        
                        // Apply Material (Texture/Color)
                        if (primitive.material !== undefined && materials[primitive.material]) {
                            const mat = materials[primitive.material];
                            if (mat.texture && !entity.texture) {
                                entity.entityTexture(mat.texture);
                            }
                            if (mat.color) {
                                entity.entityColor(mat.color[0] * 255, mat.color[1] * 255, mat.color[2] * 255);
                                entity.entityAlpha(mat.color[3]);
                            }
                        }

                        // Attributes: POSITION
                        const posAcc = getAccessorData(primitive.attributes.POSITION);
                        const posData = new Float32Array(posAcc.buffer, posAcc.byteOffset, posAcc.count * 3);

                        // Attributes: NORMAL
                        let normData = null;
                        if (primitive.attributes.NORMAL !== undefined) {
                            const normAcc = getAccessorData(primitive.attributes.NORMAL);
                            normData = new Float32Array(normAcc.buffer, normAcc.byteOffset, normAcc.count * 3);
                        }

                        // Attributes: TEXCOORD_0
                        let uvData = null;
                        if (primitive.attributes.TEXCOORD_0 !== undefined) {
                            const uvAcc = getAccessorData(primitive.attributes.TEXCOORD_0);
                            uvData = new Float32Array(uvAcc.buffer, uvAcc.byteOffset, uvAcc.count * 2);
                        }

                        // Add Vertices to Surface
                        for (let i = 0; i < posAcc.count; i++) {
                            const x = posData[i * 3];
                            const y = posData[i * 3 + 1];
                            const z = posData[i * 3 + 2];
                            
                            const u = uvData ? uvData[i * 2] : 0;
                            const v = uvData ? uvData[i * 2 + 1] : 0;

                            const idx = surface.addVertex(x, y, z, u, v);

                            if (normData) {
                                surface.vertexNormal(idx, normData[i * 3], normData[i * 3 + 1], normData[i * 3 + 2]);
                            }
                        }

                        // Add Triangles (Indices)
                        if (primitive.indices !== undefined) {
                            const indAcc = getAccessorData(primitive.indices);
                            let indices;
                            // Support different index types
                            if (indAcc.componentType === 5123) indices = new Uint16Array(indAcc.buffer, indAcc.byteOffset, indAcc.count);
                            else if (indAcc.componentType === 5125) indices = new Uint32Array(indAcc.buffer, indAcc.byteOffset, indAcc.count);
                            else indices = new Uint8Array(indAcc.buffer, indAcc.byteOffset, indAcc.count);

                            for (let i = 0; i < indAcc.count; i += 3) {
                                surface.addTriangle(indices[i], indices[i+1], indices[i+2]);
                            }
                        }
                    }
                }

                // Process Children
                if (nodeDef.children) {
                    for (const childIndex of nodeDef.children) {
                        processNode(childIndex, entity);
                    }
                }
            };

            // Start with default scene
            const sceneIndex = gltf.scene !== undefined ? gltf.scene : 0;
            const scene = gltf.scenes[sceneIndex];
            
            if (scene && scene.nodes) {
                for (const nodeIndex of scene.nodes) {
                    processNode(nodeIndex, rootEntity);
                }
            }

            console.log(`Bonobo: Parsed GLTF/GLB`);

        } catch (err) {
            console.error(`Bonobo: Could not parse GLTF`, err);
        }
    }
}