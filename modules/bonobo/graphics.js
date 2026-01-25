/**
 * Manages the HTML5 Canvas and provides basic drawing primitives.
 */
export class Graphics{
    constructor(width = 640, height = 480, bonobo){
        if(width === "*" && typeof height === "object"){
            bonobo = height;
        }

        this.bonobo = bonobo;
		bonobo.contextOwner = this;
		this.canvasData = {};
		this.initCanvas(width, height);
    }

    /**
     * Initializes the canvas element.
     * @param {number|string} width Width or "*" for fullscreen.
     * @param {number} height Height.
     */
	initCanvas(width, height){
		this.canvasData.element = document.createElement("canvas");
		this.canvasData.element.style.cursor = "none";

        if(width === "*"){
            this.canvasData.element.width = window.innerWidth;
            this.canvasData.element.height = window.innerHeight;

            window.addEventListener("resize", () => {
                this.canvasData.element.width = window.innerWidth;
                this.canvasData.element.height = window.innerHeight;
                this.canvasData.context.fillStyle = this.canvasData.drawColor;
                this.canvasData.context.strokeStyle = this.canvasData.drawColor;
            });
        }else{
            this.canvasData.element.width = width;
            this.canvasData.element.height = height;
        }

		this.canvasData.context = this.canvasData.element.getContext("2d");
		this.canvasData.clsColor = "rgba(0,0,0,1)";
		this.canvasData.drawColor = "rgba(255,255,255,1)";

		this.bonobo.canvasToDOM(this.canvasData.element);
	}

	get canvasContext(){
		return this.canvasData.context;
	}

	get width(){
		return this.canvasData.element.width;
	}

	get height(){
		return this.canvasData.element.height;
	}

    /**
     * Sets the clear color (background color).
     * @param {number} r Red (0-255).
     * @param {number} g Green (0-255).
     * @param {number} b Blue (0-255).
     * @param {number} [a=1] Alpha (0-1).
     */
	clsColor(r = 0, g = 0, b = 0, a = 1){
		this.canvasData.clsColor = `rgba(${r}, ${g}, ${b}, ${a})`;
	}

    /**
     * Sets the current drawing color.
     * @param {number} r Red (0-255).
     * @param {number} g Green (0-255).
     * @param {number} b Blue (0-255).
     * @param {number} [a=1] Alpha (0-1).
     */
	color(r = 255, g = 255, b = 255, a = 1){
		this.canvasData.drawColor = `rgba(${r}, ${g}, ${b}, ${a})`;
		this.canvasData.context.fillStyle = this.canvasData.drawColor;
		this.canvasData.context.strokeStyle = this.canvasData.drawColor;
	}

    /**
     * Clears the screen with the set clear color.
     */
	cls(){
		this.canvasData.context.fillStyle = this.canvasData.clsColor;
		this.canvasData.context.fillRect(0, 0, this.canvasData.element.width, this.canvasData.element.height);
		this.canvasData.context.fillStyle = this.canvasData.drawColor;
	}

    /**
     * Draws a rectangle.
     * @param {number} x X-coordinate.
     * @param {number} y Y-coordinate.
     * @param {number} w Width.
     * @param {number} h Height.
     * @param {boolean} [filled=true] Whether to fill the rectangle.
     */
	rect(x, y, w, h, filled = true){
		if(filled){
			this.canvasData.context.fillRect(x, y, w, h);
		}else{
			this.canvasData.context.strokeRect(x, y, w, h);
		}
	}

    /**
     * Draws a line.
     * @param {number} x1 Start X.
     * @param {number} y1 Start Y.
     * @param {number} x2 End X.
     * @param {number} y2 End Y.
     */
	line(x1, y1, x2, y2){
		this.canvasData.context.beginPath();
		this.canvasData.context.moveTo(x1, y1);
		this.canvasData.context.lineTo(x2, y2);
		this.canvasData.context.stroke();
	}
}