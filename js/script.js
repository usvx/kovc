document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');

    let width, height;
    let symbolSize = 20;
    let columns;
    let drops = [];

    let mouseX = 0;
    let mouseY = 0;

    function getRandomCharacter() {
        const randomChoice = Math.random();
        if (randomChoice < 0.5) {
            return String.fromCharCode(0x0410 + Math.random() * (0x044F - 0x0410));
        } else {
            return String.fromCharCode(0xAC00 + Math.random() * (0xD7A3 - 0xAC00));
        }
    }

    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        columns = Math.floor(width / symbolSize);
        drops = [];
        for (let x = 0; x < columns; x++) {
            drops[x] = Math.random() * height / symbolSize;
        }
    }

    function drawMatrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#00ffcc';
        ctx.font = `${symbolSize}px 'Noto Sans', monospace`;

        for (let i = 0; i < drops.length; i++) {
            const text = getRandomCharacter();
            const x = i * symbolSize;
            const y = drops[i] * symbolSize;

            const dx = (x - mouseX) * 0.05;
            const dy = (y - mouseY) * 0.05;

            ctx.fillText(text, x - dx, y - dy);

            if (y > height && Math.random() > 0.975) {
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

    const entrance = document.querySelector('.entrance');

    function parallaxEffect(x, y) {
        const percentX = (x / window.innerWidth) - 0.5;
        const percentY = (y / window.innerHeight) - 0.5;
        entrance.style.transform = `translateX(${percentX * 30}px) translateY(${percentY * 30}px)`;
        mouseX = x;
        mouseY = y;
    }

    document.addEventListener('mousemove', (e) => {
        parallaxEffect(e.clientX, e.clientY);
    });

    document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        parallaxEffect(touch.clientX, touch.clientY);
    }, { passive: true });

    document.addEventListener('deviceorientation', (e) => {
        const x = (e.gamma || 0) * 5 + window.innerWidth / 2;
        const y = (e.beta || 0) * 5 + window.innerHeight / 2;
        parallaxEffect(x, y);
    });
});
