/* js/script.js */

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

    function createTextTexture(char) {
        const canvas = document.createElement('canvas');
        const size = isMobile ? 128 : 256; // Reduced size for better performance
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Create a vibrant gradient for the text
        const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.5);
        gradient.addColorStop(0, '#00FFAA'); // Teal
        gradient.addColorStop(1, '#FFAA00'); // Amber
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#AA00FF'; // Deep purple shadow
        ctx.shadowBlur = isMobile ? 15 : 25; // Adjusted shadow blur
        ctx.fillText(char, size / 2, size / 2);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
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
        renderer.setPixelRatio(window.devicePixelRatio);
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.0005); // Subtle fog for depth

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000); // Reduced far plane for performance
        camera.position.z = isMobile ? 800 : 1000;

        // Ambient Light with vibrant color
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
        scene.add(ambientLight);

        // Point Light for dynamic lighting effects
        const pointLight = new THREE.PointLight(0xAA00FF, 1, 1000); // Deep purple light with shorter range
        pointLight.position.set(0, 0, 500);
        scene.add(pointLight);

        // Group to hold all particles and shapes
        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        // Create Hangeul and Cyrillic particles
        const particleCount = isMobile ? 500 : 1000; // Reduced count for performance
        for (let i = 0; i < particleCount; i++) {
            const char = getRandomCharacter();
            const texture = createTextTexture(char);
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true, blending: THREE.AdditiveBlending });
            const sprite = new THREE.Sprite(material);
            sprite.position.x = (Math.random() - 0.5) * 2000; // Reduced spread
            sprite.position.y = (Math.random() - 0.5) * 2000;
            sprite.position.z = (Math.random() - 0.5) * 2000;
            sprite.scale.set(50, 50, 1); // Reduced size for better aesthetics
            sprite.speedX = (Math.random() - 0.5) * 0.5; // Slower movement
            sprite.speedY = (Math.random() - 0.5) * 0.5;
            sprite.speedZ = (Math.random() - 0.5) * 0.5;
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.01; // Slower rotation
            sceneGroup.add(sprite);
            particles.push(sprite);
        }

        // Create geometric shapes with wireframe materials
        const geometryTypes = [];

        // Torus Knot Geometry
        geometryTypes.push(new THREE.TorusKnotGeometry(50, 10, 100, 16));

        // Icosahedron Geometry
        geometryTypes.push(new THREE.IcosahedronGeometry(50, 0));

        // Custom Tube Geometry
        const path = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-100, -100, -100),
            new THREE.Vector3(0, 100, 0),
            new THREE.Vector3(100, -100, 100)
        ]);
        geometryTypes.push(new THREE.TubeGeometry(path, 64, 10, 8, false));

        const shapeCount = isMobile ? 25 : 50; // Reduced count for performance
        for (let i = 0; i < shapeCount; i++) {
            const geometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            const material = new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
                wireframe: true,
                transparent: true,
                opacity: 0.2, // Reduced opacity for subtlety
                emissive: 0x00FFD1, // Added emissive color for glow effect
                emissiveIntensity: 0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = (Math.random() - 0.5) * 2000; // Reduced spread
            mesh.position.y = (Math.random() - 0.5) * 2000;
            mesh.position.z = (Math.random() - 0.5) * 2000;
            mesh.rotationSpeedX = (Math.random() - 0.5) * 0.01; // Slower rotation
            mesh.rotationSpeedY = (Math.random() - 0.5) * 0.01;
            mesh.rotationSpeedZ = (Math.random() - 0.5) * 0.01;
            sceneGroup.add(mesh);
            shapes.push(mesh);
        }

        // Event listeners for interactivity
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
    }

    function animate() {
        requestAnimationFrame(animate);

        // Update particle positions
        particles.forEach(p => {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;

            // Boundary conditions to keep particles within a range
            if (p.position.x > 1000 || p.position.x < -1000) p.speedX *= -1;
            if (p.position.y > 1000 || p.position.y < -1000) p.speedY *= -1;
            if (p.position.z > 1000 || p.position.z < -1000) p.speedZ *= -1;
        });

        // Rotate geometric shapes
        shapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
        });

        // Slight rotation of the entire scene group for a dynamic effect
        sceneGroup.rotation.y += 0.0005; // Slower rotation
        sceneGroup.rotation.x += 0.0005;

        // Smooth rotation based on mouse movement
        const targetRotationY = mouseX * 0.05;
        const targetRotationX = mouseY * 0.05;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;

        renderer.render(scene, camera);
    }

    init();

    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1500);
    };

    // Form submission handling
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

    // Prevent form submission on Enter key
    form.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});
