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
      displacementX: 0,
      displacementY: 0
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

    gui.add(this.settings, 'displacementX').min(-5).max(5).onChange((value) => {
      this.objects.plane.material.uniforms.displacementX.value = value;
    });
    gui.add(this.settings, 'displacementY').min(-5).max(5).onChange((value) => {
      this.objects.plane.material.uniforms.displacementY.value = value;
    });
    // gui.add(this.settings, 'normalScale').min(-1).max(1).onChange((value) => {
    //   this.objects.planeMaterial.normalScale.set(1, -1).multiplyScalar(value);
    // });


    this.stats = new Stats();
    this.stats.setMode(0);

    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.left = '0px';
    this.stats.domElement.style.top = '0px';

    document.body.appendChild(this.stats.domElement);
  }

  addLight() {
    // const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    // this.scene.add(ambientLight);

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

    // const geometry = new THREE.BufferGeometry();
    const geometry = new THREE.SphereBufferGeometry(10, 50, 50);
    // const planeMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide, wireframe: true});

    const shaderMaterial = new THREE.ShaderMaterial({

      // uniforms: {
      //   delta: { value: 0 }
      // },
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib['lights'],
        {
          diffuse: { type: 'c', value: new THREE.Color(0xff00ff) },
          delta: { value: 0 },
          displacementX: { type: 'f', value: 0 },
          displacementY: { type: 'f', value: 0 },
        }
      ]),
      wireframe: true,
      // lights: true,

      vertexShader: `
        attribute float vertexDisplacement;
        uniform float delta;
        uniform float displacementX;
        uniform float displacementY;
        varying float vOpacity;
        varying vec3 vUv;

        void main() 
        {
            vUv = position;
            vOpacity = vertexDisplacement;

            vec3 p = position;

            p.x += sin(vertexDisplacement) * displacementX;
            p.y += cos(vertexDisplacement) * displacementY;

            p.x = p.x - displacementX / 2.0;
            p.y = p.y - displacementY;

          vec4 modelViewPosition = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * modelViewPosition;
        }
      `,

      fragmentShader: `
        uniform float delta;
        varying float vOpacity;
        varying vec3 vUv;

        void main() {

            float r = 1.0 + cos(vUv.x * delta);
            float g = 0.5 + sin(delta) * 0.5;
            float b = 0.0;
            // vec3 rgb = vec3(r, g, b);
            vec3 rgb = vec3(0.0, 0.5, 1.0);

          gl_FragColor = vec4(rgb, vOpacity);
        }
      `

    });

    const vertexDisplacement = new Float32Array(geometry.attributes.position.count);
    for (let i = 0; i < vertexDisplacement.length; i++) {
      vertexDisplacement[i] = Math.sin(i);
    }
    geometry.addAttribute('vertexDisplacement', new THREE.BufferAttribute(vertexDisplacement, 1));

    this.objects.planeMaterial = shaderMaterial;
    this.objects.plane = new THREE.Mesh(geometry, this.objects.planeMaterial);
    this.scene.add(this.objects.plane);

    this.addGui();
    this.addLight();
    this.settingCamera();

    let delta = 0;

    const animate = () => {
      requestAnimationFrame(animate);
      this.stats.begin();
      // stats start

      delta += 0.1;
      this.objects.plane.material.uniforms.delta.value = 0.5 + Math.sin(delta) * 0.5;
      for (let i = 0; i < vertexDisplacement.length; i++) {
        vertexDisplacement[i] = 0.5 + Math.sin(i + delta) * 0.25;
      }
      this.objects.plane.geometry.attributes.vertexDisplacement.needsUpdate = true;

      // stats end
      this.stats.end();
      this.renderer.render( this.scene, this.camera );
    };
    animate();

  }

}

new Scene().init();
