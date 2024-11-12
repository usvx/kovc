import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer, sceneGroup, composer, bloomPass;
    const particles = [];
    const spheres = [];
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2;
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    const CONFIG = {
        PARTICLE_COUNT: isMobile ? 600 : 1000,
        SPHERE_COUNT: isMobile ? 30 : 60,
        MIN_DISTANCE: 400,
        PARTICLE_SIZE: isMobile ? 150 : 200,
        SPHERE_SIZE: isMobile ? 80 : 120,
        PARTICLE_SPEED: isMobile ? 1.5 : 2.5,
        ROTATION_SPEED: isMobile ? 0.003 : 0.005,
        TEXTURE_SIZE: isMobile ? 256 : 512,
        SHADOW_BLUR: isMobile ? 15 : 30,
        LIGHT_INTENSITY: isMobile ? 1.0 : 1.5,
        AMBIENT_COLOR: 0x1E90FF,
        DIRECTIONAL_COLOR: 0x9370DB,
        BACKGROUND_COLOR: 0x0A0A0A,
        PARTICLE_COLOR_1: 0x1E90FF,
        PARTICLE_COLOR_2: 0xBA55D3,
        SPHERE_COLOR: 0xBA55D3,
        EMISSIVE_COLOR: 0x9370DB,
        MAX_PIXEL_RATIO: isMobile ? Math.min(window.devicePixelRatio, 3) : Math.min(window.devicePixelRatio, 2),
        ENV_MAP_INTENSITY: 1.0,
        MIN_CAMERA_DISTANCE: 500,
        MAX_SPHERE_SIZE: isMobile ? 100 : 150,
        BLOOM_INTENSITY: 1.5,
        BLOOM_THRESHOLD: 0.85,
        BLOOM_RADIUS: 0.4,
    };

    const TEXTURE_CACHE_SIZE = 200;
    const textureCache = [];

    // Shader material for particles
    const particleShader = {
        vertexShader: `
            varying vec3 vColor;
            void main() {
                vColor = color;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                gl_PointSize = 10.0;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            void main() {
                float dist = distance(gl_PointCoord, vec2(0.5));
                if (dist > 0.5) discard;
                gl_FragColor = vec4(vColor, 1.0);
            }
        `,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
    };

    /**
     * Creates a high-resolution text texture for a given character.
     * @param {string} char - The character to create a texture for.
     * @returns {THREE.Texture} - The generated texture.
     */
    const createTextTexture = (char) => {
        if (textureCache.length >= TEXTURE_CACHE_SIZE) {
            return textureCache[Math.floor(Math.random() * TEXTURE_CACHE_SIZE)];
        }
        const canvas = document.createElement('canvas');
        const size = CONFIG.TEXTURE_SIZE * window.devicePixelRatio;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.clearRect(0, 0, CONFIG.TEXTURE_SIZE, CONFIG.TEXTURE_SIZE);
        const gradient = ctx.createLinearGradient(0, 0, CONFIG.TEXTURE_SIZE, CONFIG.TEXTURE_SIZE);
        gradient.addColorStop(0, '#1E90FF');
        gradient.addColorStop(1, '#BA55D3');
        ctx.font = `${CONFIG.TEXTURE_SIZE * 0.8}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#9370DB';
        ctx.shadowBlur = CONFIG.SHADOW_BLUR;
        ctx.globalAlpha = 0.9;
        ctx.fillText(char, CONFIG.TEXTURE_SIZE / 2, CONFIG.TEXTURE_SIZE / 2);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        textureCache.push(texture);
        return texture;
    };

    /**
     * Generates a random Hangul character.
     * @returns {string} - A random Hangul character.
     */
    const getRandomHangulCharacter = () => {
        const initials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112];
        const medials = [0x1161, 0x1163, 0x1165, 0x1167, 0x1169, 0x116D, 0x1162, 0x1164, 0x1166, 0x1168, 0x116A];
        const finals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA, 0x11C2];
        const initial = initials[Math.floor(Math.random() * initials.length)];
        const medial = medials[Math.floor(Math.random() * medials.length)];
        const final = finals[Math.floor(Math.random() * finals.length)];
        const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
        return String.fromCharCode(syllableCode);
    };

    /**
     * Generates a random Cyrillic character.
     * @returns {string} - A random Cyrillic character.
     */
    const getRandomCyrillicCharacter = () => {
        const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Э', 'Ю', 'Я'];
        return letters[Math.floor(Math.random() * letters.length)];
    };

    /**
     * Generates a random character, either Hangul or Cyrillic.
     * @returns {string} - A random character.
     */
    const getRandomCharacter = () => Math.random() < 0.5 ? getRandomHangulCharacter() : getRandomCyrillicCharacter();

    /**
     * Generates a random position in 3D space, ensuring it's not too close to existing spheres
     * and not too close to the camera to prevent covering the entire screen.
     * @param {Array} existingSpheres - Array of existing spheres to avoid.
     * @param {number} radius - The radius to maintain distance.
     * @returns {THREE.Vector3} - A random position vector.
     */
    const getRandomPosition = (existingSpheres, radius) => {
        const boundingRadius = 2000;
        const minDistanceFromCamera = CONFIG.MIN_CAMERA_DISTANCE + radius;
        let position, tooClose, attempts = 0;
        do {
            position = new THREE.Vector3(
                (Math.random() - 0.5) * 2 * boundingRadius,
                (Math.random() - 0.5) * 2 * boundingRadius,
                (Math.random() - 0.5) * 2 * boundingRadius
            );
            const distanceFromCamera = position.distanceTo(camera.position);
            if (distanceFromCamera < minDistanceFromCamera) {
                tooClose = true;
            } else {
                tooClose = existingSpheres.some(sphere => position.distanceTo(sphere.position) < CONFIG.MIN_DISTANCE + radius);
            }
            attempts++;
            if (attempts > 100) break;
        } while (tooClose);
        return position;
    };

    /**
     * Initializes the Three.js scene, camera, renderer, particles, and spheres.
     */
    const init = () => {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: !isMobile,
            alpha: true,
            powerPreference: isMobile ? 'low-power' : 'default'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(CONFIG.MAX_PIXEL_RATIO, 3));
        renderer.setClearColor(CONFIG.BACKGROUND_COLOR, 1);
        renderer.physicallyCorrectLights = true;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ReinhardToneMapping;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 1200 : 1800;

        // Ambient Light with pulsating intensity
        const ambientLight = new THREE.AmbientLight(CONFIG.AMBIENT_COLOR, CONFIG.LIGHT_INTENSITY);
        scene.add(ambientLight);

        // Directional Light with dynamic movement
        const directionalLight = new THREE.DirectionalLight(CONFIG.DIRECTIONAL_COLOR, CONFIG.LIGHT_INTENSITY);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);

        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        createParticles();
        createSpheres();

        // Bloom Effect Setup
        setupPostProcessing();

        renderer.sortObjects = true;

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);

        animate();
    };

    /**
     * Sets up post-processing for bloom effect.
     */
    const setupPostProcessing = () => {
        // Since we can only use THREE.js, we'll implement a simple bloom-like effect using the renderer's capabilities
        // Note: For advanced post-processing, additional modules are typically required
        // Here, we'll simulate a glow by adding a larger, semi-transparent sphere around each main sphere

        spheres.forEach(sphere => {
            const glowGeometry = new THREE.SphereGeometry(sphere.geometry.parameters.radius * 1.5, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: CONFIG.PARTICLE_COLOR_1,
                transparent: true,
                opacity: 0.1,
                blending: THREE.AdditiveBlending
            });
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            glowMesh.position.copy(sphere.position);
            sceneGroup.add(glowMesh);
            sphere.userData.glow = glowMesh;
        });
    };

    /**
     * Creates particles (sprites) with random characters and positions.
     */
    const createParticles = () => {
        const uniqueChars = 30;
        const characters = Array.from({ length: uniqueChars }, () => getRandomCharacter());
        characters.forEach(char => textureCache.push(createTextTexture(char)));

        // Create a buffer geometry for particles
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
            const char = characters[Math.floor(Math.random() * uniqueChars)];
            const texture = createTextTexture(char);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: 0.95
            }));
            sprite.position.set(
                (Math.random() - 0.5) * 5000,
                (Math.random() - 0.5) * 5000,
                (Math.random() - 0.5) * 5000
            );
            sprite.scale.set(CONFIG.PARTICLE_SIZE, CONFIG.PARTICLE_SIZE, 1);
            sprite.speedX = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.speedY = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.speedZ = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.02;
            sprite.renderOrder = 1;
            sceneGroup.add(sprite);
            particles.push(sprite);
        }
    };

    /**
     * Creates smooth, glassy spheres with refined material properties.
     */
    const createSpheres = () => {
        for (let i = 0; i < CONFIG.SPHERE_COUNT; i++) {
            const geometry = new THREE.SphereGeometry(CONFIG.SPHERE_SIZE, 64, 64);
            const material = new THREE.MeshPhysicalMaterial({
                color: CONFIG.SPHERE_COLOR,
                metalness: 0.0,
                roughness: 0.05,
                transmission: 1.0,
                transparent: true,
                opacity: 0.3,
                emissive: CONFIG.EMISSIVE_COLOR,
                emissiveIntensity: 0.5,
                side: THREE.DoubleSide,
                reflectivity: 0.9,
                clearcoat: 1.0,
                clearcoatRoughness: 0.05,
                ior: 1.5,
                depthWrite: false,
                alphaTest: 0.1
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.copy(getRandomPosition(spheres, CONFIG.SPHERE_SIZE));
            sphere.rotationSpeedX = (Math.random() - 0.5) * 0.02;
            sphere.rotationSpeedY = (Math.random() - 0.5) * 0.02;
            sphere.rotationSpeedZ = (Math.random() - 0.5) * 0.02;
            sphere.renderOrder = 0;
            sceneGroup.add(sphere);
            spheres.push(sphere);
        }
    };

    /**
     * Handles mouse movement to rotate the scene.
     * @param {MouseEvent} event 
     */
    const onDocumentMouseMove = (event) => {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    };

    /**
     * Handles touch movement to rotate the scene.
     * @param {TouchEvent} event 
     */
    const onDocumentTouchMove = (event) => {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX) / windowHalfX;
            mouseY = (event.touches[0].pageY - windowHalfY) / windowHalfY;
        }
    };

    /**
     * Handles window resize events to adjust camera and renderer.
     */
    const onWindowResize = () => {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    /**
     * The main animation loop. Updates positions and rotations of particles and spheres.
     */
    const animate = () => {
        requestAnimationFrame(animate);

        // Update particles
        particles.forEach(p => {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;
            p.material.rotation += p.rotationSpeed;
            if (Math.abs(p.position.x) > 2500) p.speedX *= -1;
            if (Math.abs(p.position.y) > 2500) p.speedY *= -1;
            if (Math.abs(p.position.z) > 2500) p.speedZ *= -1;
        });

        // Update spheres and their glow
        spheres.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;

            // Update glow
            if (s.userData.glow) {
                s.userData.glow.rotation.copy(s.rotation);
                s.userData.glow.scale.setScalar(1 + Math.sin(Date.now() * 0.001) * 0.5);
            }
        });

        // Dynamic lighting effects
        scene.traverse(object => {
            if (object.isDirectionalLight) {
                object.position.x = Math.sin(Date.now() * 0.001) * 5;
                object.position.y = Math.cos(Date.now() * 0.001) * 5;
                object.position.z = Math.sin(Date.now() * 0.001) * 5;
            }
        });

        // Scene rotation based on mouse
        sceneGroup.rotation.y += CONFIG.ROTATION_SPEED;
        sceneGroup.rotation.x += CONFIG.ROTATION_SPEED * 0.75;
        const targetRotationY = mouseX * 0.05;
        const targetRotationX = mouseY * 0.05;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;

        renderer.render(scene, camera);
    };

    /**
     * Handles form submission to redirect to the login URL.
     * @param {Event} event 
     */
    const handleFormSubmit = (event) => {
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
    };

    /**
     * Initializes the scene and starts the animation.
     */
    const initializeScene = () => {
        init();
    };

    // Initialize the Scene
    initializeScene();

    // Hide preloader after a short delay
    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 800);
    };

    // Form Handling
    form.addEventListener('submit', handleFormSubmit);
    form.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});
