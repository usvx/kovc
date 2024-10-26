import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');
    let scene, camera, renderer, sceneGroup;
    const particles = [];
    const shapes = [];
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = isMobile ? 256 : 512;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const gradient = ctx.createLinearGradient(0, 0, size, size);
        const hue = (Math.random() * 360) % 360;
        gradient.addColorStop(0, `hsl(${hue}, 100%, 80%)`);
        gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 100%, 60%)`);
        ctx.fillStyle = gradient;
        ctx.shadowColor = `hsl(${(hue + 180) % 360}, 100%, 40%)`;
        ctx.shadowBlur = isMobile ? 40 : 60;
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

        const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
        return String.fromCharCode(syllableCode);
    }

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
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputEncoding = THREE.sRGBEncoding;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 800 : 1200;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(ambientLight, directionalLight);

        startAnimation();
        window.addEventListener('resize', onWindowResize, false);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function startAnimation() {
        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        const geometry = new THREE.SphereGeometry(isMobile ? 100 : 140, 64, 64);
        const shapeCount = isMobile ? 50 : 100;
        for (let i = 0; i < shapeCount; i++) {
            addShape(geometry);
        }

        const particleCount = isMobile ? 400 : 800;
        for (let i = 0; i < particleCount; i++) {
            addParticle();
        }

        animate();
    }

    function addShape(geometry) {
        const hue = Math.random() * 360;
        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(`hsl(${hue}, 100%, 80%)`),
            emissive: new THREE.Color(`hsl(${(hue + 180) % 360}, 100%, 50%)`),
            emissiveIntensity: 0.8,
            metalness: 0.5,
            roughness: 0.1,
            transmission: 0.95,
            opacity: 0.7,
            transparent: true,
            clearcoat: 1,
            clearcoatRoughness: 0.05,
            reflectivity: 1.0,
            ior: 1.4,
            thickness: 10,
        });
        const mesh = new THREE.Mesh(geometry, material);
        resetPosition(mesh);
        shapes.push(mesh);
        sceneGroup.add(mesh);
    }

    function addParticle() {
        const char = getRandomCharacter();
        const texture = createTextTexture(char);
        const particleGeometry = new THREE.PlaneGeometry(isMobile ? 100 : 150, isMobile ? 100 : 150);
        const hue = Math.random() * 360;
        const material = new THREE.MeshPhysicalMaterial({
            map: texture,
            color: new THREE.Color(`hsl(${hue}, 100%, 70%)`),
            emissive: new THREE.Color(`hsl(${(hue + 180) % 360}, 100%, 60%)`),
            emissiveIntensity: 0.8,
            metalness: 0.4,
            roughness: 0.05,
            transparent: true,
            clearcoat: 1,
            clearcoatRoughness: 0.05,
            reflectivity: 0.9
        });
        const mesh = new THREE.Mesh(particleGeometry, material);
        resetPosition(mesh);
        particles.push(mesh);
        sceneGroup.add(mesh);
    }

    function resetPosition(object) {
        object.position.set(
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 2000
        );
        object.userData = {
            amplitude: Math.random() * 20 + 10,
            speed: Math.random() * 0.02 + 0.005,
            offset: Math.random() * Math.PI * 2
        };
    }

    function animate() {
        requestAnimationFrame(animate);
        const time = Date.now() * 0.001;

        particles.forEach(p => {
            p.position.x += Math.sin(time * p.userData.speed + p.userData.offset) * p.userData.amplitude * 0.1;
            p.position.y += Math.cos(time * p.userData.speed + p.userData.offset) * p.userData.amplitude * 0.1;
            p.lookAt(camera.position);
            p.material.color.offsetHSL(0.0008, 0, 0);
            p.material.emissive.offsetHSL(0.0008, 0, 0);

            if (p.position.length() > 2000) {
                resetPosition(p);
            }
        });

        shapes.forEach(s => {
            s.position.x += Math.sin(time * s.userData.speed + s.userData.offset) * s.userData.amplitude * 0.1;
            s.position.y += Math.cos(time * s.userData.speed + s.userData.offset) * s.userData.amplitude * 0.1;
            s.material.color.offsetHSL(0.0005, 0, 0);
            s.material.emissive.offsetHSL(0.0005, 0, 0);

            if (s.position.length() > 2000) {
                resetPosition(s);
            }
        });

        sceneGroup.rotation.y += 0.003;
        sceneGroup.rotation.x += 0.0018;
        renderer.render(scene, camera);
    }

    init();

    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1500);
    };
});
