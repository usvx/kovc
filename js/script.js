document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#login-form button');
    const sphere = document.querySelector('.sphere');
    const body = document.body;

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

    button.addEventListener('mouseenter', () => {
        sphere.style.transition = 'background 0.4s ease, transform 0.4s ease';
        sphere.style.background = 'radial-gradient(circle at 50% 50%, var(--button-hover-bg-start), var(--button-hover-bg-end) 70%)';
        sphere.style.transform = 'scale(1.1)';
        button.style.boxShadow = '0 8px 16px rgba(255, 87, 51, 0.7)';
    });

    button.addEventListener('mouseleave', () => {
        sphere.style.transition = 'background 0.4s ease, transform 0.4s ease';
        sphere.style.background = 'radial-gradient(circle at 50% 50%, var(--button-bg-start), var(--button-bg-end) 70%)';
        sphere.style.transform = 'scale(1)';
        button.style.boxShadow = 'var(--box-shadow)';
    });

    document.getElementById('login-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.querySelector('input[name="username"]').value;
        const email = `${username}@ko.vc`;
        const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/ko.vc`;
        window.location.href = loginUrl;
    });
});
