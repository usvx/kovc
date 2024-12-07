document.addEventListener('DOMContentLoaded', () => {
    // Select critical elements
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');
    const canvas = document.getElementById('background');

    // Environment & global variables
    let scene, camera, renderer, sceneGroup;
    let particles = [];
    let shapes = [];

    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    // Three.js constants & configurations
    const PARTICLE_COUNT = 1200;  // Adjusted equally for mobile or desktop
    const SHAPE_COUNT = 80;
    const VIEW_ANGLE = 75;
    const NEAR_CLIP = 1;
    const FAR_CLIP = 10000;
    const BG_DEPTH_LIMIT = 2500; // Bound for particle/shape position re-bounce
    const PARTICLE_SPEED_FACTOR = isMobile ? 2 : 4;
    const SHAPE_ROTATION_SPEED = 0.015;
    const SCENE_ROTATION_Y_INC = 0.0025;
    const SCENE_ROTATION_X_INC = 0.002;
    const SCENE_ROTATION_FOLLOW_FACTOR = 0.05;

    /**
     * Create a texture with a single character rendered at the center of a canvas.
     * @param {string} char - The character to draw.
     * @returns {THREE.Texture} - A texture containing the rendered character.
     */
    const createTextTexture = (char) => {
        const canvas = document.createElement('canvas');
        const size = 256; // Use a consistent size
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = '#99ffff'; // Pastel cyan text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.fillText(char, size / 2, size / 2);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture.premultiplyAlpha = true;
        return texture;
    };

    /**
     * Returns a random character from a combination of Hangul syllables and Cyrillic letters.
     * @returns {string} A random character.
     */
    const getRandomCharacter = () => {
        const hangulInitials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112];
        const hangulMedials = [0x1161, 0x1165, 0x1166, 0x1167, 0x1169, 0x116E, 0x1172, 0x1173, 0x1175];
        const hangulFinals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA];

        const initial = hangulInitials[Math.floor(Math.random() * hangulInitials.length)];
        const medial = hangulMedials[Math.floor(Math.random() * hangulMedials.length)];
        const final = hangulFinals[Math.floor(Math.random() * hangulFinals.length)];

        const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
        const hangulChar = String.fromCharCode(syllableCode);

        const cyrillicLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Э', 'Ю', 'Я'];

        return Math.random() < 0.5 
            ? hangulChar 
            : cyrillicLetters[Math.floor(Math.random() * cyrillicLetters.length)];
    };

    /**
     * Initialize the Three.js scene, camera, lights, renderer, particles, and shapes.
     */
    const init = () => {
        // Renderer setup
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Scene & Camera
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(VIEW_ANGLE, window.innerWidth / window.innerHeight, NEAR_CLIP, FAR_CLIP);
        camera.position.z = isMobile ? 1000 : 1500;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x99ffff, 2);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xFF00FF, 0.8);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);

        // Main group that holds all particles and shapes
        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        // Create particle sprites
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const char = getRandomCharacter();
            const texture = createTextTexture(char);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: 0.7
            });
            const sprite = new THREE.Sprite(material);
            sprite.position.set(
                (Math.random() - 0.5) * 5000,
                (Math.random() - 0.5) * 5000,
                (Math.random() - 0.5) * 5000
            );
            sprite.scale.set(150, 150, 1);
            sprite.speedX = (Math.random() - 0.5) * PARTICLE_SPEED_FACTOR;
            sprite.speedY = (Math.random() - 0.5) * PARTICLE_SPEED_FACTOR;
            sprite.speedZ = (Math.random() - 0.5) * PARTICLE_SPEED_FACTOR;
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.1;

            sceneGroup.add(sprite);
            particles.push(sprite);
        }

        // Shared material properties for shapes
        const baseMaterialProps = {
            wireframe: true,
            transparent: true,
            opacity: 0.2,
            emissive: 0x99ffff,
            emissiveIntensity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            metalness: 0.5,
            roughness: 0.1,
            color: 0xffffff
        };

        const shapeMaterial = new THREE.MeshStandardMaterial(baseMaterialProps);
        const geometryGenerators = [
            () => new THREE.CylinderGeometry(80, 80, 150, 5, 1, false), // Pentagonal prism
            () => new THREE.IcosahedronGeometry(90, 1) // Icosahedron
        ];

        // Create shapes
        for (let i = 0; i < SHAPE_COUNT; i++) {
            const geometry = geometryGenerators[Math.floor(Math.random() * geometryGenerators.length)]();
            const mesh = new THREE.Mesh(geometry, shapeMaterial.clone());
            mesh.position.set(
                (Math.random() - 0.5) * 5000,
                (Math.random() - 0.5) * 5000,
                (Math.random() - 0.5) * 5000
            );
            mesh.rotationSpeedX = (Math.random() - 0.5) * SHAPE_ROTATION_SPEED;
            mesh.rotationSpeedY = (Math.random() - 0.5) * SHAPE_ROTATION_SPEED;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * SHAPE_ROTATION_SPEED;

            sceneGroup.add(mesh);
            shapes.push(mesh);
        }

        // Event listeners
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);

        animate();
    };

    /**
     * Update mouse coordinates relative to screen center.
     * @param {MouseEvent} event 
     */
    const onDocumentMouseMove = (event) => {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    };

    /**
     * Handle touch move events similarly to mouse move.
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
     * Adjust camera and renderer on window resize.
     */
    const onWindowResize = () => {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    /**
     * The animation loop: update positions, rotations, and render.
     */
    const animate = () => {
        requestAnimationFrame(animate);

        // Update particles
        for (const p of particles) {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;
            p.material.rotation += p.rotationSpeed;

            // Bounce back if out of certain bounds
            if (Math.abs(p.position.x) > BG_DEPTH_LIMIT) p.speedX *= -1;
            if (Math.abs(p.position.y) > BG_DEPTH_LIMIT) p.speedY *= -1;
            if (Math.abs(p.position.z) > BG_DEPTH_LIMIT) p.speedZ *= -1;
        }

        // Update shapes
        for (const s of shapes) {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
        }

        // Rotate the entire sceneGroup slightly for a drifting feel
        sceneGroup.rotation.y += SCENE_ROTATION_Y_INC;
        sceneGroup.rotation.x += SCENE_ROTATION_X_INC;

        // Follow mouse movements smoothly
        const targetRotationY = mouseX * 0.05;
        const targetRotationX = mouseY * 0.05;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * SCENE_ROTATION_FOLLOW_FACTOR;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * SCENE_ROTATION_FOLLOW_FACTOR;

        // Render the scene
        renderer.render(scene, camera);
    };

    // Initialize the scene
    init();

    // Handle preloader
    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1000);
    };

    // Form event handlers
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

    form.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});
