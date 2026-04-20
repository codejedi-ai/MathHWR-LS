import { Paper } from "../types/PageEntity";

export interface RectangleOptions {
  offsetX: number;        // relative to paper's top-left
  offsetY: number;        // relative to paper's top-left
  width: number;
  height: number;
  fillStyle?: string;
  strokeStyle?: string;
  lineWidth?: number;
  cornerRadius?: number;  // optional rounded corners
  z?: number;             // for painter's algorithm ordering
}

export class Rectangle {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  fillStyle?: string;
  strokeStyle?: string;
  lineWidth: number;
  cornerRadius: number;
  z: number;

  constructor(opts: RectangleOptions) {
    this.offsetX = opts.offsetX;
    this.offsetY = opts.offsetY;
    this.width = opts.width;
    this.height = opts.height;
    this.fillStyle = opts.fillStyle;
    this.strokeStyle = opts.strokeStyle;
    this.lineWidth = opts.lineWidth ?? 1;
    this.cornerRadius = opts.cornerRadius ?? 0;
    this.z = opts.z ?? 0;
  }

  // Draws the rectangle relative to the paper's top-left corner
  draw(gc: CanvasRenderingContext2D, paper: Paper): void {
    const paperLeft = paper.event.x - paper.width / 2;
    const paperTop = paper.event.y - paper.height / 2;
    const x = paperLeft + this.offsetX;
    const y = paperTop + this.offsetY;

    if (this.fillStyle) gc.fillStyle = this.fillStyle;
    if (this.strokeStyle) gc.strokeStyle = this.strokeStyle;
    gc.lineWidth = this.lineWidth;

    if ((gc as any).roundRect && this.cornerRadius > 0) {
      gc.beginPath();
      (gc as any).roundRect(x, y, this.width, this.height, this.cornerRadius);
      if (this.fillStyle) gc.fill();
      if (this.strokeStyle) gc.stroke();
    } else {
      if (this.fillStyle) gc.fillRect(x, y, this.width, this.height);
      if (this.strokeStyle) gc.strokeRect(x, y, this.width, this.height);
    }
  }
}


