document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer;
    let particles = [];
    let shapes = [];
    let sceneGroup;
    let mouseX = 0, mouseY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    const PARTICLE_COUNT = 1200;
    const SHAPE_COUNT = 80;
    const BG_DEPTH_LIMIT = 2500;
    const PARTICLE_SPEED_FACTOR = isMobile ? 2 : 4;
    const SHAPE_ROTATION_SPEED = 0.015;
    const SCENE_ROTATION_Y_INC = 0.0025;
    const SCENE_ROTATION_X_INC = 0.002;
    const SCENE_ROTATION_FOLLOW_FACTOR = 0.05;

    let hueShift = 0; // We'll shift colors over time

    /** 
     * Create a texture for a character with a dynamic pastel color influenced by hueShift.
     */
    const createTextTexture = (char) => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, size, size);
        // Dynamically adjust hue
        const hue = (180 + hueShift) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 80%)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
        ctx.fillText(char, size / 2, size / 2);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture.premultiplyAlpha = true;
        return texture;
    };

    const getRandomCharacter = () => {
        const hangulInitials = [0x1100,0x1102,0x1103,0x1105,0x1106,0x1107,0x1109,0x110B,0x110C,0x110E,0x110F,0x1110,0x1111,0x1112];
        const hangulMedials = [0x1161,0x1165,0x1166,0x1167,0x1169,0x116E,0x1172,0x1173,0x1175];
        const hangulFinals = [0x0000,0x11A8,0x11AB,0x11AF,0x11B7,0x11BA];

        const initial = hangulInitials[Math.floor(Math.random() * hangulInitials.length)];
        const medial = hangulMedials[Math.floor(Math.random() * hangulMedials.length)];
        const final = hangulFinals[Math.floor(Math.random() * hangulFinals.length)];

        const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
        const hangulChar = String.fromCharCode(syllableCode);

        const cyrillicLetters = ['А','Б','В','Г','Д','Е','Ж','З','И','К','Л','М','Н','О','П','Р','С','Т','У','Ф','Х','Ц','Ч','Ш','Э','Ю','Я'];
        return Math.random() < 0.5 ? hangulChar : cyrillicLetters[Math.floor(Math.random() * cyrillicLetters.length)];
    };

    const init = () => {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias:true, alpha:true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 1000 : 1500;

        const ambientLight = new THREE.AmbientLight(0x99ffff, 2);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xFF00FF, 0.8);
        directionalLight.position.set(1,1,1).normalize();
        scene.add(directionalLight);

        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        // Particles
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const char = getRandomCharacter();
            const texture = createTextTexture(char);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent:true,
                blending:THREE.AdditiveBlending,
                depthWrite:false,
                opacity:0.7
            });
            const sprite = new THREE.Sprite(material);
            sprite.position.set((Math.random()-0.5)*5000, (Math.random()-0.5)*5000, (Math.random()-0.5)*5000);
            sprite.scale.set(150,150,1);
            sprite.speedX = (Math.random()-0.5)*PARTICLE_SPEED_FACTOR;
            sprite.speedY = (Math.random()-0.5)*PARTICLE_SPEED_FACTOR;
            sprite.speedZ = (Math.random()-0.5)*PARTICLE_SPEED_FACTOR;
            sprite.rotationSpeed = (Math.random()-0.5)*0.1;

            // Add a subtle pulsation
            sprite.pulseOffset = Math.random() * Math.PI * 2;

            sceneGroup.add(sprite);
            particles.push(sprite);
        }

        // Shapes with enhanced material and subtle color shifts
        const baseMaterialProps = {
            wireframe:true,
            transparent:true,
            opacity:0.2,
            emissive:0x99ffff,
            emissiveIntensity:0.3,
            blending:THREE.AdditiveBlending,
            depthWrite:false,
            metalness:0.5,
            roughness:0.1,
            color:0xffffff
        };

        const shapeMaterial = new THREE.MeshStandardMaterial(baseMaterialProps);
        const geometryGenerators = [
            () => new THREE.CylinderGeometry(80,80,150,5,1,false),
            () => new THREE.IcosahedronGeometry(90,1)
        ];

        for (let i = 0; i < SHAPE_COUNT; i++) {
            const geometry = geometryGenerators[Math.floor(Math.random()*geometryGenerators.length)]();
            const mesh = new THREE.Mesh(geometry, shapeMaterial.clone());
            mesh.position.set((Math.random()-0.5)*5000, (Math.random()-0.5)*5000, (Math.random()-0.5)*5000);
            mesh.rotationSpeedX = (Math.random()-0.5)*SHAPE_ROTATION_SPEED;
            mesh.rotationSpeedY = (Math.random()-0.5)*SHAPE_ROTATION_SPEED;
            mesh.rotationSpeedZ = (Math.random()-0.5)*SHAPE_ROTATION_SPEED;
            // Pulsation offset
            mesh.pulseOffset = Math.random() * Math.PI * 2;

            sceneGroup.add(mesh);
            shapes.push(mesh);
        }

        // Events
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, { passive:false });
        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener('wheel', onDocumentWheel, { passive:true });

        animate();
    };

    const onDocumentMouseMove = (event) => {
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    };

    const onDocumentTouchMove = (event) => {
        if (event.touches.length === 1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX) / windowHalfX;
            mouseY = (event.touches[0].pageY - windowHalfY) / windowHalfY;
        }
    };

    const onWindowResize = () => {
        windowHalfX = window.innerWidth/2;
        windowHalfY = window.innerHeight/2;
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    // Add scroll interaction to slightly zoom in or out
    let zoomTarget = camera.position.z;
    const onDocumentWheel = (event) => {
        zoomTarget += event.deltaY * 0.5;
        zoomTarget = Math.min(Math.max(zoomTarget, 500), 3000); // clamp zoom
    };

    const animate = () => {
        requestAnimationFrame(animate);
        hueShift += 0.1; // Gradually shift hue

        // Smooth camera zoom
        camera.position.z += (zoomTarget - camera.position.z) * 0.05;

        // Update particles
        const time = performance.now() * 0.001;
        particles.forEach(p => {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;
            p.material.rotation += p.rotationSpeed;

            // Pulsation in scale
            const scalePulse = 1 + Math.sin(time + p.pulseOffset)*0.05;
            p.scale.set(150*scalePulse,150*scalePulse,1);

            // Bounce within space
            if (Math.abs(p.position.x)>BG_DEPTH_LIMIT) p.speedX*=-1;
            if (Math.abs(p.position.y)>BG_DEPTH_LIMIT) p.speedY*=-1;
            if (Math.abs(p.position.z)>BG_DEPTH_LIMIT) p.speedZ*=-1;
        });

        // Update shapes
        shapes.forEach(s => {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;

            // Pulsation in opacity
            const opacityPulse = 0.2 + (Math.sin(time + s.pulseOffset)*0.1);
            s.material.opacity = opacityPulse;

            // Subtle hue shift in emissive color
            const hue = (180 + hueShift) % 360;
            s.material.emissive.setHSL(hue/360, 1, 0.5);
        });

        // Scene rotation with subtle drifting
        sceneGroup.rotation.y += SCENE_ROTATION_Y_INC;
        sceneGroup.rotation.x += SCENE_ROTATION_X_INC;

        // Follow mouse smoothly
        targetRotationY = mouseX * 0.05;
        targetRotationX = mouseY * 0.05;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * SCENE_ROTATION_FOLLOW_FACTOR;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * SCENE_ROTATION_FOLLOW_FACTOR;

        renderer.render(scene, camera);
    };

    init();

    window.onload = () => {
        setTimeout(() => {
            preloader.style.display='none';
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
