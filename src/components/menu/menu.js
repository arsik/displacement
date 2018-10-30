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
    // this.ctx.lineWidth = 0;
    // this.ctx.strokeStyle = rect.color;
    // this.ctx.fillStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`;
    this.ctx.fillStyle = rect.color;
    this.ctx.rect(rect.position[0], rect.position[1], rect.size, rect.size);
    this.ctx.fill();
    // this.ctx.stroke();
  }

  updatePixelsInfo(ctx) {
    // const data = ctx.getImageData(15, 15, 1, 1).data;

    // console.log(`R: ${data[0]} G: ${data[1]} B: ${data[2]}`);
    // console.log(this.rectangles);

    this.rectangles.forEach((item) => {
      const data = ctx.getImageData(item.position[0], item.position[1], item.size, item.size).data;
      item.color = `rgba(${data[0]}, ${data[1]}, ${data[2]})`;
    });

    // console.log(this.rectangles.length);
    // this.cubeColor = `rgb(${data[0]},${data[1]},${data[2]})`;

  }

  generateRectangles(count, rectSize) {

    const rectangles = [];

    let x = 0;
    let y = 0;

    for (let i = 0; i < count; i++) {

      rectangles.push({
        size: rectSize,
        position: [x, y],
        color: 'rgba(255,255,255'
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

      this.ctx.clearRect(0, 0, 0, 0);

      this.rectangles.forEach((item) => {
        this.drawRect(item);
      });

    };
    animate();
  }

}
