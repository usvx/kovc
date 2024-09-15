document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer;
    let particles = [];
    let shapes = [];
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
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
        const ranges = [
            [0xAC00, 0xD7A3],
            [0x0410, 0x042F],
        ];
        const range = ranges[Math.floor(Math.random() * ranges.length)];
        const code = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
        return String.fromCharCode(code);
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

            scene.add(sprite);
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

            scene.add(mesh);
            shapes.push(mesh);
        }

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });

        window.addEventListener('resize', onWindowResize, false);

        animate();
    }

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    }

    function onDocumentTouchMove(event) {
        if (event.touches.length == 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX);
            mouseY = (event.touches[0].pageY - windowHalfY);
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

        targetX = mouseX * 0.05;
        targetY = mouseY * 0.05;

        camera.position.x += (targetX - camera.position.x) * 0.1;
        camera.position.y += (-targetY - camera.position.y) * 0.1;
        camera.lookAt(scene.position);

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
