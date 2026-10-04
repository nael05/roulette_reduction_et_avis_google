const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navLinkElements = document.querySelectorAll('.nav-link');
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    if (!navLinks.classList.contains('active')) {
        
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    
    const spans = navToggle.querySelectorAll('span');
    if (navLinks.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translateY(10px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translateY(-10px)';
        document.body.style.overflow = 'hidden';
    } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
        document.body.style.overflow = '';
    }
});

const sections = document.querySelectorAll('section[id]');

function updateActiveLink() {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinkElements.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveLink);

navLinkElements.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const spans = navToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
        document.body.style.overflow = '';
    });
});

const scrollTopBtn = document.getElementById('scrollTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollTopBtn.classList.add('visible');
    } else {
        scrollTopBtn.classList.remove('visible');
    }
});

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

const statNumbers = document.querySelectorAll('.stat-number');
let hasAnimated = false;

function animateCounters() {
    if (hasAnimated) return;
    
    const statsSection = document.querySelector('.hero-stats');
    if (!statsSection) return;
    
    const rect = statsSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    if (rect.top <= windowHeight * 0.8 && rect.bottom >= 0) {
        hasAnimated = true;
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;
            
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    stat.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    stat.textContent = target;
                }
            };
            
            updateCounter();
        });
    }
}

window.addEventListener('scroll', animateCounters);
window.addEventListener('load', animateCounters);

function initAOS() {
    const elements = document.querySelectorAll('[data-aos]');
    
    if (elements.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = parseInt(entry.target.getAttribute('data-aos-delay')) || 0;
                setTimeout(() => {
                    entry.target.classList.add('aos-animate');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(element => {
        observer.observe(element);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAOS);
} else {
    initAOS();
}

const sliders = document.querySelectorAll('.comparison-slider');

sliders.forEach(slider => {
    const beforeImage = slider.querySelector('.c-before');
    const beforeImgTag = beforeImage.querySelector('img');
    const handle = slider.querySelector('.c-handle');
    let isDown = false;

    const move = (e) => {
        if (!isDown) return;
        
        const rect = slider.getBoundingClientRect();
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        
        let position = Math.max(0, Math.min(x, rect.width));
        let percentage = (position / rect.width) * 100;

        beforeImage.style.width = `${percentage}%`;
        handle.style.left = `${percentage}%`;
    };

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        move(e);
    });
    
    window.addEventListener('mouseup', () => {
        isDown = false;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        move(e);
        e.preventDefault(); 
    });

    slider.addEventListener('touchstart', (e) => {
        isDown = true;
        move(e);
    }, { passive: true });

    window.addEventListener('touchend', () => {
        isDown = false;
    });

    window.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        move(e);
    }, { passive: false });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const offsetTop = target.offsetTop - 80;
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

const spheres = document.querySelectorAll('.gradient-sphere');

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    
    spheres.forEach((sphere, index) => {
        const speed = 0.1 + (index * 0.05);
        const yPos = -(scrolled * speed);
        sphere.style.transform = `translateY(${yPos}px)`;
    });
});

if (window.innerWidth > 768) {
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        border: 2px solid var(--primary);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transition: transform 0.2s ease, opacity 0.2s ease;
        opacity: 0;
    `;
    document.body.appendChild(cursor);
    
    const cursorDot = document.createElement('div');
    cursorDot.style.cssText = `
        position: fixed;
        width: 6px;
        height: 6px;
        background: var(--primary);
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        transition: transform 0.1s ease;
        opacity: 0;
    `;
    document.body.appendChild(cursorDot);
    
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let dotX = 0, dotY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.opacity = '1';
        cursorDot.style.opacity = '1';
    });
    
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        cursorDot.style.opacity = '0';
    });
    
    const interactiveElements = document.querySelectorAll('a, button, input, select, textarea');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'scale(1.5)';
            cursor.style.borderColor = 'var(--primary-light)';
        });
        
        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'scale(1)';
            cursor.style.borderColor = 'var(--primary)';
        });
    });
    
    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        
        dotX += (mouseX - dotX) * 0.4;
        dotY += (mouseY - dotY) * 0.4;
        cursorDot.style.left = dotX + 'px';
        cursorDot.style.top = dotY + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    
    animateCursor();
}

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

window.addEventListener('load', () => {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 300);
    }
    
    updateActiveLink();
    animateCounters();
});

console.log('%c Clean Wash & Co ', 'background: linear-gradient(135deg, #00f0ff, #00b8cc); color: #050814; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 5px;');
console.log('%c Site développé avec passion 🚀 ', 'color: #00f0ff; font-size: 14px;');

function toggleCardSupp(button) {
    const content = button.nextElementSibling;
    
    content.classList.toggle('active');
    
    const icon = button.querySelector('i');
    if (icon) {
        icon.style.transform = content.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

function toggleServiceInfo(button) {
    const content = button.nextElementSibling;
    content.classList.toggle('active');
    button.classList.toggle('active');
    
    const textSpan = button.querySelector('span');
    const icon = button.querySelector('i');
    
    if (content.classList.contains('active')) {
        textSpan.textContent = "Moins d'infos";
        icon.style.transform = 'rotate(180deg)';
    } else {
        textSpan.textContent = "Plus d'infos";
        icon.style.transform = 'rotate(0deg)';
    }
}

function filterCategory(category) {
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.remove('active');
        const btnText = btn.innerText.toLowerCase();
        if(category === 'auto' && btnText.includes('auto')) btn.classList.add('active');
        if(category === 'domicile' && btnText.includes('mobilier')) btn.classList.add('active');
        if(category === 'tarif' && btnText.includes('tarif')) btn.classList.add('active');
    });

    const gridAuto = document.querySelector('#auto .services-grid'); 
    const sectionDomicile = document.getElementById('domicile');     
    const sectionTarif = document.getElementById('tarif');     
    
    const subtitleAuto = document.getElementById('subtitle-auto');
    const subtitleDomicile = document.getElementById('subtitle-domicile');
    const subtitleTarif = document.getElementById('subtitle-tarif');

    if(gridAuto) { gridAuto.style.display = 'none'; gridAuto.classList.remove('category-fade'); }
    if(sectionDomicile) { sectionDomicile.style.display = 'none'; sectionDomicile.classList.remove('category-fade'); }
    if(sectionTarif) { sectionTarif.style.display = 'none'; sectionTarif.classList.remove('category-fade'); }
    
    if(subtitleAuto) subtitleAuto.style.display = 'none';
    if(subtitleDomicile) subtitleDomicile.style.display = 'none';
    if(subtitleTarif) subtitleTarif.style.display = 'none';

    setTimeout(() => {
        if (category === 'auto') {
            if(gridAuto) { gridAuto.style.display = 'grid'; gridAuto.classList.add('category-fade'); }
            if(subtitleAuto) subtitleAuto.style.display = 'block';
        } else if (category === 'domicile') {
            if(sectionDomicile) { sectionDomicile.style.display = 'block'; sectionDomicile.classList.add('category-fade'); }
            if(subtitleDomicile) subtitleDomicile.style.display = 'block';
        } else if (category === 'tarif') {
            if(sectionTarif) { sectionTarif.style.display = 'block'; sectionTarif.classList.add('category-fade'); }
            if(subtitleTarif) subtitleTarif.style.display = 'block';
        }
    }, 10);
}