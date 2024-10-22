// Importing necessary modules from ESM.sh
import * as THREE from 'https://esm.sh/three@0.154.0';
import { EffectComposer } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'https://esm.sh/three@0.154.0/examples/jsm/shaders/FXAAShader.js';
import { SSAOPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/SSAOPass.js';
import { BokehPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/BokehPass.js?bundle';
import { GUI } from 'https://cdn.jsdelivr.net/npm/lil-gui@0.17/+esm'; // Switched to lil-gui

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');
    let scene, camera, renderer, composer;
    let particlesGroup, shapesGroup;
    const clock = new THREE.Clock();
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    const gui = new GUI({ width: 300 });

    // Configuration based on device
    const CONFIG = {
        PARTICLE_COUNT: isMobile ? 1000 : 2000,
        SHAPE_COUNT: isMobile ? 100 : 200,
        PARTICLE_SIZE: isMobile ? 300 : 200,
        SHAPE_SIZE: isMobile ? 80 : 60,
        BLOOM_STRENGTH: isMobile ? 1.0 : 2.0,
        BLOOM_RADIUS: 0.5,
        BLOOM_THRESHOLD: 0.1,
        SSAO_KERNEL_RADIUS: 16,
        SSAO_MIN_DISTANCE: 0.005,
        SSAO_MAX_DISTANCE: 0.1,
        BOKEH_FOCUS: 1000,
        BOKEH_APERTURE: 0.00002,
        BOKEH_MAXBLUR: 0.01,
        CAMERA_POSITION_Z: isMobile ? 1000 : 2000,
        GROUP_ROTATION_SPEED_Y: isMobile ? 0.0015 : 0.0025,
        GROUP_ROTATION_SPEED_X: isMobile ? 0.001 : 0.002,
    };

    // Initialize the scene
    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: !isMobile, // Disable antialiasing on mobile for performance
            alpha: true,
            powerPreference: 'high-performance',
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace; // Updated property
        renderer.useLegacyLights = true; // Updated property
        renderer.physicallyCorrectLights = false; // Explicitly set to false
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            1,
            20000
        );
        camera.position.z = CONFIG.CAMERA_POSITION_Z;

        // Lighting
        const ambientLight = new THREE.AmbientLight(isMobile ? 0x00ffd1 : 0xffffff, isMobile ? 1.5 : 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(isMobile ? 0xff00ff : 0xffffff, isMobile ? 2 : 1.0);
        directionalLight.position.set(1, 1, 1).normalize();
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        const pointLight1 = new THREE.PointLight(0xff00ff, 1.5, 1500);
        pointLight1.position.set(-2000, 1000, 2000);
        pointLight1.castShadow = true;
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x00ffff, 1.5, 1500);
        pointLight2.position.set(2000, -1000, -2000);
        pointLight2.castShadow = true;
        scene.add(pointLight2);

        // Groups for better performance
        particlesGroup = new THREE.Group();
        shapesGroup = new THREE.Group();
        scene.add(particlesGroup, shapesGroup);

        // Create Objects
        createParticles();
        createShapes();

        // Post-processing
        setupPostProcessing();

        // GUI Controls
        setupGUI();

        // Event Listeners
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', debounce(onWindowResize, 300), false);

        // Start Animation
        animate();
    }

    // Debounce function to limit the rate at which a function can fire.
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Create Textures Efficiently
    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = isMobile ? 512 : 1024;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Optimize text rendering
        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isMobile ? '#00FFD1' : 'rgba(255, 255, 255, 0.8)';
        ctx.shadowColor = isMobile ? '#FF00FF' : 'rgba(255, 255, 255, 0.4)';
        ctx.shadowBlur = isMobile ? 40 : 50;
        ctx.fillText(char, size / 2, size / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        return texture;
    }

    // Generate a Random Character (Hangeul or Cyrillic)
    function getRandomCharacter() {
        const hangeulInitials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112];
        const hangeulMedials = [0x1161, 0x1165, 0x1166, 0x1167, 0x1169, 0x116E, 0x1172, 0x1173, 0x1175];
        const hangeulFinals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA];
        const cyrillicLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Э', 'Ю', 'Я'];
        const isHangeul = Math.random() < 0.5;
        if (isHangeul) {
            const initial = hangeulInitials[Math.floor(Math.random() * hangeulInitials.length)];
            const medial = hangeulMedials[Math.floor(Math.random() * hangeulMedials.length)];
            const final = hangeulFinals[Math.floor(Math.random() * hangeulFinals.length)];
            const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
            return String.fromCharCode(syllableCode);
        } else {
            return cyrillicLetters[Math.floor(Math.random() * cyrillicLetters.length)];
        }
    }

    // Create Particles using Sprites
    function createParticles() {
        const particleCount = CONFIG.PARTICLE_COUNT;
        for (let i = 0; i < particleCount; i++) {
            const char = getRandomCharacter();
            const texture = createTextTexture(char);
            const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthTest: true,
                depthWrite: false,
                emissive: new THREE.Color(0xffffff),
                emissiveIntensity: 0.8,
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(
                (Math.random() - 0.5) * (isMobile ? 8000 : 6000),
                (Math.random() - 0.5) * (isMobile ? 8000 : 6000),
                (Math.random() - 0.5) * (isMobile ? 8000 : 6000)
            );
            sprite.scale.set(CONFIG.PARTICLE_SIZE, CONFIG.PARTICLE_SIZE, 1);
            sprite.userData = {
                speedX: (Math.random() - 0.5) * (isMobile ? 3 : 4),
                speedY: (Math.random() - 0.5) * (isMobile ? 3 : 4),
                speedZ: (Math.random() - 0.5) * (isMobile ? 3 : 4),
                rotationSpeed: (Math.random() - 0.5) * 0.05,
            };
            particlesGroup.add(sprite);
        }
    }

    // Create Shapes using Meshes
    function createShapes() {
        const shapeCount = CONFIG.SHAPE_COUNT;
        const geometryTypes = [
            THREE.TetrahedronGeometry,
            THREE.OctahedronGeometry,
            THREE.IcosahedronGeometry,
            THREE.DodecahedronGeometry,
            THREE.BoxGeometry,
            THREE.SphereGeometry
        ];

        for (let i = 0; i < shapeCount; i++) {
            const GeometryClass = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            const geometry = new GeometryClass(CONFIG.SHAPE_SIZE, isMobile ? 1 : 2);
            const material = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(`hsl(${Math.random() * 360}, 60%, 50%)`),
                metalness: 0.3,
                roughness: 0.2,
                transmission: 0.9,
                transparent: true,
                opacity: 0.7,
                reflectivity: 1.0,
                ior: 1.5,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1,
                emissive: new THREE.Color(0x000000),
                emissiveIntensity: 0.1,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * (isMobile ? 8000 : 6000),
                (Math.random() - 0.5) * (isMobile ? 8000 : 6000),
                (Math.random() - 0.5) * (isMobile ? 8000 : 6000)
            );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = {
                rotationSpeedX: (Math.random() - 0.5) * 0.01,
                rotationSpeedY: (Math.random() - 0.5) * 0.01,
                rotationSpeedZ: (Math.random() - 0.5) * 0.01,
            };
            shapesGroup.add(mesh);
        }
    }

    // Setup Post-Processing Effects
    function setupPostProcessing() {
        composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        // Unreal Bloom Pass
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            CONFIG.BLOOM_STRENGTH,
            CONFIG.BLOOM_RADIUS,
            CONFIG.BLOOM_THRESHOLD
        );
        composer.addPass(bloomPass);

        // SSAO Pass (conditionally add based on device)
        if (!isMobile) { // SSAO can be intensive
            const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
            ssaoPass.kernelRadius = CONFIG.SSAO_KERNEL_RADIUS;
            ssaoPass.minDistance = CONFIG.SSAO_MIN_DISTANCE;
            ssaoPass.maxDistance = CONFIG.SSAO_MAX_DISTANCE;
            composer.addPass(ssaoPass);
        }

        // Bokeh Pass
        const bokehPass = new BokehPass(scene, camera, {
            focus: CONFIG.BOKEH_FOCUS,
            aperture: CONFIG.BOKEH_APERTURE,
            maxblur: CONFIG.BOKEH_MAXBLUR
        });
        composer.addPass(bokehPass);

        // FXAA Pass
        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        composer.addPass(fxaaPass);
    }

    // Setup GUI Controls using lil-gui
    function setupGUI() {
        gui.close(); // Hide GUI by default to avoid performance hit in production

        const bloomFolder = gui.addFolder('Bloom');
        bloomFolder.add(composer.passes[1], 'strength', 0.0, 3.0).name('Strength');
        bloomFolder.add(composer.passes[1], 'radius', 0.0, 1.0).name('Radius');
        bloomFolder.add(composer.passes[1], 'threshold', 0.0, 1.0).name('Threshold');
        bloomFolder.open();

        if (!isMobile) { // Only add SSAO controls if SSAO is enabled
            const ssaoPass = composer.passes.find(pass => pass instanceof SSAOPass);
            if (ssaoPass) {
                const ssaoFolder = gui.addFolder('SSAO');
                ssaoFolder.add(ssaoPass, 'kernelRadius', 0, 32).name('Kernel Radius');
                ssaoFolder.add(ssaoPass, 'minDistance', 0.001, 0.02).name('Min Distance');
                ssaoFolder.add(ssaoPass, 'maxDistance', 0.01, 0.2).name('Max Distance');
                ssaoFolder.open();
            }
        }

        const bokehFolder = gui.addFolder('Bokeh');
        bokehFolder.add(bokehPass.uniforms.focus, 'value', 500, 3000).name('Focus Distance');
        bokehFolder.add(bokehPass.uniforms.aperture, 'value', 0.00001, 0.001).name('Aperture');
        bokehFolder.add(bokehPass.uniforms.maxblur, 'value', 0.0, 0.1).name('Max Blur');
        bokehFolder.open();

        const fxaaFolder = gui.addFolder('FXAA');
        fxaaFolder.add(fxaaPass.uniforms.resolution.value, 'x').min(0).max(1).step(0.0001).name('Resolution X');
        fxaaFolder.add(fxaaPass.uniforms.resolution.value, 'y').min(0).max(1).step(0.0001).name('Resolution Y');
        fxaaFolder.open();
    }

    // Handle Mouse Movement
    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    }

    // Handle Touch Movement
    function onDocumentTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX) / windowHalfX;
            mouseY = (event.touches[0].pageY - windowHalfY) / windowHalfY;
        }
    }

    // Handle Window Resize with Debounce
    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);

        // Update FXAA resolution
        const fxaaPass = composer.passes.find(pass => pass instanceof ShaderPass && pass.uniforms['resolution']);
        if (fxaaPass) {
            fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        }
    }

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();

        // Update Particles
        particlesGroup.children.forEach(p => {
            p.position.x += p.userData.speedX * delta * 60;
            p.position.y += p.userData.speedY * delta * 60;
            p.position.z += p.userData.speedZ * delta * 60;
            p.material.rotation += p.userData.rotationSpeed * delta * 60;

            const boundary = isMobile ? 4000 : 3000;
            if (p.position.x > boundary || p.position.x < -boundary) p.userData.speedX *= -1;
            if (p.position.y > boundary || p.position.y < -boundary) p.userData.speedY *= -1;
            if (p.position.z > boundary || p.position.z < -boundary) p.userData.speedZ *= -1;
        });

        // Update Shapes
        shapesGroup.children.forEach(s => {
            s.rotation.x += s.userData.rotationSpeedX * delta * 60;
            s.rotation.y += s.userData.rotationSpeedY * delta * 60;
            s.rotation.z += s.userData.rotationSpeedZ * delta * 60;
        });

        // Group Rotation based on mouse movement
        sceneGroup.rotation.y += CONFIG.GROUP_ROTATION_SPEED_Y;
        sceneGroup.rotation.x += CONFIG.GROUP_ROTATION_SPEED_X;

        const targetRotationY = mouseX * (isMobile ? 0.02 : 0.05);
        const targetRotationX = mouseY * (isMobile ? 0.02 : 0.05);
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;

        // Camera Rotation for subtle effect
        camera.rotation.x += (mouseY * 0.01 - camera.rotation.x) * 0.05;
        camera.rotation.y += (mouseX * 0.01 - camera.rotation.y) * 0.05;

        // Render the scene with post-processing
        composer.render(delta);
    }

    // Initialize the application
    init();

    // Hide preloader after assets are loaded
    window.onload = () => {
        setTimeout(() => {
            preloader.style.opacity = '0';
            preloader.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 1000);
    };

    // Handle Form Submission
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = form.username.value.trim();
        const domainSelect = form.querySelector('select[name="domain"]');
        const domain = domainSelect.value;
        if (username && domain) {
            const email = `${username}${domain}`;
            const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/`;
            window.location.href = loginUrl;
        } else {
            alert('Please enter your username and select a domain.');
        }
    });

    // Handle Enter Key Press in Form
    form.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});
