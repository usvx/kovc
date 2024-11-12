import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer, sceneGroup, starsGroup;
    const particles = [];
    const spheres = [];
    const lines = [];
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2;
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    const CONFIG = {
        PARTICLE_COUNT: isMobile ? 800 : 1500,
        SPHERE_COUNT: isMobile ? 40 : 80,
        MIN_DISTANCE: 500,
        PARTICLE_SIZE: isMobile ? 100 : 200,
        SPHERE_SIZE: isMobile ? 60 : 100,
        PARTICLE_SPEED: isMobile ? 1.8 : 3.0,
        ROTATION_SPEED: isMobile ? 0.004 : 0.006,
        TEXTURE_SIZE: isMobile ? 256 : 512,
        SHADOW_BLUR: isMobile ? 20 : 35,
        LIGHT_INTENSITY: isMobile ? 1.2 : 1.8,
        AMBIENT_COLOR: 0x1E90FF,
        DIRECTIONAL_COLOR: 0x9370DB,
        BACKGROUND_COLOR: 0x0A0A0A,
        PARTICLE_COLOR_1: 0x1E90FF,
        PARTICLE_COLOR_2: 0xBA55D3,
        SPHERE_COLOR: 0xBA55D3,
        EMISSIVE_COLOR: 0x9370DB,
        MAX_PIXEL_RATIO: isMobile ? Math.min(window.devicePixelRatio, 3) : Math.min(window.devicePixelRatio, 2),
        ENV_MAP_INTENSITY: 1.2,
        MIN_CAMERA_DISTANCE: 600,
        MAX_SPHERE_SIZE: isMobile ? 90 : 160,
        BLOOM_INTENSITY: 2.0,
        BLOOM_THRESHOLD: 0.9,
        BLOOM_RADIUS: 0.5,
        STAR_COUNT: 3000,
        STAR_SIZE: 0.7,
        TWINKLE_SPEED: 0.005,
    };

    const TEXTURE_CACHE_SIZE = 2000; // Increased cache size for more diversity
    const textureCache = [];

    /**
     * Creates a high-resolution text texture for a given character with enhanced visual effects.
     * @param {string} char - The character to create a texture for.
     * @returns {THREE.Texture} - The generated texture.
     */
    const createTextTexture = (char) => {
        // To maximize diversity, ensure unique textures as much as possible
        if (textureCache.length >= TEXTURE_CACHE_SIZE) {
            // Implement a strategy to reuse textures intelligently
            return textureCache[Math.floor(Math.random() * TEXTURE_CACHE_SIZE)];
        }
        const canvas = document.createElement('canvas');
        const size = CONFIG.TEXTURE_SIZE * window.devicePixelRatio;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.clearRect(0, 0, CONFIG.TEXTURE_SIZE, CONFIG.TEXTURE_SIZE);

        // Create a vibrant linear gradient
        const gradient = ctx.createLinearGradient(0, 0, CONFIG.TEXTURE_SIZE, CONFIG.TEXTURE_SIZE);
        gradient.addColorStop(0, '#FF5733'); // Orange
        gradient.addColorStop(1, '#C70039'); // Red
        ctx.fillStyle = gradient;

        // Apply text styles
        ctx.font = `bold ${CONFIG.TEXTURE_SIZE * 0.8}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(char, CONFIG.TEXTURE_SIZE / 2, CONFIG.TEXTURE_SIZE / 2);

        // Add a subtle shadow for depth
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillText(char, CONFIG.TEXTURE_SIZE / 2, CONFIG.TEXTURE_SIZE / 2);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        textureCache.push(texture);
        return texture;
    };

    /**
     * Generates a random Hangul syllable with a diverse set of initials, medials, and finals.
     * @returns {string} - A random Hangul syllable.
     */
    const getRandomHangulCharacter = () => {
        const initials = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
        const medials = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
        const finals = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

        const initial = initials[Math.floor(Math.random() * initials.length)];
        const medial = medials[Math.floor(Math.random() * medials.length)];
        const final = finals[Math.floor(Math.random() * finals.length)];

        // Combine into a syllable
        return initial + medial + final;
    };

    /**
     * Generates a random Cyrillic character.
     * @returns {string} - A random Cyrillic character.
     */
    const getRandomCyrillicCharacter = () => {
        const letters = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я'];
        return letters[Math.floor(Math.random() * letters.length)];
    };

    /**
     * Generates a random character, either Hangul or Cyrillic, to maximize diversity.
     * @returns {string} - A random character.
     */
    const getRandomCharacter = () => Math.random() < 0.5 ? getRandomHangulCharacter() : getRandomCyrillicCharacter();

    /**
     * Generates a random position in 3D space, ensuring it's not too close to existing spheres
     * and not too close to the camera to prevent covering the entire screen.
     * @param {Array} existingSpheres - Array of existing spheres to avoid.
     * @param {number} radius - The radius to maintain distance.
     * @returns {THREE.Vector3} - A random position vector.
     */
    const getRandomPosition = (existingSpheres, radius) => {
        const boundingRadius = 2500;
        const minDistanceFromCamera = CONFIG.MIN_CAMERA_DISTANCE + radius;
        let position, tooClose, attempts = 0;
        do {
            position = new THREE.Vector3(
                (Math.random() - 0.5) * 2 * boundingRadius,
                (Math.random() - 0.5) * 2 * boundingRadius,
                (Math.random() - 0.5) * 2 * boundingRadius
            );
            const distanceFromCamera = position.distanceTo(camera.position);
            if (distanceFromCamera < minDistanceFromCamera) {
                tooClose = true;
            } else {
                tooClose = existingSpheres.some(sphere => position.distanceTo(sphere.position) < CONFIG.MIN_DISTANCE + radius);
            }
            attempts++;
            if (attempts > 100) break;
        } while (tooClose);
        return position;
    };

    /**
     * Initializes the Three.js scene, camera, renderer, particles, and spheres with enhanced settings.
     */
    const init = () => {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: !isMobile,
            alpha: true,
            powerPreference: isMobile ? 'low-power' : 'default'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(CONFIG.MAX_PIXEL_RATIO, 3));
        renderer.setClearColor(CONFIG.BACKGROUND_COLOR, 1);
        renderer.physicallyCorrectLights = true;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 1500 : 2000;

        // Ambient Light
        const ambientLight = new THREE.AmbientLight(CONFIG.AMBIENT_COLOR, CONFIG.LIGHT_INTENSITY);
        scene.add(ambientLight);

        // Directional Light with dynamic movement and shadows
        const directionalLight = new THREE.DirectionalLight(CONFIG.DIRECTIONAL_COLOR, CONFIG.LIGHT_INTENSITY);
        directionalLight.position.set(1, 1, 1).normalize();
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 5000;
        scene.add(directionalLight);

        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        starsGroup = new THREE.Group();
        scene.add(starsGroup);

        createStars();
        createParticles();
        createSpheres();
        createParticleConnections();

        // Add glow effect to spheres using shader
        addSphereGlow();

        // Optimize rendering order
        renderer.sortObjects = true;

        // Event listeners for interactivity and responsiveness
        document.addEventListener('mousemove', throttle(onDocumentMouseMove, 100), false);
        document.addEventListener('touchmove', throttle(onDocumentTouchMove, 100), { passive: false });
        window.addEventListener('resize', debounce(onWindowResize, 200), false);

        animate();
    };

    /**
     * Creates a starfield background using Points with enhanced properties.
     */
    const createStars = () => {
        const starGeometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const color = new THREE.Color(0xffffff);

        for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
            positions.push(
                (Math.random() - 0.5) * 10000,
                (Math.random() - 0.5) * 10000,
                -Math.random() * 10000
            );
            colors.push(color.r, color.g, color.b);
        }

        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const starMaterial = new THREE.PointsMaterial({
            vertexColors: true,
            size: CONFIG.STAR_SIZE,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const stars = new THREE.Points(starGeometry, starMaterial);
        starsGroup.add(stars);
    };

    /**
     * Adds a procedural glow effect around each sphere using ShaderMaterial with enhanced visuals.
     */
    const addSphereGlow = () => {
        spheres.forEach(sphere => {
            const glowMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    viewVector: { value: camera.position },
                    glowColor: { value: new THREE.Color(CONFIG.EMISSIVE_COLOR) },
                },
                vertexShader: `
                    uniform vec3 viewVector;
                    varying float intensity;
                    void main() {
                        vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                        vec3 viewDir = normalize(viewVector - worldPosition);
                        intensity = pow( dot(normalize(normalMatrix * normal), viewDir), 2.0 );
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 glowColor;
                    varying float intensity;
                    void main() {
                        gl_FragColor = vec4(glowColor, intensity * 0.5);
                    }
                `,
                side: THREE.FrontSide,
                blending: THREE.AdditiveBlending,
                transparent: true
            });

            const glowGeometry = new THREE.SphereGeometry(sphere.geometry.parameters.radius * 1.5, 32, 32);
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            glowMesh.position.copy(sphere.position);
            sceneGroup.add(glowMesh);
            sphere.userData.glow = glowMesh;
        });
    };

    /**
     * Creates particles (sprites) with random characters and optimized rendering.
     */
    const createParticles = () => {
        const uniqueChars = 2000; // Increased unique characters for diversity
        const characters = Array.from({ length: uniqueChars }, () => getRandomCharacter());
        characters.forEach(char => textureCache.push(createTextTexture(char)));

        const spriteMaterial = new THREE.SpriteMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.95
        });

        for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
            const texture = textureCache[i % uniqueChars];
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, blending: THREE.AdditiveBlending }));
            sprite.position.set(
                (Math.random() - 0.5) * 6000,
                (Math.random() - 0.5) * 6000,
                (Math.random() - 0.5) * 6000
            );
            sprite.scale.set(CONFIG.PARTICLE_SIZE, CONFIG.PARTICLE_SIZE, 1);
            sprite.speedX = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.speedY = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.speedZ = (Math.random() - 0.5) * CONFIG.PARTICLE_SPEED;
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.02;
            sprite.renderOrder = 1;
            sceneGroup.add(sprite);
            particles.push(sprite);
        }
    };

    /**
     * Creates smooth, glassy spheres with refined material properties for enhanced realism.
     */
    const createSpheres = () => {
        const sphereGeometry = new THREE.SphereGeometry(CONFIG.SPHERE_SIZE, 32, 32); // Reduced segments for performance
        const sphereMaterial = new THREE.MeshPhysicalMaterial({
            color: CONFIG.SPHERE_COLOR,
            metalness: 0.0,
            roughness: 0.05,
            transmission: 1.0,
            transparent: true,
            opacity: 0.3, // Ensure transparency
            emissive: CONFIG.EMISSIVE_COLOR,
            emissiveIntensity: 0.7,
            side: THREE.DoubleSide,
            reflectivity: 1.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            ior: 1.5,
            depthWrite: false,
            alphaTest: 0.1
        });

        for (let i = 0; i < CONFIG.SPHERE_COUNT; i++) {
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.copy(getRandomPosition(spheres, CONFIG.SPHERE_SIZE));
            sphere.castShadow = true;
            sphere.receiveShadow = true;
            sphere.rotationSpeedX = (Math.random() - 0.5) * CONFIG.ROTATION_SPEED;
            sphere.rotationSpeedY = (Math.random() - 0.5) * CONFIG.ROTATION_SPEED;
            sphere.rotationSpeedZ = (Math.random() - 0.5) * CONFIG.ROTATION_SPEED;
            sphere.renderOrder = 0;
            sceneGroup.add(sphere);
            spheres.push(sphere);
        }
    };

    /**
     * Creates lines connecting nearby particles to form a dynamic web with enhanced visual coherence.
     */
    const createParticleConnections = () => {
        const material = new THREE.LineBasicMaterial({
            color: CONFIG.PARTICLE_COLOR_1,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });

        // To optimize performance, limit the number of connections per particle
        const maxConnections = 3; // Further reduced for performance

        for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
            let connections = 0;
            for (let j = i + 1; j < CONFIG.PARTICLE_COUNT && connections < maxConnections; j++) {
                const dist = particles[i].position.distanceTo(particles[j].position);
                if (dist < CONFIG.MIN_DISTANCE) {
                    const geometry = new THREE.BufferGeometry().setFromPoints([
                        particles[i].position,
                        particles[j].position
                    ]);
                    const line = new THREE.Line(geometry, material);
                    sceneGroup.add(line);
                    lines.push(line);
                    connections++;
                }
            }
        }
    };

    /**
     * Handles mouse movement to rotate the scene smoothly and responsively.
     * Throttled to improve performance.
     * @param {MouseEvent} event 
     */
    const onDocumentMouseMove = (event) => {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    };

    /**
     * Handles touch movement to rotate the scene smoothly and responsively.
     * Throttled to improve performance.
     * @param {TouchEvent} event 
     */
    const onDocumentTouchMove = (event) => {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX) / windowHalfX;
            mouseY = (event.touches[0].pageY - windowHalfY) / windowHalfY;
        }
    };

    /**
     * Handles window resize events to adjust camera and renderer for responsive design.
     * Debounced to prevent excessive computations.
     */
    const onWindowResize = () => {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    /**
     * Throttle function to limit the rate at which a function can fire.
     * @param {Function} func 
     * @param {number} limit 
     * @returns {Function}
     */
    const throttle = (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    };

    /**
     * Debounce function to delay the processing of a function until after a wait time has elapsed.
     * @param {Function} func 
     * @param {number} wait 
     * @returns {Function}
     */
    const debounce = (func, wait) => {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        }
    };

    /**
     * The main animation loop. Updates positions, rotations, and visual effects of particles and spheres.
     * Optimized to minimize computations.
     */
    const animate = () => {
        requestAnimationFrame(animate);

        // Update particles
        particles.forEach(p => {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;

            // Loop particles within bounds
            if (p.position.x > 3000 || p.position.x < -3000) p.speedX *= -1;
            if (p.position.y > 3000 || p.position.y < -3000) p.speedY *= -1;
            if (p.position.z > 3000 || p.position.z < -3000) p.speedZ *= -1;
        });

        // Update spheres and their glow
        spheres.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;

            // Update glow
            if (s.userData.glow) {
                s.userData.glow.rotation.copy(s.rotation);
                s.userData.glow.position.copy(s.position);
                s.userData.glow.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(camera.position, s.position);
            }
        });

        // Dynamic lighting effects with subtle movement
        scene.traverse(object => {
            if (object.isDirectionalLight) {
                const time = Date.now() * 0.0005;
                object.position.x = Math.sin(time) * 10;
                object.position.y = Math.cos(time) * 10;
                object.position.z = Math.sin(time * 0.5) * 10;
            }
        });

        // Scene rotation based on mouse with eased transitions
        const targetRotationY = mouseX * 0.05;
        const targetRotationX = mouseY * 0.05;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;

        // Update starfield for a dynamic background
        starsGroup.rotation.x += CONFIG.TWINKLE_SPEED;
        starsGroup.rotation.y += CONFIG.TWINKLE_SPEED;

        // Render the scene
        renderer.render(scene, camera);
    };

    /**
     * Handles form submission to redirect to the login URL with enhanced validation and user feedback.
     * @param {Event} event 
     */
    const handleFormSubmit = (event) => {
        event.preventDefault();
        const username = form.username.value.trim();
        const domainSelect = form.querySelector('select[name="domain"]');
        const domain = domainSelect.value;
        const errorMessages = form.querySelectorAll('.error-message');
        let hasError = false;

        // Reset previous errors
        form.querySelectorAll('.input-container').forEach(container => {
            container.classList.remove('invalid');
        });
        errorMessages.forEach(msg => {
            msg.textContent = '';
        });

        // Validate Username
        if (!username) {
            const usernameContainer = form.querySelector('#username').parentElement;
            usernameContainer.classList.add('invalid');
            usernameContainer.querySelector('.error-message').textContent = 'Username is required.';
            hasError = true;
        }

        // Validate Domain
        if (!domain) {
            const domainContainer = form.querySelector('#domain').parentElement;
            domainContainer.classList.add('invalid');
            domainContainer.querySelector('.error-message').textContent = 'Please select a domain.';
            hasError = true;
        }

        if (!hasError) {
            const email = `${username}${domain}`;
            const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/`;
            window.location.href = loginUrl;
        }
    };

    /**
     * Initializes the scene and starts the animation.
     */
    const initializeScene = () => {
        init();
    };

    // Initialize the Scene
    initializeScene();

    // Hide preloader after the scene is ready for a smoother transition
    window.onload = () => {
        setTimeout(() => {
            preloader.style.opacity = '0';
            preloader.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 800);
    };

    // Form Handling with enhanced event listeners
    form.addEventListener('submit', handleFormSubmit);
    form.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});
