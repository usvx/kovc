document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer;
    let particles = [];
    let clock = new THREE.Clock();
    let composer;
    let mouse = new THREE.Vector2();
    let target = new THREE.Vector2();
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.font = `${size * 0.8}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0, 255, 204, 1)';
        ctx.shadowColor = 'rgba(0, 255, 204, 0.5)';
        ctx.shadowBlur = 20;
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
        renderer.outputEncoding = THREE.sRGBEncoding;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = 500;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0x00ffcc, 1);
        camera.add(pointLight);
        scene.add(camera);

        const particleCount = 1500;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const sizes = [];
        const textures = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push((Math.random() - 0.5) * 2000);
            positions.push((Math.random() - 0.5) * 2000);
            positions.push((Math.random() - 0.5) * 2000);

            velocities.push((Math.random() - 0.5) * 0.2);
            velocities.push((Math.random() - 0.5) * 0.2);
            velocities.push((Math.random() - 0.5) * 0.2);

            sizes.push(Math.random() * 50 + 20);

            const char = getRandomCharacter();
            const texture = createTextTexture(char);
            textures.push(texture);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        const materials = textures.map(texture => new THREE.PointsMaterial({
            size: 50,
            map: texture,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
        }));

        const particles = new THREE.Group();
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.BufferGeometry();
            particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions.slice(i * 3, i * 3 + 3), 3));
            particleGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities.slice(i * 3, i * 3 + 3), 3));
            particleGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes.slice(i, i + 1), 1));

            const particle = new THREE.Points(particleGeometry, materials[i]);
            particles.add(particle);
        }

        scene.add(particles);

        const renderPass = new POSTPROCESSING.RenderPass(scene, camera);
        const bloomPass = new POSTPROCESSING.EffectPass(camera, new POSTPROCESSING.BloomEffect({ intensity: 1.2 }));
        const smaaPass = new POSTPROCESSING.EffectPass(camera, new POSTPROCESSING.SMAAEffect());
        composer = new POSTPROCESSING.EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(bloomPass);
        composer.addPass(smaaPass);

        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);

        animate();
    }

    function onMouseMove(event) {
        mouse.x = (event.clientX - windowHalfX) / 100;
        mouse.y = (event.clientY - windowHalfY) / 100;
    }

    function onTouchMove(event) {
        if (event.touches.length == 1) {
            event.preventDefault();
            mouse.x = (event.touches[0].pageX - windowHalfX) / 100;
            mouse.y = (event.touches[0].pageY - windowHalfY) / 100;
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

        scene.children[2].children.forEach(particle => {
            const positions = particle.geometry.attributes.position.array;
            const velocities = particle.geometry.attributes.velocity.array;
            positions[0] += velocities[0] * delta * 60;
            positions[1] += velocities[1] * delta * 60;
            positions[2] += velocities[2] * delta * 60;

            if (positions[0] > 1000 || positions[0] < -1000) velocities[0] *= -1;
            if (positions[1] > 1000 || positions[1] < -1000) velocities[1] *= -1;
            if (positions[2] > 1000 || positions[2] < -1000) velocities[2] *= -1;

            particle.geometry.attributes.position.needsUpdate = true;
        });

        camera.position.x += (mouse.x * 50 - camera.position.x) * 0.05;
        camera.position.y += (-mouse.y * 50 - camera.position.y) * 0.05;
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
