document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    class BackgroundAnimation {
        constructor() {
            this.mouseX = 0;
            this.mouseY = 0;
            this.targetX = 0;
            this.targetY = 0;
            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;
            this.animate = this.animate.bind(this);
            this.init();
        }

        init() {
            this.canvas = document.getElementById('background');
            this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);

            this.scene = new THREE.Scene();

            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
            this.camera.position.z = 1000;

            this.scene.add(new THREE.AmbientLight(0x404040));

            const pointLight = new THREE.PointLight(0x00ffcc, 1);
            pointLight.position.set(0, 0, 1000);
            this.scene.add(pointLight);

            this.initParticles();
            this.initShapes();
            this.initPostProcessing();

            document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
            document.addEventListener('touchmove', this.onDocumentTouchMove.bind(this), { passive: false });
            window.addEventListener('resize', this.onWindowResize.bind(this), false);

            this.clock = new THREE.Clock();
            this.animate();
        }

        initParticles() {
            const particleCount = 10000;
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            const color = new THREE.Color();

            for (let i = 0; i < particleCount; i++) {
                const x = (Math.random() - 0.5) * 4000;
                const y = (Math.random() - 0.5) * 4000;
                const z = (Math.random() - 0.5) * 4000;

                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;

                color.setHSL((x / 4000) + 0.5, 0.7, 0.5);
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const material = new THREE.PointsMaterial({
                size: 15,
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                transparent: true
            });

            this.particleSystem = new THREE.Points(geometry, material);

            this.scene.add(this.particleSystem);
        }

        initShapes() {
            const geometryTypes = [
                new THREE.TetrahedronGeometry(50, 0),
                new THREE.OctahedronGeometry(50, 0),
                new THREE.IcosahedronGeometry(50, 0)
            ];
            const material = new THREE.MeshStandardMaterial({
                color: 0x00ffcc,
                wireframe: true,
                transparent: true,
                opacity: 0.2
            });
            this.shapes = [];

            for (let i = 0; i < 30; i++) {
                const geometryType = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
                const mesh = new THREE.Mesh(geometryType, material.clone());
                mesh.position.set(
                    (Math.random() - 0.5) * 4000,
                    (Math.random() - 0.5) * 4000,
                    (Math.random() - 0.5) * 4000
                );
                mesh.rotationSpeedX = (Math.random() - 0.5) * 0.01;
                mesh.rotationSpeedY = (Math.random() - 0.5) * 0.01;
                mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.01;
                this.scene.add(mesh);
                this.shapes.push(mesh);
            }
        }

        initPostProcessing() {
            this.composer = new THREE.EffectComposer(this.renderer);
            this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));

            const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                1.5, 0.4, 0.85
            );
            bloomPass.threshold = 0;
            bloomPass.strength = 1.5;
            bloomPass.radius = 0;
            this.composer.addPass(bloomPass);
        }

        onDocumentMouseMove(event) {
            this.mouseX = (event.clientX - this.windowHalfX);
            this.mouseY = (event.clientY - this.windowHalfY);
        }

        onDocumentTouchMove(event) {
            if (event.touches.length === 1) {
                event.preventDefault();
                this.mouseX = (event.touches[0].pageX - this.windowHalfX);
                this.mouseY = (event.touches[0].pageY - this.windowHalfY);
            }
        }

        onWindowResize() {
            this.windowHalfX = window.innerWidth / 2;
            this.windowHalfY = window.innerHeight / 2;
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }

        animate() {
            requestAnimationFrame(this.animate);
            const delta = this.clock.getDelta();
            this.particleSystem.rotation.y += delta * 0.05;

            this.shapes.forEach(shape => {
                shape.rotation.x += shape.rotationSpeedX;
                shape.rotation.y += shape.rotationSpeedY;
                shape.rotation.z += shape.rotationSpeedZ;
            });

            this.targetX = this.mouseX * 0.05;
            this.targetY = this.mouseY * 0.05;
            this.camera.position.x += (this.targetX - this.camera.position.x) * 0.1;
            this.camera.position.y += (-this.targetY - this.camera.position.y) * 0.1;
            this.camera.lookAt(this.scene.position);
            this.composer.render();
        }
    }

    const backgroundAnimation = new BackgroundAnimation();

    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
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
});
