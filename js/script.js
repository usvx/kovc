document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#login-form button');
    const sphere = document.querySelector('.sphere');
    const body = document.body;

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    const randomSphereColor = getRandomColor();
    const randomButtonColor = getRandomColor();

    sphere.style.background = `radial-gradient(circle at 50% 50%, ${randomSphereColor}, transparent)`;
    button.style.backgroundColor = randomButtonColor;

    button.addEventListener('mouseenter', () => {
        sphere.style.transform = 'scale(1.05)';
    });

    button.addEventListener('mouseleave', () => {
        sphere.style.transform = 'scale(1)';
    });

    document.getElementById('login-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.querySelector('input[name="username"]').value;
        const email = `${username}@ko.vc`;
        const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/ko.vc`;
        window.location.href = loginUrl;
    });

    let hasMouse = false;
    let lastXPercent = 0;
    let lastYPercent = 0;
    let animationId;

    function throttle(callback, delay) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                callback.apply(this, args);
            }
        };
    }

    function updateBackground(xPercent, yPercent) {
        cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(() => {
            body.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
        });
    }

    window.addEventListener('mousemove', throttle((e) => {
        if (!hasMouse) {
            hasMouse = true;
            body.classList.add('has-mouse');
        }

        const xPercent = (e.clientX / window.innerWidth) * 100;
        const yPercent = (e.clientY / window.innerHeight) * 100;

        if (Math.abs(xPercent - lastXPercent) > 0.5 || Math.abs(yPercent - lastYPercent) > 0.5) {
            lastXPercent = xPercent;
            lastYPercent = yPercent;
            updateBackground(xPercent, yPercent);
        }
    }, 100));

    window.addEventListener('touchstart', () => {
        if (hasMouse) {
            hasMouse = false;
            body.classList.remove('has-mouse');
            body.style.backgroundPosition = 'center';
        }
    });
});
