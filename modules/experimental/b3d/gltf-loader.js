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
                    const mat = { texture: null, color: null, normalTexture: null, roughnessTexture: null, occlusionTexture: null, emissiveTexture: null, emissiveFactor: null };
                    
                    if (matDef.pbrMetallicRoughness) {
                        const pbr = matDef.pbrMetallicRoughness;
                        if (pbr.baseColorTexture !== undefined) {
                            mat.texture = textures[pbr.baseColorTexture.index];
                        }
                        if (pbr.baseColorFactor) {
                            mat.color = pbr.baseColorFactor;
                        }
                        if (pbr.metallicRoughnessTexture !== undefined) {
                            mat.roughnessTexture = textures[pbr.metallicRoughnessTexture.index];
                        }
                    }

                    if (matDef.normalTexture !== undefined) {
                        mat.normalTexture = textures[matDef.normalTexture.index];
                    }

                    if (matDef.occlusionTexture !== undefined) {
                        mat.occlusionTexture = textures[matDef.occlusionTexture.index];
                    }

                    if (matDef.emissiveTexture !== undefined) {
                        mat.emissiveTexture = textures[matDef.emissiveTexture.index];
                    }

                    if (matDef.emissiveFactor !== undefined) {
                        mat.emissiveFactor = matDef.emissiveFactor;
                    }

                    materials[i] = mat;
                }
            }
            
            // Load Skins
            const skins = [];
            if (gltf.skins) {
                for (let i = 0; i < gltf.skins.length; i++) {
                    const skinDef = gltf.skins[i];
                    const skin = {
                        name: skinDef.name,
                        joints: skinDef.joints, // Indices, resolve to entities later
                        inverseBindMatrices: null
                    };

                    if (skinDef.inverseBindMatrices !== undefined) {
                        const acc = getAccessorData(skinDef.inverseBindMatrices);
                        skin.inverseBindMatrices = createTypedArray(Float32Array, acc.buffer, acc.byteOffset, acc.count * 16);
                    }
                    skins[i] = skin;
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

            // Helper to safely create TypedArrays (handles unaligned byteOffsets)
            const createTypedArray = (Type, buffer, byteOffset, length) => {
                if (byteOffset % Type.BYTES_PER_ELEMENT === 0) {
                    return new Type(buffer, byteOffset, length);
                }
                // Create a copy if unaligned to avoid RangeError
                return new Type(buffer.slice(byteOffset, byteOffset + length * Type.BYTES_PER_ELEMENT));
            };

            const nodes = [];

            // Process Nodes recursively
            const processNode = (nodeIndex, parent) => {
                const nodeDef = gltf.nodes[nodeIndex];
                let entity;

                // Create Entity (Mesh or empty Node)
                entity = new MeshClass(parent);
                if (nodeDef.name) entity.name = nodeDef.name;
                nodes[nodeIndex] = entity;

                // Apply Transform
                if (nodeDef.matrix) {
                    // TODO: Decompose matrix into TRS. 
                    // For now, we ignore matrix transforms as Bonobo Entity relies on TRS.
                    console.warn("Bonobo: GLTF node uses 'matrix' which is not yet supported. Transform ignored.");
                }

                if (nodeDef.translation) {
                    entity.position(nodeDef.translation[0], nodeDef.translation[1], nodeDef.translation[2]);
                }
                
                if (nodeDef.rotation) {
                    // Convert Quaternion (x, y, z, w) to Euler (Pitch, Yaw, Roll)
                    // Bonobo Entity applies rotation as Y -> X -> Z (Tait-Bryan YXZ)
                    const [x, y, z, w] = nodeDef.rotation;

                    const t0 = 2.0 * (w * y + z * x);
                    const t1 = 1.0 - 2.0 * (x * x + y * y);
                    const yaw = Math.atan2(t0, t1);

                    let t2 = 2.0 * (w * x - y * z);
                    t2 = t2 > 1.0 ? 1.0 : t2;
                    t2 = t2 < -1.0 ? -1.0 : t2;
                    const pitch = Math.asin(t2);

                    const t3 = 2.0 * (w * z + x * y);
                    const t4 = 1.0 - 2.0 * (x * x + z * z);
                    const roll = Math.atan2(t3, t4);

                    const toDeg = 180.0 / Math.PI;
                    entity.rotate(pitch * toDeg, yaw * toDeg, roll * toDeg);
                }

                if (nodeDef.scale) {
                    entity.scale(nodeDef.scale[0], nodeDef.scale[1], nodeDef.scale[2]);
                }

                if (nodeDef.skin !== undefined) {
                    entity.skin = skins[nodeDef.skin];
                }

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
                            if (mat.normalTexture && !entity.normalTexture) {
                                entity.entityNormalTexture(mat.normalTexture);
                            }
                            if (mat.roughnessTexture && !entity.roughnessTexture) {
                                entity.entityRoughnessTexture(mat.roughnessTexture);
                            }
                            if (mat.occlusionTexture && !entity.occlusionTexture) {
                                entity.entityOcclusionTexture(mat.occlusionTexture);
                            }
                            if (mat.emissiveTexture && !entity.emissiveTexture) {
                                entity.entityEmissiveTexture(mat.emissiveTexture);
                            }
                            if (mat.color) {
                                entity.entityColor(mat.color[0] * 255, mat.color[1] * 255, mat.color[2] * 255);
                                entity.entityAlpha(mat.color[3]);
                            }
                            if (mat.emissiveFactor) {
                                entity.entityEmissiveColor(mat.emissiveFactor[0] * 255, mat.emissiveFactor[1] * 255, mat.emissiveFactor[2] * 255);
                            }
                        }

                        // Attributes: POSITION
                        const posAcc = getAccessorData(primitive.attributes.POSITION);
                        const posData = createTypedArray(Float32Array, posAcc.buffer, posAcc.byteOffset, posAcc.count * 3);

                        // Attributes: NORMAL
                        let normData = null;
                        if (primitive.attributes.NORMAL !== undefined) {
                            const normAcc = getAccessorData(primitive.attributes.NORMAL);
                            normData = createTypedArray(Float32Array, normAcc.buffer, normAcc.byteOffset, normAcc.count * 3);
                        }

                        // Attributes: TANGENT
                        let tanData = null;
                        if (primitive.attributes.TANGENT !== undefined) {
                            const tanAcc = getAccessorData(primitive.attributes.TANGENT);
                            tanData = createTypedArray(Float32Array, tanAcc.buffer, tanAcc.byteOffset, tanAcc.count * 4);
                        }

                        // Attributes: TEXCOORD_0
                        let uvData = null;
                        if (primitive.attributes.TEXCOORD_0 !== undefined) {
                            const uvAcc = getAccessorData(primitive.attributes.TEXCOORD_0);
                            uvData = createTypedArray(Float32Array, uvAcc.buffer, uvAcc.byteOffset, uvAcc.count * 2);
                        }

                        // Attributes: COLOR_0
                        let colorData = null;
                        let colorType = null;
                        let colorCompType = null;
                        if (primitive.attributes.COLOR_0 !== undefined) {
                            const colorAcc = getAccessorData(primitive.attributes.COLOR_0);
                            colorType = colorAcc.type;
                            colorCompType = colorAcc.componentType;
                            const itemSize = colorType === 'VEC3' ? 3 : 4;
                            
                            if (colorCompType === 5126) { // FLOAT
                                colorData = createTypedArray(Float32Array, colorAcc.buffer, colorAcc.byteOffset, colorAcc.count * itemSize);
                            } else if (colorCompType === 5121) { // UNSIGNED_BYTE
                                colorData = createTypedArray(Uint8Array, colorAcc.buffer, colorAcc.byteOffset, colorAcc.count * itemSize);
                            } else if (colorCompType === 5123) { // UNSIGNED_SHORT
                                colorData = createTypedArray(Uint16Array, colorAcc.buffer, colorAcc.byteOffset, colorAcc.count * itemSize);
                            }
                        }

                        // Attributes: JOINTS_0
                        let jointsData = null;
                        if (primitive.attributes.JOINTS_0 !== undefined) {
                            const jointsAcc = getAccessorData(primitive.attributes.JOINTS_0);
                            const ComponentTypeMap = { 5121: Uint8Array, 5123: Uint16Array };
                            const TypedClass = ComponentTypeMap[jointsAcc.componentType] || Uint16Array;
                            jointsData = createTypedArray(TypedClass, jointsAcc.buffer, jointsAcc.byteOffset, jointsAcc.count * 4);
                        }

                        // Attributes: WEIGHTS_0
                        let weightsData = null;
                        if (primitive.attributes.WEIGHTS_0 !== undefined) {
                            const weightsAcc = getAccessorData(primitive.attributes.WEIGHTS_0);
                            const ComponentTypeMap = { 5126: Float32Array, 5121: Uint8Array, 5123: Uint16Array };
                            const TypedClass = ComponentTypeMap[weightsAcc.componentType] || Float32Array;
                            weightsData = createTypedArray(TypedClass, weightsAcc.buffer, weightsAcc.byteOffset, weightsAcc.count * 4);
                            
                            if (weightsAcc.componentType === 5121) { // UNSIGNED_BYTE
                                const floatWeights = new Float32Array(weightsData.length);
                                for(let k=0; k<weightsData.length; k++) floatWeights[k] = weightsData[k] / 255.0;
                                weightsData = floatWeights;
                            } else if (weightsAcc.componentType === 5123) { // UNSIGNED_SHORT
                                const floatWeights = new Float32Array(weightsData.length);
                                for(let k=0; k<weightsData.length; k++) floatWeights[k] = weightsData[k] / 65535.0;
                                weightsData = floatWeights;
                            }
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

                            if (tanData) {
                                surface.vertexTangent(idx, tanData[i * 4], tanData[i * 4 + 1], tanData[i * 4 + 2], tanData[i * 4 + 3]);
                            }

                            if (colorData) {
                                let r = 1, g = 1, b = 1, a = 1;
                                const stride = colorType === 'VEC3' ? 3 : 4;
                                const offset = i * stride;
                                
                                if (colorCompType === 5126) { // FLOAT
                                    r = colorData[offset];
                                    g = colorData[offset + 1];
                                    b = colorData[offset + 2];
                                    if (stride === 4) a = colorData[offset + 3];
                                } else if (colorCompType === 5121) { // UNSIGNED_BYTE
                                    r = colorData[offset] / 255;
                                    g = colorData[offset + 1] / 255;
                                    b = colorData[offset + 2] / 255;
                                    if (stride === 4) a = colorData[offset + 3] / 255;
                                } else if (colorCompType === 5123) { // UNSIGNED_SHORT
                                    r = colorData[offset] / 65535;
                                    g = colorData[offset + 1] / 65535;
                                    b = colorData[offset + 2] / 65535;
                                    if (stride === 4) a = colorData[offset + 3] / 65535;
                                }
                                surface.vertexColor(idx, r, g, b, a);
                            }

                            if (jointsData && weightsData) {
                                surface.vertexBones(idx, 
                                    [jointsData[i * 4], jointsData[i * 4 + 1], jointsData[i * 4 + 2], jointsData[i * 4 + 3]],
                                    [weightsData[i * 4], weightsData[i * 4 + 1], weightsData[i * 4 + 2], weightsData[i * 4 + 3]]
                                );
                            }
                        }

                        // Add Triangles (Indices)
                        if (primitive.indices !== undefined) {
                            const indAcc = getAccessorData(primitive.indices);
                            let indices;
                            // Support different index types
                            if (indAcc.componentType === 5123) indices = createTypedArray(Uint16Array, indAcc.buffer, indAcc.byteOffset, indAcc.count);
                            else if (indAcc.componentType === 5125) indices = createTypedArray(Uint32Array, indAcc.buffer, indAcc.byteOffset, indAcc.count);
                            else indices = createTypedArray(Uint8Array, indAcc.buffer, indAcc.byteOffset, indAcc.count);

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

            // Resolve Skin Joints
            for (const skin of skins) {
                skin.joints = skin.joints.map(index => nodes[index]);
            }

            // Load Animations
            if (gltf.animations) {
                const animations = [];
                for (const animDef of gltf.animations) {
                    const anim = {
                        name: animDef.name,
                        channels: [],
                        samplers: []
                    };

                    for (const samplerDef of animDef.samplers) {
                        const inputAcc = getAccessorData(samplerDef.input);
                        const outputAcc = getAccessorData(samplerDef.output);
                        
                        const sampler = {
                            input: createTypedArray(Float32Array, inputAcc.buffer, inputAcc.byteOffset, inputAcc.count),
                            output: null,
                            interpolation: samplerDef.interpolation || 'LINEAR'
                        };

                        const ComponentTypeMap = {
                            5120: Int8Array, 5121: Uint8Array,
                            5122: Int16Array, 5123: Uint16Array,
                            5125: Uint32Array, 5126: Float32Array
                        };
                        const TypeSizeMap = { 'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4 };
                        const TypedClass = ComponentTypeMap[outputAcc.componentType] || Float32Array;
                        const elementSize = TypeSizeMap[outputAcc.type] || 1;
                        
                        sampler.output = createTypedArray(TypedClass, outputAcc.buffer, outputAcc.byteOffset, outputAcc.count * elementSize);
                        
                        // Normalize output if needed
                        if (outputAcc.componentType === 5120) { // INT8
                             const floatOutput = new Float32Array(sampler.output.length);
                             for(let k=0; k<sampler.output.length; k++) floatOutput[k] = Math.max(sampler.output[k] / 127.0, -1.0);
                             sampler.output = floatOutput;
                        } else if (outputAcc.componentType === 5121) { // UINT8
                             const floatOutput = new Float32Array(sampler.output.length);
                             for(let k=0; k<sampler.output.length; k++) floatOutput[k] = sampler.output[k] / 255.0;
                             sampler.output = floatOutput;
                        } else if (outputAcc.componentType === 5122) { // INT16
                             const floatOutput = new Float32Array(sampler.output.length);
                             for(let k=0; k<sampler.output.length; k++) floatOutput[k] = Math.max(sampler.output[k] / 32767.0, -1.0);
                             sampler.output = floatOutput;
                        } else if (outputAcc.componentType === 5123) { // UINT16
                             const floatOutput = new Float32Array(sampler.output.length);
                             for(let k=0; k<sampler.output.length; k++) floatOutput[k] = sampler.output[k] / 65535.0;
                             sampler.output = floatOutput;
                        }

                        anim.samplers.push(sampler);
                    }

                    for (const channelDef of animDef.channels) {
                        anim.channels.push({
                            sampler: anim.samplers[channelDef.sampler],
                            target: {
                                node: nodes[channelDef.target.node],
                                path: channelDef.target.path
                            }
                        });
                    }
                    animations.push(anim);
                }
                rootEntity.animations = animations;
            }

            console.log(`Bonobo: Parsed GLTF/GLB`);
    }
}