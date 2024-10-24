document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');
    let scene, camera, renderer, composer;
    let particles = [];
    let shapes = [];
    let sceneGroup;
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    const envMap = new THREE.CubeTextureLoader().setPath('textures/cube/').load([
        'px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'
    ]);

    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = isMobile ? 128 : 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.5);
        gradient.addColorStop(0, '#00FFAA');
        gradient.addColorStop(1, '#FFAA00');
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#AA00FF';
        ctx.shadowBlur = isMobile ? 20 : 25;
        ctx.fillText(char, size / 2, size / 2);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function getRandomCharacter() {
        const hangulInitials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112];
        const hangulMedials = [0x1161, 0x1165, 0x1166, 0x1167, 0x1169, 0x116E, 0x1172, 0x1173, 0x1175];
        const hangulFinals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA];
        const cyrillicLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Э', 'Ю', 'Я'];

        const isHangul = Math.random() < 0.5;
        if (isHangul) {
            const initial = hangulInitials[Math.floor(Math.random() * hangulInitials.length)];
            const medial = hangulMedials[Math.floor(Math.random() * hangulMedials.length)];
            const final = hangulFinals[Math.floor(Math.random() * hangulFinals.length)];
            const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final - 0x11A7);
            return String.fromCharCode(syllableCode);
        } else {
            return cyrillicLetters[Math.floor(Math.random() * cyrillicLetters.length)];
        }
    }

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.0005);
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
        camera.position.z = isMobile ? 800 : 1000;
        const ambientLight = new THREE.AmbientLight(0x00FFD1, 2);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xFF00FF, 1);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);
        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        const particleCount = isMobile ? 500 : 1000;
        for (let i = 0; i < particleCount; i++) {
            const char = getRandomCharacter();
            const texture = createTextTexture(char);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            const sprite = new THREE.Sprite(material);
            sprite.position.set(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000
            );
            sprite.scale.set(50, 50, 1);
            sprite.speedX = (Math.random() - 0.5) * 0.5;
            sprite.speedY = (Math.random() - 0.5) * 0.5;
            sprite.speedZ = (Math.random() - 0.5) * 0.5;
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.01;
            sceneGroup.add(sprite);
            particles.push(sprite);
        }

        const geometryTypes = [
            new THREE.TorusKnotGeometry(50, 10, 100, 16),
            new THREE.IcosahedronGeometry(50, 0),
            new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
                new THREE.Vector3(-100, -100, -100),
                new THREE.Vector3(0, 100, 0),
                new THREE.Vector3(100, -100, 100)
            ]), 64, 10, 8, false)
        ];

        const shapeCount = isMobile ? 25 : 50;
        for (let i = 0; i < shapeCount; i++) {
            const geometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            const material = new THREE.MeshPhysicalMaterial({
                color: 0xFFFFFF,
                roughness: 0.1,
                metalness: 0.8,
                clearcoat: 1,
                envMap: envMap,
                transparent: true,
                opacity: 0.6,
                reflectivity: 1,
                refractionRatio: 0.98,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000
            );
            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.01;
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.01;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.01;
            sceneGroup.add(mesh);
            shapes.push(mesh);
        }

        const renderPass = new THREE.RenderPass(scene, camera);
        const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0;
        bloomPass.strength = 1.5;
        bloomPass.radius = 0.5;

        composer = new THREE.EffectComposer(renderer);
        composer.addPass(renderPass);
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
            if (p.position.x > 1000 || p.position.x < -1000) p.speedX *= -1;
            if (p.position.y > 1000 || p.position.y < -1000) p.speedY *= -1;
            if (p.position.z > 1000 || p.position.z < -1000) p.speedZ *= -1;
            p.material.rotation += p.rotationSpeed;
        });

        shapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
        });

        sceneGroup.rotation.y += 0.0025;
        sceneGroup.rotation.x += 0.002;

        const targetRotationY = mouseX * 0.05;
        const targetRotationX = mouseY * 0.05;
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
    });

    form.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && event.target.tagName !== 'BUTTON') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});
