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
        this.canvasData.colorValues = { r: 255, g: 255, b: 255, a: 1 };
        this.canvasData.origin = { x: 0, y: 0 };

		this.bonobo.canvasToDOM(this.canvasData.element);

        // Make canvas focusable and focus it automatically
        this.canvasData.element.tabIndex = 1;
        this.canvasData.element.style.outline = "none";
        this.canvasData.element.focus();

        this.canvasData.context.save(); // Save initial clean state for Viewport resets
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
}