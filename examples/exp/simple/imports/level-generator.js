export class LevelGenerator {
    constructor(math) {
        this.math = math;
    }

    createAsteroidField(masterMesh, count) {
        const cubes = [];
        for (let i = 0; i < count; i++) {
            const c = masterMesh.copyEntity(); // Instanz erstellen
            c.position(
                this.math.rand(-500, 500),
                this.math.rand(-100, 100),
                this.math.rand(-500, 500)
            );
            c.rotX = this.math.rand(-50, 50) / 20.0;
            c.rotY = this.math.rand(-50, 50) / 20.0;
            c.rotZ = this.math.rand(-50, 50) / 20.0;
            cubes.push(c);
        }
        return cubes;
    }
}