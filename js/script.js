import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form'),
          preloader = document.getElementById('preloader');

    let scene, camera, renderer,
        particles = [],
        torusKnotShapes = [],
        sceneGroup,
        mouseX = 0, mouseY = 0,
        windowHalfX = window.innerWidth / 2,
        windowHalfY = window.innerHeight / 2,
        isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    const CONFIG = {
        PARTICLE_COUNT: isMobile ? 300 : 800,
        TORUS_KNOT_COUNT: isMobile ? 40 : 80,
        MIN_DISTANCE: 250,
        PARTICLE_SIZE: isMobile ? 100 : 150,
        TORUS_KNOT_RADIUS: isMobile ? 60 : 90,
        PARTICLE_SPEED: isMobile ? 0.8 : 1.5,
        ROTATION_SPEED: isMobile ? 0.002 : 0.004,
        TEXTURE_SIZE: isMobile ? 128 : 256,
        SHADOW_BLUR: isMobile ? 10 : 25,
        LIGHT_INTENSITY: isMobile ? 0.6 : 0.8,
        AMBIENT_COLOR: 0x1E90FF,       // DodgerBlue
        DIRECTIONAL_COLOR: 0x9370DB,   // MediumPurple
        BACKGROUND_COLOR: 0x0A0A0A,    // Dark Background for better contrast
        PARTICLE_COLOR_1: 0x1E90FF,     // DodgerBlue
        PARTICLE_COLOR_2: 0xBA55D3,     // MediumOrchid
        TORUS_COLOR: 0xBA55D3,          // MediumOrchid
        EMISSIVE_COLOR: 0x9370DB,       // MediumPurple
        MAX_PIXEL_RATIO: isMobile ? 1.0 : window.devicePixelRatio
    };

    // Pre-generate a limited set of textures to reuse
    const TEXTURE_CACHE_SIZE = 100;
    const textureCache = [];

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

    function getRandomHangulCharacter() {
        const commonInitials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112],
              commonMedials = [0x1161, 0x1163, 0x1165, 0x1167, 0x1169, 0x116D, 0x1162, 0x1164, 0x1166, 0x1168, 0x116A],
              commonFinals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA, 0x11C2];
        const initial = commonInitials[Math.floor(Math.random() * commonInitials.length)],
              medial = commonMedials[Math.floor(Math.random() * commonMedials.length)],
              final = commonFinals[Math.floor(Math.random() * commonFinals.length)];
        const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
        return String.fromCharCode(syllableCode);
    }

    function getRandomCyrillicCharacter() {
        const start = 0x0410,
              end = 0x042F,
              code = Math.floor(Math.random() * (end - start + 1)) + start;
        return String.fromCharCode(code);
    }

    function getRandomCharacter() {
        return Math.random() < 0.7 ? getRandomHangulCharacter() : getRandomCyrillicCharacter();
    }

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

    // Initialization
    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: !isMobile, // Disable antialiasing on mobile for performance
            alpha: true, 
            powerPreference: isMobile ? 'low-power' : 'default' 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(CONFIG.MAX_PIXEL_RATIO, 1.5)); // Limit pixel ratio on mobile
        renderer.setClearColor(CONFIG.BACKGROUND_COLOR, 1); // Set background color

        scene = new THREE.Scene();

        // Camera Setup
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 800 : 1200;

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

        // Create Torus Knots
        createTorusKnots();

        // Event Listeners
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);

        // Start Animation
        animate();
    }

    function createParticles() {
        for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
            const char = getRandomCharacter(),
                  texture = createTextTexture(char),
                  material = new THREE.SpriteMaterial({ 
                      map: texture, 
                      transparent: true, 
                      blending: THREE.AdditiveBlending, 
                      depthWrite: false,
                      opacity: 0.9
                  }),
                  sprite = new THREE.Sprite(material);

            sprite.position.set(
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000
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

    function createTorusKnots() {
        for (let i = 0; i < CONFIG.TORUS_KNOT_COUNT; i++) {
            const torusKnotGeometry = new THREE.TorusKnotGeometry(
                CONFIG.TORUS_KNOT_RADIUS * 0.5, 
                CONFIG.TORUS_KNOT_RADIUS * 0.08, 
                isMobile ? 100 : 150, // Lower segments on mobile
                isMobile ? 12 : 20     // Lower tubular segments on mobile
            );
            const material = new THREE.MeshStandardMaterial({
                color: CONFIG.TORUS_COLOR,
                wireframe: true,
                transparent: true,
                opacity: 0.2,
                emissive: CONFIG.EMISSIVE_COLOR,
                emissiveIntensity: 0.5,
                side: THREE.DoubleSide
            });
            const torusKnotMesh = new THREE.Mesh(torusKnotGeometry, material);

            torusKnotMesh.position.copy(getRandomPosition(torusKnotShapes, CONFIG.TORUS_KNOT_RADIUS));
            torusKnotMesh.rotationSpeedX = (Math.random() - 0.5) * 0.02;
            torusKnotMesh.rotationSpeedY = (Math.random() - 0.5) * 0.02;
            torusKnotMesh.rotationSpeedZ = (Math.random() - 0.5) * 0.02;
            sceneGroup.add(torusKnotMesh);
            torusKnotShapes.push(torusKnotMesh);
        }
    }

    // Event Handlers
    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    }

    function onDocumentTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX) / windowHalfX;
            mouseY = (event.touches[0].pageY - windowHalfY) / windowHalfY;
        }
    }

    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        // Update Particles
        particles.forEach(p => {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;
            p.material.rotation += p.rotationSpeed;

            // Boundary Conditions
            if (Math.abs(p.position.x) > 2000) p.speedX *= -1;
            if (Math.abs(p.position.y) > 2000) p.speedY *= -1;
            if (Math.abs(p.position.z) > 2000) p.speedZ *= -1;
        });

        // Update Torus Knots
        torusKnotShapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
        });

        // Smooth Scene Rotation
        sceneGroup.rotation.y += CONFIG.ROTATION_SPEED;
        sceneGroup.rotation.x += CONFIG.ROTATION_SPEED * 0.75;

        // Interactive Rotation
        const targetRotationY = mouseX * 0.1;
        const targetRotationX = mouseY * 0.1;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;

        renderer.render(scene, camera);
    }

    // Form Handling
    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1500);
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = form.username.value.trim(),
              domainSelect = form.querySelector('select[name="domain"]'),
              domain = domainSelect.value;
        if (username && domain) {
            const email = `${username}${domain}`,
                  loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/`;
            window.location.href = loginUrl;
        } else {
            alert('Please enter your username and select a domain.');
        }
    });

    form.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });

    // Initialize the Scene
    init();
});
