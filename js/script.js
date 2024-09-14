document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('background');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.z = 1000;
    const particles = new THREE.Group();
    scene.add(particles);

    function getRandomCharacter() {
        const rand = Math.random();
        if (rand < 0.5) {
            return String.fromCharCode(0x0410 + Math.random() * (0x044F - 0x0410));
        } else {
            return String.fromCharCode(0xAC00 + Math.random() * (0xD7A3 - 0xAC00));
        }
    }

    function createTextTexture(char) {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.font = 'Bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#00ffcc';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffcc';
        ctx.fillText(char, size / 2, size / 2);
        return new THREE.CanvasTexture(canvas);
    }

    const particleCount = 2000;
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
        particle.position.x = THREE.MathUtils.randFloatSpread(2000);
        particle.position.y = THREE.MathUtils.randFloatSpread(2000);
        particle.position.z = THREE.MathUtils.randFloatSpread(2000);
        particle.scale.x = particle.scale.y = 20 + Math.random() * 40;
        particles.add(particle);
    }

    function animate() {
        requestAnimationFrame(animate);
        particles.rotation.x += 0.0005;
        particles.rotation.y += 0.001;
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
