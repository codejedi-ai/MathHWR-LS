// simple drawable circle
export class Circle {
    constructor(
      public x: number,
      public y: number,
      public diameter: number = 64,
      public fill = "rgba(255, 0, 0, 0.9)",
      public stroke = "black"
    ) {}
  
    hitTest(mx: number, my: number) {
      const dx = mx - this.x;
      const dy = my - this.y;
      const r = this.diameter / 2;
      return dx * dx + dy * dy <= r * r;
    }
  
    draw(gc: CanvasRenderingContext2D) {
      gc.save();
      gc.fillStyle = this.fill;
  
      gc.strokeStyle = this.stroke;
      gc.lineWidth = 2;
      gc.beginPath();
      gc.arc(this.x, this.y, this.diameter / 2, 0, 2 * Math.PI);
      gc.fill();
      gc.stroke();
      gc.restore();
    }
  }
  