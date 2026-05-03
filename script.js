// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const ctaButton = document.querySelector('.cta-button');

// Toggle menu when hamburger is clicked
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close menu when a nav link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar-container')) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// CTA Button scrolls to contact section
if (ctaButton) {
    ctaButton.addEventListener('click', () => {
        const contactSection = document.querySelector('#contact');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// Logo click scrolls to home
const logoSection = document.querySelector('.logo-section');
if (logoSection) {
    logoSection.addEventListener('click', () => {
        const homeSection = document.querySelector('#home');
        if (homeSection) {
            homeSection.scrollIntoView({ behavior: 'smooth' });
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
}
