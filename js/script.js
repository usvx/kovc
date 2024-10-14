document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer;
    let particles = [];
    let sceneGroup;
    let clock = new THREE.Clock();
    let composer;
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.8}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#00ffcc';
        ctx.fillText(char, size / 2, size / 2);
        return new THREE.CanvasTexture(canvas);
    }

    function getRandomCharacter() {
        const hangeulInitials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112];
        const hangeulMedials = [0x1161, 0x1165, 0x1166, 0x1167, 0x1169, 0x116E, 0x1172, 0x1173, 0x1175];
        const hangeulFinals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA];
        const initial = hangeulInitials[Math.floor(Math.random() * hangeulInitials.length)];
        const medial = hangeulMedials[Math.floor(Math.random() * hangeulMedials.length)];
        const final = hangeulFinals[Math.floor(Math.random() * hangeulFinals.length)];
        const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
        const hangeulChar = String.fromCharCode(syllableCode);
        const cyrillicLetters = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ';
        const isHangeul = Math.random() < 0.5;
        if (isHangeul) {
            return hangeulChar;
        } else {
            return cyrillicLetters[Math.floor(Math.random() * cyrillicLetters.length)];
        }
    }

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
        camera.position.z = 1000;
        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        const particleCount = 1000;
        for (let i = 0; i < particleCount; i++) {
            const char = getRandomCharacter();
            const texture = createTextTexture(char);
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
            const sprite = new THREE.Sprite(material);
            sprite.position.set((Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000);
            sprite.scale.set(80, 80, 1);
            sprite.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            sceneGroup.add(sprite);
            particles.push(sprite);
        }

        const renderPass = new POSTPROCESSING.RenderPass(scene, camera);
        const bloomPass = new POSTPROCESSING.BloomEffect({ luminanceThreshold: 0.1, luminanceSmoothing: 0.9, intensity: 2.0 });
        const smaaPass = new POSTPROCESSING.SMAAEffect();
        composer = new POSTPROCESSING.EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(new POSTPROCESSING.EffectPass(camera, bloomPass, smaaPass));

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);

        animate();
    }

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) / 10;
        mouseY = (event.clientY - windowHalfY) / 10;
    }

    function onDocumentTouchMove(event) {
        if (event.touches.length == 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX) / 10;
            mouseY = (event.touches[0].pageY - windowHalfY) / 10;
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
        const delta = clock.getDelta();
        particles.forEach(sprite => {
            sprite.position.addScaledVector(sprite.userData.velocity, delta * 60);
            if (sprite.position.x > 2000 || sprite.position.x < -2000) sprite.userData.velocity.x *= -1;
            if (sprite.position.y > 2000 || sprite.position.y < -2000) sprite.userData.velocity.y *= -1;
            if (sprite.position.z > 2000 || sprite.position.z < -2000) sprite.userData.velocity.z *= -1;
        });
        sceneGroup.rotation.y += 0.001;
        sceneGroup.rotation.x += 0.0005;
        camera.position.x += (mouseX - camera.position.x) * 0.05;
        camera.position.y += (-mouseY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
        composer.render(delta);
    }

    init();

    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = form.username.value.trim();
        const domainSelect = form.querySelector('select[name="domain"]');
        const domain = domainSelect.value;
        if (username && domain) {
            const email = `${username}${domain}`;
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailPattern.test(email)) {
                const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/`;
                window.location.href = loginUrl;
            } else {
                alert('Please enter a valid email address.');
            }
        } else {
            alert('Please enter your username and select a domain.');
        }
    });
});
