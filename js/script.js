import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer, sceneGroup;
    const particles = [];
    const shapes = [];
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2;
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    const CONFIG = {
        PARTICLE_COUNT: isMobile ? 600 : 1000, // Increased particle count for better density
        SHAPE_COUNT: isMobile ? 60 : 100,      // Increased shape count for more variety
        MIN_DISTANCE: 200,                      // Reduced minimum distance for closer proximity
        PARTICLE_SIZE: isMobile ? 150 : 200,    // Increased particle size
        SHAPE_SIZE: isMobile ? 120 : 150,       // Increased shape size
        PARTICLE_SPEED: isMobile ? 1.5 : 2.5,   // Slightly increased particle speed
        ROTATION_SPEED: isMobile ? 0.003 : 0.005, // Increased rotation speed for livelier motion
        TEXTURE_SIZE: isMobile ? 256 : 512,     // Increased texture size for higher resolution
        SHADOW_BLUR: isMobile ? 15 : 30,        // Increased shadow blur for a more pronounced glow
        LIGHT_INTENSITY: isMobile ? 0.8 : 1.0,  // Increased light intensity for better illumination
        AMBIENT_COLOR: 0x1E90FF,
        DIRECTIONAL_COLOR: 0x9370DB,
        BACKGROUND_COLOR: 0x0A0A0A,
        PARTICLE_COLOR_1: 0x1E90FF,
        PARTICLE_COLOR_2: 0xBA55D3,
        SHAPE_COLOR: 0xBA55D3,
        EMISSIVE_COLOR: 0x9370DB,
        MAX_PIXEL_RATIO: isMobile ? Math.min(window.devicePixelRatio, 2) : Math.min(window.devicePixelRatio, 2)
    };

    const TEXTURE_CACHE_SIZE = 100; // Increased cache size to accommodate higher resolution textures
    const textureCache = [];

    const createTextTexture = (char) => {
        if (textureCache.length >= TEXTURE_CACHE_SIZE) {
            return textureCache[Math.floor(Math.random() * TEXTURE_CACHE_SIZE)];
        }
        const canvas = document.createElement('canvas');
        const size = CONFIG.TEXTURE_SIZE;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#1E90FF');
        gradient.addColorStop(1, '#BA55D3');
        ctx.font = `${size * 0.8}px 'Urbanist', sans-serif`; // Increased font size
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#9370DB';
        ctx.shadowBlur = CONFIG.SHADOW_BLUR;
        ctx.globalAlpha = 0.9; // Slightly increased opacity for better visibility
        ctx.fillText(char, size / 2, size / 2);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        textureCache.push(texture);
        return texture;
    };

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

    const getRandomCyrillicCharacter = () => {
        const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Э', 'Ю', 'Я'];
        return letters[Math.floor(Math.random() * letters.length)];
    };

    const getRandomCharacter = () => Math.random() < 0.5 ? getRandomHangulCharacter() : getRandomCyrillicCharacter();

    const getRandomPosition = (existingShapes, radius) => {
        let position, tooClose, attempts = 0;
        do {
            position = new THREE.Vector3(
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000
            );
            tooClose = existingShapes.some(shape => position.distanceTo(shape.position) < CONFIG.MIN_DISTANCE + radius);
            attempts++;
            if (attempts > 100) break;
        } while (tooClose);
        return position;
    };

    const init = () => {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: !isMobile,
            alpha: true,
            powerPreference: isMobile ? 'low-power' : 'default'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(CONFIG.MAX_PIXEL_RATIO, 2));
        renderer.setClearColor(CONFIG.BACKGROUND_COLOR, 1);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 1200 : 1800; // Adjusted camera position for better visibility

        const ambientLight = new THREE.AmbientLight(CONFIG.AMBIENT_COLOR, CONFIG.LIGHT_INTENSITY);
        const directionalLight = new THREE.DirectionalLight(CONFIG.DIRECTIONAL_COLOR, CONFIG.LIGHT_INTENSITY);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(ambientLight, directionalLight);

        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        createParticles();
        createShapes();

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);

        animate();
    };

    const createParticles = () => {
        const uniqueChars = 30; // Increased number of unique characters for variety
        const characters = Array.from({ length: uniqueChars }, () => getRandomCharacter());
        characters.forEach(char => textureCache.push(createTextTexture(char)));

        for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
            const char = characters[Math.floor(Math.random() * uniqueChars)];
            const texture = createTextTexture(char);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: 0.95 // Increased opacity for better visibility
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
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.02; // Increased rotation speed
            sceneGroup.add(sprite);
            particles.push(sprite);
        }
    };

    const createShapes = () => {
        const geometryTypes = [
            THREE.TetrahedronGeometry,
            THREE.OctahedronGeometry,
            THREE.IcosahedronGeometry,
            THREE.DodecahedronGeometry
        ];

        for (let i = 0; i < CONFIG.SHAPE_COUNT; i++) {
            const GeometryClass = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            const geometry = new GeometryClass(CONFIG.SHAPE_SIZE, 1);
            const material = new THREE.MeshStandardMaterial({
                color: CONFIG.SHAPE_COLOR,
                wireframe: true,
                transparent: true,
                opacity: 0.5, // Increased opacity for better visibility
                emissive: CONFIG.EMISSIVE_COLOR,
                emissiveIntensity: 0.7, // Increased emissive intensity
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(getRandomPosition(shapes, CONFIG.SHAPE_SIZE));
            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.03; // Increased rotation speed
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.03;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.03;
            sceneGroup.add(mesh);
            shapes.push(mesh);
        }
    };

    const onDocumentMouseMove = (event) => {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    };

    const onDocumentTouchMove = (event) => {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX) / windowHalfX;
            mouseY = (event.touches[0].pageY - windowHalfY) / windowHalfY;
        }
    };

    const onWindowResize = () => {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const animate = () => {
        requestAnimationFrame(animate);
        particles.forEach(p => {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;
            p.material.rotation += p.rotationSpeed;
            if (Math.abs(p.position.x) > 2500) p.speedX *= -1;
            if (Math.abs(p.position.y) > 2500) p.speedY *= -1;
            if (Math.abs(p.position.z) > 2500) p.speedZ *= -1;
        });
        shapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
        });
        sceneGroup.rotation.y += CONFIG.ROTATION_SPEED;
        sceneGroup.rotation.x += CONFIG.ROTATION_SPEED * 0.75;
        const targetRotationY = mouseX * 0.05;
        const targetRotationX = mouseY * 0.05;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;
        renderer.render(scene, camera);
    };

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

    const initializeScene = () => {
        init();
    };

    initializeScene();

    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 800); // Slightly reduced delay for faster visibility
    };

    form.addEventListener('submit', handleFormSubmit);
    form.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});
