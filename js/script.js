// js/script.js

// Import Three.js as an ES Module using absolute URLs
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form'),
          preloader = document.getElementById('preloader');
    let scene, camera, renderer,
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
              size = isMobile ? 128 : 256; // Reduced size for performance
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.5}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#00FFFF');
        gradient.addColorStop(1, '#8A2BE2');
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#4B0082';
        ctx.shadowBlur = isMobile ? 15 : 25; // Reduced blur for performance
        ctx.fillText(char, size / 2, size / 2);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
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
    function createMobiusStrip(segments = 50, slices = 8) { // Reduced segments and slices for performance
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
        renderer.physicallyCorrectLights = true; // Enable physically correct lighting
        renderer.toneMapping = THREE.ACESFilmicToneMapping; // Better tone mapping
        renderer.toneMappingExposure = 1.0; // Adjust exposure for balanced brightness
        renderer.shadowMap.enabled = false; // Disable shadows for performance

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000); // Set background to black

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 800 : 1200;

        // Enhanced Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Increased ambient light
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(1, 1, 1).normalize();
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-1, -1, -1).normalize();
        scene.add(ambientLight, directionalLight1, directionalLight2);

        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        // Adjust particle and shape counts based on device type
        const particleCount = isMobile ? 400 : 800; // Further reduced count for better performance
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
                (Math.random() - 0.5) * 2000, // Reduced position range for better clustering
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000
            );
            sprite.scale.set(isMobile ? 100 : 150, isMobile ? 100 : 150, 1); // Adjusted scale for balance
            sprite.speedX = (Math.random() - 0.5) * (isMobile ? 0.8 : 1.5); // Reduced speed for smoother movement
            sprite.speedY = (Math.random() - 0.5) * (isMobile ? 0.8 : 1.5);
            sprite.speedZ = (Math.random() - 0.5) * (isMobile ? 0.8 : 1.5);
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.02; // Adjusted rotation speed
            sceneGroup.add(sprite);
            particles.push(sprite);
        }

        // Generate procedural environment map
        cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, { // Reduced resolution for performance
            format: THREE.RGBAFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
            encoding: THREE.sRGBEncoding
        });

        cubeCamera = new THREE.CubeCamera(1, 10000, cubeRenderTarget);
        cubeCamera.position.copy(camera.position);
        scene.add(cubeCamera);
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
        shapeCount = isMobile ? 40 : 80; // Further reduced count for performance

        for (let i = 0; i < shapeCount; i++) {
            let geometry;
            const selectedGeometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            if (selectedGeometry === createMobiusStrip) {
                geometry = selectedGeometry(50, 4); // Further reduced segments and slices
            } else {
                switch(selectedGeometry){
                    case THREE.TorusKnotGeometry:
                        geometry = new THREE.TorusKnotGeometry(
                            Math.random() * 30 + 20, // radius
                            Math.random() * 5 + 3,   // tube
                            Math.floor(Math.random() * 80) + 80, // tubularSegments
                            Math.floor(Math.random() * 12) + 6,   // radialSegments
                            Math.floor(Math.random() * 6) + 1,    // p
                            Math.floor(Math.random() * 6) + 1     // q
                        );
                        break;
                    case THREE.SphereGeometry:
                        geometry = new THREE.SphereGeometry(
                            Math.random() * 30 + 15, // radius
                            Math.floor(Math.random() * 24) + 12, // widthSegments
                            Math.floor(Math.random() * 24) + 12  // heightSegments
                        );
                        break;
                    case THREE.DodecahedronGeometry:
                        geometry = new THREE.DodecahedronGeometry(Math.random() * 15 + 10, 0);
                        break;
                    case THREE.TorusGeometry:
                        geometry = new THREE.TorusGeometry(
                            Math.random() * 30 + 15, // radius
                            Math.random() * 3 + 2,   // tube
                            Math.floor(Math.random() * 12) + 6, // radialSegments
                            Math.floor(Math.random() * 12) + 6  // tubularSegments
                        );
                        break;
                    case THREE.PlaneGeometry:
                        geometry = new THREE.PlaneGeometry(
                            Math.random() * 50 + 25, // width
                            Math.random() * 50 + 25, // height
                            Math.floor(Math.random() * 5) + 1, // widthSegments
                            Math.floor(Math.random() * 5) + 1  // heightSegments
                        );
                        break;
                    default:
                        geometry = new THREE.IcosahedronGeometry(isMobile ? 40 : 60, 1); // Reduced subdivisions
                }
            }

            // Enhanced glassy material with physical properties
            const material = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(`hsl(${Math.random() * 360}, 70%, 50%)`), // Softer, more varied colors
                metalness: 0.1, // Slight metallic sheen
                roughness: 0.1, // Less rough for better reflections
                transmission: 0.95, // High transparency for glass-like effect
                transparent: true,
                opacity: 0.95,
                clearcoat: 1,
                clearcoatRoughness: 0,
                thickness: 10, // Increased thickness for better refraction
                envMap: cubeRenderTarget.texture,
                envMapIntensity: 1,
                side: THREE.DoubleSide,
                reflectivity: 0.9, // Enhanced reflectivity for shinier surfaces
                ior: 1.5 // Index of Refraction for glass-like material
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * 2000, // Reduced position range for better clustering
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000
            );

            // Random scaling for more diversity
            const scale = Math.random() * 1.2 + 0.5; // Adjusted scale range
            mesh.scale.set(scale, scale, scale);

            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.01; // Slower rotation for elegance
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.01;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.01;

            sceneGroup.add(mesh);
            shapes.push(mesh);
        }

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
            if (p.position.x > 1000 || p.position.x < -1000) p.speedX *= -1;
            if (p.position.y > 1000 || p.position.y < -1000) p.speedY *= -1;
            if (p.position.z > 1000 || p.position.z < -1000) p.speedZ *= -1;
        });
        shapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
        });
        sceneGroup.rotation.y += 0.002; // Reduced rotation speed for smoother performance
        sceneGroup.rotation.x += 0.0015;
        const targetRotationY = mouseX * 0.05; // Reduced influence for smoother interaction
        const targetRotationX = mouseY * 0.05;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.02; // Slower interpolation
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.02;

        // Update cube camera for reflections
        cubeCamera.position.copy(camera.position);
        cubeCamera.update(renderer, scene);

        renderer.render(scene, camera);
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
