document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer;
    let particles = [];
    let shapes = [];
    let sceneGroup;
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#00ffcc';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 20;
        ctx.fillText(char, size / 2, size / 2);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
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
        const cyrillicLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Э', 'Ю', 'Я'];
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
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
        camera.position.z = 1000;
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0x00ffcc, 1);
        pointLight.position.set(0, 0, 1000);
        scene.add(pointLight);
        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);
        const particleCount = 500;
        for (let i = 0; i < particleCount; i++) {
            const char = getRandomCharacter();
            const texture = createTextTexture(char);
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true, blending: THREE.AdditiveBlending });
            const sprite = new THREE.Sprite(material);
            sprite.position.x = (Math.random() - 0.5) * 4000;
            sprite.position.y = (Math.random() - 0.5) * 4000;
            sprite.position.z = (Math.random() - 0.5) * 4000;
            sprite.scale.set(80, 80, 1);
            sprite.speedX = (Math.random() - 0.5) * 0.5;
            sprite.speedY = (Math.random() - 0.5) * 0.5;
            sprite.speedZ = (Math.random() - 0.5) * 0.5;
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.05;
            sceneGroup.add(sprite);
            particles.push(sprite);
        }
        const geometryTypes = [THREE.TetrahedronGeometry, THREE.OctahedronGeometry, THREE.IcosahedronGeometry];
        for (let i = 0; i < 30; i++) {
            const GeometryClass = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            const geometry = new GeometryClass(50, 0);
            const material = new THREE.MeshStandardMaterial({
                color: 0x00ffcc,
                wireframe: true,
                transparent: true,
                opacity: 0.2,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = (Math.random() - 0.5) * 4000;
            mesh.position.y = (Math.random() - 0.5) * 4000;
            mesh.position.z = (Math.random() - 0.5) * 4000;
            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.01;
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.01;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.01;
            sceneGroup.add(mesh);
            shapes.push(mesh);
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
        if (event.touches.length == 1) {
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
            p.material.rotation += p.rotationSpeed;
            if (p.position.x > 2000 || p.position.x < -2000) p.speedX *= -1;
            if (p.position.y > 2000 || p.position.y < -2000) p.speedY *= -1;
            if (p.position.z > 2000 || p.position.z < -2000) p.speedZ *= -1;
        });
        shapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
        });
        sceneGroup.rotation.y += 0.001;
        sceneGroup.rotation.x += 0.0005;
        const targetRotationY = mouseX * 0.05;
        const targetRotationX = mouseY * 0.05;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;
        renderer.render(scene, camera);
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
            const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/`;
            window.location.href = loginUrl;
        } else {
            alert('Please enter your username and select a domain.');
        }
    });
});
