import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

    class TextureCreator {
        static createTextTexture(char, size = 512) {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = isMobile ? 256 : size;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, size, size);
            ctx.font = `${size * 0.6}px 'Urbanist', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const hue = Math.random() * 360;
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, `hsl(${hue}, 100%, 80%)`);
            gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 100%, 60%)`);
            ctx.fillStyle = gradient;
            ctx.shadowColor = `hsl(${(hue + 180) % 360}, 100%, 40%)`;
            ctx.shadowBlur = isMobile ? 40 : 60;
            ctx.fillText(char, size / 2, size / 2);

            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        }
    }

    class CharacterGenerator {
        static getRandomHangulCharacter() {
            const initials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112];
            const medials = [0x1161, 0x1163, 0x1165, 0x1167, 0x1169, 0x116D, 0x1162, 0x1164, 0x1166, 0x1168, 0x116A];
            const finals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA, 0x11C2];

            const syllableCode = 0xAC00 +
                ((initials[Math.floor(Math.random() * initials.length)] - 0x1100) * 588) +
                ((medials[Math.floor(Math.random() * medials.length)] - 0x1161) * 28) +
                (finals[Math.floor(Math.random() * finals.length)] ? (finals[Math.floor(Math.random() * finals.length)] - 0x11A7) : 0);

            return String.fromCharCode(syllableCode);
        }

        static getRandomCyrillicCharacter() {
            const start = 0x0410, end = 0x042F;
            return String.fromCharCode(Math.floor(Math.random() * (end - start + 1)) + start);
        }

        static getRandomCharacter() {
            return Math.random() < 0.7 ? this.getRandomHangulCharacter() : this.getRandomCyrillicCharacter();
        }
    }

    class SceneManager {
        constructor() {
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
            this.camera.position.z = isMobile ? 800 : 1200;

            this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('background'), antialias: true, alpha: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.outputEncoding = THREE.sRGBEncoding;

            this.sceneGroup = new THREE.Group();
            this.scene.add(this.sceneGroup);
            this.particles = [];
            this.shapes = [];

            this.addLighting();
            this.populateScene();
            this.animate();

            window.addEventListener('resize', this.onWindowResize.bind(this));
        }

        addLighting() {
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
            directionalLight.position.set(1, 1, 1).normalize();
            this.scene.add(ambientLight, directionalLight);
        }

        populateScene() {
            const geometry = new THREE.SphereGeometry(isMobile ? 100 : 140, 64, 64);
            const shapeCount = isMobile ? 50 : 100;

            for (let i = 0; i < shapeCount; i++) this.addShape(geometry);
            for (let i = 0; i < (isMobile ? 400 : 800); i++) this.addParticle();
        }

        addShape(geometry) {
            const hue = Math.random() * 360;
            const material = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(`hsl(${hue}, 100%, 80%)`),
                emissive: new THREE.Color(`hsl(${(hue + 180) % 360}, 100%, 50%)`),
                emissiveIntensity: 0.8,
                metalness: 0.5,
                roughness: 0.1,
                transmission: 0.95,
                opacity: 0.7,
                transparent: true,
                clearcoat: 1,
                clearcoatRoughness: 0.05,
                reflectivity: 1.0,
                ior: 1.4,
                thickness: 10,
            });

            const mesh = new THREE.Mesh(geometry, material);
            this.resetPosition(mesh);
            this.shapes.push(mesh);
            this.sceneGroup.add(mesh);
        }

        addParticle() {
            const char = CharacterGenerator.getRandomCharacter();
            const texture = TextureCreator.createTextTexture(char);
            const particleGeometry = new THREE.PlaneGeometry(isMobile ? 100 : 150, isMobile ? 100 : 150);
            const hue = Math.random() * 360;

            const material = new THREE.MeshPhysicalMaterial({
                map: texture,
                color: new THREE.Color(`hsl(${hue}, 100%, 70%)`),
                emissive: new THREE.Color(`hsl(${(hue + 180) % 360}, 100%, 60%)`),
                emissiveIntensity: 0.8,
                metalness: 0.4,
                roughness: 0.05,
                transparent: true,
                clearcoat: 1,
                clearcoatRoughness: 0.05,
                reflectivity: 0.9
            });

            const mesh = new THREE.Mesh(particleGeometry, material);
            this.resetPosition(mesh);
            this.particles.push(mesh);
            this.sceneGroup.add(mesh);
        }

        resetPosition(object) {
            object.position.set(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000
            );
            object.userData = {
                amplitude: Math.random() * 20 + 10,
                speed: Math.random() * 0.02 + 0.005,
                offset: Math.random() * Math.PI * 2
            };
        }

        animate() {
            requestAnimationFrame(this.animate.bind(this));
            const time = Date.now() * 0.001;

            this.updateObjects(this.particles, time);
            this.updateObjects(this.shapes, time);

            this.sceneGroup.rotation.y += 0.003;
            this.sceneGroup.rotation.x += 0.0018;
            this.renderer.render(this.scene, this.camera);
        }

        updateObjects(objects, time) {
            objects.forEach(obj => {
                obj.position.x += Math.sin(time * obj.userData.speed + obj.userData.offset) * obj.userData.amplitude * 0.1;
                obj.position.y += Math.cos(time * obj.userData.speed + obj.userData.offset) * obj.userData.amplitude * 0.1;
                obj.lookAt(this.camera.position);
                obj.material.color.offsetHSL(0.0005, 0, 0);
                obj.material.emissive.offsetHSL(0.0005, 0, 0);

                if (obj.position.length() > 2000) this.resetPosition(obj);
            });
        }

        onWindowResize() {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    new SceneManager();

    window.onload = () => setTimeout(() => { preloader.style.display = 'none'; }, 1500);
});
