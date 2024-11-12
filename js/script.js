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

    const CONFIG = {
        PARTICLE_COUNT: isMobile ? 1200 : 1200,
        SHAPE_COUNT: isMobile ? 80 : 80,
        PARTICLE_SIZE: 150,
        SHAPE_SIZE: 80,
        PARTICLE_SPEED: isMobile ? 2 : 4,
        ROTATION_SPEED: 0.02,
        TEXTURE_SIZE: 256,
    };

    /**
     * Creates a text texture for a given character using the Urbanist font.
     * @param {string} char - The character to create a texture for.
     * @returns {THREE.Texture} - The generated texture.
     */
    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = CONFIG.TEXTURE_SIZE;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);

        // Set font styles
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Text color and shadow
        ctx.fillStyle = '#00FFD1';
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur = isMobile ? 20 : 25;

        // Draw the character
        ctx.fillText(char, size / 2, size / 2);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    /**
     * Generates a random Hangul syllable using Unicode composition.
     * @returns {string} - A random Hangul syllable.
     */
    function getRandomHangulCharacter() {
        const initials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112];
        const medials = [0x1161, 0x1165, 0x1166, 0x1167, 0x1169, 0x116E, 0x1172, 0x1173, 0x1175];
        const finals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA];

        const initial = initials[Math.floor(Math.random() * initials.length)];
        const medial = medials[Math.floor(Math.random() * medials.length)];
        const final = finals[Math.floor(Math.random() * finals.length)];

        const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
        return String.fromCharCode(syllableCode);
    }

    /**
     * Generates a random Cyrillic uppercase character.
     * @returns {string} - A random uppercase Cyrillic character.
     */
    function getRandomCyrillicCharacter() {
        const uppercase = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Э', 'Ю', 'Я'];
        return uppercase[Math.floor(Math.random() * uppercase.length)];
    }

    /**
     * Generates a random character, either Hangul or uppercase Cyrillic.
     * @returns {string} - A random character.
     */
    function getRandomCharacter() {
        const isHangeul = Math.random() < 0.5;
        return isHangeul ? getRandomHangulCharacter() : getRandomCyrillicCharacter();
    }

    /**
     * Initializes the Three.js scene, camera, renderer, particles, and shapes.
     */
    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 1000 : 1500;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x00FFD1, 2);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xFF00FF, 1);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);

        // Group to hold all objects
        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        // Create particles
        const particleCount = CONFIG.PARTICLE_COUNT;
        for (let i = 0; i < particleCount; i++) {
            const char = getRandomCharacter();
            const texture = createTextTexture(char);
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true, blending: THREE.AdditiveBlending });
            const sprite = new THREE.Sprite(material);
            sprite.position.x = (Math.random() - 0.5) * 5000;
            sprite.position.y = (Math.random() - 0.5) * 5000;
            sprite.position.z = (Math.random() - 0.5) * 5000;
            sprite.scale.set(CONFIG.PARTICLE_SIZE, CONFIG.PARTICLE_SIZE, 1);
            sprite.speedX = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.speedY = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.speedZ = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.1;
            sceneGroup.add(sprite);
            particles.push(sprite);
        }

        // Create shapes
        const geometryTypes = [THREE.TetrahedronGeometry, THREE.OctahedronGeometry, THREE.IcosahedronGeometry, THREE.DodecahedronGeometry];
        const shapeCount = CONFIG.SHAPE_COUNT;
        for (let i = 0; i < shapeCount; i++) {
            const GeometryClass = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            const geometry = new GeometryClass(CONFIG.SHAPE_SIZE, 1);
            const material = new THREE.MeshStandardMaterial({
                color: 0x00FFD1,
                wireframe: true,
                transparent: true,
                opacity: 0.4,
                emissive: 0xFF00FF,
                emissiveIntensity: 0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = (Math.random() - 0.5) * 5000;
            mesh.position.y = (Math.random() - 0.5) * 5000;
            mesh.position.z = (Math.random() - 0.5) * 5000;
            mesh.rotationSpeedX = (Math.random() - 0.5) * CONFIG.ROTATION_SPEED;
            mesh.rotationSpeedY = (Math.random() - 0.5) * CONFIG.ROTATION_SPEED;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * CONFIG.ROTATION_SPEED;
            sceneGroup.add(mesh);
            shapes.push(mesh);
        }

        // Event listeners
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);

        // Start animation
        animate();
    }

    /**
     * Handles mouse movement to update rotation targets.
     * @param {MouseEvent} event 
     */
    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    }

    /**
     * Handles touch movement to update rotation targets.
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
     * The main animation loop. Updates particles and shapes positions and rotations.
     */
    function animate() {
        requestAnimationFrame(animate);

        // Update particles
        particles.forEach(p => {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;
            p.material.rotation += p.rotationSpeed;

            // Bounce particles within bounds
            if (p.position.x > 2500 || p.position.x < -2500) p.speedX *= -1;
            if (p.position.y > 2500 || p.position.y < -2500) p.speedY *= -1;
            if (p.position.z > 2500 || p.position.z < -2500) p.speedZ *= -1;
        });

        // Update shapes
        shapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
        });

        // Rotate the entire scene group
        sceneGroup.rotation.y += 0.0025;
        sceneGroup.rotation.x += 0.002;

        // Smooth scene rotation based on mouse position
        const targetRotationY = mouseX * 0.05;
        const targetRotationX = mouseY * 0.05;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;

        // Render the scene
        renderer.render(scene, camera);
    }

    /**
     * Handles form submission to redirect to the login URL with validation.
     * @param {Event} event 
     */
    function handleFormSubmit(event) {
        event.preventDefault();
        const username = form.username.value.trim();
        const domainSelect = form.querySelector('select[name="domain"]');
        const domain = domainSelect.value;

        // Reset previous errors
        form.querySelectorAll('.input-container').forEach(container => {
            container.classList.remove('invalid');
        });
        form.querySelectorAll('.error-message').forEach(msg => {
            msg.textContent = '';
        });

        let hasError = false;

        // Validate Username
        if (!username) {
            const usernameContainer = form.querySelector('#username').parentElement;
            usernameContainer.classList.add('invalid');
            usernameContainer.querySelector('.error-message').textContent = 'Username is required.';
            hasError = true;
        }

        // Validate Domain
        if (!domain) {
            const domainContainer = form.querySelector('#domain').parentElement;
            domainContainer.classList.add('invalid');
            domainContainer.querySelector('.error-message').textContent = 'Please select a domain.';
            hasError = true;
        }

        if (!hasError) {
            const email = `${username}${domain}`;
            const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/`;
            window.location.href = loginUrl;
        }
    }

    /**
     * Initializes the scene and starts the animation.
     */
    function initializeScene() {
        init();
    }

    // Initialize the Scene
    initializeScene();

    // Hide preloader after the scene is ready for a smoother transition
    window.onload = () => {
        setTimeout(() => {
            preloader.style.opacity = '0';
            preloader.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 800);
    };

    // Form Handling with enhanced event listeners
    form.addEventListener('submit', handleFormSubmit);
    form.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});
