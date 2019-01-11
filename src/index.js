// import _ from 'lodash';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import Stats from 'stats-js';

THREE.FresnelShader = {

  uniforms: {

    'mRefractionRatio': { type: 'f', value: 1.02 },
    'mFresnelBias': { type: 'f', value: 0.1 },
    'mFresnelPower': { type: 'f', value: 2.0 },
    'mFresnelScale': { type: 'f', value: 1.0 },
    'tCube': { type: 't', value: null }

  },

  vertexShader: [

    'uniform float mRefractionRatio;',
    'uniform float mFresnelBias;',
    'uniform float mFresnelScale;',
    'uniform float mFresnelPower;',

    'varying vec3 vReflect;',
    'varying vec3 vRefract[3];',
    'varying float vReflectionFactor;',

    'void main() {',

    'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
    'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',

    'vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );',

    'vec3 I = worldPosition.xyz - cameraPosition;',

    'vReflect = reflect( I, worldNormal );',
    'vRefract[0] = refract( normalize( I ), worldNormal, mRefractionRatio );',
    'vRefract[1] = refract( normalize( I ), worldNormal, mRefractionRatio * 0.99 );',
    'vRefract[2] = refract( normalize( I ), worldNormal, mRefractionRatio * 0.98 );',
    'vReflectionFactor = mFresnelBias + mFresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), mFresnelPower );',

    'gl_Position = projectionMatrix * mvPosition;',

    '}'

  ].join('\n'),

  fragmentShader: [

    'uniform samplerCube tCube;',

    'varying vec3 vReflect;',
    'varying vec3 vRefract[3];',
    'varying float vReflectionFactor;',

    'void main() {',

    'vec4 reflectedColor = textureCube( tCube, vec3( -vReflect.x, vReflect.yz ) );',
    'vec4 refractedColor = vec4( 1.0 );',

    'refractedColor.r = textureCube( tCube, vec3( -vRefract[0].x, vRefract[0].yz ) ).r;',
    'refractedColor.g = textureCube( tCube, vec3( -vRefract[1].x, vRefract[1].yz ) ).g;',
    'refractedColor.b = textureCube( tCube, vec3( -vRefract[2].x, vRefract[2].yz ) ).b;',

    'gl_FragColor = mix( refractedColor, reflectedColor, clamp( vReflectionFactor, 0.0, 1.0 ) );',

    '}'

  ].join('\n')

};

class Scene {

  constructor() {

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 20000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;

    this.stats = null;
    this.objects = {};
    this.initialized = false;
  }

  addGui() { // настройки GUI
    // const gui = new dat.GUI();

    // gui.add(this.camera.position, 'x', -10, 10).listen();
    // gui.add(this.camera.position, 'y', -10, 10).listen();
    // gui.add(this.camera.position, 'z', -10, 10).listen();

    // gui.add(this.settings, 'displacementX').min(-100).max(100).onChange((value) => {
    //   this.objects.mainObject.material.uniforms.displacementX.value = value;
    // });
    // gui.add(this.settings, 'displacementY').min(-100).max(100).onChange((value) => {
    //   this.objects.mainObject.material.uniforms.displacementY.value = value;
    // });

    this.stats = new Stats();
    this.stats.setMode(0);

    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.bottom = '0px';
    this.stats.domElement.style.right = '0px';
    this.stats.domElement.style.zIndex = '100';

    document.body.appendChild(this.stats.domElement);
  }

  settingCamera() {
    const OrbitControls = require('three-orbit-controls')(THREE);
    const controls = new OrbitControls(this.camera);
    this.camera.position.set(0, 150, 400);
    this.camera.lookAt(this.scene.position);
    controls.update();
  }

  addLight() {
    const light = new THREE.PointLight(0xffffff);
    light.position.set(0, 250, 0);
    this.scene.add(light);
  }

  createMapMaterial() {
    const imageCanvas = document.createElement('canvas'),
      context = imageCanvas.getContext('2d');

    imageCanvas.width = imageCanvas.height = 128;
    context.fillStyle = '#ccc';
    context.fillRect(0, 0, 128, 128);

    context.fillStyle = '#fff';
    context.fillRect(0, 0, 64, 64);
    context.fillRect(64, 64, 64, 64);

    const textureCanvas = new THREE.CanvasTexture(imageCanvas);
    textureCanvas.repeat.set(500, 500);
    textureCanvas.wrapS = THREE.RepeatWrapping;
    textureCanvas.wrapT = THREE.RepeatWrapping;
    textureCanvas.magFilter = THREE.NearestFilter;
    textureCanvas.minFilter = THREE.NearestFilter;

    return textureCanvas;
  }

  settingScene() { // настройки сцены
    const devicePixelRatio = window.devicePixelRatio || 1; // for retina

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);
    this.renderer.domElement.style = 'width: 100%; height: 100%;';
  }

  createBubble() {
    this.refractSphereCamera = new THREE.CubeCamera(0.1, 5000, 512);
    this.scene.add(this.refractSphereCamera);

    const fShader = THREE.FresnelShader;
    const fresnelUniforms = {
      'mRefractionRatio': { type: 'f', value: 1.02 },
      'mFresnelBias': { type: 'f', value: 0.1 },
      'mFresnelPower': { type: 'f', value: 2.0 },
      'mFresnelScale': { type: 'f', value: 1.0 },
      'tCube': { type: 't', value: this.refractSphereCamera.renderTarget } //  textureCube }
    };

    // create custom material for the shader
    const customMaterial = new THREE.ShaderMaterial({
      uniforms: fresnelUniforms,
      vertexShader: fShader.vertexShader,
      fragmentShader: fShader.fragmentShader
    });

    const sphereGeometry = new THREE.SphereGeometry(100, 64, 32);
    this.sphere = new THREE.Mesh(sphereGeometry, customMaterial);
    this.sphere.position.set(0, 50, 100);
    this.scene.add(this.sphere);

    this.refractSphereCamera.position.copy(this.sphere.position);
  }

  init() {

    this.settingScene();
    this.addGui(); // добавляем Gui
    this.settingCamera(); // настраиваем камеру (только для dev)
    this.addLight();
    this.createBubble();

    const floorMaterial = new THREE.MeshBasicMaterial({ map: this.createMapMaterial(), side: THREE.DoubleSide });
    const floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    this.objects.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.objects.floor.position.y = -50.5;
    this.objects.floor.rotation.x = Math.PI / 2;
    this.scene.add(this.objects.floor);

    const animate = () => {
      requestAnimationFrame(animate);
      this.stats.begin();

      this.refractSphereCamera.updateCubeMap(this.renderer, this.scene);

      this.stats.end();
      this.renderer.render(this.scene, this.camera);

    };
    animate();

    this.initialized = true;

  }

}

new Scene().init();
