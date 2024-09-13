document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let stars = [];
    const fps = 60;
    const numStars = 200;
    const starSpeed = 0.05;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    class Star {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width - width / 2;
            this.y = Math.random() * height - height / 2;
            this.z = Math.random() * width;
            this.origZ = this.z;
        }

        update() {
            this.z -= starSpeed * fps;
            if (this.z <= 0) {
                this.reset();
                this.z = width;
            }
        }

        draw() {
            const sx = (this.x / this.z) * width + width / 2;
            const sy = (this.y / this.z) * height + height / 2;
            const radius = (1 - this.z / width) * 2;
            ctx.beginPath();
            ctx.fillStyle = 'white';
            ctx.arc(sx, sy, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initStars() {
        stars = [];
        for (let i = 0; i < numStars; i++) {
            stars.push(new Star());
        }
    }

    function animateStars() {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.8)';
        ctx.fillRect(0, 0, width, height);
        stars.forEach(star => {
            star.update();
            star.draw();
        });
        requestAnimationFrame(animateStars);
    }

    initStars();
    animateStars();

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
