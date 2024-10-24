/* js/script.js */

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
    let isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = isMobile ? 256 : 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur = isMobile ? 30 : 35;
        ctx.fillText(char, size / 2, size / 2);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function getRandomCharacter() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return chars.charAt(Math.floor(Math.random() * chars.length));
    }

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.0008);

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 800 : 1200;

        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xFF00FF, 1.5, 5000);
        pointLight.position.set(0, 0, 500);
        scene.add(pointLight);

        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        const particleCount = isMobile ? 1000 : 1500;
        for (let i = 0; i < particleCount; i++) {
            const char = getRandomCharacter();
            const texture = createTextTexture(char);
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
            const sprite = new THREE.Sprite(material);
            sprite.position.x = (Math.random() - 0.5) * 4000;
            sprite.position.y = (Math.random() - 0.5) * 4000;
            sprite.position.z = (Math.random() - 0.5) * 4000;
            sprite.scale.set(100, 100, 1);
            sprite.speedX = (Math.random() - 0.5) * 2;
            sprite.speedY = (Math.random() - 0.5) * 2;
            sprite.speedZ = (Math.random() - 0.5) * 2;
            sceneGroup.add(sprite);
            particles.push(sprite);
        }

        const geometryTypes = [
            THREE.TorusGeometry,
            THREE.TorusKnotGeometry,
            THREE.SphereGeometry,
            THREE.BoxGeometry
        ];

        const shapeCount = isMobile ? 50 : 75;
        for (let i = 0; i < shapeCount; i++) {
            const GeometryClass = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            const geometry = new GeometryClass(100, 30, 16, 100);
            const material = new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = (Math.random() - 0.5) * 4000;
            mesh.position.y = (Math.random() - 0.5) * 4000;
            mesh.position.z = (Math.random() - 0.5) * 4000;
            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.02;
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.02;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.02;
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
        sceneGroup.rotation.x += 0.001;
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
        if (event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});
