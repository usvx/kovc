document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const symbols = [];
    const symbolSize = 20;
    const columns = Math.floor(width / symbolSize);
    const rows = Math.floor(height / symbolSize);

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

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
            this.y = (this.y + this.speed) % rows;
        }

        draw() {
            ctx.fillStyle = '#00ffcc';
            ctx.fillText(this.value, this.x * symbolSize, this.y * symbolSize);
        }
    }

    function initMatrix() {
        for (let i = 0; i < columns; i++) {
            symbols[i] = new Symbol(i, Math.floor(Math.random() * rows), Math.random() * 0.5 + 0.5);
        }
    }

    function animateMatrix() {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        ctx.fillRect(0, 0, width, height);
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
