window.addEventListener('load', () => {
    const canvas = document.getElementById('background');
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.z = 1000;

    const particles = new THREE.Group();
    scene.add(particles);

    function getRandomCharacter() {
        const rand = Math.random();
        return rand < 0.5
            ? String.fromCharCode(0x0410 + Math.floor(Math.random() * (0x044F - 0x0410)))
            : String.fromCharCode(0xAC00 + Math.floor(Math.random() * (0xD7A3 - 0xAC00)));
    }

    function createTextTexture(char) {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.font = 'Bold 200px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#00ffcc';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00ffcc';
        ctx.fillText(char, size / 2, size / 2);
        return new THREE.CanvasTexture(canvas);
    }

    const particleCount = 1500;

    for (let i = 0; i < particleCount; i++) {
        const character = getRandomCharacter();
        const texture = createTextTexture(character);
        const material = new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });
        const particle = new THREE.Sprite(material);
        particle.position.x = (Math.random() - 0.5) * 2000;
        particle.position.y = (Math.random() - 0.5) * 2000;
        particle.position.z = (Math.random() - 0.5) * 2000;
        particle.scale.x = particle.scale.y = 30 + Math.random() * 50;
        particles.add(particle);
    }

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) * 0.05;
        mouseY = (event.clientY - windowHalfY) * 0.05;
    }

    function onDocumentTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX) * 0.05;
            mouseY = (event.touches[0].pageY - windowHalfY) * 0.05;
        }
    }

    document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('touchmove', onDocumentTouchMove);

    function animate() {
        requestAnimationFrame(animate);

        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        particles.rotation.x += 0.0005 * (targetY - particles.rotation.x);
        particles.rotation.y += 0.0005 * (targetX - particles.rotation.y);

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const form = document.getElementById('login-form');
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
