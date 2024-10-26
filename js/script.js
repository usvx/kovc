    import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('login-form'),
                  preloader = document.getElementById('preloader');
            let scene, camera, renderer,
                particles = [],
                shapes = [],
                sceneGroup,
                isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

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
                const hue = Math.random() * 360;
                gradient.addColorStop(0, `hsl(${hue}, 100%, 70%)`);
                gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 100%, 50%)`);
                ctx.fillStyle = gradient;
                ctx.shadowColor = `hsl(${(hue + 180) % 360}, 100%, 30%)`;
                ctx.shadowBlur = isMobile ? 30 : 50;
                ctx.fillText(char, size / 2, size / 2);
                const texture = new THREE.Texture(canvas);
                texture.needsUpdate = true;
                return texture;
            }

            function getRandomHangulCharacter() {
                const initials = [0x1100, 0x1102, 0x1103, 0x1105, 0x1106, 0x1107, 0x1109, 0x110B, 0x110C, 0x110E, 0x110F, 0x1110, 0x1111, 0x1112],
                      medials = [0x1161, 0x1163, 0x1165, 0x1167, 0x1169, 0x116D, 0x1162, 0x1164, 0x1166, 0x1168, 0x116A],
                      finals = [0x0000, 0x11A8, 0x11AB, 0x11AF, 0x11B7, 0x11BA, 0x11C2];
                const initial = initials[Math.floor(Math.random() * initials.length)],
                      medial = medials[Math.floor(Math.random() * medials.length)],
                      final = finals[Math.floor(Math.random() * finals.length)];
                const syllableCode = 0xAC00 + ((initial - 0x1100) * 588) + ((medial - 0x1161) * 28) + (final ? (final - 0x11A7) : 0);
                return String.fromCharCode(syllableCode);
            }

            function getRandomCyrillicCharacter() {
                const start = 0x0410, end = 0x042F;
                const code = Math.floor(Math.random() * (end - start + 1)) + start;
                return String.fromCharCode(code);
            }

            function getRandomCharacter() {
                return Math.random() < 0.7 ? getRandomHangulCharacter() : getRandomCyrillicCharacter();
            }

            function init() {
                const canvas = document.getElementById('background');
                renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.outputEncoding = THREE.sRGBEncoding;

                scene = new THREE.Scene();
                camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
                camera.position.z = isMobile ? 800 : 1200;

                const ambientLight = new THREE.AmbientLight(0xffffff, 0.5),
                      directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                directionalLight.position.set(1, 1, 1).normalize();
                scene.add(ambientLight, directionalLight);

                startAnimation();
                window.addEventListener('resize', onWindowResize, false);
            }

            function onWindowResize() {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }

            function startAnimation() {
                sceneGroup = new THREE.Group();
                scene.add(sceneGroup);

                const geometry = new THREE.SphereGeometry(isMobile ? 80 : 120, 64, 64);
                const shapeCount = isMobile ? 50 : 100;
                for (let i = 0; i < shapeCount; i++) {
                    const hue = Math.random() * 360;
                    const material = new THREE.MeshPhysicalMaterial({
                        color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
                        metalness: 0.2,
                        roughness: 0.1,
                        transmission: 0.9,
                        opacity: 0.6,
                        transparent: true,
                        clearcoat: 1,
                        clearcoatRoughness: 0.1,
                        reflectivity: 0.5,
                        ior: 1.4,
                        thickness: 5,
                    });
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set((Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000);
                    mesh.userData = {
                        amplitude: Math.random() * 20 + 10,
                        speed: Math.random() * 0.02 + 0.01,
                        offset: Math.random() * Math.PI * 2
                    };
                    sceneGroup.add(mesh);
                    shapes.push(mesh);
                }

                const particleCount = isMobile ? 400 : 800;
                for (let i = 0; i < particleCount; i++) {
                    const char = getRandomCharacter(),
                          texture = createTextTexture(char),
                          particleGeometry = new THREE.PlaneGeometry(isMobile ? 100 : 150, isMobile ? 100 : 150),
                          hue = Math.random() * 360;
                    const material = new THREE.MeshPhysicalMaterial({
                        map: texture,
                        color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
                        metalness: 0.1,
                        roughness: 0.05,
                        transparent: true,
                        clearcoat: 1,
                        clearcoatRoughness: 0.1,
                        reflectivity: 1
                    });
                    const mesh = new THREE.Mesh(particleGeometry, material);
                    mesh.position.set((Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000, (Math.random() - 0.5) * 4000);
                    mesh.userData = {
                        amplitude: Math.random() * 20 + 10,
                        speed: Math.random() * 0.02 + 0.01,
                        offset: Math.random() * Math.PI * 2
                    };
                    particles.push(mesh);
                    sceneGroup.add(mesh);
                }

                animate();
            }

            function animate() {
                requestAnimationFrame(animate);

                const time = Date.now() * 0.001;

                // Sinusoidal motion for particles and shapes
                particles.forEach(p => {
                    p.position.x += Math.sin(time * p.userData.speed + p.userData.offset) * p.userData.amplitude * 0.1;
                    p.position.y += Math.cos(time * p.userData.speed + p.userData.offset) * p.userData.amplitude * 0.1;
                    p.lookAt(camera.position); // Keep text readable and facing the camera
                });

                shapes.forEach(s => {
                    s.position.x += Math.sin(time * s.userData.speed + s.userData.offset) * s.userData.amplitude * 0.1;
                    s.position.y += Math.cos(time * s.userData.speed + s.userData.offset) * s.userData.amplitude * 0.1;
                });

                sceneGroup.rotation.y += 0.0025; // Slight rotation for added depth
                sceneGroup.rotation.x += 0.0015;
                renderer.render(scene, camera);
            }

            init();
            window.onload = () => {
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 1500);
            };
        });

