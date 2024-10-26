// js/script.js

// Import Three.js as an ES Module using absolute URLs
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
// Import additional modules for post-processing
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/UnrealBloomPass.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form'),
          preloader = document.getElementById('preloader');
    let scene, camera, renderer, composer,
        particles = [],
        shapes = [],
        sceneGroup,
        cubeCamera, cubeRenderTarget,
        mouseX = 0, mouseY = 0,
        windowHalfX = window.innerWidth / 2,
        windowHalfY = window.innerHeight / 2,
        isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    // Function to create text texture for particles
    function createTextTexture(char) {
        const canvas = document.createElement('canvas'),
              size = isMobile ? 256 : 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#00FFFF');
        gradient.addColorStop(1, '#8A2BE2');
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#4B0082';
        ctx.shadowBlur = isMobile ? 30 : 50;
        ctx.fillText(char, size / 2, size / 2);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    // Functions to generate random characters
    function getRandomHangeulCharacter() {
        const commonInitials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112],
              commonMedials = [0x1161, 0x1163, 0x1165, 0x1167, 0x1169, 0x116D, 0x1162, 0x1164, 0x1166, 0x1168, 0x116A],
              commonFinals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA, 0x11C2];
        const initial = commonInitials[Math.floor(Math.random() * commonInitials.length)],
              medial = commonMedials[Math.floor(Math.random() * commonMedials.length)],
              final = commonFinals[Math.floor(Math.random() * commonFinals.length)];
        const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
        return String.fromCharCode(syllableCode);
    }

    function getRandomCyrillicCharacter() {
        const start = 0x0410,
              end = 0x042F,
              code = Math.floor(Math.random() * (end - start + 1)) + start;
        return String.fromCharCode(code);
    }

    function getRandomCharacter() {
        return Math.random() < 0.7 ? getRandomHangeulCharacter() : getRandomCyrillicCharacter();
    }

    // Function to create Möbius Strip geometry
    function createMobiusStrip(segments = 100, slices = 16) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        for (let i = 0; i <= segments; i++) {
            const u = i / segments * Math.PI * 2;
            for (let j = 0; j <= slices; j++) {
                const v = (j / slices - 0.5) * 1; // width of the strip
                // Möbius strip parametric equations
                const x = (1 + v * Math.cos(u / 2)) * Math.cos(u);
                const y = (1 + v * Math.cos(u / 2)) * Math.sin(u);
                const z = v * Math.sin(u / 2);
                vertices.push(x * 100, y * 100, z * 100);

                // Compute normals (approximation)
                const nx = Math.cos(u / 2) * Math.cos(u);
                const ny = Math.cos(u / 2) * Math.sin(u);
                const nz = Math.sin(u / 2);
                normals.push(nx, ny, nz);

                // UVs
                uvs.push(i / segments, j / slices);
            }
        }

        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < slices; j++) {
                const a = i * (slices + 1) + j;
                const b = (i + 1) * (slices + 1) + j;
                const c = (i + 1) * (slices + 1) + (j + 1);
                const d = i * (slices + 1) + (j + 1);

                // Two triangles per quad
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.computeVertexNormals();

        return geometry;
    }

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputEncoding = THREE.sRGBEncoding; // Ensure correct color encoding
        renderer.toneMapping = THREE.ACESFilmicToneMapping; // Better tone mapping
        renderer.toneMappingExposure = 1.5; // Increase exposure for brighter scene

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 800 : 1200;

        // Improved Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Increased ambient light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1).normalize();
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-1, -1, -1).normalize();
        scene.add(ambientLight, directionalLight, directionalLight2);

        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        // Create Gradient Background with subtle colors
        const background = new THREE.PlaneGeometry(10000, 10000);
        const backgroundMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec2 vUv;
                void main(){
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                void main(){
                    vec3 topColor = vec3(0.05, 0.1, 0.2); // Darker Blue
                    vec3 bottomColor = vec3(0.3, 0.5, 0.7); // Lighter Blue
                    gl_FragColor = vec4(mix(bottomColor, topColor, vUv.y), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        const backgroundMesh = new THREE.Mesh(background, backgroundMaterial);
        backgroundMesh.rotation.x = -Math.PI / 2;
        sceneGroup.add(backgroundMesh);

        // Adjust particle and shape counts based on device type
        const particleCount = isMobile ? 600 : 1200; // Reduced count for performance
        for (let i = 0; i < particleCount; i++) {
            const char = getRandomCharacter(),
                  texture = createTextTexture(char),
                  material = new THREE.SpriteMaterial({ 
                      map: texture, 
                      transparent: true, 
                      blending: THREE.AdditiveBlending, 
                      depthWrite: false // Improve performance and visual blending
                  }),
                  sprite = new THREE.Sprite(material);
            sprite.position.set(
                (Math.random() - 0.5) * 4000, 
                (Math.random() - 0.5) * 4000, 
                (Math.random() - 0.5) * 4000
            );
            sprite.scale.set(isMobile ? 120 : 180, isMobile ? 120 : 180, 1); // Slightly smaller for better balance
            sprite.speedX = (Math.random() - 0.5) * (isMobile ? 1.2 : 2.5);
            sprite.speedY = (Math.random() - 0.5) * (isMobile ? 1.2 : 2.5);
            sprite.speedZ = (Math.random() - 0.5) * (isMobile ? 1.2 : 2.5);
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.04; // Increased rotation speed for dynamism
            sceneGroup.add(sprite);
            particles.push(sprite);
        }

        // Generate procedural environment map
        cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
            format: THREE.RGBAFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
            encoding: THREE.sRGBEncoding
        });

        cubeCamera = new THREE.CubeCamera(1, 10000, cubeRenderTarget);
        scene.environment = cubeRenderTarget.texture;

        // Enhanced geometry types including TorusKnot and Möbius Strip
        const geometryTypes = [
            THREE.TorusKnotGeometry,
            createMobiusStrip, // Custom Möbius Strip function
            THREE.SphereGeometry,
            THREE.DodecahedronGeometry,
            THREE.TorusGeometry,
            THREE.PlaneGeometry
        ],
        shapeCount = isMobile ? 60 : 100; // Reduced count for performance

        for (let i = 0; i < shapeCount; i++) {
            let geometry;
            const selectedGeometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            if (selectedGeometry === createMobiusStrip) {
                geometry = selectedGeometry(100, 16); // segments and slices
            } else {
                switch(selectedGeometry){
                    case THREE.TorusKnotGeometry:
                        geometry = new THREE.TorusKnotGeometry(
                            Math.random() * 50 + 30, // radius
                            Math.random() * 10 + 5,  // tube
                            Math.floor(Math.random() * 100) + 100, // tubularSegments
                            Math.floor(Math.random() * 16) + 8,   // radialSegments
                            Math.floor(Math.random() * 10) + 2,    // p
                            Math.floor(Math.random() * 10) + 3     // q
                        );
                        break;
                    case THREE.SphereGeometry:
                        geometry = new THREE.SphereGeometry(
                            Math.random() * 50 + 20, // radius
                            Math.floor(Math.random() * 32) + 16, // widthSegments
                            Math.floor(Math.random() * 32) + 16  // heightSegments
                        );
                        break;
                    case THREE.DodecahedronGeometry:
                        geometry = new THREE.DodecahedronGeometry(Math.random() * 30 + 20, 0);
                        break;
                    case THREE.TorusGeometry:
                        geometry = new THREE.TorusGeometry(
                            Math.random() * 50 + 20, // radius
                            Math.random() * 5 + 5,   // tube
                            Math.floor(Math.random() * 16) + 8, // radialSegments
                            Math.floor(Math.random() * 16) + 8  // tubularSegments
                        );
                        break;
                    case THREE.PlaneGeometry:
                        geometry = new THREE.PlaneGeometry(
                            Math.random() * 100 + 50, // width
                            Math.random() * 100 + 50, // height
                            Math.floor(Math.random() * 10) + 1, // widthSegments
                            Math.floor(Math.random() * 10) + 1  // heightSegments
                        );
                        break;
                    default:
                        geometry = new THREE.IcosahedronGeometry(isMobile ? 80 : 120, 2);
                }
            }

            // Enhanced glassy material with physical properties
            const material = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(`hsl(${Math.random() * 360}, 70%, 60%)`), // Softer, more varied colors
                metalness: 0.1, // Slight metallic sheen
                roughness: 0.2, // Less rough for better reflections
                transmission: 0.9, // Slightly less than full transparency for better visibility
                transparent: true,
                opacity: 0.95,
                clearcoat: 1,
                clearcoatRoughness: 0,
                thickness: 5, // Increased thickness for better refraction
                envMap: cubeRenderTarget.texture,
                envMapIntensity: 1,
                side: THREE.DoubleSide,
                reflectivity: 0.9 // Enhanced reflectivity for shinier surfaces
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000
            );

            // Random scaling for more diversity
            const scale = Math.random() * 1.8 + 0.7; // Slightly reduced scale range
            mesh.scale.set(scale, scale, scale);

            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.015; // Slower rotation for elegance
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.015;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.015;

            sceneGroup.add(mesh);
            shapes.push(mesh);
        }

        // Initialize post-processing for bloom effect
        composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, // strength
            0.4, // radius
            0.85 // threshold
        );
        bloomPass.threshold = 0.21;
        bloomPass.strength = 1.2; // Increased strength for more pronounced bloom
        bloomPass.radius = 0.55;
        composer.addPass(bloomPass);

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);

        // Initial cube camera update
        cubeCamera.position.copy(camera.position);
        cubeCamera.update(renderer, scene);

        animate();
    }

    // Function to handle mouse movement
    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    }

    // Function to handle touch movement
    function onDocumentTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX) / windowHalfX;
            mouseY = (event.touches[0].pageY - windowHalfY) / windowHalfY;
        }
    }

    // Function to handle window resize
    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        particles.forEach(p => {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;
            p.material.rotation += p.rotationSpeed;
            // Boundary check and bounce
            if (p.position.x > 2000 || p.position.x < -2000) p.speedX *= -1;
            if (p.position.y > 2000 || p.position.y < -2000) p.speedY *= -1;
            if (p.position.z > 2000 || p.position.z < -2000) p.speedZ *= -1;
        });
        shapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
        });
        sceneGroup.rotation.y += 0.003;
        sceneGroup.rotation.x += 0.0025;
        const targetRotationY = mouseX * 0.1;
        const targetRotationX = mouseY * 0.1;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;

        // Update cube camera for reflections
        cubeCamera.position.copy(camera.position);
        cubeCamera.update(renderer, scene);

        // Use composer for post-processing
        composer.render();
    }

    // Initialize the scene
    init();

    // Preloader handling
    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1500);
    };

    // Form submission handling
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = form.username.value.trim(),
              domainSelect = form.querySelector('select[name="domain"]'),
              domain = domainSelect.value;
        if (username && domain) {
            const email = `${username}${domain}`,
                  loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/`;
            window.location.href = loginUrl;
        } else {
            alert('Please enter your username and select a domain.');
        }
    });

    // Prevent form submission on Enter key
    form.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});
