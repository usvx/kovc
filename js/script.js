/* js/script.js */

/**
 * This script initializes the Three.js scene, handles user interactions,
 * and manages the login form functionality.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Select the login form and preloader elements
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    // Variables for Three.js scene
    let scene, camera, renderer;
    let particles = [];
    let shapes = [];
    let sceneGroup;
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    /**
     * Creates a texture with the specified character.
     * @param {string} char - The character to render on the texture.
     * @returns {THREE.Texture} - The generated texture.
     */
    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = isMobile ? 128 : 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Clear the canvas
        ctx.clearRect(0, 0, size, size);

        // Set font properties
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Create a vibrant gradient
        const gradient = ctx.createRadialGradient(
            size / 2, size / 2, size * 0.1,
            size / 2, size / 2, size * 0.5
        );
        gradient.addColorStop(0, '#00FFAA');
        gradient.addColorStop(1, '#FFAA00');

        // Set fill and shadow properties
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#AA00FF';
        ctx.shadowBlur = isMobile ? 15 : 25;

        // Draw the character
        ctx.fillText(char, size / 2, size / 2);

        // Create a texture from the canvas
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    /**
     * Generates a random character, either Hangul or Cyrillic.
     * @returns {string} - The generated character.
     */
    function getRandomCharacter() {
        const hangulInitials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112];
        const hangulMedials = [0x1161, 0x1165, 0x1166, 0x1167, 0x1169, 0x116E, 0x1172, 0x1173, 0x1175];
        const hangulFinals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA];
        const cyrillicLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Э', 'Ю', 'Я'];

        const isHangul = Math.random() < 0.5;
        if (isHangul) {
            // Generate a random Hangul syllable
            const initial = hangulInitials[Math.floor(Math.random() * hangulInitials.length)];
            const medial = hangulMedials[Math.floor(Math.random() * hangulMedials.length)];
            const final = hangulFinals[Math.floor(Math.random() * hangulFinals.length)];
            const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final - 0x11A7);
            return String.fromCharCode(syllableCode);
        } else {
            // Return a random Cyrillic letter
            return cyrillicLetters[Math.floor(Math.random() * cyrillicLetters.length)];
        }
    }

    /**
     * Initializes the Three.js scene, camera, renderer, particles, and shapes.
     */
    function init() {
        // Create the renderer and add it to the DOM
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Create the scene and set the fog
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.0005);

        // Create the camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
        camera.position.z = isMobile ? 800 : 1000;

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
        scene.add(ambientLight);

        // Add point light
        const pointLight = new THREE.PointLight(0xAA00FF, 1, 1000);
        pointLight.position.set(0, 0, 500);
        scene.add(pointLight);

        // Create a group for particles and shapes
        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        // Create particles
        const particleCount = isMobile ? 500 : 1000;
        for (let i = 0; i < particleCount; i++) {
            const char = getRandomCharacter();
            const texture = createTextTexture(char);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            const sprite = new THREE.Sprite(material);
            sprite.position.set(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000
            );
            sprite.scale.set(50, 50, 1);
            sprite.speedX = (Math.random() - 0.5) * 0.5;
            sprite.speedY = (Math.random() - 0.5) * 0.5;
            sprite.speedZ = (Math.random() - 0.5) * 0.5;
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.01;
            sceneGroup.add(sprite);
            particles.push(sprite);
        }

        // Create geometric shapes
        const geometryTypes = [
            new THREE.TorusKnotGeometry(50, 10, 100, 16),
            new THREE.IcosahedronGeometry(50, 0),
            new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
                new THREE.Vector3(-100, -100, -100),
                new THREE.Vector3(0, 100, 0),
                new THREE.Vector3(100, -100, 100)
            ]), 64, 10, 8, false)
        ];

        const shapeCount = isMobile ? 25 : 50;
        for (let i = 0; i < shapeCount; i++) {
            const geometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            const material = new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
                wireframe: true,
                transparent: true,
                opacity: 0.2,
                emissive: 0x00FFD1,
                emissiveIntensity: 0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000
            );
            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.01;
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.01;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.01;
            sceneGroup.add(mesh);
            shapes.push(mesh);
        }

        // Add event listeners
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);

        // Start the animation loop
        animate();
    }

    /**
     * Handles mouse movement to influence scene rotation.
     * @param {MouseEvent} event
     */
    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    }

    /**
     * Handles touch movement to influence scene rotation.
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
     * Adjusts the renderer and camera when the window is resized.
     */
    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Animates the scene by updating particle positions and rotating shapes.
     */
    function animate() {
        requestAnimationFrame(animate);

        // Update particle positions
        particles.forEach(p => {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;

            // Reverse direction if out of bounds
            if (p.position.x > 1000 || p.position.x < -1000) p.speedX *= -1;
            if (p.position.y > 1000 || p.position.y < -1000) p.speedY *= -1;
            if (p.position.z > 1000 || p.position.z < -1000) p.speedZ *= -1;

            // Rotate the sprite
            p.rotation += p.rotationSpeed;
        });

        // Rotate shapes
        shapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
        });

        // Rotate scene group
        sceneGroup.rotation.y += 0.0005;
        sceneGroup.rotation.x += 0.0005;

        // Smooth rotation based on mouse movement
        const targetRotationY = mouseX * 0.05;
        const targetRotationX = mouseY * 0.05;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;

        // Render the scene
        renderer.render(scene, camera);
    }

    // Initialize the scene
    init();

    /**
     * Hides the preloader after the window has fully loaded.
     */
    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1500);
    };

    /**
     * Handles form submission by constructing the email and redirecting to the login URL.
     * @param {Event} event
     */
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

    /**
     * Prevents form submission when the Enter key is pressed in the input fields.
     * @param {KeyboardEvent} event
     */
    form.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && event.target.tagName !== 'BUTTON') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});
