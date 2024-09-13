document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initMatrix();
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const symbolSize = 20;
    let columns;
    let symbols = [];

    class Symbol {
        constructor(x, y, speed) {
            this.characters = 'アァカサタナハマヤャラワン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.value = '';
        }

        update() {
            this.value = this.characters.charAt(Math.floor(Math.random() * this.characters.length));
            if (this.y * symbolSize > canvas.height) {
                this.y = 0;
            } else {
                this.y += this.speed;
            }
        }

        draw() {
            ctx.fillStyle = '#00ffcc';
            ctx.fillText(this.value, this.x * symbolSize, this.y * symbolSize);
        }
    }

    function initMatrix() {
        columns = Math.floor(canvas.width / symbolSize);
        symbols = [];
        for (let i = 0; i < columns; i++) {
            symbols[i] = new Symbol(i, Math.random() * -50, Math.random() * 0.5 + 0.5);
        }
    }

    function animateMatrix() {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${symbolSize}px monospace`;
        symbols.forEach(symbol => {
            symbol.update();
            symbol.draw();
        });
        requestAnimationFrame(animateMatrix);
    }

    initMatrix();
    animateMatrix();

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
