document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');

    let width, height;
    let stars = [];
    const starCount = 200;
    let hue = 0;

    function resizeCanvas() {
        width = canvas.width = window.innerWidth + 1;
        height = canvas.height = window.innerHeight + 1;
        initStars();
    }

    function initStars() {
        stars = [];
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                z: Math.random() * width,
            });
        }
    }

    function moveStars() {
        for (let star of stars) {
            star.z -= 2;
            if (star.z <= 0) {
                star.z = width;
            }
        }
    }

    function drawStars() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        for (let star of stars) {
            let x = (star.x - width / 2) * (width / star.z);
            x += width / 2;
            let y = (star.y - height / 2) * (width / star.z);
            y += height / 2;
            let radius = width / star.z;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fill();
        }

        hue += 0.5;
    }

    function animate() {
        moveStars();
        drawStars();
        requestAnimationFrame(animate);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = form.username.value.trim();
        if (username) {
            const email = `${username}@ko.vc`;
            const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/ko.vc`;
            window.location.href = loginUrl;
        } else {
            alert('Please enter your access code.');
        }
    });
});
