import * as THREE from 'https://esm.sh/three@0.154.0';
import { EffectComposer } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'https://esm.sh/three@0.154.0/examples/jsm/shaders/FXAAShader.js';
import { SSAOPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/SSAOPass.js';
import { DepthOfFieldPass } from 'https://esm.sh/three@0.154.0/examples/jsm/postprocessing/DepthOfFieldPass.js';
import { GUI } from 'https://esm.sh/dat.gui@0.7.7';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');
    let scene, camera, renderer, composer;
    let particles = [];
    let shapes = [];
    let sceneGroup;
    const clock = new THREE.Clock();
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    const gui = new GUI({ width: 300 });

    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = isMobile ? 512 : 1024;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isMobile ? '#00FFD1' : 'rgba(255, 255, 255, 0.8)';
        ctx.shadowColor = isMobile ? '#FF00FF' : 'rgba(255, 255, 255, 0.4)';
        ctx.shadowBlur = isMobile ? 40 : 50;
        ctx.fillText(char, size / 2, size / 2);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 16;
        return texture;
    }

    function getRandomCharacter() {
        const hangeulInitials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112];
        const hangeulMedials = [0x1161, 0x1165, 0x1166, 0x1167, 0x1169, 0x116E, 0x1172, 0x1173, 0x1175];
        const hangeulFinals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA];
        const cyrillicLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Э', 'Ю', 'Я'];
        const isHangeul = Math.random() < 0.5;
        if (isHangeul) {
            const initial = hangeulInitials[Math.floor(Math.random() * hangeulInitials.length)];
            const medial = hangeulMedials[Math.floor(Math.random() * hangeulMedials.length)];
            const final = hangeulFinals[Math.floor(Math.random() * hangeulFinals.length)];
            const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
            return String.fromCharCode(syllableCode);
        } else {
            return cyrillicLetters[Math.floor(Math.random() * cyrillicLetters.length)];
        }
    }

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.physicallyCorrectLights = true;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 20000);
        camera.position.z = isMobile ? 1000 : 2000;
        const ambientLight = new THREE.AmbientLight(isMobile ? 0x00FFD1 : 0xffffff, isMobile ? 1.5 : 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(isMobile ? 0xFF00FF : 0xffffff, isMobile ? 2 : 1.0);
        directionalLight.position.set(1, 1, 1).normalize();
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        const pointLight1 = new THREE.PointLight(0xff00ff, 1.5, 1500);
        pointLight1.position.set(-2000, 1000, 2000);
        pointLight1.castShadow = true;
        scene.add(pointLight1);
        const pointLight2 = new THREE.PointLight(0x00ffff, 1.5, 1500);
        pointLight2.position.set(2000, -1000, -2000);
        pointLight2.castShadow = true;
        scene.add(pointLight2);
        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);
        createParticles();
        createShapes();
        setupPostProcessing();
        setupGUI();
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);
        animate();
    }

    function createParticles() {
        const particleCount = isMobile ? 1000 : 1500;
        for (let i = 0; i < particleCount; i++) {
            const char = getRandomCharacter();
            const texture = createTextTexture(char);
            const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthTest: true,
                depthWrite: false,
                emissive: new THREE.Color(0xffffff),
                emissiveIntensity: 0.8,
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.x = (Math.random() - 0.5) * (isMobile ? 8000 : 6000);
            sprite.position.y = (Math.random() - 0.5) * (isMobile ? 8000 : 6000);
            sprite.position.z = (Math.random() - 0.5) * (isMobile ? 8000 : 6000);
            sprite.scale.set(isMobile ? 300 : 200, isMobile ? 300 : 200, 1);
            sprite.speedX = (Math.random() - 0.5) * (isMobile ? 3 : 4);
            sprite.speedY = (Math.random() - 0.5) * (isMobile ? 3 : 4);
            sprite.speedZ = (Math.random() - 0.5) * (isMobile ? 3 : 4);
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.05;
            sceneGroup.add(sprite);
            particles.push(sprite);
        }
    }

    function createShapes() {
        const geometryTypes = [
            THREE.TetrahedronGeometry,
            THREE.OctahedronGeometry,
            THREE.IcosahedronGeometry,
            THREE.DodecahedronGeometry,
            THREE.BoxGeometry,
            THREE.SphereGeometry
        ];
        const shapeCount = isMobile ? 100 : 150;
        for (let i = 0; i < shapeCount; i++) {
            const GeometryClass = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            const geometry = new GeometryClass(isMobile ? 80 : 60, isMobile ? 1 : 2);
            const material = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(`hsl(${Math.random() * 360}, 60%, 50%)`),
                metalness: 0.3,
                roughness: 0.2,
                transmission: 0.9,
                transparent: true,
                opacity: 0.7,
                reflectivity: 1.0,
                ior: 1.5,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1,
                emissive: new THREE.Color(0x000000),
                emissiveIntensity: 0.1,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = (Math.random() - 0.5) * (isMobile ? 8000 : 6000);
            mesh.position.y = (Math.random() - 0.5) * (isMobile ? 8000 : 6000);
            mesh.position.z = (Math.random() - 0.5) * (isMobile ? 8000 : 6000);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.01;
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.01;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.01;
            sceneGroup.add(mesh);
            shapes.push(mesh);
        }
    }

    function setupPostProcessing() {
        composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,
            0.6,
            0.85
        );
        bloomPass.threshold = 0.1;
        bloomPass.strength = isMobile ? 1.0 : 2.0;
        bloomPass.radius = 0.5;
        composer.addPass(bloomPass);
        const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
        ssaoPass.kernelRadius = 16;
        ssaoPass.minDistance = 0.005;
        ssaoPass.maxDistance = 0.1;
        composer.addPass(ssaoPass);
        const dofPass = new DepthOfFieldPass(scene, camera, {
            focus: 1000,
            aperture: 0.0002,
            maxblur: 0.01
        });
        composer.addPass(dofPass);
        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        composer.addPass(fxaaPass);
    }

    function setupGUI() {
        const bloomFolder = gui.addFolder('Bloom');
        bloomFolder.add(composer.passes[1], 'strength', 0.0, 3.0).name('Strength');
        bloomFolder.add(composer.passes[1], 'radius', 0.0, 1.0).name('Radius');
        bloomFolder.add(composer.passes[1], 'threshold', 0.0, 1.0).name('Threshold');
        bloomFolder.open();
        const ssaoFolder = gui.addFolder('SSAO');
        ssaoFolder.add(composer.passes[2], 'kernelRadius', 0, 32).name('Kernel Radius');
        ssaoFolder.add(composer.passes[2], 'minDistance', 0.001, 0.02).name('Min Distance');
        ssaoFolder.add(composer.passes[2], 'maxDistance', 0.01, 0.2).name('Max Distance');
        ssaoFolder.open();
        const dofFolder = gui.addFolder('Depth of Field');
        dofFolder.add(composer.passes[3].settings, 'focus', 500, 3000).name('Focus Distance');
        dofFolder.add(composer.passes[3].settings, 'aperture', 0.0001, 0.001).name('Aperture');
        dofFolder.add(composer.passes[3].settings, 'maxblur', 0.0, 0.05).name('Max Blur');
        dofFolder.open();
        const fxaaFolder = gui.addFolder('FXAA');
        fxaaFolder.add(composer.passes[4].uniforms['resolution'].value, 'x').min(0).max(1).step(0.0001).name('Resolution X');
        fxaaFolder.add(composer.passes[4].uniforms['resolution'].value, 'y').min(0).max(1).step(0.0001).name('Resolution Y');
        fxaaFolder.open();
        gui.close();
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
        const fxaaPass = composer.passes.find(pass => pass instanceof ShaderPass && pass.uniforms['resolution']);
        if (fxaaPass) {
            fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        particles.forEach(p => {
            p.position.x += p.speedX * delta * 60;
            p.position.y += p.speedY * delta * 60;
            p.position.z += p.speedZ * delta * 60;
            p.material.rotation += p.rotationSpeed * delta * 60;
            const boundary = isMobile ? 4000 : 3000;
            if (p.position.x > boundary || p.position.x < -boundary) p.speedX *= -1;
            if (p.position.y > boundary || p.position.y < -boundary) p.speedY *= -1;
            if (p.position.z > boundary || p.position.z < -boundary) p.speedZ *= -1;
        });
        shapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX * delta * 60;
            s.rotation.y += s.rotationSpeedY * delta * 60;
            s.rotation.z += s.rotationSpeedZ * delta * 60;
        });
        sceneGroup.rotation.y += isMobile ? 0.0015 : 0.0025;
        sceneGroup.rotation.x += isMobile ? 0.001 : 0.002;
        const targetRotationY = mouseX * (isMobile ? 0.02 : 0.05);
        const targetRotationX = mouseY * (isMobile ? 0.02 : 0.05);
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;
        camera.rotation.x += (mouseY * 0.01 - camera.rotation.x) * 0.05;
        camera.rotation.y += (mouseX * 0.01 - camera.rotation.y) * 0.05;
        composer.render(delta);
    }

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
