/* ========================================
   ASTRONET - COMPLETE JAVASCRIPT
   ======================================== */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize all functions
    createStarField();
    initNavigation();
    initScrollEffects();
    initGalleryFilters();
    initAnimations();

});

/* ========================================
   STAR FIELD GENERATION
   ======================================== */
function createStarField() {
    const starsSmall = document.querySelector('.stars-small');
    const starsMedium = document.querySelector('.stars-medium');
    const starsLarge = document.querySelector('.stars-large');

    if (!starsSmall || !starsMedium || !starsLarge) return;

    // Generate small stars (most numerous, smallest size)
    for (let i = 0; i < 200; i++) {
        createStar(starsSmall, {
            size: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.5 + 0.3,
            duration: Math.random() * 3 + 2
        });
    }

    // Generate medium stars
    for (let i = 0; i < 100; i++) {
        createStar(starsMedium, {
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.6 + 0.4,
            duration: Math.random() * 4 + 3
        });
    }

    // Generate large stars (fewest, largest size)
    for (let i = 0; i < 50; i++) {
        createStar(starsLarge, {
            size: Math.random() * 2.5 + 1.5,
            opacity: Math.random() * 0.7 + 0.5,
            duration: Math.random() * 5 + 4
        });
    }

    // Add occasional colored stars
    addColoredStars(starsLarge);

    // Add shooting stars
    createShootingStars();
}

function createStar(container, options) {
    const star = document.createElement('div');
    star.className = 'star';
    
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    star.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        width: ${options.size}px;
        height: ${options.size}px;
        background: white;
        border-radius: 50%;
        opacity: ${options.opacity};
        animation: twinkle ${options.duration}s ease-in-out infinite;
        animation-delay: ${Math.random() * options.duration}s;
    `;
    
    container.appendChild(star);
}

function addColoredStars(container) {
    const colors = ['#a78bfa', '#06b6d4', '#f472b6', '#fbbf24'];
    
    for (let i = 0; i < 15; i++) {
        const star = document.createElement('div');
        star.className = 'star colored-star';
        
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 3 + 2;
        
        star.style.cssText = `
            position: absolute;
            left: ${x}%;
            top: ${y}%;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            opacity: 0.8;
            box-shadow: 0 0 ${size * 2}px ${color};
            animation: twinkle ${Math.random() * 3 + 3}s ease-in-out infinite;
            animation-delay: ${Math.random() * 3}s;
        `;
        
        container.appendChild(star);
    }
}

function createShootingStars() {
    const starField = document.querySelector('.star-field');
    if (!starField) return;

    // Create shooting star container
    const shootingContainer = document.createElement('div');
    shootingContainer.className = 'shooting-stars-container';
    shootingContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
    `;
    starField.appendChild(shootingContainer);

    // Periodically create shooting stars
    setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance every interval
            createShootingStar(shootingContainer);
        }
    }, 3000);
}

function createShootingStar(container) {
    const shootingStar = document.createElement('div');
    shootingStar.className = 'shooting-star';
    
    const startX = Math.random() * 100;
    const startY = Math.random() * 50;
    
    shootingStar.style.cssText = `
        position: absolute;
        left: ${startX}%;
        top: ${startY}%;
        width: 100px;
        height: 2px;
        background: linear-gradient(90deg, white, transparent);
        border-radius: 50%;
        transform: rotate(-45deg);
        animation: shootingStar 1s ease-out forwards;
    `;
    
    container.appendChild(shootingStar);
    
    // Remove after animation
    setTimeout(() => {
        shootingStar.remove();
    }, 1000);
}

/* ========================================
   NAVIGATION
   ======================================== */
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const navbar = document.getElementById('navbar');

    // Mobile menu toggle
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        // Close menu when clicking a link
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    }

    // Navbar scroll effect
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
}

/* ========================================
   SCROLL EFFECTS
   ======================================== */
function initScrollEffects() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Scroll indicator click
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const nextSection = document.querySelector('.welcome-section, .page-content, .features-section');
            if (nextSection) {
                nextSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
        scrollIndicator.style.cursor = 'pointer';
    }

    // Reveal animations on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for reveal animation
    const revealElements = document.querySelectorAll(
        '.feature-card, .quick-link-card, .event-card, .event-preview-card, ' +
        '.gallery-item, .learning-card, .course-card, .team-card, ' +
        '.stat-card, .timeline-item, .resource-card, .learning-category-card'
    );

    revealElements.forEach(el => {
        el.classList.add('reveal-element');
        observer.observe(el);
    });
}

/* ========================================
   GALLERY FILTERS
   ======================================== */
function initGalleryFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (filterTabs.length === 0 || galleryItems.length === 0) return;

    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter') || this.textContent.toLowerCase();

            // Filter gallery items
            galleryItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

/* ========================================
   ANIMATIONS
   ======================================== */
function initAnimations() {
    // Add stagger animation to grids
    addStaggerAnimation('.features-grid .feature-card', 100);
    addStaggerAnimation('.quick-links-grid .quick-link-card', 100);
    addStaggerAnimation('.gallery-grid .gallery-item', 50);
    addStaggerAnimation('.courses-grid .course-card', 100);
    addStaggerAnimation('.team-grid .team-card', 100);
    addStaggerAnimation('.events-list .event-card', 100);

    // Counter animation for stats
    animateCounters();

    // Parallax effect for hero
    initParallax();
}

function addStaggerAnimation(selector, delay) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * delay}ms`;
    });
}

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.textContent.replace(/\D/g, ''));
                const suffix = counter.textContent.replace(/[0-9]/g, '');
                
                if (!isNaN(target) && !counter.classList.contains('counted')) {
                    counter.classList.add('counted');
                    animateCounter(counter, target, suffix);
                }
                
                counterObserver.unobserve(counter);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element, target, suffix) {
    let current = 0;
    const increment = target / 50;
    const duration = 1500;
    const stepTime = duration / 50;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + suffix;
    }, stepTime);
}

function initParallax() {
    const hero = document.querySelector('.hero');
    
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const heroContent = hero.querySelector('.hero-content');
            
            if (heroContent && scrolled < window.innerHeight) {
                heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
                heroContent.style.opacity = 1 - (scrolled / window.innerHeight);
            }
        });
    }
}

/* ========================================
   FORM HANDLING
   ======================================== */
document.addEventListener('submit', function(e) {
    if (e.target.classList.contains('contact-form')) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Simulate form submission
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            submitBtn.textContent = 'Message Sent!';
            submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            
            // Reset form
            e.target.reset();
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 2000);
        }, 1500);
    }
});

/* ========================================
   UTILITY FUNCTIONS
   ======================================== */

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/* ========================================
   VIDEO PLAY FUNCTIONALITY
   ======================================== */
document.addEventListener('click', function(e) {
    const playBtn = e.target.closest('.video-play-overlay, .play-btn');
    if (playBtn) {
        e.preventDefault();
        // In a real implementation, this would open a video modal
        alert('Video player would open here. This is a demo.');
    }
});

/* ========================================
   GALLERY LIGHTBOX (Basic)
   ======================================== */
document.addEventListener('click', function(e) {
    const galleryItem = e.target.closest('.gallery-item:not(.video-item)');
    if (galleryItem) {
        const title = galleryItem.querySelector('h3')?.textContent || 'Gallery Image';
        const desc = galleryItem.querySelector('p')?.textContent || '';
        
        // In a real implementation, this would open a lightbox
        // For now, just show the item was clicked
        console.log(`Clicked: ${title} - ${desc}`);
    }
});

/* ========================================
   EVENT REGISTRATION (Basic)
   ======================================== */
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('event-register-btn')) {
        e.preventDefault();
        const eventCard = e.target.closest('.event-card');
        const eventTitle = eventCard?.querySelector('h3')?.textContent || 'Event';
        
        // In a real implementation, this would open a registration modal
        alert(`Registration for "${eventTitle}" - This would open a registration form.`);
    }
});

/* ========================================
   COURSE ACTIONS
   ======================================== */
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-sm') && e.target.closest('.course-card')) {
        e.preventDefault();
        const courseCard = e.target.closest('.course-card');
        const courseTitle = courseCard?.querySelector('h3')?.textContent || 'Course';
        
        // In a real implementation, this would navigate to the course
        alert(`Opening course: "${courseTitle}" - This would navigate to the course page.`);
    }
});

/* ========================================
   INITIALIZE ON PAGE LOAD
   ======================================== */
window.addEventListener('load', function() {
    // Remove loading state if any
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
    
    // Trigger initial animations
    setTimeout(() => {
        document.querySelectorAll('.hero-content, .page-header').forEach(el => {
            el.classList.add('animate-in');
        });
    }, 100);
});

/* ========================================
   HANDLE RESIZE
   ======================================== */
window.addEventListener('resize', debounce(function() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 768) {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');
        
        if (hamburger && navLinks) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    }
}, 250));

console.log('🚀 Astronet website loaded successfully!');