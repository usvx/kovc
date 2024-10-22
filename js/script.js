// Import necessary modules from ESM.sh
import * as THREE from 'https://esm.sh/three@0.154.0';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const preloader = document.getElementById('preloader');
  let scene, camera, renderer;
  let particles = [];
  let shapes = [];
  let sceneGroup;
  let mouseX = 0,
    mouseY = 0;
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;
  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

  function createTextTexture(char, hueOffset = 0) {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Dynamic color based on hueOffset
    const hue = (Date.now() * 0.05 + hueOffset) % 360;
    ctx.clearRect(0, 0, size, size);
    ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
    ctx.shadowColor = `hsl(${(hue + 180) % 360}, 100%, 50%)`;
    ctx.shadowBlur = 15;
    ctx.fillText(char, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter; // Improve performance
    return texture;
  }

  function getRandomCharacter() {
    const hangeulInitials = [
      0x1100, 0x1102, 0x1103, 0x1105, 0x1106,
      0x1107, 0x1109, 0x110b, 0x110c, 0x110e,
      0x110f, 0x1110, 0x1111, 0x1112,
    ];
    const hangeulMedials = [
      0x1161, 0x1165, 0x1166, 0x1167,
      0x1169, 0x116e, 0x1172, 0x1173, 0x1175,
    ];
    const hangeulFinals = [0x0000, 0x11a8, 0x11ab, 0x11af, 0x11b7, 0x11ba];
    const cyrillicLetters = [
      'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж',
      'З', 'И', 'К', 'Л', 'М', 'Н', 'О',
      'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х',
      'Ц', 'Ч', 'Ш', 'Э', 'Ю', 'Я',
    ];
    const isHangeul = Math.random() < 0.5;
    if (isHangeul) {
      const initial = hangeulInitials[Math.floor(Math.random() * hangeulInitials.length)];
      const medial = hangeulMedials[Math.floor(Math.random() * hangeulMedials.length)];
      const final = hangeulFinals[Math.floor(Math.random() * hangeulFinals.length)];
      const syllableCode = 0xac00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11a7) : 0);
      return String.fromCharCode(syllableCode);
    } else {
      return cyrillicLetters[Math.floor(Math.random() * cyrillicLetters.length)];
    }
  }

  function init() {
    const canvas = document.getElementById('background');
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.setClearColor(0x000000, 1); // Set background color to deep black

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    camera.position.z = isMobile ? 1000 : 1500;

    // Adjusted lighting to enhance visuals
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    sceneGroup = new THREE.Group();
    scene.add(sceneGroup);

    const particleCount = isMobile ? 600 : 800;
    for (let i = 0; i < particleCount; i++) {
      const char = getRandomCharacter();
      const hueOffset = Math.random() * 360;
      const texture = createTextTexture(char, hueOffset);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(
        (Math.random() - 0.5) * 4000,
        (Math.random() - 0.5) * 4000,
        (Math.random() - 0.5) * 4000
      );
      const scale = isMobile ? 100 : 120;
      sprite.scale.set(scale, scale, 1);
      sprite.speed = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      sprite.rotationSpeed = (Math.random() - 0.5) * 0.05;
      sprite.hueOffset = hueOffset;
      sceneGroup.add(sprite);
      particles.push(sprite);
    }

    const geometryTypes = [
      THREE.TetrahedronGeometry,
      THREE.OctahedronGeometry,
      THREE.IcosahedronGeometry,
      THREE.DodecahedronGeometry,
    ];
    const shapeCount = isMobile ? 40 : 60;
    for (let i = 0; i < shapeCount; i++) {
      const GeometryClass = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
      const geometry = new GeometryClass(isMobile ? 60 : 80, 0);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(`hsl(${Math.random() * 360}, 100%, 50%)`),
        wireframe: true,
        transparent: true,
        opacity: 0.5,
        emissive: new THREE.Color(`hsl(${Math.random() * 360}, 100%, 50%)`),
        emissiveIntensity: 0.5,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 4000,
        (Math.random() - 0.5) * 4000,
        (Math.random() - 0.5) * 4000
      );
      mesh.rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );
      sceneGroup.add(mesh);
      shapes.push(mesh);
    }

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

    const time = Date.now() * 0.001;

    // Update particles
    particles.forEach((p) => {
      p.position.add(p.speed);
      p.material.rotation += p.rotationSpeed;

      // Update particle color dynamically
      const hue = (time * 20 + p.hueOffset) % 360;
      p.material.map = createTextTexture(p.material.map.image.innerText, hue);
      p.material.map.needsUpdate = true;

      // Boundary check
      const boundary = 2000;
      if (p.position.x > boundary || p.position.x < -boundary) p.speed.x *= -1;
      if (p.position.y > boundary || p.position.y < -boundary) p.speed.y *= -1;
      if (p.position.z > boundary || p.position.z < -boundary) p.speed.z *= -1;
    });

    // Update shapes
    shapes.forEach((s) => {
      s.rotation.x += s.rotationSpeed.x;
      s.rotation.y += s.rotationSpeed.y;
      s.rotation.z += s.rotationSpeed.z;

      // Update shape color dynamically
      const hue = (time * 10 + s.id * 10) % 360;
      s.material.color.setHSL(hue / 360, 1, 0.5);
      s.material.emissive.setHSL((hue + 180) / 360, 1, 0.5);
    });

    // Rotate scene group
    sceneGroup.rotation.y += 0.0015;
    sceneGroup.rotation.x += 0.001;

    // Mouse interaction
    const targetRotationY = mouseX * 0.02;
    const targetRotationX = mouseY * 0.02;
    sceneGroup.rotation.y += (targetRotationY - sceneGroup.rotation.y) * 0.05;
    sceneGroup.rotation.x += (targetRotationX - sceneGroup.rotation.x) * 0.05;

    renderer.render(scene, camera);
  }

  init();

  window.onload = () => {
    setTimeout(() => {
      preloader.style.opacity = '0';
      preloader.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 500);
    }, 1000);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = form.username.value.trim();
    const domainSelect = form.querySelector('select[name="domain"]');
    const domain = domainSelect.value;
    if (username && domain) {
      const email = `${username}${domain}`;
      const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(
        email
      )}&continue=https://mail.google.com/a/`;
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
