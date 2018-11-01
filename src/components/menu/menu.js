export class Menu {

  constructor() {
    this.canvas = document.getElementById('menu');
    this.ctx = this.canvas.getContext('2d');
  }

  getContext() {
    return this;
  }

  drawRect(rect) {
    this.ctx.beginPath();
    this.ctx.fillStyle = rect.color;
    this.ctx.rect(rect.position[0], rect.position[1], rect.size, rect.size);
    this.ctx.fill();
  }

  updatePixelsInfo(ctx) {

    const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
    const dataLength = data.length / 4; // массив из пикселей в виде rgba (1px = r,g,b,a)
    const step = Math.floor(dataLength / this.rectangles.length);

    for (let i = 0, j = 0; i < dataLength && j < this.rectangles.length; i += step, j++) {
      let pixel = i * 4;
      this.rectangles[j].color = `rgba(${data[pixel]}, ${data[pixel + 1]}, ${data[pixel + 2]}, 255)`;
    }

  }

  generateRectangles(count, rectSize) {

    const rectangles = [];

    let x = 0;
    let y = 0;

    for (let i = 0; i < count; i++) {

      rectangles.push({
        size: rectSize,
        position: [x, y],
        color: 'rgba(255,255,255)'
      });

      x += rectSize;
      if (x >= this.canvas.width) {
        x = 0;
        y += rectSize;
      }

    }
    return rectangles;
  }

  init() {
    const menu = document.querySelector('.menu');
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = menu.offsetWidth * devicePixelRatio;
    this.canvas.height = menu.offsetHeight * devicePixelRatio;

    const {
      width,
      height
    } = this.canvas;

    // генерим квадраты в меню
    let rectSize = 50;
    const widthRectCount = Math.floor(width / rectSize);
    rectSize = width / widthRectCount;
    const count = Math.ceil((height / rectSize)) * widthRectCount;

    this.rectangles = this.generateRectangles(count, rectSize);

    const animate = () => {
      requestAnimationFrame(animate);

      // setTimeout(() => {
      //   animate();
      // }, 250);

      this.ctx.clearRect(0, 0, 0, 0);

      this.rectangles.forEach((item) => {
        this.drawRect(item);
      });

    };
    animate();
  }

}
