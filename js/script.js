import * as THREE from 'https://esm.sh/three@0.154.0';
import { EffectComposer } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'https://esm.sh/three@0.154.0/examples/jsm/shaders/FXAAShader.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');
    let scene, camera, renderer, composer;
    let particles = [];
    let shapes = [];
    let sceneGroup;
    const clock = new THREE.Clock();
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    // Utility function to create a text texture with dynamic styling
    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = isMobile ? 256 : 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);

        // Dynamic font size based on device
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Dynamic fill and shadow colors for vibrant effects
        ctx.fillStyle = isMobile ? '#00FFD1' : 'rgba(255, 255, 255, 0.6)';
        ctx.shadowColor = isMobile ? '#FF00FF' : 'rgba(255, 255, 255, 0.3)';
        ctx.shadowBlur = isMobile ? 20 : 30;

        ctx.fillText(char, size / 2, size / 2);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture.encoding = THREE.sRGBEncoding;
        return texture;
    }

    // Function to generate random Hangeul or Cyrillic characters
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

    // Initialization function to set up the scene
    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.physicallyCorrectLights = true;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 1000 : 1500;

        // Ambient Light for general illumination
        const ambientLight = new THREE.AmbientLight(isMobile ? 0x00FFD1 : 0xffffff, isMobile ? 2 : 0.5);
        scene.add(ambientLight);

        // Directional Light for shadows and depth
        const directionalLight = new THREE.DirectionalLight(isMobile ? 0xFF00FF : 0xffffff, isMobile ? 1 : 1.0);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);

        // Additional Point Lights for dynamic lighting effects
        const pointLight1 = new THREE.PointLight(0xff00ff, 1, 1000);
        pointLight1.position.set(-1000, 500, 1000);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x00ffff, 1, 1000);
        pointLight2.position.set(1000, -500, -1000);
        scene.add(pointLight2);

        // Group to hold all scene objects for collective transformations
        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        // Create Particle System
        createParticles();

        // Create Geometric Shapes
        createShapes();

        // Setup Post-Processing Composer
        setupPostProcessing();

        // Event Listeners for Interactivity
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);

        animate();
    }

    // Function to create particles with text textures
    function createParticles() {
        const particleCount = isMobile ? 800 : 1200;
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
                emissiveIntensity: 0.5,
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.x = (Math.random() - 0.5) * (isMobile ? 5000 : 4000);
            sprite.position.y = (Math.random() - 0.5) * (isMobile ? 5000 : 4000);
            sprite.position.z = (Math.random() - 0.5) * (isMobile ? 5000 : 4000);
            sprite.scale.set(isMobile ? 150 : 120, isMobile ? 150 : 120, 1);
            sprite.speedX = (Math.random() - 0.5) * (isMobile ? 2 : 2);
            sprite.speedY = (Math.random() - 0.5) * (isMobile ? 2 : 2);
            sprite.speedZ = (Math.random() - 0.5) * (isMobile ? 2 : 2);
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.02;
            sceneGroup.add(sprite);
            particles.push(sprite);
        }
    }

    // Function to create rotating geometric shapes
    function createShapes() {
        const geometryTypes = [THREE.TetrahedronGeometry, THREE.OctahedronGeometry, THREE.IcosahedronGeometry, THREE.DodecahedronGeometry];
        const shapeCount = isMobile ? 80 : 100;
        for (let i = 0; i < shapeCount; i++) {
            const GeometryClass = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            const geometry = new GeometryClass(isMobile ? 80 : 60, isMobile ? 1 : 2);

            // Randomly choose between physical and standard materials for diversity
            let material;
            if (Math.random() < 0.5) {
                material = new THREE.MeshPhysicalMaterial({
                    color: new THREE.Color(`hsl(${Math.random() * 360}, 100%, 70%)`),
                    metalness: 0,
                    roughness: 0,
                    transmission: 1.0,
                    transparent: true,
                    opacity: 0.85,
                    reflectivity: 0.9,
                    ior: 1.5,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.05,
                    emissive: new THREE.Color(0xffffff),
                    emissiveIntensity: 0.2,
                });
            } else {
                material = new THREE.MeshStandardMaterial({
                    color: 0x00FFD1,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.4,
                    emissive: 0xFF00FF,
                    emissiveIntensity: 0.5
                });
            }

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = (Math.random() - 0.5) * (isMobile ? 5000 : 4000);
            mesh.position.y = (Math.random() - 0.5) * (isMobile ? 5000 : 4000);
            mesh.position.z = (Math.random() - 0.5) * (isMobile ? 5000 : 4000);
            mesh.rotationSpeedX = (Math.random() - 0.5) * (isMobile ? 0.02 : 0.01);
            mesh.rotationSpeedY = (Math.random() - 0.5) * (isMobile ? 0.02 : 0.01);
            mesh.rotationSpeedZ = (Math.random() - 0.5) * (isMobile ? 0.02 : 0.01);
            sceneGroup.add(mesh);
            shapes.push(mesh);
        }
    }

    // Function to set up post-processing effects
    function setupPostProcessing() {
        composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,
            0.4,
            0.85
        );
        bloomPass.threshold = 0.1;
        bloomPass.strength = isMobile ? 1.0 : 1.5; // Adjust bloom strength based on device
        bloomPass.radius = 0.4;
        composer.addPass(bloomPass);

        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        composer.addPass(fxaaPass);
    }

    // Event handler for mouse movement
    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    }

    // Event handler for touch movement
    function onDocumentTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX) / windowHalfX;
            mouseY = (event.touches[0].pageY - windowHalfY) / windowHalfY;
        }
    }

    // Event handler for window resize
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

    // Animation loop to render the scene
    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        // Update particle positions and rotations
        particles.forEach(p => {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;
            p.material.rotation += p.rotationSpeed;

            // Boundary conditions to reverse direction
            const boundary = isMobile ? 2500 : 2000;
            if (p.position.x > boundary || p.position.x < -boundary) p.speedX *= -1;
            if (p.position.y > boundary || p.position.y < -boundary) p.speedY *= -1;
            if (p.position.z > boundary || p.position.z < -boundary) p.speedZ *= -1;
        });

        // Update shape rotations
        shapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
        });

        // Apply gentle rotation to the entire scene group
        sceneGroup.rotation.y += isMobile ? 0.0015 : 0.0025;
        sceneGroup.rotation.x += isMobile ? 0.001 : 0.002;

        // Smoothly interpolate scene rotation based on mouse/touch input
        const targetRotationY = mouseX * (isMobile ? 0.02 : 0.05);
        const targetRotationX = mouseY * (isMobile ? 0.02 : 0.05);
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;

        // Subtle camera rotation for added depth
        camera.rotation.x += (mouseY * 0.01 - camera.rotation.x) * 0.05;
        camera.rotation.y += (mouseX * 0.01 - camera.rotation.y) * 0.05;

        // Render the scene with post-processing
        composer.render(delta);
    }

    // Initialize the scene
    init();

    // Handle preloader display
    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1000);
    };

    // Handle form submission for login
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

    // Handle Enter key for form submission
    form.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});
