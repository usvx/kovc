document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    let scene, camera, renderer, particles = [], raycaster, mouse = new THREE.Vector2();
    let isUserInteracting = false, lon = 0, lat = 0, phi = 0, theta = 0;
    let touchX, touchY;

    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.7}px 'Noto Sans KR', sans-serif`;
        ctx.fillStyle = '#00ffcc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(char, size / 2, size / 2);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function getRandomHangul() {
        const start = 0xAC00;
        const end = 0xD7A3;
        const code = Math.floor(Math.random() * (end - start + 1)) + start;
        return String.fromCharCode(code);
    }

    function getRandomCyrillic() {
        const start = 0x0410;
        const end = 0x042F;
        const code = Math.floor(Math.random() * (end - start + 1)) + start;
        return String.fromCharCode(code);
    }

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);

        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x00ffcc, 1);
        pointLight.position.set(0, 0, 1000);
        scene.add(pointLight);

        const particleCount = 1000;

        for (let i = 0; i < particleCount; i++) {
            const char = Math.random() > 0.5 ? getRandomHangul() : getRandomCyrillic();

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

        raycaster = new THREE.Raycaster();

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('mousedown', onDocumentMouseDown, false);
        document.addEventListener('mouseup', onDocumentMouseUp, false);
        document.addEventListener('wheel', onDocumentMouseWheel, false);

        document.addEventListener('touchstart', onDocumentTouchStart, false);
        document.addEventListener('touchmove', onDocumentTouchMove, false);
        document.addEventListener('touchend', onDocumentTouchEnd, false);

        animate();

        window.addEventListener('resize', onWindowResize, false);
    }

    function onDocumentMouseDown(event) {
        event.preventDefault();
        isUserInteracting = true;
        lon = event.clientX;
        lat = event.clientY;
    }

    function onDocumentMouseMove(event) {
        if (isUserInteracting) {
            const deltaX = event.clientX - lon;
            const deltaY = event.clientY - lat;
            lon = event.clientX;
            lat = event.clientY;

            particles.forEach(p => {
                p.position.x += deltaX * 0.5;
                p.position.y -= deltaY * 0.5;
            });
        }
    }

    function onDocumentMouseUp(event) {
        isUserInteracting = false;
    }

    function onDocumentMouseWheel(event) {
        camera.position.z += event.deltaY * 0.5;
    }

    function onDocumentTouchStart(event) {
        if (event.touches.length == 1) {
            event.preventDefault();
            isUserInteracting = true;
            touchX = event.touches[0].pageX;
            touchY = event.touches[0].pageY;
        }
    }

    function onDocumentTouchMove(event) {
        if (isUserInteracting && event.touches.length == 1) {
            event.preventDefault();
            const deltaX = event.touches[0].pageX - touchX;
            const deltaY = event.touches[0].pageY - touchY;
            touchX = event.touches[0].pageX;
            touchY = event.touches[0].pageY;

            particles.forEach(p => {
                p.position.x += deltaX * 0.5;
                p.position.y -= deltaY * 0.5;
            });
        }
    }

    function onDocumentTouchEnd(event) {
        isUserInteracting = false;
    }

    function onWindowResize() {
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
