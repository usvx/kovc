// Import necessary modules from ESM.sh
import * as THREE from 'https://esm.sh/three@0.154.0';
import { EffectComposer } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'https://esm.sh/three@0.154.0/examples/jsm/shaders/FXAAShader.js';
import { GUI } from 'https://esm.sh/lil-gui@0.17';

document.addEventListener('DOMContentLoaded', () => {
  // Main variables
  let scene, camera, renderer, composer;
  let particlesGroup, shapesGroup, sceneGroup;
  const clock = new THREE.Clock();
  let mouseX = 0,
    mouseY = 0;
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;
  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
  const gui = new GUI({ width: 300 });

  // Configuration constants
  const CONFIG = {
    PARTICLE_COUNT: isMobile ? 500 : 1000, // Reduced particle count for performance
    SHAPE_COUNT: isMobile ? 50 : 100, // Reduced shape count for performance
    PARTICLE_SIZE: 150,
    SHAPE_SIZE: 40,
    BLOOM_STRENGTH: 0.8,
    BLOOM_RADIUS: 0.2,
    BLOOM_THRESHOLD: 0.2,
    CAMERA_POSITION_Z: isMobile ? 1000 : 1500,
    GROUP_ROTATION_SPEED_Y: 0.001,
    GROUP_ROTATION_SPEED_X: 0.0005,
  };

  // Initialization function
  function init() {
    setupRenderer();
    setupScene();
    setupCamera();
    setupLights();
    createGroups();
    createParticles();
    createShapes();
    setupPostProcessing();
    setupEventListeners();
    animate();
  }

  // Set up the renderer
  function setupRenderer() {
    const canvas = document.getElementById('background');
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  // Set up the scene
  function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
  }

  // Set up the camera
  function setupCamera() {
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      5000
    );
    camera.position.z = CONFIG.CAMERA_POSITION_Z;
  }

  // Set up lights
  function setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
  }

  // Create groups for particles and shapes
  function createGroups() {
    particlesGroup = new THREE.Group();
    shapesGroup = new THREE.Group();
    sceneGroup = new THREE.Group();

    sceneGroup.add(particlesGroup);
    sceneGroup.add(shapesGroup);
    scene.add(sceneGroup);
  }

  // Create particles (sprites with text textures)
  function createParticles() {
    const particleCount = CONFIG.PARTICLE_COUNT;
    for (let i = 0; i < particleCount; i++) {
      const char = getRandomCharacter();
      const texture = createTextTexture(char);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(
        (Math.random() - 0.5) * 4000,
        (Math.random() - 0.5) * 4000,
        (Math.random() - 0.5) * 4000
      );
      sprite.scale.set(CONFIG.PARTICLE_SIZE, CONFIG.PARTICLE_SIZE, 1);
      particlesGroup.add(sprite);
    }
  }

  // Create 3D shapes
  function createShapes() {
    const shapeCount = CONFIG.SHAPE_COUNT;
    const geometryTypes = [
      THREE.TetrahedronGeometry,
      THREE.OctahedronGeometry,
      THREE.IcosahedronGeometry,
    ];

    for (let i = 0; i < shapeCount; i++) {
      const GeometryClass =
        geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
      const geometry = new GeometryClass(CONFIG.SHAPE_SIZE, 0);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(`hsl(${Math.random() * 360}, 50%, 50%)`),
        metalness: 0.5,
        roughness: 0.5,
        transparent: true,
        opacity: 0.8,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 3000,
        (Math.random() - 0.5) * 3000,
        (Math.random() - 0.5) * 3000
      );
      shapesGroup.add(mesh);
    }
  }

  // Set up post-processing effects
  function setupPostProcessing() {
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      CONFIG.BLOOM_STRENGTH,
      CONFIG.BLOOM_RADIUS,
      CONFIG.BLOOM_THRESHOLD
    );
    composer.addPass(bloomPass);

    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms['resolution'].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    composer.addPass(fxaaPass);
  }

  // Event listeners for interaction and responsiveness
  function setupEventListeners() {
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
  }

  // Mouse move event handler
  function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / 100;
    mouseY = (event.clientY - windowHalfY) / 100;
  }

  // Window resize event handler
  function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  }

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Rotate the scene group
    sceneGroup.rotation.y += CONFIG.GROUP_ROTATION_SPEED_Y;
    sceneGroup.rotation.x += CONFIG.GROUP_ROTATION_SPEED_X;

    // Smooth camera movement based on mouse position
    camera.position.x += (mouseX * 10 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 10 - camera.position.y) * 0.05;

    // Render the scene using composer
    composer.render(delta);
  }

  // Generate a random character for particles
  function getRandomCharacter() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Create a text texture for a character
  function createTextTexture(char) {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.font = `${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(char, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  // Initialize the application
  init();
});
