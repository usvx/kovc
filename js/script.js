import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer;
    let particles = [];
    let shapes = [];
    let sceneGroup;
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    // Configuration Object
    const CONFIG = {
        PARTICLE_COUNT: isMobile ? 400 : 800, // Adjusted for performance
        SHAPE_COUNT: isMobile ? 40 : 80,      // Adjusted for performance
        MIN_DISTANCE: 250,
        PARTICLE_SIZE: isMobile ? 100 : 150,
        SHAPE_SIZE: isMobile ? 60 : 90,
        PARTICLE_SPEED: isMobile ? 1.0 : 2.0,
        ROTATION_SPEED: isMobile ? 0.002 : 0.004,
        TEXTURE_SIZE: isMobile ? 128 : 256, // Optimized for performance
        SHADOW_BLUR: isMobile ? 10 : 25,
        LIGHT_INTENSITY: isMobile ? 0.6 : 0.8,
        AMBIENT_COLOR: 0x1E90FF,       // DodgerBlue
        DIRECTIONAL_COLOR: 0x9370DB,   // MediumPurple
        BACKGROUND_COLOR: 0x0A0A0A,    // Dark Background for better contrast
        PARTICLE_COLOR_1: 0x1E90FF,    // DodgerBlue
        PARTICLE_COLOR_2: 0xBA55D3,    // MediumOrchid
        SHAPE_COLOR: 0xBA55D3,         // MediumOrchid
        EMISSIVE_COLOR: 0x9370DB,      // MediumPurple
        MAX_PIXEL_RATIO: isMobile ? 1.0 : Math.min(window.devicePixelRatio, 2) // Capped for performance
    };

    // Texture Cache
    const TEXTURE_CACHE_SIZE = 50; // Limited cache size for performance
    const textureCache = [];

    /**
     * Creates a text texture for a given character.
     * Reuses textures from the cache to optimize performance.
     * @param {string} char - The character to create a texture for.
     * @returns {THREE.Texture} - The generated texture.
     */
    function createTextTexture(char) {
        if (textureCache.length >= TEXTURE_CACHE_SIZE) {
            return textureCache[Math.floor(Math.random() * TEXTURE_CACHE_SIZE)];
        }

        const canvas = document.createElement('canvas');
        const size = CONFIG.TEXTURE_SIZE;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#1E90FF'); // DodgerBlue
        gradient.addColorStop(1, '#BA55D3'); // MediumOrchid

        // Text Styling
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = gradient;

        // Subtle Glow Adjustment
        ctx.shadowColor = '#9370DB'; // MediumPurple
        ctx.shadowBlur = CONFIG.SHADOW_BLUR;
        ctx.globalAlpha = 0.85; // Reduced opacity for natural glow

        // Draw Text
        ctx.fillText(char, size / 2, size / 2);

        // Create Texture
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        // Cache the texture
        textureCache.push(texture);
        return texture;
    }

    /**
     * Generates a random Hangul character.
     * @returns {string} - A random Hangul character.
     */
    function getRandomHangulCharacter() {
        const hangeulInitials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112];
        const hangeulMedials = [0x1161, 0x1163, 0x1165, 0x1167, 0x1169, 0x116D, 0x1162, 0x1164, 0x1166, 0x1168, 0x116A];
        const hangeulFinals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA, 0x11C2];
        const initial = hangeulInitials[Math.floor(Math.random() * hangeulInitials.length)];
        const medial = hangeulMedials[Math.floor(Math.random() * hangeulMedials.length)];
        const final = hangeulFinals[Math.floor(Math.random() * hangeulFinals.length)];
        const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
        return String.fromCharCode(syllableCode);
    }

    /**
     * Generates a random Cyrillic character.
     * @returns {string} - A random Cyrillic character.
     */
    function getRandomCyrillicCharacter() {
        const cyrillicLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Э', 'Ю', 'Я'];
        return cyrillicLetters[Math.floor(Math.random() * cyrillicLetters.length)];
    }

    /**
     * Generates a random character, either Hangul or Cyrillic.
     * @returns {string} - A random character.
     */
    function getRandomCharacter() {
        const isHangeul = Math.random() < 0.5;
        return isHangeul ? getRandomHangulCharacter() : getRandomCyrillicCharacter();
    }

    /**
     * Generates a random position in 3D space, ensuring it's not too close to existing shapes.
     * @param {Array} existingShapes - Array of existing shapes to avoid.
     * @param {number} radius - The radius to maintain distance.
     * @returns {THREE.Vector3} - A random position vector.
     */
    function getRandomPosition(existingShapes, radius) {
        let position;
        let tooClose;
        let attempts = 0;
        do {
            position = new THREE.Vector3(
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000
            );
            tooClose = existingShapes.some(shape => {
                const distance = position.distanceTo(shape.position);
                return distance < CONFIG.MIN_DISTANCE + radius;
            });
            attempts++;
            if (attempts > 100) break; // Prevent infinite loop
        } while (tooClose);
        return position;
    }

    /**
     * Initializes the Three.js scene, camera, renderer, particles, and shapes.
     */
    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: !isMobile, // Disable antialiasing on mobile for performance
            alpha: true, 
            powerPreference: isMobile ? 'low-power' : 'default' 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(CONFIG.MAX_PIXEL_RATIO, 2)); // Capped for performance
        renderer.setClearColor(CONFIG.BACKGROUND_COLOR, 1); // Set background color

        scene = new THREE.Scene();

        // Camera Setup
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 1000 : 1500;

        // Lighting
        const ambientLight = new THREE.AmbientLight(CONFIG.AMBIENT_COLOR, CONFIG.LIGHT_INTENSITY);
        const directionalLight = new THREE.DirectionalLight(CONFIG.DIRECTIONAL_COLOR, CONFIG.LIGHT_INTENSITY);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(ambientLight, directionalLight);

        // Group to hold all objects
        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        // Create Particles
        createParticles();

        // Create Shapes
        createShapes();

        // Event Listeners
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);

        // Start Animation
        animate();
    }

    /**
     * Creates particles (sprites) with random characters and positions.
     * Reuses textures from the cache for performance.
     */
    function createParticles() {
        // Predefine a set of characters to reuse textures
        const uniqueChars = 20; // Number of unique characters
        const characters = [];
        for (let i = 0; i < uniqueChars; i++) {
            characters.push(getRandomCharacter());
        }

        for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
            const char = characters[Math.floor(Math.random() * uniqueChars)];
            const texture = createTextTexture(char);
            const material = new THREE.SpriteMaterial({ 
                map: texture, 
                transparent: true, 
                blending: THREE.AdditiveBlending, 
                depthWrite: false,
                opacity: 0.9
            });
            const sprite = new THREE.Sprite(material);

            sprite.position.set(
                (Math.random() - 0.5) * 5000,
                (Math.random() - 0.5) * 5000,
                (Math.random() - 0.5) * 5000
            );
            sprite.scale.set(CONFIG.PARTICLE_SIZE, CONFIG.PARTICLE_SIZE, 1);
            sprite.speedX = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.speedY = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.speedZ = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.015; // Subtle rotation
            sceneGroup.add(sprite);
            particles.push(sprite);
        }
    }

    /**
     * Creates shapes (geometries) with random positions and rotations.
     */
    function createShapes() {
        const geometryTypes = [
            THREE.TetrahedronGeometry, 
            THREE.OctahedronGeometry, 
            THREE.IcosahedronGeometry, 
            THREE.DodecahedronGeometry
        ];

        for (let i = 0; i < CONFIG.SHAPE_COUNT; i++) {
            const GeometryClass = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            const geometry = new GeometryClass(CONFIG.SHAPE_SIZE, 1); // Size and detail

            const material = new THREE.MeshStandardMaterial({
                color: CONFIG.SHAPE_COLOR,
                wireframe: true,
                transparent: true,
                opacity: 0.4,
                emissive: CONFIG.EMISSIVE_COLOR,
                emissiveIntensity: 0.5,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);

            mesh.position.copy(getRandomPosition(shapes, CONFIG.SHAPE_SIZE));
            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.02;
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.02;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.02;

            sceneGroup.add(mesh);
            shapes.push(mesh);
        }
    }

    /**
     * Handles mouse movement to rotate the scene.
     * @param {MouseEvent} event 
     */
    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    }

    /**
     * Handles touch movement to rotate the scene.
     * @param {TouchEvent} event 
     */
    function onDocumentTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX) / windowHalfX;
            mouseY = (event.touches[0].pageY - windowHalfY) / windowHalfY;
        }
    }

    /**
     * Handles window resize events to adjust camera and renderer.
     */
    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * The main animation loop. Updates positions and rotations of particles and shapes.
     */
    function animate() {
        requestAnimationFrame(animate);

        // Update Particles
        particles.forEach(p => {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;
            p.material.rotation += p.rotationSpeed;

            // Boundary Conditions
            if (Math.abs(p.position.x) > 2500) p.speedX *= -1;
            if (Math.abs(p.position.y) > 2500) p.speedY *= -1;
            if (Math.abs(p.position.z) > 2500) p.speedZ *= -1;
        });

        // Update Shapes
        shapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
        });

        // Smooth Scene Rotation
        sceneGroup.rotation.y += CONFIG.ROTATION_SPEED;
        sceneGroup.rotation.x += CONFIG.ROTATION_SPEED * 0.75;

        // Interactive Rotation
        const targetRotationY = mouseX * 0.05;
        const targetRotationX = mouseY * 0.05;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;

        renderer.render(scene, camera);
    }

    /**
     * Handles form submission to redirect to the login URL.
     * @param {Event} event 
     */
    function handleFormSubmit(event) {
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
    }

    /**
     * Initializes the scene and starts the animation.
     */
    function initializeScene() {
        init();
        animate();
    }

    // Initialize the Scene
    initializeScene();

    // Hide preloader after a short delay
    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1000); // Reduced delay for faster visibility
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
