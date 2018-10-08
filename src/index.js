// import _ from 'lodash';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import Stats from 'stats-js';
import { scapeArr } from './scape.js';
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
      scapeMaterial: null
    };

    this.initialized = false;

    console.log(scapeArr);

  }

  addGui() {
    const gui = new dat.GUI();

    // gui.add(this.camera.position, 'x', -10, 10).listen();
    // gui.add(this.camera.position, 'y', -10, 10).listen();
    // gui.add(this.camera.position, 'z', -10, 10).listen();

    gui.add(this.settings, 'displacementX').min(-100).max(100).onChange((value) => {
      this.objects.plane.material.uniforms.displacementX.value = value;
    });
    gui.add(this.settings, 'displacementY').min(-100).max(100).onChange((value) => {
      this.objects.plane.material.uniforms.displacementY.value = value;
    });
    // gui.add(this.settings, 'normalScale').min(-1).max(1).onChange((value) => {
    //   this.objects.scapeMaterial.normalScale.set(1, -1).multiplyScalar(value);
    // });


    this.stats = new Stats();
    this.stats.setMode(0);

    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.left = '0px';
    this.stats.domElement.style.top = '0px';

    document.body.appendChild(this.stats.domElement);
  }

  addLight() {
    const ambientLight = new THREE.AmbientLight(0x404040);
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
    this.camera.position.set(0, 13, 80);
    controls.update();
  }

  init() {

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( this.renderer.domElement );
    document.body.style = 'overflow: hidden; margin: 0; background: #000;';


    const scapeGeometry = new THREE.BufferGeometry();

    const positions = [];

    const scapeSize = 100;
    const interpolatePoints = 10;
    const interpolateFrac = 0.1;

    function interpolate(a, b, frac) {
      const n = a + (b - a) * frac;
      return n.toFixed(5);
    }

    for (let i = 0; i < scapeArr.length - 1; i++) {

      for (let j = 1; j < interpolatePoints; j++) {
        const pos = [
          interpolate(scapeArr[i][0], scapeArr[i + 1][0], j * interpolateFrac) / scapeSize,
          interpolate(scapeArr[i][2], scapeArr[i + 1][2], j * interpolateFrac) / scapeSize,
          interpolate(scapeArr[i][1], scapeArr[i + 1][1], j * interpolateFrac) / scapeSize,
        ];
        positions.push(...pos);
      }
      // positions.push(scapeArr[i][0] / scapeSize, scapeArr[i][2] / scapeSize, scapeArr[i][1] / scapeSize);




      // colors.push( ( scapeArr[i][0] / scapeR ) + 0.5 );
      // colors.push( ( scapeArr[i][2] / scapeR ) + 0.5 );
      // colors.push( ( scapeArr[i][1] / scapeR ) + 0.5 );
    }
    scapeGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
    // scapeGeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    scapeGeometry.computeBoundingSphere();




    const shaderMaterial = new THREE.ShaderMaterial({
      vertexColors: THREE.VertexColors,
      transparent: true,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib['lights'],
        {
          percent: { value: 0 },
          color1: { type: 'c', value: new THREE.Color(0x0B0991) },
          color2: { type: 'c', value: new THREE.Color(0x00FFEA) },
          delta: { value: 0 },
          displacementX: { type: 'f', value: 0 },
          displacementY: { type: 'f', value: 0 },
        }
      ]),
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
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec3 vUv;
        uniform float percent;
        uniform float delta;

        void main() {
          gl_FragColor = vec4(mix(color1, color2, cos(vUv * 0.10)), 1.0);
          if(percent > 0.0) {
            gl_FragColor.a = percent;
          }
        }
      `
    });

    const vertexDisplacement = new Float32Array(scapeGeometry.attributes.position.count);
    for (let i = 0; i < vertexDisplacement.length; i++) {
      vertexDisplacement[i] = Math.sin(i);
    }
    scapeGeometry.addAttribute('vertexDisplacement', new THREE.BufferAttribute(vertexDisplacement, 1));

    this.objects.scapeMaterial = shaderMaterial;
    this.objects.plane = new THREE.Line(scapeGeometry, this.objects.scapeMaterial);
    this.scene.add(this.objects.plane);
    // this.scene.add(this.objects.plane);

    this.addGui();
    this.addLight();
    this.settingCamera();

    let delta = 0;
    let percent = 1.0;

    const animate = () => {
      requestAnimationFrame(animate);
      this.stats.begin();
      // stats start

      delta += 0.1;
      percent += 1000.0;
      this.objects.plane.material.uniforms.delta.value = 0.5 + Math.sin(delta) * 0.5;
      this.objects.plane.material.uniforms.percent.value = percent;
      for (let i = 0; i < vertexDisplacement.length; i++) {
        vertexDisplacement[i] = 0.5 + Math.sin(i + delta) * 0.25;
      }
      this.objects.plane.geometry.attributes.vertexDisplacement.needsUpdate = true;
      this.objects.plane.geometry.attributes.position.needsUpdate = true;

      this.objects.plane.geometry.drawRange.count = percent;

      // stats end
      this.stats.end();
      this.renderer.render( this.scene, this.camera );
    };
    animate();

  }

}

new Scene().init();
