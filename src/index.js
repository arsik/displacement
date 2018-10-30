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

  colladaCamera() {

    const loader = new GLTFLoader();

    loader.load(
      // resource URL
      'assets/cube1-5.gltf',
      // called when the resource is loaded
      ( gltf ) => {

        console.log(gltf);

        const model = gltf.scene;

        this.scene.add( model );

        this.mixer = new THREE.AnimationMixer(model);
        this.mixer.clipAction(gltf.animations[0]).play();

        // gltf.animations; // Array<THREE.AnimationClip>
        // gltf.scene; // THREE.Scene
        // gltf.scenes; // Array<THREE.Scene>
        // gltf.cameras; // Array<THREE.Camera>
        // gltf.asset; // Object

      },
      // called while loading is progressing
      function ( xhr ) {

        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

      },
      // called when loading has errors
      function ( error ) {

        console.log( 'An error happened' );

      }
    );
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
    // const interpolatePoints = 10; // количество точек между двумя точками
    // const interpolateFrac = 0.1; // расстояние между точками (интерполируемыми)

    for (let i = 0; i < fileArr.length - 1; i++) {

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
          gl_FragColor = vec4(mix(color1, color2, sin(vUv.x * vUv.z * vUv.y * 0.00001)), 1.0);
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
    this.colladaCamera();

    const menu = new Menu();
    menu.init();
    // const menuContext = menu.getContext();

    let delta = 0;
    let percent = 1.0;
    // const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      this.stats.begin();

      delta += 0.1;
      percent += 50.0;

      this.objects.scale.material.uniforms.delta.value = 0.5 + Math.sin(delta) * 0.5;
      for (let i = 0; i < vertexDisplacement.length; i++) {
        vertexDisplacement[i] = 0.5 + Math.sin(i + delta) * 0.25;
      }
      this.objects.scale.geometry.attributes.vertexDisplacement.needsUpdate = true; // анимация displacement
      this.objects.scale.geometry.drawRange.count = percent; // анимация линии

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
      menu.updatePixelsInfo(dynamicCanvasCtx);

      // console.log(dynamicCanvasCtx);


    };
    animate();

    this.initialized = true;

  }

}

new Scene().init();
