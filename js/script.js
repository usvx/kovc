document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');

    let width, height;
    const symbolSize = 20;
    let columns;
    let symbols = [];

    class Symbol {
        constructor(x, y, speed) {
            this.x = x;
            this.y = y;
            this.value = '';
            this.speed = speed;
            this.switchInterval = Math.round(Math.random() * 20 + 5);
        }

        setToRandomSymbol() {
            const charType = Math.random();
            if (charType < 0.5) {
                this.value = String.fromCharCode(0x0410 + Math.random() * (0x044F - 0x0410));
            } else {
                this.value = String.fromCharCode(0xAC00 + Math.random() * (0xD7A3 - 0xAC00));
            }
        }

        rain() {
            if (this.y >= height) {
                this.y = Math.random() * height - height;
            } else {
                this.y += this.speed;
            }
            if (Math.random() > 0.975) {
                this.setToRandomSymbol();
            }
        }
    }

    class Effect {
        constructor() {
            this.initialize();
        }

        initialize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            columns = Math.floor(width / symbolSize);
            symbols = [];
            for (let i = 0; i < columns; i++) {
                const x = i * symbolSize;
                const y = Math.random() * height - height;
                const speed = Math.random() * 5 + 2;
                symbols.push(new Symbol(x, y, speed));
            }
        }
    }

    const effect = new Effect();
    window.addEventListener('resize', () => effect.initialize());

    let lastTime = 0;
    const fps = 30;
    const nextFrame = 1000 / fps;
    let timer = 0;

    function animate(time = 0) {
        const deltaTime = time - lastTime;
        lastTime = time;

        if (timer > nextFrame) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, width, height);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            symbols.forEach(symbol => {
                ctx.fillStyle = '#00ffcc';
                ctx.font = `${symbolSize}px 'Noto Sans', monospace`;
                ctx.fillText(symbol.value, symbol.x, symbol.y);
                symbol.rain();
            });
            timer = 0;
        } else {
            timer += deltaTime;
        }

        requestAnimationFrame(animate);
    }

    animate();

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
