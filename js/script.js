import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer, sceneGroup;
    const particles = [];
    const torusKnotShapes = [];
    let mouseX = 0, mouseY = 0;
    const MIN_DISTANCE = 300;
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    const windowHalfX = () => window.innerWidth / 2;
    const windowHalfY = () => window.innerHeight / 2;

    const settings = {
        size: isMobile ? 256 : 512,
        particleCount: isMobile ? 800 : 1600,
        shapeCount: isMobile ? 80 : 120,
        radius: isMobile ? 80 : 120,
        cameraZ: isMobile ? 800 : 1200,
        fontScale: isMobile ? 0.6 : 1,
    };

    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const { size, fontScale } = settings;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * fontScale}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#00FFFF');
        gradient.addColorStop(1, '#8A2BE2');
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#4B0082';
        ctx.shadowBlur = isMobile ? 30 : 50;
        
        ctx.fillText(char, size / 2, size / 2);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function getRandomHangulCharacter() {
        const initials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112];
        const medials = [0x1161, 0x1163, 0x1165, 0x1167, 0x1169, 0x116D, 0x1162, 0x1164, 0x1166, 0x1168, 0x116A];
        const finals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA, 0x11C2];
        
        const initial = initials[Math.floor(Math.random() * initials.length)];
        const medial = medials[Math.floor(Math.random() * medials.length)];
        const final = finals[Math.floor(Math.random() * finals.length)];

        return String.fromCharCode(0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0));
    }

    function getRandomCyrillicCharacter() {
        return String.fromCharCode(Math.floor(Math.random() * (0x042F - 0x0410 + 1)) + 0x0410);
    }

    function getRandomCharacter() {
        return Math.random() < 0.7 ? getRandomHangulCharacter() : getRandomCyrillicCharacter();
    }

    function getRandomPosition(radius) {
        let position;
        let tooClose;
        do {
            position = new THREE.Vector3(
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000
            );
            tooClose = torusKnotShapes.some(shape => position.distanceTo(shape.position) < MIN_DISTANCE + radius);
        } while (tooClose);
        return position;
    }

    function initScene() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = settings.cameraZ;

        const ambientLight = new THREE.AmbientLight(0x00FFFF, 1);
        const directionalLight = new THREE.DirectionalLight(0x8A2BE2, 1);
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
    }

    function createParticles() {
        for (let i = 0; i < settings.particleCount; i++) {
            const char = getRandomCharacter();
            const texture = createTextTexture(char);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                alphaTest: 0.5
            });
            const sprite = new THREE.Sprite(material);
            sprite.position.set((Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000);
            sprite.scale.set(isMobile ? 150 : 200, isMobile ? 150 : 200, 1);
            sprite.speed = { x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 3, z: (Math.random() - 0.5) * 3 };
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.05;
            sceneGroup.add(sprite);
            particles.push(sprite);
        }
    }

    function createShapes() {
        for (let i = 0; i < settings.shapeCount; i++) {
            const geometry = new THREE.TorusKnotGeometry(settings.radius * 0.5, settings.radius * 0.15, 100, 16);
            const material = new THREE.MeshStandardMaterial({
                color: 0x00FFFF,
                wireframe: true,
                transparent: true,
                opacity: 0.3,
                emissive: 0x8A2BE2,
                emissiveIntensity: 0.8,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(getRandomPosition(settings.radius));
            mesh.rotationSpeed = { x: (Math.random() - 0.5) * 0.05, y: (Math.random() - 0.5) * 0.05, z: (Math.random() - 0.5) * 0.05 };
            sceneGroup.add(mesh);
            torusKnotShapes.push(mesh);
        }
    }

    function animate() {
        requestAnimationFrame(animate);

        particles.forEach(p => {
            p.position.x += p.speed.x;
            p.position.y += p.speed.y;
            p.position.z += p.speed.z;
            p.material.rotation += p.rotationSpeed;
            ['x', 'y', 'z'].forEach(axis => {
                if (Math.abs(p.position[axis]) > 2000) p.speed[axis] *= -1;
            });
        });

        torusKnotShapes.forEach(shape => {
            shape.rotation.x += shape.rotationSpeed.x;
            shape.rotation.y += shape.rotationSpeed.y;
            shape.rotation.z += shape.rotationSpeed.z;
        });

        sceneGroup.rotation.y += 0.003;
        sceneGroup.rotation.x += 0.0025;

        sceneGroup.rotation.y += (mouseX * 0.1 - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (mouseY * 0.1 - sceneGroup.rotation.x) * 0.05;

        renderer.render(scene, camera);
    }

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX()) / windowHalfX();
        mouseY = (event.clientY - windowHalfY()) / windowHalfY();
    }

    function onDocumentTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX()) / windowHalfX();
            mouseY = (event.touches[0].pageY - windowHalfY()) / windowHalfY();
        }
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.onload = () => {
        setTimeout(() => preloader.style.display = 'none', 1500);
    };

    form.addEventListener('submit', handleSubmit);
    form.addEventListener('keydown', handleKeyDown);

    function handleSubmit(event) {
        event.preventDefault();
        const username = form.username.value.trim();
        const domain = form.querySelector('select[name="domain"]').value;
        if (username && domain) {
            const email = `${username}${domain}`;
            window.location.href = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/`;
        } else {
            alert('Please enter your username and select a domain.');
        }
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    }

    initScene();
});
