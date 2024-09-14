document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('background');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = [];
    for (let x = 0; x < columns; x++) drops[x] = canvas.height;

    const koreanChars = [];
    for (let i = 0xAC00; i <= 0xD7A3; i++) {
        koreanChars.push(String.fromCharCode(i));
    }
    const russianChars = [];
    for (let i = 0x0410; i <= 0x044F; i++) {
        russianChars.push(String.fromCharCode(i));
    }
    const chars = koreanChars.concat(russianChars);

    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00ffcc';
        ctx.font = fontSize + 'px Noto Sans KR';

        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize < 0 && Math.random() > 0.975) {
                drops[i] = canvas.height / fontSize;
            }

            drops[i]--;
        }
    }

    setInterval(draw, 33);

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const columns = Math.floor(canvas.width / fontSize);
        drops.length = 0;
        for (let x = 0; x < columns; x++) drops[x] = canvas.height / fontSize;
    });

    const form = document.getElementById('login-form');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = form.username.value.trim();
        if (username) {
            const email = `${username}@ko.vc`;
            const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail
