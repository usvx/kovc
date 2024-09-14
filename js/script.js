document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    const canvasLayers = [
        document.getElementById('layer1'),
        document.getElementById('layer2'),
        document.getElementById('layer3')
    ];

    const contexts = canvasLayers.map(canvas => canvas.getContext('2d'));

    let width, height;
    const symbolSize = 20;
    const layers = [];
    const speeds = [1, 0.7, 0.5];

    function getRandomCharacter() {
        const randomChoice = Math.random();
        if (randomChoice < 0.5) {
            return String.fromCharCode(0x0410 + Math.random() * (0x044F - 0x0410));
        } else {
            return String.fromCharCode(0xAC00 + Math.random() * (0xD7A3 - 0xAC00));
        }
    }

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;

        canvasLayers.forEach(canvas => {
            canvas.width = width;
            canvas.height = height;
        });

        layers.length = 0;
        for (let i = 0; i < canvasLayers.length; i++) {
            const columns = Math.floor(width / symbolSize);
            const drops = [];
            for (let x = 0; x < columns; x++) {
                drops[x] = Math.random() * height / symbolSize;
            }
            layers.push(drops);
        }
    }

    function drawMatrix() {
        contexts.forEach((ctx, index) => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#00ffcc';
            ctx.font = `${symbolSize}px 'Noto Sans', monospace`;

            const drops = layers[index];
            const speed = speeds[index];

            for (let i = 0; i < drops.length; i++) {
                const text = getRandomCharacter();
                const x = i * symbolSize;
                const y = drops[i] * symbolSize;

                ctx.fillText(text, x, y);

                if (y > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i] += speed;
            }
        });

        requestAnimationFrame(drawMatrix);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    drawMatrix();

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
