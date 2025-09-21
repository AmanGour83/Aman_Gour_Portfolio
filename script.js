// Matrix rain effect
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()';
const fontSize = 10;
const columns = canvas.width / fontSize;

const drops = [];
for (let x = 0; x < columns; x++) {
    drops[x] = 1;
}

function draw() {
    ctx.fillStyle = 'rgba(13, 17, 23, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ff41';
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(draw, 35);

// Resize canvas on window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Typing effect
const typeText = document.querySelector('.typing-effect');
const names = ['Aman Gour', 'Developer', 'Hacker', 'Creator'];
let nameIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
    const currentName = names[nameIndex];
    
    if (isDeleting) {
        typeText.textContent = currentName.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typeText.textContent = currentName.substring(0, charIndex + 1);
        charIndex++;
    }

    if (!isDeleting && charIndex === currentName.length) {
        setTimeout(() => { isDeleting = true; typeEffect(); }, 2000);
        return;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        nameIndex = (nameIndex + 1) % names.length;
    }

    const speed = isDeleting ? 100 : 200;
    setTimeout(typeEffect, speed);
}

typeEffect();

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(13, 17, 23, 0.98)';
    } else {
        navbar.style.background = 'rgba(13, 17, 23, 0.95)';
    }
});

// Animate cards on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.hacker-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Contact form handling with Formspree integration
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');

form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const data = new FormData(form);

    try {
        const response = await fetch(form.action, {
            method: form.method,
            body: data,
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            status.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    ✅ Your message has been sent successfully! I'll get back to you soon.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>`;
            form.reset();
        } else {
            status.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    ❌ Oops! Something went wrong. Please try again later.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>`;
        }
    } catch (error) {
        status.innerHTML = `
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                ⚠️ Network error. Please check your connection and try again.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
    }
});

// Animate contact form on scroll
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.style.opacity = '0';
    contactForm.style.transform = 'translateY(30px)';
    contactForm.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(contactForm);
}

// Enlarge certificate image on click
      document.querySelectorAll('.certificate-img').forEach(function(img) {
        img.addEventListener('click', function() {
          document.getElementById('modalCertificateImg').src = this.src;
          var modal = new bootstrap.Modal(document.getElementById('certificateModal'));
          modal.show();
        });
      });