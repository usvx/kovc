document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#login-form button');
    const sphere = document.querySelector('.sphere');
    const body = document.body;

    let hasMouse = false;

    window.addEventListener('mousemove', (e) => {
        if (!hasMouse) {
            hasMouse = true;
            body.classList.add('has-mouse');
        }

        const xPercent = e.clientX / window.innerWidth * 100;
        const yPercent = e.clientY / window.innerHeight * 100;
        
        body.style.background = `radial-gradient(circle at ${xPercent}% ${yPercent}%, var(--primary-bg-color), var(--secondary-bg-color) 50%, var(--tertiary-bg-color) 100%)`;
    });

    window.addEventListener('touchstart', () => {
        if (hasMouse) {
            hasMouse = false;
            body.classList.remove('has-mouse');
            body.style.background = `linear-gradient(135deg, var(--primary-bg-color) 0%, var(--secondary-bg-color) 50%, var(--tertiary-bg-color) 100%)`;
        }
    });

    button.addEventListener('mouseenter', () => {
        sphere.style.background = 'radial-gradient(circle at 50% 50%, var(--button-hover-bg-start), var(--button-hover-bg-end) 70%)';
    });

    button.addEventListener('mouseleave', () => {
        sphere.style.background = 'radial-gradient(circle at 50% 50%, var(--button-bg-start), var(--button-bg-end) 70%)';
    });

    document.getElementById('login-form').addEventListener('submit', redirectToGoogleLogin);
});

function redirectToGoogleLogin(event) {
    event.preventDefault();
    const username = document.querySelector('input[name="username"]').value;
    const email = username + '@ko.vc';
    const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/ko.vc`;
    window.location.href = loginUrl;
}
