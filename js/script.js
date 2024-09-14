document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const canvas = document.getElementById('background');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    let width, height;
    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        gl.viewport(0, 0, width, height);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const vertexShaderSource = `
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
            vUv = position * 0.5 + 0.5;
            gl_Position = vec4(position, 0, 1);
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        uniform float time;
        uniform vec2 resolution;
        varying vec2 vUv;

        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
            vec2 st = vUv * resolution.xy / min(resolution.x, resolution.y);
            float n = noise(st * 10.0 + time * 0.1);
            float m = smoothstep(0.3, 0.7, n);

            float grid = step(0.1, abs(fract(st.x * 10.0) - 0.5)) * step(0.1, abs(fract(st.y * 10.0) - 0.5));
            float char = step(0.5, random(floor(st * 10.0) + floor(time)));
            float colorIntensity = m * grid * char;

            vec3 color = mix(vec3(0.0), vec3(0.0, 1.0, 0.8), colorIntensity);

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    const timeUniformLocation = gl.getUniformLocation(program, 'time');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'resolution');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        -1, -1, 
         1, -1, 
        -1,  1, 
        -1,  1, 
         1, -1, 
         1,  1
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    function render(time) {
        time *= 0.001;

        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1f(timeUniformLocation, time);
        gl.uniform2f(resolutionUniformLocation, width, height);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

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
});
