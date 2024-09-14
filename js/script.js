document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    let scene, camera, renderer, letters = [];

    const hangeulChars = [...'가나다라마바사아자차카타파하'];
    const russianChars = [...'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'];

    function init() {
        const container = document.getElementById('scene-container');
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 200;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        const light = new THREE.PointLight(0xffffff, 1);
        light.position.set(0, 0, 200);
        scene.add(light);

        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const loader = new THREE.FontLoader();
        loader.load('https://threejs.org/examples/fonts/gentilis_regular.typeface.json', function (font) {
            const material = new THREE.MeshPhongMaterial({ color: 0x00ffcc, flatShading: true });

            for (let i = 0; i < 50; i++) {
                const char = Math.random() > 0.5 ? hangeulChars[Math.floor(Math.random() * hangeulChars.length)] : russianChars[Math.floor(Math.random() * russianChars.length)];
                const textGeo = new THREE.TextGeometry(char, {
                    font: font,
                    size: 20,
                    height: 5,
                    curveSegments: 12,
                });
                const textMesh = new THREE.Mesh(textGeo, material);
                textMesh.position.x = (Math.random() - 0.5) * 400;
                textMesh.position.y = (Math.random() - 0.5) * 400;
                textMesh.position.z = (Math.random() - 0.5) * 400;
                textMesh.rotation.x = Math.random() * 2 * Math.PI;
                textMesh.rotation.y = Math.random() * 2 * Math.PI;
                textMesh.rotation.z = Math.random() * 2 * Math.PI;
                scene.add(textMesh);
                letters.push(textMesh);
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

        letters.forEach(letter => {
            letter.rotation.x += 0.005;
            letter.rotation.y += 0.005;
            letter.rotation.z += 0.005;
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
