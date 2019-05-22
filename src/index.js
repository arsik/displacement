// import _ from 'lodash';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import Stats from 'stats-js';
// import { TweenMax } from 'gsap/TweenMax';


class Scene {

  constructor() {

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 25, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    this.ctx = null;
    this.stats = null;
    this.objects = {};
    this.initialized = false;
  }

  addGui() {
    const gui = new dat.GUI();

    gui.add(this.camera.position, 'x', -1.0, 1.0).listen();
    gui.add(this.camera.position, 'y', -1.0, 1.0).listen();
    gui.add(this.camera.position, 'z', -1.0, 1.0).listen();

    // gui.add(this.settings, 'displacementX').min(-100).max(100).onChange((value) => {
    //   this.objects.scale.material.uniforms.displacementX.value = value;
    // });
    // gui.add(this.settings, 'displacementY').min(-100).max(100).onChange((value) => {
    //   this.objects.scale.material.uniforms.displacementY.value = value;
    // });

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
    const controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.camera.position.set(0.0, 0.0, 0.5);
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

  createMaterial() {
    return new THREE.PointsMaterial( { size: 1, sizeAttenuation: false, color: '#fff' } );
  }

  createGeometry() {
    const points = require('./assets/points.json').values;
    const geometry = new THREE.BufferGeometry();

    // console.log(points);
    geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(points), 3 ) );
    geometry.computeBoundingSphere();

    return geometry;
  }

  interpolate(a, b, frac) {
    const n = a + (b - a) * frac;
    return n.toFixed(5);
  }

  init() {

    this.settingScene();

    const geometry = this.createGeometry();
    const material = this.createMaterial();

    this.objects.scale = new THREE.Points(geometry, material);
    this.scene.add(this.objects.scale);

    this.addGui();
    this.addLight();
    this.settingCamera();

    const animate = () => {
      requestAnimationFrame(animate);
      this.stats.begin();

      //

      this.stats.end();
      this.renderer.render( this.scene, this.camera );
    };
    animate();

    this.initialized = true;

  }

}

new Scene().init();
