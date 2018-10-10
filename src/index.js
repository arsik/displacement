// import _ from 'lodash';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import Stats from 'stats-js';
// import { TweenMax } from 'gsap/TweenMax';

class Scene {

  constructor() {

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;

    this.stats = null;

    this.settings = {
      displacementX: 0.0,
      displacementY: 0.0
    };

    this.objects = {
      scape: null
    };

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
    document.body.style = 'overflow: hidden; margin: 0; background: #000;';
  }

  createGeometry() {

    const promise = new Promise((resolve) => {

      const scapeGeometry = new THREE.BufferGeometry();

      const ColladaLoader = require('three-collada-loader');
      const loadingManager = new THREE.LoadingManager();

      const loader = new ColladaLoader( loadingManager );
      loader.load( '/assets/geo.dae', ( collada ) => {

        this.scene.add(collada.scene);

        // console.log(collada.scene.children[0].children[0].geometry.vertices);

        const positions = collada.scene.children[0].children[0].geometry.vertices;
        const convertedPositions = [];
        for (let i = 0; i < positions.length; i++) {
          const pos = [
            positions[i].x,
            positions[i].y,
            positions[i].z,
          ];
          convertedPositions.push(...pos);
        }

        scapeGeometry.addAttribute('position', new THREE.Float32BufferAttribute(convertedPositions, 3));
        scapeGeometry.computeBoundingSphere();
        const vertexDisplacement = new Float32Array(scapeGeometry.attributes.position.count);
        for (let i = 0; i < vertexDisplacement.length; i++) {
          vertexDisplacement[i] = Math.sin(i);
        }
        scapeGeometry.addAttribute('vertexDisplacement', new THREE.BufferAttribute(vertexDisplacement, 1));

        resolve({
          geometry: scapeGeometry,
          vertexDisplacement: vertexDisplacement
        });

      });


    });

    return promise;

  }

  createMaterial() {
    const shaderMaterial = new THREE.ShaderMaterial({
      transparent: true,
      // wireframe: true,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib['lights'],
        {
          percent: { value: 0 },
          color1: { type: 'c', value: new THREE.Color(0x0B0991) },
          color2: { type: 'c', value: new THREE.Color(0x00FFEA) },
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

            p.x += sin(vertexDisplacement) * displacementX;
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
          gl_FragColor = vec4(mix(color1, color2, cos(vUv * 0.02)), 1.0);
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

    const geometryPromise = this.createGeometry();
    const material = this.createMaterial();

    geometryPromise.then(resolve => {

      const geometry = resolve.geometry;
      const vertexDisplacement = resolve.vertexDisplacement;


      this.objects.scale = new THREE.Mesh(geometry, material);
      this.scene.add(this.objects.scale);

      this.addGui();
      this.addLight();
      this.settingCamera();

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

        // stats end
        this.stats.end();
        this.renderer.render( this.scene, this.camera );
      };
      animate();

      this.initialized = true;

    });



  }

}

new Scene().init();
