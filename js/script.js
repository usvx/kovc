document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const preloader = document.getElementById('preloader');

    let scene, camera, renderer;
    let uniforms;
    let clock = new THREE.Clock();
    let composer;
    let mouse = new THREE.Vector2();
    let target = new THREE.Vector2();

    function init() {
        const canvas = document.getElementById('background');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
        camera.position.z = 400;

        uniforms = {
            time: { value: 1.0 },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            mouse: { value: new THREE.Vector2() },
        };

        const geometry = new THREE.PlaneBufferGeometry(2, 2);

        const vertexShader = `
            void main() {
                gl_Position = vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            precision mediump float;
            uniform float time;
            uniform vec2 resolution;
            uniform vec2 mouse;

            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec2 pos = uv * 2.0 - 1.0;
                pos.x *= resolution.x / resolution.y;

                float len = length(pos - mouse);
                float angle = atan(pos.y - mouse.y, pos.x - mouse.x);
                float wave = sin(len * 10.0 - time * 5.0 + angle * 5.0);

                float color = smoothstep(0.0, 0.1, wave);

                vec3 col = mix(vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.8), color);

                gl_FragColor = vec4(col, 1.0);
            }
        `;

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const renderPass = new POSTPROCESSING.RenderPass(scene, camera);
        const bloomPass = new POSTPROCESSING.BloomEffect({ intensity: 1.5 });
        const smaaPass = new POSTPROCESSING.SMAAEffect();
        composer = new POSTPROCESSING.EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(new POSTPROCESSING.EffectPass(camera, bloomPass, smaaPass));

        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('resize', onWindowResize, false);

        animate();
    }

    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        target.x = event.clientX / window.innerWidth;
        target.y = 1 - event.clientY / window.innerHeight;
    }

    function onTouchMove(event) {
        if (event.touches.length == 1) {
            event.preventDefault();
            mouse.x = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.touches[0].pageY / window.innerHeight) * 2 + 1;
            target.x = event.touches[0].pageX / window.innerWidth;
            target.y = 1 - event.touches[0].pageY / window.innerHeight;
        }
    }

    function onWindowResize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        uniforms.resolution.value.x = window.innerWidth;
        uniforms.resolution.value.y = window.innerHeight;
    }

    function animate() {
        requestAnimationFrame(animate);
        uniforms.time.value += clock.getDelta();
        uniforms.mouse.value.lerp(target, 0.1);
        composer.render();
    }

    init();

    window.onload = () => {
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = form.username.value.trim();
        const domainSelect = form.querySelector('select[name="domain"]');
        const domain = domainSelect.value;
        if (username && domain) {
            const email = `${username}${domain}`;
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailPattern.test(email)) {
                const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/`;
                window.location.href = loginUrl;
            } else {
                alert('Please enter a valid email address.');
            }
        } else {
            alert('Please enter your username and select a domain.');
        }
    });
});
