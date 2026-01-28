/**
 * Handles loading of legacy Blitz3D model formats (.b3d).
 * Separated from Mesh to keep the core clean.
 */
export class B3DLoader {
    /**
     * Loads a mesh from a URL.
     * @param {string} url 
     * @param {Mesh} mesh The root mesh to populate.
     * @param {typeof Mesh} MeshClass The Mesh class constructor (dependency injection).
     */
    static load(url, mesh, MeshClass) {
        // Async loading
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load ${url}`);
                return response.arrayBuffer();
            })
            .then(data => this.parse(data, mesh, MeshClass))
            .catch(err => {
                console.error(`Bonobo: Could not load mesh '${url}'`, err);
            });
    }

    static parse(data, mesh, MeshClass) {
        console.log(`Bonobo: Parsing B3D data (${data.byteLength} bytes)`);
        // TODO: B3DParser.parse(mesh, data, MeshClass);
    }
}