document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    let scene, camera, renderer, particles = [];
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.7}px 'Urbanist', sans-serif`;
        ctx.fillStyle = '#00ffcc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
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

        const particleCount = 1000;

        for (let i = 0; i < particleCount; i++) {
            const char = getRandomCharacter();

            const texture = createTextTexture(char);
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
            const sprite = new THREE.Sprite(material);
            sprite.position.x = (Math.random() - 0.5) * 4000;
            sprite.position.y = (Math.random() - 0.5) * 4000;
            sprite.position.z = (Math.random() - 0.5) * 4000;
            sprite.scale.set(80, 80, 1);

            sprite.speedX = (Math.random() - 0.5) * 2;
            sprite.speedY = (Math.random() - 0.5) * 2;
            sprite.speedZ = (Math.random() - 0.5) * 2;

            scene.add(sprite);
            particles.push(sprite);
        }

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });

        animate();

        window.addEventListener('resize', onWindowResize, false);
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

            if (p.position.x > 2000 || p.position.x < -2000) p.speedX *= -1;
            if (p.position.y > 2000 || p.position.y < -2000) p.speedY *= -1;
            if (p.position.z > 2000 || p.position.z < -2000) p.speedZ *= -1;
        });

        targetX = mouseX * 0.05;
        targetY = mouseY * 0.05;

        camera.position.x += (targetX - camera.position.x) * 0.1;
        camera.position.y += (-targetY - camera.position.y) * 0.1;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }

    init();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = form.username.value.trim();
        if (username) {
            const email = `${username}@ko.vc`;
            const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/ko.vc`;
            window.location.href = loginUrl;
        } else {
            alert('Please enter your username.');
        }
    });
});
