document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');

    let width, height;
    let symbolSize = 20;
    let columns;
    let drops = [];

    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        columns = Math.floor(width / symbolSize);
        drops = [];
        for (let x = 0; x < columns; x++) {
            drops[x] = Math.random() * -1000;
        }
    }

    function drawMatrix() {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#00ffcc';
        ctx.font = `${symbolSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
            const text = String.fromCharCode(0x30A0 + Math.random() * 97);
            ctx.fillText(text, i * symbolSize, drops[i] * symbolSize);

            if (drops[i] * symbolSize > height && Math.random() > 0.975) {
                drops[i] = 0;
            }

            drops[i]++;
        }

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
