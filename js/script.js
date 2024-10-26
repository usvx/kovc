import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/shaders/FXAAShader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js';
import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.11.3/gsap.min.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    class SceneManager {
        constructor() {
            this.initScene();
            this.addLighting();
            this.populateScene();
            this.setupPostProcessing();
            this.setupControls();
            this.animate();
            window.addEventListener('resize', this.onWindowResize.bind(this));
        }

        initScene() {
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
            this.camera.position.z = isMobile ? 800 : 1200;
            
            // Renderer setup
            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            document.body.appendChild(this.renderer.domElement);

            this.sceneGroup = new THREE.Group();
            this.scene.add(this.sceneGroup);
            this.particles = [];
            this.shapes = [];
        }

        addLighting() {
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            this.scene.add(ambientLight);

            // Moving spotlight for dynamic lighting
            this.spotlight = new THREE.SpotLight(0xffa95c, 1.5);
            this.spotlight.position.set(-500, 500, 500);
            this.spotlight.castShadow = true;
            this.spotlight.angle = 0.3;
            this.spotlight.penumbra = 0.5;
            this.scene.add(this.spotlight);

            // Animate spotlight for dynamic effect
            gsap.to(this.spotlight.position, {
                x: 500,
                y: 300,
                z: -500,
                duration: 6,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true
            });
        }

        populateScene() {
            const geometry = new THREE.SphereGeometry(isMobile ? 100 : 140, 64, 64);
            const shapeCount = isMobile ? 30 : 60;

            for (let i = 0; i < shapeCount; i++) this.addShape(geometry);
            for (let i = 0; i < (isMobile ? 200 : 400); i++) this.addParticle();
        }

        addShape(geometry) {
            const hue = Math.random() * 360;
            const material = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(`hsl(${hue}, 100%, 80%)`),
                emissive: new THREE.Color(`hsl(${(hue + 180) % 360}, 100%, 50%)`),
                emissiveIntensity: 1.2,
                metalness: 0.7,
                roughness: 0.1,
                transmission: 0.8,
                opacity: 0.8,
                transparent: true,
                clearcoat: 1,
                clearcoatRoughness: 0.1,
                reflectivity: 0.9,
                ior: 1.3
            });

            const mesh = new THREE.Mesh(geometry, material);
            this.resetPosition(mesh);
            this.shapes.push(mesh);
            this.sceneGroup.add(mesh);
        }

        addParticle() {
            const char = Math.random() < 0.7 ? this.getRandomHangulCharacter() : this.getRandomCyrillicCharacter();
            const texture = this.createTextTexture(char);
            const particleGeometry = new THREE.PlaneGeometry(isMobile ? 50 : 100, isMobile ? 50 : 100);

            const material = new THREE.MeshStandardMaterial({
                map: texture,
                color: 0xffffff,
                emissive: new THREE.Color(`hsl(${Math.random() * 360}, 100%, 60%)`),
                emissiveIntensity: 1.5,
                transparent: true
            });

            const mesh = new THREE.Mesh(particleGeometry, material);
            this.resetPosition(mesh);
            this.particles.push(mesh);
            this.sceneGroup.add(mesh);
        }

        createTextTexture(char) {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = isMobile ? 256 : 512;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = `${canvas.width * 0.6}px 'Urbanist', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 70%)`;
            ctx.fillText(char, canvas.width / 2, canvas.height / 2);
            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        }

        getRandomHangulCharacter() {
            const initials = [0x1100, 0x1102, 0x1103, 0x1105];
            const medials = [0x1161, 0x1163, 0x1165];
            const finals = [0x0000, 0x11A8, 0x11AB];

            const syllableCode = 0xAC00 +
                ((initials[Math.floor(Math.random() * initials.length)] - 0x1100) * 588) +
                ((medials[Math.floor(Math.random() * medials.length)] - 0x1161) * 28) +
                (finals[Math.floor(Math.random() * finals.length)] ? (finals[Math.floor(Math.random() * finals.length)] - 0x11A7) : 0);

            return String.fromCharCode(syllableCode);
        }

        getRandomCyrillicCharacter() {
            const start = 0x0410, end = 0x042F;
            return String.fromCharCode(Math.floor(Math.random() * (end - start + 1)) + start);
        }

        setupPostProcessing() {
            const renderPass = new RenderPass(this.scene, this.camera);
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
            bloomPass.threshold = 0.21;
            bloomPass.strength = 0.55;
            bloomPass.radius = 0.5;

            const fxaaPass = new ShaderPass(FXAAShader);
            fxaaPass.material.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);

            this.composer = new EffectComposer(this.renderer);
            this.composer.addPass(renderPass);
            this.composer.addPass(bloomPass);
            this.composer.addPass(fxaaPass);
        }

        setupControls() {
            const controls = new OrbitControls(this.camera, this.renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.1;
            controls.maxDistance = 1500;
            controls.minDistance = 300;
            controls.enablePan = false;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.3;
        }

        resetPosition(object) {
            object.position.set((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000);
            object.userData = { amplitude: Math.random() * 20 + 10, speed: Math.random() * 0.02 + 0.005, offset: Math.random() * Math.PI * 2 };
        }

        animate() {
            requestAnimationFrame(() => this.animate());

            const time = Date.now() * 0.0005;
            this.sceneGroup.rotation.y = Math.sin(time * 0.5) * 0.1;

            this.particles.forEach(p => this.updateObject(p, time));
            this.shapes.forEach(s => this.updateObject(s, time));
            this.composer.render();
        }

        updateObject(object, time) {
            object.position.x += Math.sin(time * object.userData.speed + object.userData.offset) * object.userData.amplitude * 0.1;
            object.position.y += Math.cos(time * object.userData.speed + object.userData.offset) * object.userData.amplitude * 0.1;
            object.lookAt(this.camera.position);
            object.material.color.offsetHSL(0.0005, 0, 0);
        }

        onWindowResize() {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    new SceneManager();

    window.onload = () => setTimeout(() => { preloader.style.display = 'none'; }, 1500);
});
