import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');
    const canvas = document.getElementById('background');

    let scene, camera, renderer, particles = [], torusKnotShapes = [];
    let mouseX = 0, mouseY = 0;
    let isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    const MIN_DISTANCE = 300;
    const PARTICLE_COUNT = isMobile ? 800 : 1600;
    const TORUS_COUNT = isMobile ? 80 : 120;
    const TORUS_RADIUS = isMobile ? 80 : 120;

    function createTextTexture(char) {
        const size = isMobile ? 256 : 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#00FFFF');
        gradient.addColorStop(1, '#8A2BE2');
        
        ctx.fillStyle = gradient;
        ctx.fillText(char, size / 2, size / 2);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    // Function to get a random Hangul character
    function getRandomHangulCharacter() {
        const commonInitials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112];
        const commonMedials = [0x1161, 0x1163, 0x1165, 0x1167, 0x1169, 0x116D, 0x1162, 0x1164, 0x1166, 0x1168, 0x116A];
        const commonFinals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA, 0x11C2];
        
        const initial = commonInitials[Math.floor(Math.random() * commonInitials.length)];
        const medial = commonMedials[Math.floor(Math.random() * commonMedials.length)];
        const final = commonFinals[Math.floor(Math.random() * commonFinals.length)];
        
        const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
        return String.fromCharCode(syllableCode);
    }

    // Function to get a random Cyrillic character
    function getRandomCyrillicCharacter() {
        const start = 0x0410;
        const end = 0x042F;
        const code = Math.floor(Math.random() * (end - start + 1)) + start;
        return String.fromCharCode(code);
    }

    function getRandomCharacter() {
        return Math.random() < 0.7 ? getRandomHangulCharacter() : getRandomCyrillicCharacter();
    }

    function init() {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 800 : 1200;

        scene.add(new THREE.AmbientLight(0x00FFFF, 1));
        const directionalLight = new THREE.DirectionalLight(0x8A2BE2, 1);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);

        const sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const texture = createTextTexture(getRandomCharacter());
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true, blending: THREE.AdditiveBlending });
            const sprite = new THREE.Sprite(material);
            sprite.position.set((Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000);
            sprite.scale.set(isMobile ? 150 : 200, isMobile ? 150 : 200, 1);
            particles.push(sprite);
            sceneGroup.add(sprite);
        }

        for (let i = 0; i < TORUS_COUNT; i++) {
            const geometry = new THREE.TorusKnotGeometry(TORUS_RADIUS * 0.5, TORUS_RADIUS * 0.15, 100, 16);
            const material = new THREE.MeshStandardMaterial({ color: 0x00FFFF, wireframe: true, opacity: 0.3, emissive: 0x8A2BE2 });
            const torusKnotMesh = new THREE.Mesh(geometry, material);
            torusKnotMesh.position.set((Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000);
            torusKnotShapes.push(torusKnotMesh);
            sceneGroup.add(torusKnotMesh);
        }

        animate(sceneGroup);
        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener('mousemove', onMouseMove);
    }

    function animate(sceneGroup) {
        requestAnimationFrame(() => animate(sceneGroup));
        
        particles.forEach(p => {
            p.position.x += (Math.random() - 0.5) * (isMobile ? 1.5 : 3);
            p.position.y += (Math.random() - 0.5) * (isMobile ? 1.5 : 3);
            p.position.z += (Math.random() - 0.5) * (isMobile ? 1.5 : 3);
        });

        torusKnotShapes.forEach(s => {
            s.rotation.x += 0.01;
            s.rotation.y += 0.01;
        });

        renderer.render(scene, camera);
    }

    function onMouseMove(event) {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = (event.clientY / window.innerHeight) * 2 - 1;
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    init();
});
