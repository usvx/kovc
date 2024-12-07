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
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    // Reduced particle count for better performance and smoothness.
    const PARTICLE_COUNT = isMobile ? 500 : 700; 
    const SHAPE_COUNT = isMobile ? 40 : 60;

    // Pre-made character atlas: a grid of Korean & Cyrillic chars.
    // Assume char-atlas.png is a high-quality atlas image.
    let charAtlas = new THREE.TextureLoader().load('img/char-atlas.png');
    charAtlas.anisotropy = 16;

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias:true, alpha:true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = isMobile ? 1000 : 1400;

        const ambientLight = new THREE.AmbientLight(0x00FFD1, 2);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xFF00FF, 0.8);
        directionalLight.position.set(1,1,1).normalize();
        scene.add(directionalLight);

        sceneGroup = new THREE.Group();
        scene.add(sceneGroup);

        // Create particle sprites from atlas: 
        // We'll randomly pick regions of the atlas for each sprite.
        // Assume the atlas is an 8x8 grid of different characters
        const gridSize = 8;
        const cellSize = 1 / gridSize;

        for (let i=0; i<PARTICLE_COUNT; i++) {
            const material = new THREE.SpriteMaterial({ map:charAtlas, transparent:true, blending:THREE.AdditiveBlending });
            const sprite = new THREE.Sprite(material);
            sprite.position.x = (Math.random()-0.5)*4000;
            sprite.position.y = (Math.random()-0.5)*4000;
            sprite.position.z = (Math.random()-0.5)*4000;
            sprite.scale.set(120,120,1);
            sprite.speedX = (Math.random()-0.5)*(isMobile?1.5:3);
            sprite.speedY = (Math.random()-0.5)*(isMobile?1.5:3);
            sprite.speedZ = (Math.random()-0.5)*(isMobile?1.5:3);
            sprite.rotationSpeed = (Math.random()-0.5)*0.02;

            // Random UV offset:
            const ux = Math.floor(Math.random()*gridSize);
            const uy = Math.floor(Math.random()*gridSize);
            sprite.material.map.offset.set(ux*cellSize, uy*cellSize);
            sprite.material.map.repeat.set(cellSize, cellSize);

            sceneGroup.add(sprite);
            particles.push(sprite);
        }

        const geometryTypes = [THREE.TetrahedronGeometry, THREE.OctahedronGeometry, THREE.IcosahedronGeometry, THREE.DodecahedronGeometry];
        for (let i=0; i<SHAPE_COUNT; i++) {
            const GeometryClass = geometryTypes[Math.floor(Math.random()*geometryTypes.length)];
            const geometry = new GeometryClass(90,1);
            const material = new THREE.MeshStandardMaterial({
                color:0x00FFD1,
                wireframe:true,
                transparent:true,
                opacity:0.4,
                emissive:0xFF00FF,
                emissiveIntensity:0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = (Math.random()-0.5)*4000;
            mesh.position.y = (Math.random()-0.5)*4000;
            mesh.position.z = (Math.random()-0.5)*4000;
            mesh.rotationSpeedX = (Math.random()-0.5)*0.01;
            mesh.rotationSpeedY = (Math.random()-0.5)*0.01;
            mesh.rotationSpeedZ = (Math.random()-0.5)*0.01;
            sceneGroup.add(mesh);
            shapes.push(mesh);
        }

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('touchmove', onDocumentTouchMove, {passive:false});
        window.addEventListener('resize', onWindowResize, false);
        animate();
    }

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX)/windowHalfX;
        mouseY = (event.clientY - windowHalfY)/windowHalfY;
    }

    function onDocumentTouchMove(event) {
        if(event.touches.length===1) {
            event.preventDefault();
            mouseX = (event.touches[0].pageX - windowHalfX)/windowHalfX;
            mouseY = (event.touches[0].pageY - windowHalfY)/windowHalfY;
        }
    }

    function onWindowResize() {
        windowHalfX = window.innerWidth/2;
        windowHalfY = window.innerHeight/2;
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);

        // Update particles
        for (let p of particles) {
            p.position.x += p.speedX;
            p.position.y += p.speedY;
            p.position.z += p.speedZ;
            p.material.rotation += p.rotationSpeed;
            if (Math.abs(p.position.x) > 2000) p.speedX *= -1;
            if (Math.abs(p.position.y) > 2000) p.speedY *= -1;
            if (Math.abs(p.position.z) > 2000) p.speedZ *= -1;
        }

        // Update shapes
        for (let s of shapes) {
            s.rotation.x += s.rotationSpeedX;
            s.rotation.y += s.rotationSpeedY;
            s.rotation.z += s.rotationSpeedZ;
        }

        sceneGroup.rotation.y += 0.0015;
        sceneGroup.rotation.x += 0.001;
        const targetRotationY = mouseX *0.03;
        const targetRotationX = mouseY *0.03;
        sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y)*0.02;
        sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x)*0.02;

        renderer.render(scene, camera);
    }

    init();
    window.onload = () => {
        setTimeout(()=>{ preloader.style.display='none'; },700);
    };
    form.addEventListener('submit',(event)=>{
        event.preventDefault();
        const username = form.username.value.trim();
        const domainSelect = form.querySelector('select[name="domain"]');
        const domain = domainSelect.value;
        if(username && domain) {
            const email = `${username}${domain}`;
            const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/`;
            window.location.href = loginUrl;
        } else {
            alert('Please enter your username and select a domain.');
        }
    });
    form.addEventListener('keydown',(event)=>{
        if(event.key==='Enter') {
            event.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
});
