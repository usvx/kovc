import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
// Post-processing scripts should be included in your HTML as shown above.

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form'),
          preloader = document.getElementById('preloader');
    let scene, camera, renderer,
        particles = [],
        torusKnotShapes = [],
        sceneGroup,
        composer, bloomPass,
        mouseX = 0, mouseY = 0,
        windowHalfX = window.innerWidth / 2,
        windowHalfY = window.innerHeight / 2,
        isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    const MIN_DISTANCE = 300;
    let particleCount, shapeCount, shapeRadius;

    function getRandomColor() {
        const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#8E44AD', '#FF793F'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function createTextTexture(char) {
        const canvas = document.createElement('canvas'),
              size = isMobile ? 256 : 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);

        // Use a random vibrant gradient
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        const color1 = getRandomColor();
        const color2 = getRandomColor();
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);

        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = gradient;
        ctx.shadowColor = color2;
        ctx.shadowBlur = isMobile ? 30 : 50;
        ctx.fillText(char, size / 2, size / 2);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function getRandomHangulCharacter() {
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
        return Math.random() < 0.7 ? getRandomHangulCharacter() : getRandomCyrillicCharacter();
    }

    function getRandomPosition(existingShapes, radius) {
        let position;
        let tooClose;
        do {
            position = new THREE.Vector3(
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000
            );
            tooClose = existingShapes.some(shape => {
                const distance = position.distanceTo(shape.position);
                return distance < MIN_DISTANCE + radius;
            });
        } while (tooClose);
        return position;
    }

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 800 : 1200;

        // Enhanced Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(ambientLight, directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
        pointLight.position.set(-50, 50, 50);
        scene.add(pointLight);

        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        // Responsive Counts
        if (isMobile) {
            particleCount = 600;
            shapeCount = 60;
            shapeRadius = 60;
        } else {
            particleCount = 1600;
            shapeCount = 120;
            shapeRadius = 120;
        }

        // Create Particles
        for (let i = 0; i < particleCount; i++) {
            const char = getRandomCharacter(),
                  texture = createTextTexture(char),
                  material = new THREE.SpriteMaterial({ 
                      map: texture, 
                      transparent: true, 
                      blending: THREE.AdditiveBlending, 
                      alphaTest: 0.5
                  }),
                  sprite = new THREE.Sprite(material);
            sprite.position.set((Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000);
            sprite.scale.set(isMobile ? 150 : 200, isMobile ? 150 : 200, 1);
            sprite.speedX = (Math.random() - 0.5) * (isMobile ? 1.5 : 3);
            sprite.speedY = (Math.random() - 0.5) * (isMobile ? 1.5 : 3);
            sprite.speedZ = (Math.random() - 0.5) * (isMobile ? 1.5 : 3);
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.05;
            sceneGroup.add(sprite);
            particles.push(sprite);
        }

        // Create Geometric Shapes
        for (let i = 0; i < shapeCount; i++) {
            let geometry;
            const shapeType = Math.random();
            if (shapeType < 0.33) {
                geometry = new THREE.TorusKnotGeometry(shapeRadius * 0.5, shapeRadius * 0.15, 100, 16);
            } else if (shapeType < 0.66) {
                geometry = new THREE.SphereGeometry(shapeRadius * 0.3, 32, 32);
            } else {
                geometry = new THREE.BoxGeometry(shapeRadius * 0.4, shapeRadius * 0.4, shapeRadius * 0.4);
            }

            const material = new THREE.MeshPhongMaterial({
                color: getRandomColor(),
                wireframe: false,
                shininess: 100,
                emissive: 0x8A2BE2,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(getRandomPosition(torusKnotShapes, shapeRadius));
            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.02;
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.02;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.02;
            sceneGroup.add(mesh);
            torusKnotShapes.push(mesh);
        }

        // Post-Processing Setup
        composer = new THREE.EffectComposer(renderer);
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);

        bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, // strength
            0.4, // radius
            0.85 // threshold
        );
        composer.addPass(bloomPass);

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
        composer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        particles.forEach(p => {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;
            p.material.rotation += p.rotationSpeed;
            if (p.position.x > 2000 || p.position.x < -2000) p.speedX *= -1;
            if (p.position.y > 2000 || p.position.y < -2000) p.speedY *= -1;
            if (p.position.z > 2000 || p.position.z < -2000) p.speedZ *= -1;

            // Interactive movement towards mouse
            p.position.x += (mouseX * 10 - p.position.x) * 0.001;
            p.position.y += (-mouseY * 10 - p.position.y) * 0.001;
        });
        torusKnotShapes.forEach(s => {
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
        composer.render();
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
