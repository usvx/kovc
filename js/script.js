document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer;
    let points;
    const clock = new THREE.Clock();
    const mouse = new THREE.Vector2();
    let windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);

    const PARTICLE_COUNT = 2000;

    init();
    window.addEventListener('resize', onWindowResize, false);

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputEncoding = THREE.sRGBEncoding;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
        camera.position.z = 1000;
        scene.add(camera);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x00ffcc, 1);
        camera.add(pointLight);

        createParticles();

        window.addEventListener('mousemove', onMouseMove, false);
        window.addEventListener('touchmove', onTouchMove, { passive: false });

        animate();
    }

    function createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const phi = Math.random() * 2 * Math.PI;
            const costheta = Math.random() * 2 - 1;
            const theta = Math.acos(costheta);
            const radius = Math.cbrt(Math.random()) * 1500;

            const x = radius * Math.sin(theta) * Math.cos(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(theta);

            positions.push(x, y, z);
            colors.push(Math.random(), 1.0, Math.random());
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const textureLoader = new THREE.TextureLoader();
        const particleTexture = textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABNElEQVR4Ae3UsUoDQRCF4S8A00AHUAg3oBN0ADcAHUACZB0AQzgACbAKnwL8cTE/vvAvC8dfuHc53p9D5f8rkJuEOMKIj8gMI8B+R4v2kkVGa5wFzgHiIvjKxl4XscKk4s4Oo9RLrPXp/GhmTihOcYHnFvbPobcMBpP2ZnAPjFRFsGjiW9qgD3QGpxc2mHzAt4lAojPrbt8JlcKHioe+7eFwJrfExOUkiRsO1PecxE3Ah1Iw0af5+E47nyO+Hzb31iFI4VkzKRIn6tY70X5hO4/uHx4OMUz+PX9zvCkSBnYn+HQ9Hp5jxUScZxDVdD+MA+LMbtOAKlAZ4VzmPbDAAAAAElFTkSuQmCC', () => {
            const material = new THREE.PointsMaterial({
                size: 10,
                map: particleTexture,
                blending: THREE.AdditiveBlending,
                depthTest: false,
                transparent: true,
                vertexColors: true
            });
            points = new THREE.Points(geometry, material);
            scene.add(points);
            hidePreloader();
        });
    }

    function hidePreloader() {
        preloader.classList.add('fade-out');
        preloader.addEventListener('transitionend', () => {
            preloader.style.display = 'none';
        });
    }

    function onMouseMove(event) {
        mouse.x = (event.clientX - windowHalf.x) / windowHalf.x;
        mouse.y = -(event.clientY - windowHalf.y) / windowHalf.y;
    }

    function onTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouse.x = (event.touches[0].clientX - windowHalf.x) / windowHalf.x;
            mouse.y = -(event.touches[0].clientY - windowHalf.y) / windowHalf.y;
        }
    }

    function onWindowResize() {
        windowHalf.set(window.innerWidth / 2, window.innerHeight / 2);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();

        if (points) {
            points.rotation.y += delta * 0.05;
        }

        camera.position.x += (mouse.x * 100 - camera.position.x) * 0.05;
        camera.position.y += (mouse.y * 100 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = form.username.value.trim();
        const domainSelect = form.querySelector('select[name="domain"]');
        const domain = domainSelect.value;

        if (username && domain) {
            const email = `${username}${domain}`;
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailPattern.test(email)) {
                try {
                    const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/`;
                    window.location.href = loginUrl;
                } catch (error) {
                    console.error('Login redirection failed:', error);
                    alert('An error occurred while redirecting. Please try again.');
                }
            } else {
                alert('Please enter a valid email address.');
            }
        } else {
            alert('Please enter your username and select a domain.');
        }
    });
});
