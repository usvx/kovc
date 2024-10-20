import * as THREE from 'https://esm.sh/three@0.153.0';
import { EffectComposer } from 'https://esm.sh/three@0.153.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.153.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.153.0/examples/jsm/postprocessing/UnrealBloomPass.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');
    let scene, camera, renderer;
    let particles = [];
    let shapes = [];
    let sceneGroup;
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    let isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    function getRandomCharacter() {
        const hangeulInitials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112];
        const hangeulMedials = [0x1161, 0x1165, 0x1166, 0x1167, 0x1169, 0x116E, 0x1172, 0x1173, 0x1175];
        const hangeulFinals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA];
        const initial = hangeulInitials[Math.floor(Math.random() * hangeulInitials.length)];
        const medial = hangeulMedials[Math.floor(Math.random() * hangeulMedials.length)];
        const final = hangeulFinals[Math.floor(Math.random() * hangeulFinals.length)];
        const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
        const hangeulChar = String.fromCharCode(syllableCode);
        const cyrillicLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Э', 'Ю', 'Я'];
        const isHangeul = Math.random() < 0.5;
        return isHangeul ? hangeulChar : cyrillicLetters[Math.floor(Math.random() * cyrillicLetters.length)];
    }

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 1000 : 1500;

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);

        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        const particleCount = 1200;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = [];
        const speeds = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push((Math.random() - 0.5) * 5000);
            positions.push((Math.random() - 0.5) * 5000);
            positions.push((Math.random() - 0.5) * 5000);
            speeds.push((Math.random() - 0.5) * (isMobile ? 2 : 4));
            speeds.push((Math.random() - 0.5) * (isMobile ? 2 : 4));
            speeds.push((Math.random() - 0.5) * (isMobile ? 2 : 4));
        }

        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        particleGeometry.setAttribute('speed', new THREE.Float32BufferAttribute(speeds, 3));

        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            },
            vertexShader: `
                attribute vec3 speed;
                varying vec2 vUv;
                uniform float time;
                void main() {
                    vec3 pos = position + speed * time;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = 150.0 * (1.0 / - gl_Position.z);
                }
            `,
            fragmentShader: `
                void main() {
                    vec2 uv = gl_PointCoord;
                    float alpha = 1.0 - smoothstep(0.0, 0.5, length(uv - 0.5));
                    vec3 color = vec3(0.0, 1.0, 0.82);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: false,
        });

        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        sceneGroup.add(particleSystem);

        const geometryTypes = [THREE.TetrahedronGeometry, THREE.OctahedronGeometry, THREE.IcosahedronGeometry, THREE.DodecahedronGeometry];
        const shapeCount = 80;
        for (let i = 0; i < shapeCount; i++) {
            const GeometryClass = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            const geometry = new GeometryClass(80, 1);
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color: { value: new THREE.Color(0x00FFD1) },
                },
                vertexShader: `
                    varying vec3 vPosition;
                    uniform float time;
                    void main() {
                        vPosition = position;
                        vec3 newPosition = position + normal * sin(time + position.x * 0.1) * 10.0;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 color;
                    varying vec3 vPosition;
                    void main() {
                        gl_FragColor = vec4(color * (0.5 + 0.5 * sin(length(vPosition) * 0.1)), 0.4);
                    }
                `,
                transparent: true,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = (Math.random() - 0.5) * 5000;
            mesh.position.y = (Math.random() - 0.5) * 5000;
            mesh.position.z = (Math.random() - 0.5) * 5000;
            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.02;
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.02;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.02;
            sceneGroup.add(mesh);
            shapes.push(mesh);
        }

        const composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        composer.addPass(bloomPass);

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);
        animate();
    }

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    }

    function onDocumentTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX) / windowHalfX;
            mouseY = (event.touches[0].pageY - windowHalfY) / windowHalfY;
        }
    }

    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();
        particleSystem.material.uniforms.time.value = time;
        shapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
            s.material.uniforms.time.value = time;
        });
        sceneGroup.rotation.y += 0.0025;
        sceneGroup.rotation.x += 0.002;
        const targetRotationY = mouseX * 0.05;
        const targetRotationX = mouseY * 0.05;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;
        composer.render(delta);
    }

    const clock = new THREE.Clock();
    init();
    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1000);
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
    form.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});
