document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#login-form button');
    const sphere = document.querySelector('.sphere');

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
});
