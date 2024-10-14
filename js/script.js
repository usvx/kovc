document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer, composer;
    let particleMesh;
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
        setupPostProcessing();

        window.addEventListener('mousemove', onMouseMove, false);
        window.addEventListener('touchmove', onTouchMove, { passive: false });

        animate();
    }

    function createParticles() {
        const geometry = new THREE.InstancedBufferGeometry();
        const baseGeometry = new THREE.PlaneGeometry(1, 1);

        geometry.index = baseGeometry.index;
        geometry.attributes.position = baseGeometry.attributes.position;
        geometry.attributes.uv = baseGeometry.attributes.uv;

        const offsets = [];
        const scales = [];
        const colors = [];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const phi = Math.random() * 2 * Math.PI;
            const costheta = Math.random() * 2 - 1;
            const theta = Math.acos(costheta);
            const radius = Math.cbrt(Math.random()) * 1500;

            const x = radius * Math.sin(theta) * Math.cos(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(theta);

            offsets.push(x, y, z);
            scales.push(Math.random() * 20 + 5);
            colors.push(Math.random(), 1.0, Math.random());
        }

        geometry.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
        geometry.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(new Float32Array(scales), 1));
        geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(new Float32Array(colors), 3));

        const textureLoader = new THREE.TextureLoader();
        const particleTexture = textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABNElEQVR4Ae3UsUoDQRCF4S8A00AHUAg3oBN0ADcAHUACZB0AQzgACbAKnwL8cTE/vvAvC8dfuHc53p9D5f8rkJuEOMKIj8gMI8B+R4v2kkVGa5wFzgHiIvjKxl4XscKk4s4Oo9RLrPXp/GhmTihOcYHnFvbPobcMBpP2ZnAPjFRFsGjiW9qgD3QGpxc2mHzAt4lAojPrbt8JlcKHioe+7eFwJrfExOUkiRsO1PecxE3Ah1Iw0af5+E47nyO+Hzb31iFI4VkzKRIn6tY70X5hO4/uHx4OMUz+PX9zvCkSBnYn+HQ9Hp5jxUScZxDVdD+MA+LMbtOAKlAZ4VzmPbDAAAAAElFTkSuQmCC', () => {
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: new THREE.Color(0x00ffcc) },
                    pointTexture: { value: particleTexture }
                },
                vertexShader: `
                    attribute vec3 instanceOffset;
                    attribute float instanceScale;
                    attribute vec3 instanceColor;
                    varying vec3 vColor;
                    varying vec2 vUv;
                    void main() {
                        vColor = instanceColor;
                        vUv = uv;
                        vec4 mvPosition = modelViewMatrix * vec4(instanceOffset + position * instanceScale, 1.0);
                        gl_PointSize = 10.0 * (300.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    uniform vec3 color;
                    uniform sampler2D pointTexture;
                    varying vec3 vColor;
                    varying vec2 vUv;
                    void main() {
                        vec4 texColor = texture2D(pointTexture, vUv);
                        gl_FragColor = vec4(color * vColor, 1.0) * texColor;
                        if (gl_FragColor.a < 0.1) discard;
                    }
                `,
                blending: THREE.AdditiveBlending,
                depthTest: false,
                transparent: true
            });

            particleMesh = new THREE.InstancedMesh(geometry, material, PARTICLE_COUNT);
            scene.add(particleMesh);
            hidePreloader();
        });
    }

    function setupPostProcessing() {
        composer = new THREE.EffectComposer(renderer);
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);

        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,
            0.4,
            0.85
        );
        composer.addPass(bloomPass);

        const dofPass = new THREE.BokehPass(scene, camera, {
            focus: 1000.0,
            aperture: 0.0002,
            maxblur: 0.01
        });
        composer.addPass(dofPass);

        const fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
        fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        fxaaPass.renderToScreen = true;
        composer.addPass(fxaaPass);
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
        composer.setSize(window.innerWidth, window.innerHeight);
        if (composer.passes.length > 0 && composer.passes[composer.passes.length - 1].material.uniforms) {
            composer.passes[composer.passes.length - 1].uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();

        if (particleMesh) {
            particleMesh.rotation.y += delta * 0.05;
        }

        camera.position.x += (mouse.x * 100 - camera.position.x) * 0.05;
        camera.position.y += (mouse.y * 100 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        if (composer) {
            composer.render(delta);
        }
    }

    function hidePreloader() {
        preloader.classList.add('fade-out');
        preloader.addEventListener('transitionend', () => {
            preloader.style.display = 'none';
        });
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
