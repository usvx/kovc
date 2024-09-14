document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    let scene, camera, renderer, particles = [];

    const hangeulChars = [...'가나다라마바사아자차카타파하'];
    const russianChars = [...'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'];

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 4000);
        camera.position.z = 1000;

        const light = new THREE.PointLight(0x00ffcc, 2, 2000);
        light.position.set(0, 0, 500);
        scene.add(light);

        const particleCount = 200;
        const loader = new THREE.FontLoader();

        loader.load('https://threejs.org/examples/fonts/gentilis_regular.typeface.json', function (font) {
            for (let i = 0; i < particleCount; i++) {
                const char = Math.random() > 0.5 ? hangeulChars[Math.floor(Math.random() * hangeulChars.length)] : russianChars[Math.floor(Math.random() * russianChars.length)];
                const textGeometry = new THREE.TextGeometry(char, {
                    font: font,
                    size: 80,
                    height: 5,
                    curveSegments: 12,
                });
                const textMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffcc, flatShading: true });
                const mesh = new THREE.Mesh(textGeometry, textMaterial);
                mesh.position.x = (Math.random() - 0.5) * 2000;
                mesh.position.y = (Math.random() - 0.5) * 2000;
                mesh.position.z = (Math.random() - 0.5) * 2000;
                mesh.rotation.x = Math.random() * 2 * Math.PI;
                mesh.rotation.y = Math.random() * 2 * Math.PI;
                mesh.rotation.z = Math.random() * 2 * Math.PI;
                mesh.speedX = (Math.random() - 0.5) * 0.2;
                mesh.speedY = (Math.random() - 0.5) * 0.2;
                mesh.speedZ = (Math.random() - 0.5) * 0.2;
                scene.add(mesh);
                particles.push(mesh);
            }
            animate();
        });

        window.addEventListener('resize', onWindowResize, false);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);

        particles.forEach(p => {
            p.rotation.x += 0.01;
            p.rotation.y += 0.01;
            p.rotation.z += 0.01;

            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;

            if (p.position.x > 1000 || p.position.x < -1000) p.speedX *= -1;
            if (p.position.y > 1000 || p.position.y < -1000) p.speedY *= -1;
            if (p.position.z > 1000 || p.position.z < -1000) p.speedZ *= -1;
        });

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
