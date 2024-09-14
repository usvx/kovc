document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');

    let width, height;
    const symbolSize = 20;
    let layers = [];
    const layerCount = 3;
    const colors = ['rgba(0, 255, 204, 0.5)', 'rgba(0, 255, 204, 0.7)', 'rgba(0, 255, 204, 1)'];

    class Symbol {
        constructor(x, y, speed) {
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.value = '';
            this.switchInterval = Math.floor(Math.random() * 20 + 5);
            this.counter = 0;
        }

        setToRandomSymbol() {
            const charType = Math.random();
            if (charType < 0.5) {
                this.value = String.fromCharCode(0x0410 + Math.random() * (0x044F - 0x0410));
            } else {
                this.value = String.fromCharCode(0xAC00 + Math.random() * (0xD7A3 - 0xAC00));
            }
        }

        update() {
            if (this.counter % this.switchInterval === 0) {
                this.setToRandomSymbol();
            }
            this.y = (this.y + this.speed) % height;
            this.counter++;
        }
    }

    class SymbolStream {
        constructor(x, speed, opacity) {
            this.symbols = [];
            this.totalSymbols = Math.floor(height / symbolSize);
            this.speed = speed;
            this.x = x;
            this.opacity = opacity;
            this.generateSymbols();
        }

        generateSymbols() {
            let y = Math.random() * -1000;
            for (let i = 0; i < this.totalSymbols; i++) {
                const symbol = new Symbol(this.x, y, this.speed);
                symbol.setToRandomSymbol();
                this.symbols.push(symbol);
                y -= symbolSize;
            }
        }

        update() {
            this.symbols.forEach(symbol => symbol.update());
        }
    }

    function init() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        ctx.font = `${symbolSize}px 'Noto Sans', monospace`;
        layers = [];
        for (let i = 0; i < layerCount; i++) {
            const streams = [];
            const columns = Math.floor(width / symbolSize);
            for (let j = 0; j < columns; j++) {
                const x = j * symbolSize;
                const speed = (Math.random() * 2 + 1) * (i + 1);
                const opacity = (i + 1) / layerCount;
                streams.push(new SymbolStream(x, speed, opacity));
            }
            layers.push(streams);
        }
    }

    function animate() {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        ctx.fillRect(0, 0, width, height);

        layers.forEach((streams, index) => {
            ctx.fillStyle = colors[index];
            streams.forEach(stream => {
                stream.update();
                stream.symbols.forEach(symbol => {
                    ctx.globalAlpha = symbol.opacity;
                    ctx.fillText(symbol.value, symbol.x, symbol.y);
                });
            });
        });
        requestAnimationFrame(animate);
    }

    init();
    animate();

    window.addEventListener('resize', () => {
        init();
    });

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
