document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const background = document.getElementById('background');

    let camera, scene, renderer;
    let uniforms;

    init();
    animate();

    function init() {
        camera = new THREE.Camera();
        camera.position.z = 1;

        scene = new THREE.Scene();

        const geometry = new THREE.PlaneBufferGeometry(2, 2);

        uniforms = {
            time: { value: 1.0 },
            resolution: { value: new THREE.Vector2() },
            mouse: { value: new THREE.Vector2() }
        };

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader(),
            fragmentShader: fragmentShader()
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        background.appendChild(renderer.domElement);

        onWindowResize();
        window.addEventListener('resize', onWindowResize, false);

        document.addEventListener('mousemove', (e) => {
            uniforms.mouse.value.x = e.pageX / window.innerWidth;
            uniforms.mouse.value.y = 1 - e.pageY / window.innerHeight;
        });

        document.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            uniforms.mouse.value.x = touch.pageX / window.innerWidth;
            uniforms.mouse.value.y = 1 - touch.pageY / window.innerHeight;
        }, { passive: true });
    }

    function onWindowResize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.resolution.value.x = window.innerWidth * window.devicePixelRatio;
        uniforms.resolution.value.y = window.innerHeight * window.devicePixelRatio;
    }

    function animate() {
        requestAnimationFrame(animate);
        uniforms.time.value += 0.05;
        renderer.render(scene, camera);
    }

    function vertexShader() {
        return `
            void main() {
                gl_Position = vec4( position, 1.0 );
            }
        `;
    }

    function fragmentShader() {
        return `
            uniform float time;
            uniform vec2 resolution;
            uniform vec2 mouse;

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            void main() {
                vec2 st = gl_FragCoord.xy / resolution.xy;
                vec3 color = vec3(0.0);

                float pct = 0.0;
                pct = distance(st, mouse);

                vec2 pos = vec2(st * 10.0);
                float rnd = random(floor(pos));

                if (rnd > 0.5) {
                    color = vec3(0.0, 1.0 - pct, pct);
                } else {
                    color = vec3(pct, 0.0, 1.0 - pct);
                }

                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = form.username.value.trim();
        if (username) {
            const email = `${username}@ko.vc`;
            const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/ko.vc`;
            window.location.href = loginUrl;
        } else {
            alert('Please enter your username.');
        }
    });

    const entrance = document.querySelector('.entrance');

    function parallaxEffect(x, y) {
        const percentX = (x / window.innerWidth) - 0.5;
        const percentY = (y / window.innerHeight) - 0.5;
        entrance.style.transform = `translateX(${percentX * 30}px) translateY(${percentY * 30}px)`;
    }

    document.addEventListener('mousemove', (e) => {
        parallaxEffect(e.clientX, e.clientY);
    });

    document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        parallaxEffect(touch.clientX, touch.clientY);
    }, { passive: true });
});
