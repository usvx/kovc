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
        PARTICLE_COUNT: isMobile ? 400 : 800,
        SHAPE_COUNT: isMobile ? 40 : 80,
        MIN_DISTANCE: 250,
        PARTICLE_SIZE: isMobile ? 100 : 150,
        SHAPE_SIZE: isMobile ? 60 : 90,
        PARTICLE_SPEED: isMobile ? 1.0 : 2.0,
        ROTATION_SPEED: isMobile ? 0.002 : 0.004,
        TEXTURE_SIZE: isMobile ? 128 : 256,
        SHADOW_BLUR: isMobile ? 10 : 25,
        LIGHT_INTENSITY: isMobile ? 0.6 : 0.8,
        AMBIENT_COLOR: 0x1E90FF,
        DIRECTIONAL_COLOR: 0x9370DB,
        BACKGROUND_COLOR: 0x0A0A0A,
        PARTICLE_COLOR_1: 0x1E90FF,
        PARTICLE_COLOR_2: 0xBA55D3,
        SHAPE_COLOR: 0xBA55D3,
        EMISSIVE_COLOR: 0x9370DB,
        MAX_PIXEL_RATIO: isMobile ? 1.0 : Math.min(window.devicePixelRatio, 2)
    };

    const textureCache = [];
    const TEXTURE_CACHE_SIZE = 50;

    function initRenderer() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: !isMobile, 
            alpha: true, 
            powerPreference: isMobile ? 'low-power' : 'default' 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(CONFIG.MAX_PIXEL_RATIO);
        renderer.setClearColor(CONFIG.BACKGROUND_COLOR, 1);
    }

    function initScene() {
        scene = new THREE.Scene();
        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);
    }

    function initCamera() {
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 1000 : 1500;
    }

    function addLighting() {
        const ambientLight = new THREE.AmbientLight(CONFIG.AMBIENT_COLOR, CONFIG.LIGHT_INTENSITY);
        const directionalLight = new THREE.DirectionalLight(CONFIG.DIRECTIONAL_COLOR, CONFIG.LIGHT_INTENSITY);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(ambientLight, directionalLight);
    }

    function createTextTexture(char) {
        if (textureCache.length >= TEXTURE_CACHE_SIZE) {
            return textureCache[Math.floor(Math.random() * TEXTURE_CACHE_SIZE)];
        }
        const canvas = document.createElement('canvas');
        const size = CONFIG.TEXTURE_SIZE;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#1E90FF');
        gradient.addColorStop(1, '#BA55D3');

        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#9370DB';
        ctx.shadowBlur = CONFIG.SHADOW_BLUR;
        ctx.globalAlpha = 0.85;
        ctx.fillText(char, size / 2, size / 2);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        textureCache.push(texture);
        return texture;
    }

    function getRandomCharacter() {
        return Math.random() < 0.5 ? getRandomHangulCharacter() : getRandomCyrillicCharacter();
    }

    function getRandomHangulCharacter() {
        const hangeulInitials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112];
        const hangeulMedials = [0x1161, 0x1163, 0x1165, 0x1167, 0x1169, 0x116D, 0x1162, 0x1164, 0x1166, 0x1168, 0x116A];
        const hangeulFinals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA, 0x11C2];
        const initial = hangeulInitials[Math.floor(Math.random() * hangeulInitials.length)];
        const medial = hangeulMedials[Math.floor(Math.random() * hangeulMedials.length)];
        const final = hangeulFinals[Math.floor(Math.random() * hangeulFinals.length)];
        return String.fromCharCode(0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0));
    }

    function getRandomCyrillicCharacter() {
        const cyrillicLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Э', 'Ю', 'Я'];
        return cyrillicLetters[Math.floor(Math.random() * cyrillicLetters.length)];
    }

    function createParticles() {
        const uniqueChars = 20;
        const characters = Array.from({ length: uniqueChars }, getRandomCharacter);
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
            sprite.position.set((Math.random() - 0.5) * 5000, (Math.random() - 0.5) * 5000, (Math.random() - 0.5) * 5000);
            sprite.scale.set(CONFIG.PARTICLE_SIZE, CONFIG.PARTICLE_SIZE, 1);
            sprite.speedX = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.speedY = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.speedZ = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.015;
            sceneGroup.add(sprite);
            particles.push(sprite);
        }
    }

    function animate() {
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
        sceneGroup.rotation.y += CONFIG.ROTATION_SPEED;
        sceneGroup.rotation.x += CONFIG.ROTATION_SPEED * 0.75;
        renderer.render(scene, camera);
    }

    function initSceneAndStart() {
        initRenderer();
        initScene();
        initCamera();
        addLighting();
        createParticles();
        animate();
    }

    initSceneAndStart();

    window.addEventListener('resize', () => {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
