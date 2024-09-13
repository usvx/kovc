document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('#login-form button');
  const sphere = document.querySelector('.sphere');
  const body = document.body;
  let hasMouse = false;
  let lastXPercent = 0;
  let lastYPercent = 0;
  let animationId;

  const throttle = (callback, delay) => {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        callback(...args);
      }
    };
  };

  const updateBackground = (xPercent, yPercent) => {
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(() => {
      body.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
    });
  };

  const onMouseMove = throttle((e) => {
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
  }, 100);

  window.addEventListener('mousemove', onMouseMove);

  window.addEventListener('touchstart', () => {
    if (hasMouse) {
      hasMouse = false;
      body.classList.remove('has-mouse');
      body.style.backgroundPosition = 'center';
    }
  });

  button.addEventListener('mouseenter', () => {
    sphere.style.transition = 'background 0.4s ease, transform 0.4s ease';
    sphere.style.background = 'radial-gradient(circle at center, var(--button-hover-bg-start), var(--button-hover-bg-end) 70%)';
    sphere.style.transform = 'scale(1.1)';
  });

  button.addEventListener('mouseleave', () => {
    sphere.style.transition = 'background 0.4s ease, transform 0.4s ease';
    sphere.style.background = 'radial-gradient(circle at center, var(--button-bg-start), var(--button-bg-end) 70%)';
    sphere.style.transform = 'scale(1)';
  });

  document.getElementById('login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.querySelector('input[name="username"]').value.trim();
    if (username) {
      const email = `${username}@ko.vc`;
      const loginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(email)}&continue=https://mail.google.com/a/ko.vc`;
      window.location.href = loginUrl;
    } else {
      alert('Please enter your username.');
    }
  });
});
