document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');

    let width, height;
    let symbolSize = 20;
    let columns;
    let symbols = [];

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

    class Symbol {
        constructor(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.speed = (Math.random() * 5 + 2) * (1 + z / 5);
            this.value = getRandomCharacter();
            this.opacity = Math.random();
            this.switchInterval = Math.round(Math.random() * 20 + 5);
            this.size = symbolSize * (1 + z / 5);
        }

        update() {
            if (frameCount % this.switchInterval === 0) {
                this.value = getRandomCharacter();
            }

            this.y += this.speed;

            if (this.y * this.size > height) {
                this.y = 0;
            }
        }

        draw() {
            ctx.save();

            let dx = (mouseX - width / 2) / width;
            let dy = (mouseY - height / 2) / height;
            let parallaxX = this.x * this.size + dx * this.z * 10;
            let parallaxY = this.y * this.size + dy * this.z * 10;

            ctx.fillStyle = `rgba(0, 255, 204, ${this.opacity})`;
            ctx.font = `${this.size}px 'Noto Sans', monospace`;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffcc';

            ctx.fillText(this.value, parallaxX, parallaxY);

            ctx.restore();
        }
    }

    let frameCount = 0;

    function initializeSymbols() {
        symbols = [];
        for (let i = 0; i < columns; i++) {
            const x = i;
            const y = Math.random() * -50;
            const z = Math.random() * 5;
            symbols.push(new Symbol(x, y, z));
        }
    }

    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        columns = Math.floor(width / symbolSize);
        initializeSymbols();
    }

    function drawMatrix() {
        frameCount++;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);

        symbols.forEach(symbol => {
            symbol.update();
            symbol.draw();
        });

        requestAnimationFrame(drawMatrix);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
    });

    drawMatrix();
});
