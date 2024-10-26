import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

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
        isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    
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
        const hue = Math.random() * 360;
        gradient.addColorStop(0, `hsl(${hue}, 100%, 70%)`);
        gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 100%, 50%)`);
        ctx.fillStyle = gradient;
        ctx.shadowColor = `hsl(${(hue + 180) % 360}, 100%, 30%)`;
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

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.physicallyCorrectLights = true;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 800 : 1200;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5),
              directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(ambientLight, directionalLight);

        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        new THREE.TextureLoader().load('https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr', (texture) => {
            const hdrEquirect = texture;
            hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = hdrEquirect;
            pmremGenerator.dispose();
            startAnimation();
        });
    }

    function startAnimation() {
        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        const geometry = new THREE.SphereGeometry(isMobile ? 80 : 120, 64, 64);
        const shapeCount = isMobile ? 100 : 150;
        for (let i = 0; i < shapeCount; i++) {
            const hue = Math.random() * 360;
            const material = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
                metalness: 0,
                roughness: 0,
                transmission: 1,
                opacity: 1,
                transparent: true,
                clearcoat: 1,
                clearcoatRoughness: 0,
                reflectivity: 1,
                ior: 1.5,
                thickness: 2,
                envMapIntensity: 1
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set((Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000);
            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.05;
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.05;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.05;
            sceneGroup.add(mesh);
            shapes.push(mesh);
        }

        const particleCount = isMobile ? 800 : 1600;
        for (let i = 0; i < particleCount; i++) {
            const char = getRandomCharacter(),
                  texture = createTextTexture(char),
                  geometry = new THREE.PlaneGeometry(isMobile ? 150 : 200, isMobile ? 150 : 200),
                  hue = Math.random() * 360,
                  material = new THREE.MeshPhysicalMaterial({
                      map: texture,
                      color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
                      metalness: 0,
                      roughness: 0,
                      transmission: 1,
                      opacity: 1,
                      transparent: true,
                      clearcoat: 1,
                      clearcoatRoughness: 0,
                      reflectivity: 1,
                      ior: 1.5,
                      thickness: 2,
                      side: THREE.DoubleSide,
                      envMapIntensity: 1
                  }),
                  mesh = new THREE.Mesh(geometry, material);
            mesh.position.set((Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000);
            mesh.speedX = (Math.random() - 0.5) * (isMobile ? 1.5 : 3);
            mesh.speedY = (Math.random() - 0.5) * (isMobile ? 1.5 : 3);
            mesh.speedZ = (Math.random() - 0.5) * (isMobile ? 1.5 : 3);
            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.05;
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.05;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.05;
            sceneGroup.add(mesh);
            particles.push(mesh);
        }

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
    }

    function animate() {
        requestAnimationFrame(animate);
        particles.forEach(p => {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;
            p.rotation.x += p.rotationSpeedX;
            p.rotation.y += p.rotationSpeedY;
            p.rotation.z += p.rotationSpeedZ;
            if (p.position.x > 2000 || p.position.x < -2000) p.speedX *= -1;
            if (p.position.y > 2000 || p.position.y < -2000) p.speedY *= -1;
            if (p.position.z > 2000 || p.position.z < -2000) p.speedZ *= -1;
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
        renderer.render(scene, camera);
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
