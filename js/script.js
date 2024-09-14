document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    let scene, camera, renderer, group;
    const characters = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ가나다라마바사아자차카타파하'.split('');

    init();
    animate();

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 50;

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        group = new THREE.Group();

        const fontLoader = new THREE.FontLoader();
        fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            const material = new THREE.MeshBasicMaterial({ color: 0x00ffcc });

            characters.forEach((char, i) => {
                const geometry = new THREE.TextGeometry(char, {
                    font: font,
                    size: 1.5,
                    height: 0.1,
                    curveSegments: 12,
                });

                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(
                    20 * Math.cos(i * 0.5),
                    20 * Math.sin(i * 0.5),
                    i * 0.5
                );

                group.add(mesh);
            });

            scene.add(group);
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

        group.rotation.x += 0.005;
        group.rotation.y += 0.005;

        renderer.render(scene, camera);
    }
});
