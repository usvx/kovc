// Import necessary Three.js modules from CDN
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/BokehPass.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form'),
          preloader = document.getElementById('preloader');
    let scene, camera, renderer,
        particles = [],
        shapes = [],
        sceneGroup,
        mouseX = 0, mouseY = 0,
        windowHalfX = window.innerWidth / 2,
        windowHalfY = window.innerHeight / 2,
        isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent),
        composer, bloomPass, renderPass, depthOfFieldPass;

    // Initialize Post-Processing
    function initPostProcessing() {
        composer = new EffectComposer(renderer);
        renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        // Bloom Effect
        bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0;
        bloomPass.strength = 1.5;
        bloomPass.radius = 0;
        composer.addPass(bloomPass);

        // Depth of Field Effect
        depthOfFieldPass = new BokehPass(scene, camera, {
            focus: 1.0,
            aperture: 0.025,
            maxblur: 0.01,

            width: window.innerWidth,
            height: window.innerHeight
        });
        depthOfFieldPass.renderToScreen = true;
        composer.addPass(depthOfFieldPass);
    }

    function createTextTexture(char) {
        const canvas = document.createElement('canvas'),
              size = isMobile ? 256 : 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
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

    function getRandomHangeulCharacter() {
        const commonInitials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112],
              commonMedials = [0x1161, 0x1163, 0x1165, 0x1167, 0x1169, 0x116D, 0x1162, 0x1164, 0x1166, 0x1168, 0x116A],
              commonFinals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA, 0x11C2];
        const initial = commonInitials[Math.floor(Math.random() * commonInitials.length)],
              medial = commonMedials[Math.floor(Math.random() * commonMedials.length)],
              final = commonFinals[Math.floor(Math.random() * commonFinals.length)];
        const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
        return String.fromCharCode(syllableCode);
    }

    function getRandomCyrillicCharacter() {
        const start = 0x0410,
              end = 0x042F,
              code = Math.floor(Math.random() * (end - start + 1)) + start;
        return String.fromCharCode(code);
    }

    function getRandomCharacter() {
        return Math.random() < 0.7 ? getRandomHangeulCharacter() : getRandomCyrillicCharacter();
    }

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        scene = new THREE.Scene();

        // Camera Setup with Depth of Field
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 800 : 1200;

        // Advanced Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
        const pointLight1 = new THREE.PointLight(0x00FFFF, 1, 5000);
        pointLight1.position.set(1000, 2000, 3000);
        const pointLight2 = new THREE.PointLight(0x8A2BE2, 1, 5000);
        pointLight2.position.set(-1000, -2000, -3000);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 0).normalize();
        scene.add(ambientLight, pointLight1, pointLight2, directionalLight);

        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        // Initialize Post-Processing
        initPostProcessing();

        // Adjust particle and shape counts based on device type
        const particleCount = isMobile ? 1200 : 2400; // Increased for more density
        for (let i = 0; i < particleCount; i++) {
            const char = getRandomCharacter(),
                  texture = createTextTexture(char),
                  material = new THREE.SpriteMaterial({ 
                      map: texture, 
                      transparent: true, 
                      blending: THREE.AdditiveBlending,
                      depthWrite: false // Improve performance with additive blending
                  }),
                  sprite = new THREE.Sprite(material);
            sprite.position.set(
                (Math.random() - 0.5) * 5000, 
                (Math.random() - 0.5) * 5000, 
                (Math.random() - 0.5) * 5000
            );
            sprite.scale.set(isMobile ? 150 : 200, isMobile ? 150 : 200, 1);
            sprite.speedX = (Math.random() - 0.5) * (isMobile ? 1.5 : 3);
            sprite.speedY = (Math.random() - 0.5) * (isMobile ? 1.5 : 3);
            sprite.speedZ = (Math.random() - 0.5) * (isMobile ? 1.5 : 3);
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.05;
            sceneGroup.add(sprite);
            particles.push(sprite);
        }

        const geometryTypes = [
            THREE.TetrahedronGeometry, 
            THREE.OctahedronGeometry, 
            THREE.IcosahedronGeometry, 
            THREE.DodecahedronGeometry,
            THREE.BoxGeometry, // Added more geometry types
            THREE.SphereGeometry
        ];
        const shapeCount = isMobile ? 150 : 300; // Increased for more immersion
        for (let i = 0; i < shapeCount; i++) {
            const GeometryClass = geometryTypes[Math.floor(Math.random() * geometryTypes.length)],
                  geometry = new GeometryClass(
                      isMobile ? 80 : 120, 
                      Math.floor(Math.random() * 3) + 1 // Varying detail levels
                  ),
                  material = new THREE.MeshStandardMaterial({
                      color: new THREE.Color(Math.random(), Math.random(), Math.random()),
                      wireframe: Math.random() < 0.5, // Random wireframe toggle
                      transparent: true,
                      opacity: 0.4,
                      emissive: 0x8A2BE2,
                      emissiveIntensity: Math.random(),
                      side: THREE.DoubleSide
                  }),
                  mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * 5000, 
                (Math.random() - 0.5) * 5000, 
                (Math.random() - 0.5) * 5000
            );
            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.02;
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.02;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.02;
            sceneGroup.add(mesh);
            shapes.push(mesh);
        }

        // Enhanced Interactivity
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);
        animate();
    }

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    }

    function onDocumentTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX) / windowHalfX;
            mouseY = (event.touches[0].pageY - windowHalfY) / windowHalfY;
        }
    }

    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (composer) {
            composer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        particles.forEach(p => {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;
            p.material.rotation += p.rotationSpeed;
            // Boundary Check with Extended Limits
            const limit = 2500;
            if (p.position.x > limit || p.position.x < -limit) p.speedX *= -1;
            if (p.position.y > limit || p.position.y < -limit) p.speedY *= -1;
            if (p.position.z > limit || p.position.z < -limit) p.speedZ *= -1;
        });
        shapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
        });
        sceneGroup.rotation.y += 0.003;
        sceneGroup.rotation.x += 0.0025;
        const targetRotationY = mouseX * 0.1;
        const targetRotationX = mouseY * 0.1;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;
        // Use composer for post-processing
        if (composer) {
            composer.render();
        } else {
            renderer.render(scene, camera);
        }
    }

    init();
    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1500);
    };
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = form.username.value.trim(),
              domainSelect = form.querySelector('select[name="domain"]'),
              domain = domainSelect.value;
        if (username && domain) {
            const email = `${username}${domain}`,
                  loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/`;
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
