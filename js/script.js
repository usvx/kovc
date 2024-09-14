document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');

    let width, height;
    const symbolSize = 20;
    let columns;
    const layers = [];
    const layerConfigs = [
        { opacity: 0.3, speedMultiplier: 0.5 },
        { opacity: 0.5, speedMultiplier: 0.7 },
        { opacity: 0.8, speedMultiplier: 1.0 },
    ];

    function getRandomCharacter() {
        const randomChoice = Math.random();
        if (randomChoice < 0.5) {
            return String.fromCharCode(
                0x0410 + Math.floor(Math.random() * (0x044F - 0x0410))
            );
        } else {
            return String.fromCharCode(
                0xAC00 + Math.floor(Math.random() * (0xD7A3 - 0xAC00))
            );
        }
    }

    function init() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        columns = Math.floor(width / symbolSize);

        layers.length = 0;
        layerConfigs.forEach((config) => {
            const layerDrops = [];
            for (let x = 0; x < columns; x++) {
                layerDrops[x] = Math.random() * height / symbolSize;
            }
            layers.push({
                drops: layerDrops,
                opacity: config.opacity,
                speedMultiplier: config.speedMultiplier,
            });
        });
    }

    function draw() {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${symbolSize}px 'Noto Sans', monospace`;
        layers.forEach((layer) => {
            ctx.fillStyle = `rgba(0, 255, 204, ${layer.opacity})`;
            for (let i = 0; i < layer.drops.length; i++) {
                const text = getRandomCharacter();
                const x = i * symbolSize;
                const y = layer.drops[i] * symbolSize;

                ctx.fillText(text, x, y);

                if (layer.drops[i] * symbolSize > height && Math.random() > 0.975) {
                    layer.drops[i] = 0;
                }

                layer.drops[i] += layer.speedMultiplier;
            }
        });

        requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener('resize', init);

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = form.username.value.trim();
        if (username) {
            const email = `${username}@ko.vc`;
            const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(
                email
            )}&continue=https://mail.google.com/a/ko.vc`;
            window.location.href = loginUrl;
        } else {
            alert('Please enter your username.');
        }
    });
});
