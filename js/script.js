import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer, sceneGroup;
    const particles = [];
    const torusKnotShapes = [];
    let mouseX = 0, mouseY = 0;
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    const MIN_DISTANCE = 300;
    const settings = {
        size: isMobile ? 256 : 512,
        particleCount: isMobile ? 800 : 1200,
        shapeCount: isMobile ? 50 : 80,
        radius: isMobile ? 80 : 100,
        cameraZ: isMobile ? 800 : 1000,
    };

    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = settings.size;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add a gradient color
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#8A2BE2');
        gradient.addColorStop(1, '#00FFFF');
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#4B0082';
        ctx.shadowBlur = 20;

        ctx.fillText(char, size / 2, size / 2);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function getRandomCharacter() {
        return Math.random() < 0.5 ? '☆' : '★';
    }

    function initScene() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000013); // Dark color for contrast
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = settings.cameraZ;

        const ambientLight = new THREE.AmbientLight(0x4444ff, 0.7); // Soft blue for cool feel
        const pointLight = new THREE.PointLight(0xff00ff, 0.8);     // Highlighting depth
        pointLight.position.set(200, 200, 200);
        scene.add(ambientLight, pointLight);

        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        createParticles();
        animate();

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        window.addEventListener('resize', onWindowResize, false);
    }

    function createParticles() {
        for (let i = 0; i < settings.particleCount; i++) {
            const char = getRandomCharacter();
            const texture = createTextTexture(char);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
            });

            const sprite = new THREE.Sprite(material);
            sprite.position.set((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000);
            sprite.scale.set(isMobile ? 100 : 150, isMobile ? 100 : 150, 1);
            sprite.speed = {
                x: (Math.random() - 0.5) * 1.5,
                y: (Math.random() - 0.5) * 1.5,
                z: (Math.random() - 0.5) * 1.5,
            };
            sceneGroup.add(sprite);
            particles.push(sprite);
        }
    }

    function animate() {
        requestAnimationFrame(animate);

        particles.forEach(p => {
            p.position.x += p.speed.x;
            p.position.y += p.speed.y;
            p.position.z += p.speed.z;

            // Boundary check for particle movement
            ['x', 'y', 'z'].forEach(axis => {
                if (Math.abs(p.position[axis]) > 1500) p.speed[axis] *= -1;
            });
        });

        // Rotate the entire scene group slowly
        sceneGroup.rotation.y += 0.001;
        sceneGroup.rotation.x += 0.0005;

        // Apply mouse-based subtle rotation
        sceneGroup.rotation.y += (mouseX * 0.01 - sceneGroup.rotation.y) * 0.01;
        sceneGroup.rotation.x += (mouseY * 0.01 - sceneGroup.rotation.x) * 0.01;

        renderer.render(scene, camera);
    }

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - window.innerWidth / 2) / window.innerWidth;
        mouseY = (event.clientY - window.innerHeight / 2) / window.innerHeight;
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    initScene();
});
