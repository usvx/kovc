import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    // ============================
    // === DOM ELEMENTS ============
    // ============================
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');
    const canvas = document.getElementById('background');

    // ============================
    // === SCENE VARIABLES =========
    // ============================
    let scene, camera, renderer, sceneGroup;
    const particles = [];
    const spheres = [];
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2;
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    // ============================
    // === CONFIGURATION ============
    // ============================
    const CONFIG = {
        PARTICLE_COUNT: isMobile ? 800 : 2000,
        SPHERE_COUNT: isMobile ? 50 : 100,
        MIN_DISTANCE: 600,
        PARTICLE_SIZE: isMobile ? 100 : 150,
        SPHERE_SIZE: isMobile ? 60 : 120,
        PARTICLE_SPEED: isMobile ? 1.2 : 2.0,
        ROTATION_SPEED: isMobile ? 0.002 : 0.004,
        TEXTURE_SIZE: isMobile ? 256 : 512,
        SHADOW_BLUR: isMobile ? 20 : 40,
        LIGHT_INTENSITY: isMobile ? 1.5 : 2.0,
        AMBIENT_COLOR: 0x1E90FF,
        DIRECTIONAL_COLOR: 0x9370DB,
        BACKGROUND_COLOR: 0x0A0A0A,
        PARTICLE_COLOR_1: 0x1E90FF,
        PARTICLE_COLOR_2: 0xBA55D3,
        SPHERE_COLOR: 0xBA55D3,
        EMISSIVE_COLOR: 0x9370DB,
        MAX_PIXEL_RATIO: isMobile ? Math.min(window.devicePixelRatio, 3) : Math.min(window.devicePixelRatio, 2),
        ENV_MAP_INTENSITY: 1.2,
        MIN_CAMERA_DISTANCE: 700,
        MAX_SPHERE_SIZE: isMobile ? 140 : 200,
    };

    // ============================
    // === TEXTURE CACHE ===========
    // ============================
    const textureCache = [];

    /**
     * Creates a high-resolution text texture for a given character.
     * @param {string} char - The character to create a texture for.
     * @returns {THREE.Texture} - The generated texture.
     */
    const createTextTexture = (char) => {
        if (textureCache.length >= 300) { // Increased cache size for more variety
            return textureCache[Math.floor(Math.random() * 300)];
        }
        const canvas = document.createElement('canvas');
        const size = CONFIG.TEXTURE_SIZE * window.devicePixelRatio;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.clearRect(0, 0, CONFIG.TEXTURE_SIZE, CONFIG.TEXTURE_SIZE);

        // Create a dynamic gradient
        const gradient = ctx.createRadialGradient(
            CONFIG.TEXTURE_SIZE / 2,
            CONFIG.TEXTURE_SIZE / 2,
            CONFIG.TEXTURE_SIZE * 0.1,
            CONFIG.TEXTURE_SIZE / 2,
            CONFIG.TEXTURE_SIZE / 2,
            CONFIG.TEXTURE_SIZE * 0.8
        );
        gradient.addColorStop(0, '#1E90FF');
        gradient.addColorStop(1, '#BA55D3');
        ctx.fillStyle = gradient;

        // Enhanced text styling with glow
        ctx.font = `${CONFIG.TEXTURE_SIZE * 0.7}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#9370DB';
        ctx.shadowBlur = CONFIG.SHADOW_BLUR;
        ctx.fillText(char, CONFIG.TEXTURE_SIZE / 2, CONFIG.TEXTURE_SIZE / 2);

        // Optional: Add a subtle inner shadow or stroke for depth
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeText(char, CONFIG.TEXTURE_SIZE / 2, CONFIG.TEXTURE_SIZE / 2);

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
        const boundingRadius = 3000; // Increased for more spread
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
        // Renderer Configuration
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
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Scene Initialization
        scene = new THREE.Scene();
        scene.background = CONFIG.BACKGROUND_COLOR; // Ensure dark background

        // Camera Setup with Smooth Controls
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 2000 : 2500;

        // Lighting Setup
        const ambientLight = new THREE.AmbientLight(CONFIG.AMBIENT_COLOR, CONFIG.LIGHT_INTENSITY);
        const directionalLight = new THREE.DirectionalLight(CONFIG.DIRECTIONAL_COLOR, CONFIG.LIGHT_INTENSITY);
        directionalLight.position.set(1, 1, 1).normalize();
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(ambientLight, directionalLight);

        // Additional Point Lights for Enhanced Illumination and Depth
        const pointLight1 = new THREE.PointLight(0xFFFFFF, 0.8, 1000);
        pointLight1.position.set(-1500, 800, -1500);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xFFFFFF, 0.8, 1000);
        pointLight2.position.set(1500, -800, 1500);
        scene.add(pointLight2);

        // Group to Hold All Scene Objects for Collective Transformations
        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        // Create Particles and Spheres
        createParticles();
        createSpheres();

        // Enable Sorting for Transparent Objects
        renderer.sortObjects = true;

        // Event Listeners for Interaction and Responsiveness
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);

        // Start Animation Loop
        animate();
    };

    /**
     * Creates particles (sprites) with random characters and positions.
     */
    const createParticles = () => {
        const uniqueChars = 150; // Increased for more variety
        const characters = Array.from({ length: uniqueChars }, () => getRandomCharacter());
        characters.forEach(char => createTextTexture(char)); // Populate texture cache

        // Create BufferGeometry for Efficient Rendering
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        const textureIndices = [];

        // Populate Geometry Attributes
        for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
            const char = characters[Math.floor(Math.random() * uniqueChars)];
            const texture = createTextTexture(char);
            positions.push(
                (Math.random() - 0.5) * 6000,
                (Math.random() - 0.5) * 6000,
                (Math.random() - 0.5) * 6000
            );
            colors.push(
                (CONFIG.PARTICLE_COLOR_1 >> 16 & 0xFF) / 255,
                (CONFIG.PARTICLE_COLOR_1 >> 8 & 0xFF) / 255,
                (CONFIG.PARTICLE_COLOR_1 & 0xFF) / 255
            );
            sizes.push(CONFIG.PARTICLE_SIZE);
            textureIndices.push(Math.floor(Math.random() * textureCache.length));
        }

        particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        particlesGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        particlesGeometry.setAttribute('textureIndex', new THREE.Float32BufferAttribute(textureIndices, 1));

        // Custom Shader Material for Advanced Particle Effects
        const particlesMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                attribute float size;
                attribute float textureIndex;
                varying vec3 vColor;
                varying float vTextureIndex;
                void main() {
                    vColor = color;
                    vTextureIndex = textureIndex;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D textures[300];
                uniform float opacity;
                varying vec3 vColor;
                varying float vTextureIndex;
                void main() {
                    int index = int(vTextureIndex);
                    vec4 texColor = texture2D(textures[index], gl_PointCoord);
                    if (texColor.a < 0.1) discard;
                    gl_FragColor = vec4(vColor, texColor.a * opacity);
                }
            `,
            uniforms: {
                textures: { value: textureCache },
                opacity: { value: 0.85 }
            },
            blending: THREE.AdditiveBlending,
            depthTest: true,
            transparent: true,
            vertexColors: true,
        });

        // Create Points Object and Add to Scene
        const particlesPoints = new THREE.Points(particlesGeometry, particlesMaterial);
        particlesPoints.renderOrder = 1;
        sceneGroup.add(particlesPoints);
        particles.push(particlesPoints);
    };

    /**
     * Creates smooth, glassy spheres with refined material properties.
     */
    const createSpheres = () => {
        for (let i = 0; i < CONFIG.SPHERE_COUNT; i++) {
            const geometry = new THREE.SphereGeometry(CONFIG.SPHERE_SIZE, 128, 128); // Higher segments for ultra-smooth spheres
            const material = new THREE.MeshPhysicalMaterial({
                color: CONFIG.SPHERE_COLOR,
                metalness: 0.0,
                roughness: 0.02,
                transmission: 1.0, // Full transmission for glass effect
                transparent: true,
                opacity: 0.35,
                emissive: CONFIG.EMISSIVE_COLOR,
                emissiveIntensity: 0.4,
                side: THREE.DoubleSide,
                reflectivity: 1.0,
                clearcoat: 1.0,
                clearcoatRoughness: 0.02,
                ior: 1.52, // Realistic index of refraction for glass
                depthWrite: false,
                alphaTest: 0.1
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.copy(getRandomPosition(spheres, CONFIG.SPHERE_SIZE));
            sphere.rotationSpeed = new THREE.Vector3(
                (Math.random() - 0.5) * 0.005,
                (Math.random() - 0.5) * 0.005,
                (Math.random() - 0.5) * 0.005
            );
            sphere.castShadow = true;
            sphere.receiveShadow = true;
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

        // Update Particles - For more dynamic movement, consider using shader-based animations
        particles.forEach(particleGroup => {
            const positions = particleGroup.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
                positions[i + 1] += (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
                positions[i + 2] += (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;

                // Boundary Conditions - Reverse direction upon crossing boundaries
                if (positions[i] > 3000 || positions[i] < -3000) positions[i] *= -1;
                if (positions[i + 1] > 3000 || positions[i + 1] < -3000) positions[i + 1] *= -1;
                if (positions[i + 2] > 3000 || positions[i + 2] < -3000) positions[i + 2] *= -1;
            }
            particleGroup.geometry.attributes.position.needsUpdate = true;
        });

        // Update Spheres - Continuous and independent rotation
        spheres.forEach(sphere => {
            sphere.rotation.x += sphere.rotationSpeed.x;
            sphere.rotation.y += sphere.rotationSpeed.y;
            sphere.rotation.z += sphere.rotationSpeed.z;
        });

        // Rotate the Entire Scene Based on Mouse/Touch Input
        const targetRotationY = mouseX * 0.1; // Increased sensitivity for more dynamic rotation
        const targetRotationX = mouseY * 0.1;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;

        // Optional: Add subtle oscillation for a more dynamic feel
        sceneGroup.rotation.z += 0.0005;

        // Render the Scene
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

    // Hide Preloader after the Window Loads
    window.onload = () => {
        setTimeout(() => {
            preloader.style.opacity = '0';
            preloader.style.transition = 'opacity 1s ease';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 1000);
        }, 1000);
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
