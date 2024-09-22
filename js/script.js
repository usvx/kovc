document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer;
    let composer;
    let clock = new THREE.Clock();
    let mouse = new THREE.Vector2();
    let uniforms;

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            1,
            1000
        );
        camera.position.z = 1;

        uniforms = {
            u_time: { value: 1.0 },
            u_resolution: {
                value: new THREE.Vector2(window.innerWidth, window.innerHeight),
            },
            u_mouse: { value: new THREE.Vector2() },
        };

        const geometry = new THREE.PlaneBufferGeometry(2, 2);

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader(),
            fragmentShader: fragmentShader(),
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener('pointermove', onPointerMove, false);

        animate();
    }

    function onWindowResize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.u_resolution.value.x = window.innerWidth;
        uniforms.u_resolution.value.y = window.innerHeight;
    }

    function onPointerMove(event) {
        mouse.x = event.clientX / window.innerWidth;
        mouse.y = event.clientY / window.innerHeight;
        uniforms.u_mouse.value.x = mouse.x;
        uniforms.u_mouse.value.y = mouse.y;
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function render() {
        uniforms.u_time.value += clock.getDelta();
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
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec2 u_mouse;

            void main() {
                vec2 st = gl_FragCoord.xy / u_resolution;
                vec3 color = vec3(0.0);

                float pct = 0.0;
                pct = distance(st, vec2(u_mouse.x, 1.0 - u_mouse.y));

                color = mix(vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.8), pct);

                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }

    init();

    window.onload = () => {
        setTimeout(() => {
            preloader.style.opacity = '0';
            preloader.style.pointerEvents = 'none';
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
});
