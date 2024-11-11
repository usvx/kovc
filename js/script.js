import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer, sceneGroup;
    const particles = [];
    const spheres = [];
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2;
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    const CONFIG = {
        PARTICLE_COUNT: isMobile ? 800 : 1200,
        SPHERE_COUNT: isMobile ? 20 : 40,
        PARTICLE_SIZE: isMobile ? 100 : 150,
        SPHERE_SIZE: isMobile ? 60 : 80,
        PARTICLE_SPEED: 1,
        ROTATION_SPEED: 0.002,
        TEXTURE_SIZE: 256,
        SHADOW_BLUR: 20,
        BACKGROUND_COLOR: 0x000000,
        MAX_PIXEL_RATIO: Math.min(window.devicePixelRatio, 2),
    };

    const textureLoader = new THREE.TextureLoader();
    const particleTexture = textureLoader.load('path/to/particle-texture.png'); // Add a custom particle texture

    const init = () => {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(CONFIG.MAX_PIXEL_RATIO);
        renderer.setClearColor(CONFIG.BACKGROUND_COLOR, 1);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
        camera.position.z = isMobile ? 800 : 1200;

        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        createParticles();
        createSpheres();

        window.addEventListener('mousemove', onMouseMove, false);
        window.addEventListener('resize', onWindowResize, false);

        animate();
    };

    const createParticles = () => {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];

        for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
            positions.push(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000
            );
            velocities.push(
                (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED,
                (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED,
                (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));

        const material = new THREE.PointsMaterial({
            size: CONFIG.PARTICLE_SIZE,
            map: particleTexture,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
            color: new THREE.Color('#0ff'),
        });

        const points = new THREE.Points(geometry, material);
        sceneGroup.add(points);
        particles.push(points);
    };

    const createSpheres = () => {
        const geometry = new THREE.SphereGeometry(CONFIG.SPHERE_SIZE, 32, 32);
        const material = new THREE.MeshPhysicalMaterial({
            color: '#8a2be2',
            metalness: 0,
            roughness: 0,
            transmission: 1,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
        });

        for (let i = 0; i < CONFIG.SPHERE_COUNT; i++) {
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000
            );
            sceneGroup.add(sphere);
            spheres.push(sphere);
        }
    };

    const onMouseMove = (event) => {
        mouseX = (event.clientX - windowHalfX) / 2;
        mouseY = (event.clientY - windowHalfY) / 2;
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

        sceneGroup.rotation.x += (mouseY / window.innerHeight - sceneGroup.rotation.x) * 0.05;
        sceneGroup.rotation.y += (mouseX / window.innerWidth - sceneGroup.rotation.y) * 0.05;

        particles.forEach(particle => {
            const positions = particle.geometry.attributes.position.array;
            const velocities = particle.geometry.attributes.velocity.array;

            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2];

                if (positions[i] > 1000 || positions[i] < -1000) velocities[i] *= -1;
                if (positions[i + 1] > 1000 || positions[i + 1] < -1000) velocities[i + 1] *= -1;
                if (positions[i + 2] > 1000 || positions[i + 2] < -1000) velocities[i + 2] *= -1;
            }

            particle.geometry.attributes.position.needsUpdate = true;
        });

        renderer.render(scene, camera);
    };

    const handleFormSubmit = (event) => {
        event.preventDefault();
        const username = form.username.value.trim();
        const domain = form.domain.value;
        if (username && domain) {
            const email = `${username}${domain}`;
            const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/`;
            window.location.href = loginUrl;
        }
    };

    init();

    window.onload = () => {
        preloader.style.opacity = '0';
        preloader.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    };

    form.addEventListener('submit', handleFormSubmit);
});
