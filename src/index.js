// import _ from 'lodash';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import GLTFLoader from 'three-gltf-loader';
import Stats from 'stats-js';

import { Menu } from './components/menu/menu';
import { fileArr } from './models/main.js';

class Scene {

  constructor() {

    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.mixer = null;
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;

    this.stats = null;

    this.settings = {
      displacementX: 0.0,
      displacementY: 0.0
    };

    this.objects = {}; // тут будем хранить наш созданный меш (геометрия + материал)

    this.initialized = false;
  }

  addGui() { // настройки GUI
    const gui = new dat.GUI();

    // gui.add(this.camera.position, 'x', -10, 10).listen();
    // gui.add(this.camera.position, 'y', -10, 10).listen();
    // gui.add(this.camera.position, 'z', -10, 10).listen();

    gui.add(this.settings, 'displacementX').min(-100).max(100).onChange((value) => {
      this.objects.mainObject.material.uniforms.displacementX.value = value;
    });
    gui.add(this.settings, 'displacementY').min(-100).max(100).onChange((value) => {
      this.objects.mainObject.material.uniforms.displacementY.value = value;
    });

    this.stats = new Stats();
    this.stats.setMode(0);

    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.bottom = '0px';
    this.stats.domElement.style.right = '0px';
    this.stats.domElement.style.zIndex = '100';

    document.body.appendChild(this.stats.domElement);
  }

  addDeviceMotion() { // гироскоп для мобилки

    // this.accel = 0;

    // window.addEventListener('devicemotion', (event) => {

    //   const accel = Math.round(event.rotationRate.gamma);

    //   this.accel += accel;

    //   document.getElementById('logo').innerHTML = this.accel;
    //   this.camera.rotation.y = this.accel;
    // });
  }

  colladaCamera() { // анимация камеры выгруженная из C4D collada -> gltf converter (http://52.4.31.236/convertmodel.html) ссылка на конвертер

    const loader = new GLTFLoader();

    loader.load('assets/cam.gltf', (gltf) => {

        this.mixer = new THREE.AnimationMixer(this.camera);

        const animation = this.mixer.clipAction(gltf.animations[0]);
        animation.setLoop(THREE.LoopOnce); // проигрываем один раз
        animation.clampWhenFinished = true; // оставить камеру на последнем кадре
        animation.play(); // запуск анимации

        console.log(animation);

      },
      function ( xhr ) {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
      },
      function ( error ) {
        console.log( `An error happened: ${error}` );
      }
    );
  }

  settingCamera() { // контролы для камеры (только при разработке)
    const OrbitControls = require('three-orbit-controls')(THREE);
    const controls = new OrbitControls( this.camera );
    this.camera.position.set(0, 13, 80);
    controls.update();
  }

  settingScene() { // настройки сцены
    const devicePixelRatio = window.devicePixelRatio || 1; // for retina

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);
    this.renderer.domElement.style = 'width: 100%; height: 100%;';
  }

  createGeometry() { // создаем геометрию на основе вертексов полученных из C4D

    const scapeGeometry = new THREE.BufferGeometry();
    const positions = [];
    const scapeSize = 100; // скейлим модель на -100 (x, y, z)
    // const interpolatePoints = 10; // количество точек между двумя точками
    // const interpolateFrac = 0.1; // расстояние между точками (интерполируемыми)

    for (let i = 0; i < fileArr.length - 1; i++) { // закомментил интерполяцию

      // for (let j = 1; j < interpolatePoints; j++) {
      //   const pos = [
      //     this.interpolate(fileArr[i][0], fileArr[i + 1][0], j * interpolateFrac) / scapeSize,
      //     this.interpolate(fileArr[i][2], fileArr[i + 1][2], j * interpolateFrac) / scapeSize,
      //     this.interpolate(fileArr[i][1], fileArr[i + 1][1], j * interpolateFrac) / scapeSize,
      //   ];
      //   positions.push(...pos);
      // }
      positions.push(fileArr[i][0] / scapeSize, fileArr[i][2] / scapeSize, fileArr[i][1] / scapeSize);
    }
    scapeGeometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    scapeGeometry.computeBoundingSphere();

    return scapeGeometry;
  }

  createMaterial() { // создаем материал для геометрии (в ней же описываем шейдер)
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
          gl_FragColor = vec4(mix(color1, color2, sin(vUv.x * vUv.z * vUv.y * 0.00001)), 1.0);
        }
      `
    });

    return shaderMaterial;
  }

  interpolate(a, b, frac) { // интерполяция меж двумя точками (юзаем циклом, frac - деление)
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

    this.objects.mainObject = new THREE.Line(geometry, material);
    this.scene.add(this.objects.mainObject); // создали меш и поместили на сцену

    this.addGui(); // добавляем Gui
    this.settingCamera(); // настраиваем камеру (только для dev)
    this.colladaCamera(); // анимируем камеру
    this.addDeviceMotion(); // добавляем гироском для мобилки

    const menu = new Menu();
    menu.init(); // инициализируем меню (кубики на канвасе)

    let delta = 0;
    let percent = 1.0;

    const animate = () => {
      requestAnimationFrame(animate);
      this.stats.begin();

      delta += 0.1;
      percent += 50.0;

      this.objects.mainObject.material.uniforms.delta.value = 0.5 + Math.sin(delta) * 0.5;
      for (let i = 0; i < vertexDisplacement.length; i++) {
        vertexDisplacement[i] = 0.5 + Math.sin(i + delta) * 0.25;
      }
      this.objects.mainObject.geometry.attributes.vertexDisplacement.needsUpdate = true; // анимация displacement
      this.objects.mainObject.geometry.drawRange.count = percent; // анимация линии

      const webgl = this.renderer.domElement.getContext('webgl', {
        preserveDrawingBuffer: true,
      });

      const animDelta = this.clock.getDelta();
      if (this.mixer != null) {
        this.mixer.update(animDelta);
      }

      // stats end
      this.stats.end();
      this.renderer.render( this.scene, this.camera );

      // скрытый канвас для получения информации о цвете пикселя
      const dynamicCanvas = document.createElement('canvas');
      dynamicCanvas.width = menu.canvas.width;
      dynamicCanvas.height = menu.canvas.height;
      const dynamicCanvasCtx = dynamicCanvas.getContext('2d');
      dynamicCanvasCtx.drawImage(webgl.canvas, 0, 0);

      // передаем скрытый канвас в наше меню
      menu.updatePixelsInfo(dynamicCanvasCtx);

    };
    animate();

    this.initialized = true;

  }

}

new Scene().init();
