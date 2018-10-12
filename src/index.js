// import _ from 'lodash';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import Stats from 'stats-js';
import { humanArr } from './human.js';
// import { tubeArr } from './tube.js';
// import { TweenMax } from 'gsap/TweenMax';


class Menu {

  constructor() {
    this.canvas = document.getElementById('menu');
    this.ctx = this.canvas.getContext('2d');
  }
  getContext() {
    return this;
  }
  drawRect(ctx, rectSize, x, y) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#444';
    // ctx.fillStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`;
    ctx.fillStyle = '#0099ff';
    ctx.rect(x, y, rectSize, rectSize);
    ctx.fill();
    ctx.stroke();
  }

  euclid(a, b) {
    if (b === 0) {
      return a;
    } else {
      return this.euclid(b, a % b);
    }
  }

  init() {
    const menu = document.querySelector('.menu');
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = menu.offsetWidth * devicePixelRatio;
    this.canvas.height = menu.offsetHeight * devicePixelRatio;

    const {
      ctx
    } = this;
    const {
      width,
      height
    } = this.canvas;

    let rectSize = 50; // вычисляем НОД по алгоритму Эвклида (размер одного квадрата)

    const widthRectCount = Math.floor(width / rectSize);

    rectSize = width / widthRectCount;

    const count = Math.ceil((height / rectSize)) * widthRectCount;

    // const rectTotal = (height * width) / (rectSize * rectSize);

    console.log({
      width: width,
      height: height,
      rectSize: rectSize,
      // rectTotal: rectTotal,
      widthRectCount: widthRectCount,
      count: count
    });

    // if (widthRectCount) {

    // }

    let x = 0;
    let y = 0;

    for (let i = 0; i < count; i++) {

      this.drawRect(ctx, rectSize, x, y);
      x += rectSize;
      if (x >= width) {
        x = 0;
        y += rectSize;
      }

    }

    const animate = () => {
      // this.ctx.drawImage(webgl.canvas, 0, 0);
      requestAnimationFrame(animate);
    };
    animate();
  }

}

class Scene {

  constructor() {

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;

    this.ctx = null;

    this.stats = null;

    this.settings = {
      displacementX: 0.0,
      displacementY: 0.0
    };

    this.objects = {};

    this.initialized = false;
  }

  addGui() {
    const gui = new dat.GUI();

    gui.add(this.camera.position, 'x', -10, 10).listen();
    gui.add(this.camera.position, 'y', -10, 10).listen();
    gui.add(this.camera.position, 'z', -10, 10).listen();

    gui.add(this.settings, 'displacementX').min(-100).max(100).onChange((value) => {
      this.objects.scale.material.uniforms.displacementX.value = value;
    });
    gui.add(this.settings, 'displacementY').min(-100).max(100).onChange((value) => {
      this.objects.scale.material.uniforms.displacementY.value = value;
    });

    this.stats = new Stats();
    this.stats.setMode(0);

    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.left = '0px';
    this.stats.domElement.style.top = '0px';

    document.body.appendChild(this.stats.domElement);
  }

  addLight() {
    // const ambientLight = new THREE.AmbientLight(0x404040);
    // this.scene.add(ambientLight);

    // const pointLight = new THREE.PointLight( 0xffffff, 1, 500 );
    // pointLight.position.set( 0, 20, 0 );
    // this.scene.add(pointLight);
  }

  settingCamera() {
    const OrbitControls = require('three-orbit-controls')(THREE);
    const controls = new OrbitControls( this.camera );
    this.camera.position.set(0, 13, 80);
    controls.update();
  }

  settingScene() {
    const devicePixelRatio = window.devicePixelRatio || 1; // for retina

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);
    this.renderer.domElement.style = 'width: 100%; height: 100%;';
  }

  createGeometry() {

    const scapeGeometry = new THREE.BufferGeometry();

    const positions = [];

    const scapeSize = 100; // скейлим модель на -100 (x, y, z)
    const interpolatePoints = 10; // количество точек между двумя точками
    const interpolateFrac = 0.1; // расстояние между точками (интерполируемыми)

    for (let i = 0; i < humanArr.length - 1; i++) {

      for (let j = 1; j < interpolatePoints; j++) {
        const pos = [
          this.interpolate(humanArr[i][0], humanArr[i + 1][0], j * interpolateFrac) / scapeSize,
          this.interpolate(humanArr[i][2], humanArr[i + 1][2], j * interpolateFrac) / scapeSize,
          this.interpolate(humanArr[i][1], humanArr[i + 1][1], j * interpolateFrac) / scapeSize,
        ];
        positions.push(...pos);
      }
      // positions.push(humanArr[i][0] / scapeSize, tubeArr[i][2] / scapeSize, tubeArr[i][1] / scapeSize);
    }

    scapeGeometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    scapeGeometry.computeBoundingSphere();

    return scapeGeometry;
  }

  createMaterial() {
    const shaderMaterial = new THREE.ShaderMaterial({
      transparent: false,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib['lights'],
        {
          percent: { value: 0 },
          color1: { type: 'c', value: new THREE.Color(0x0B0991) },
          color2: { type: 'c', value: new THREE.Color(0x00FFEA) },
          lineWidth: { value: 3 },
          delta: { value: 0 },
          displacementX: { type: 'f', value: this.settings.displacementX },
          displacementY: { type: 'f', value: this.settings.displacementY },
        }
      ]),
      vertexShader: ` // анимация вертексов
        attribute float vertexDisplacement;
        uniform float delta;
        uniform float displacementX;
        uniform float displacementY;
        varying vec3 vUv;

        void main() 
        {
          vUv = position;

          vec3 p = position;

          p.x += sin(vertexDisplacement) * displacementX / cos(delta * vertexDisplacement * 0.01);
          p.y += cos(vertexDisplacement) * displacementY;

          p.x = p.x - displacementX / 2.0;
          p.y = p.y - displacementY;

          vec4 modelViewPosition = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * modelViewPosition;
        }
      `,
      fragmentShader: ` // цвет вертексов (градиент)
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec3 vUv;
        uniform float delta;

        void main() {
          gl_FragColor = vec4(mix(color1, color2, sin(vUv.x * vUv.y * 0.01)), 1.0);
        }
      `
    });

    return shaderMaterial;
  }

  interpolate(a, b, frac) {
    const n = a + (b - a) * frac;
    return n.toFixed(5);
  }

  init() {

    this.settingScene();

    const geometry = this.createGeometry();
    const material = this.createMaterial();

    const vertexDisplacement = new Float32Array(geometry.attributes.position.count);
    for (let i = 0; i < vertexDisplacement.length; i++) {
      vertexDisplacement[i] = Math.sin(i);
    }
    geometry.addAttribute('vertexDisplacement', new THREE.BufferAttribute(vertexDisplacement, 1));

    this.objects.scale = new THREE.Line(geometry, material);
    // this.objects.scale.rotation.x = -Math.PI * 3;
    this.scene.add(this.objects.scale);

    this.addGui();
    this.addLight();
    this.settingCamera();

    const menu = new Menu();
    menu.init();
    const menuContext = menu.getContext();

    let delta = 0;
    let percent = 1.0;

    const animate = () => {
      requestAnimationFrame(animate);
      this.stats.begin();

      delta += 0.1;
      percent += 100.0;

      this.objects.scale.material.uniforms.delta.value = 0.5 + Math.sin(delta) * 0.5;
      for (let i = 0; i < vertexDisplacement.length; i++) {
        vertexDisplacement[i] = 0.5 + Math.sin(i + delta) * 0.25;
      }
      this.objects.scale.geometry.attributes.vertexDisplacement.needsUpdate = true; // анимация displacement
      this.objects.scale.geometry.drawRange.count = percent; // анимация линии


      // const webgl = this.renderer.domElement.getContext('webgl', {
      //   preserveDrawingBuffer: true,
      // });

      // stats end
      this.stats.end();
      this.renderer.render( this.scene, this.camera );

      // this.ctx.drawImage(webgl.canvas, 0, 0);
    };
    animate();

    this.initialized = true;

  }

}

new Scene().init();
