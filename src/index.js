// import _ from 'lodash';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import Stats from 'stats-js';
// import { TweenMax } from 'gsap/TweenMax';

class Scene {

  constructor() {

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
    this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;

    this.stats = null;

    this.settings = {
      roughness: 0.8,
      metalness: 0,
      displacementScale: 0,
      displacementBias: 0,
      normalScale: 1.0,
    };

    this.objects = {
      plane: null,
      planeMaterial: null
    };

    this.initialized = false;

  }

  addGui() {
    const gui = new dat.GUI();

    // gui.add(this.camera.position, 'x', -10, 10).listen();
    // gui.add(this.camera.position, 'y', -10, 10).listen();
    // gui.add(this.camera.position, 'z', -10, 10).listen();

    gui.add(this.settings, 'roughness').min(0).max(1).onChange((value) => {
      this.objects.planeMaterial.roughness = value;
    });
    gui.add(this.settings, 'metalness').min(0).max(1).onChange((value) => {
      this.objects.planeMaterial.metalness = value;
    });
    gui.add(this.settings, 'displacementBias').min(-5).max(5).onChange((value) => {
      this.objects.planeMaterial.displacementBias = value;
    });
    gui.add(this.settings, 'displacementScale').min(-5).max(5).onChange((value) => {
      this.objects.planeMaterial.displacementScale = value;
    });
    gui.add(this.settings, 'normalScale').min(-1).max(1).onChange((value) => {
      this.objects.planeMaterial.normalScale.set(1, -1).multiplyScalar(value);
    });


    this.stats = new Stats();
    this.stats.setMode(0);

    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.left = '0px';
    this.stats.domElement.style.top = '0px';

    document.body.appendChild(this.stats.domElement);
  }

  addLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight( 0xffffff, 1, 500 );
    pointLight.position.set( 0, 20, 0 );
    this.scene.add(pointLight);

    // pointLight.castShadow = true;
    // pointLight.shadow.camera.near = 1;
    // pointLight.shadow.camera.far = 60;
    // pointLight.shadow.bias = -0.005;
  }

  settingCamera() {
    const OrbitControls = require('three-orbit-controls')(THREE);
    const controls = new OrbitControls( this.camera );
    this.camera.position.set(0, 13, 16);
    controls.update();
  }

  init() {

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( this.renderer.domElement );
    document.body.style = 'overflow: hidden; margin: 0; background: #000;';

    const planeGeometry = new THREE.SphereGeometry(5, 100, 100);
    // const planeMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide, wireframe: true});

    const textureLoader = new THREE.TextureLoader();
    const normalMap = textureLoader.load('assets/normal.png');
    const displacementMap = textureLoader.load('assets/displacement.png');


    const planeDisplacementMaterial = new THREE.MeshStandardMaterial({

      color: 0x0099ff,
      roughness: this.settings.roughness,
      metalness: this.settings.metalness,

      normalMap: normalMap,
      // normalScale: this.settings.normalScale,

      // aoMap: aoMap,
      // aoMapIntensity: 1,

      displacementMap: displacementMap,
      displacementScale: this.settings.displacementScale,
      displacementBias: this.settings.displacementBias,

      // envMap: reflectionCube,
      // envMapIntensity: settings.envMapIntensity,

      wireframe: true,

      side: THREE.DoubleSide

    });

    this.objects.planeMaterial = planeDisplacementMaterial;
    this.objects.plane = new THREE.Mesh(planeGeometry, this.objects.planeMaterial);
    this.scene.add(this.objects.plane);

    this.addGui();
    this.addLight();
    this.settingCamera();

    const animate = () => {
      requestAnimationFrame(animate);

      this.stats.begin();

      if (this.initialized) {

        //
      }

      this.stats.end();

      this.renderer.render( this.scene, this.camera );
    };
    animate();

  }

}

new Scene().init();
