/* ============================================
   TBARBA Portfolio - JavaScript (ES)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- Load Portfolio from JSON ---
    loadPortfolio();

    // --- Navigation Scroll Effect ---
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // --- Mobile Menu Toggle ---
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('open');
        navLinks.classList.toggle('open');
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('open');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // --- Scroll Fade-In Animations ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll(
        '.section-header, .service-card, ' +
        '.about-content, .about-visual, .contact-info, .contact-form-wrapper, ' +
        '.hero-stats'
    ).forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // --- Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = nav.offsetHeight;
                window.scrollTo({
                    top: target.getBoundingClientRect().top + window.scrollY - navHeight - 20,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Active Nav Link ---
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY + 100;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            if (scrollY >= top && scrollY < top + height) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) link.classList.add('active');
                });
            }
        });
    });

    // --- Hero Cursor-Follow Glow ---
    const hero = document.getElementById('hero');
    const heroGlow = document.getElementById('heroCursorGlow');
    if (hero && heroGlow) {
        const GLOW_HALF = 250;
        let rafId = null;
        let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
        let initialized = false;

        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            targetX = e.clientX - rect.left;
            targetY = e.clientY - rect.top;
            if (!initialized) {
                currentX = targetX;
                currentY = targetY;
                initialized = true;
            }
            if (!rafId) animateGlow();
        });

        hero.addEventListener('mouseleave', () => {
            heroGlow.style.opacity = '0';
        });
        hero.addEventListener('mouseenter', () => {
            heroGlow.style.opacity = '1';
        });

        function animateGlow() {
            currentX += (targetX - currentX) * 0.15;
            currentY += (targetY - currentY) * 0.15;
            heroGlow.style.transform = `translate(${currentX - GLOW_HALF}px, ${currentY - GLOW_HALF}px)`;
            if (Math.abs(targetX - currentX) > 0.3 || Math.abs(targetY - currentY) > 0.3) {
                rafId = requestAnimationFrame(animateGlow);
            } else {
                rafId = null;
            }
        }
    }

    // --- Magnetic Buttons ---
    document.querySelectorAll('.magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });

    // --- Stat Count-Up ---
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count, 10);
                const suffix = el.dataset.suffix || '';
                const duration = 1400;
                const start = performance.now();
                function tick(now) {
                    const progress = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    el.textContent = Math.round(target * eased) + suffix;
                    if (progress < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
                statObserver.unobserve(el);
            }
        });
    }, { threshold: 0.6 });
    document.querySelectorAll('.stat-number[data-count]').forEach(el => statObserver.observe(el));

    // --- Contact Form ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function () {
            const btn = this.querySelector('button[type="submit"]');
            btn.innerHTML = '<span>Enviando...</span>';
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';
        });
    }
});

// ============================================
// Sistema de Carga del Portafolio
// ============================================

const CATEGORY_LABELS = {
    longform: { label: 'Larga Duración', tagClass: 'work-tag' },
    shorts:   { label: 'Short',          tagClass: 'work-tag tag-short' },
    '3d':     { label: '3D y Motion',    tagClass: 'work-tag tag-3d' }
};

async function loadPortfolio() {
    try {
        const res = await fetch('portfolio.json?v=' + Date.now());
        const data = await res.json();
        renderVideos(data.videos);
        renderChannels(data.channels);
        setupFilters();
    } catch (err) {
        console.error('Error al cargar el portafolio:', err);
    }
}

function renderVideos(videos) {
    const grid = document.getElementById('workGrid');
    grid.innerHTML = '';

    videos.forEach(video => {
        const cat = CATEGORY_LABELS[video.category] || CATEGORY_LABELS.longform;
        const isShort = video.category === 'shorts';

        const card = document.createElement('div');
        card.className = `work-card${isShort ? ' work-card-short' : ''}`;
        card.dataset.category = video.category;

        let infoHTML = `<span class="${cat.tagClass}">${cat.label}</span>`;
        if (video.channel) {
            infoHTML += `<span class="work-channel">para ${video.channel}</span>`;
        }

        card.innerHTML = `
            <div class="work-card-video">
                <div class="video-wrapper${isShort ? ' video-wrapper-short' : ''}">
                    <iframe src="https://www.youtube.com/embed/${video.id}" title="${video.title || 'Video'}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" style="display:none"></iframe>
                </div>
            </div>
            <div class="work-card-info">
                ${infoHTML}
            </div>
        `;

        grid.appendChild(card);

        const iframe = card.querySelector('iframe');
        const wrapper = card.querySelector('.video-wrapper');
        createThumbnail(video.id, iframe, wrapper);
    });

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }});
    }, { threshold: 0.1 });
    grid.querySelectorAll('.work-card').forEach(c => { c.classList.add('fade-in'); obs.observe(c); });
}

function createThumbnail(videoId, iframe, wrapper) {
    const placeholder = document.createElement('div');
    placeholder.className = 'video-placeholder';
    placeholder.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;background:url('https://img.youtube.com/vi/${videoId}/hqdefault.jpg') center/cover no-repeat;cursor:pointer;display:flex;align-items:center;justify-content:center;`;

    const playBtn = document.createElement('div');
    playBtn.style.cssText = 'width:56px;height:56px;background:rgba(0,0,0,0.7);border-radius:50%;display:flex;align-items:center;justify-content:center;transition:transform 0.3s,background 0.3s;';
    playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>';

    placeholder.appendChild(playBtn);
    placeholder.addEventListener('mouseenter', () => { playBtn.style.transform = 'scale(1.1)'; playBtn.style.background = 'rgba(124,92,255,0.9)'; });
    placeholder.addEventListener('mouseleave', () => { playBtn.style.transform = 'scale(1)'; playBtn.style.background = 'rgba(0,0,0,0.7)'; });
    placeholder.addEventListener('click', () => {
        placeholder.remove();
        iframe.style.display = '';
        iframe.src += (iframe.src.includes('?') ? '&' : '?') + 'autoplay=1';
    });

    wrapper.appendChild(placeholder);
}

function renderChannels(channels) {
    const section = document.getElementById('channelsSection');
    const grid = document.getElementById('channelsGrid');

    if (!channels || channels.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = '';
    grid.innerHTML = '';

    channels.forEach(ch => {
        const link = document.createElement('a');
        link.className = 'channel-chip';
        link.href = ch.url || '#';
        link.target = '_blank';
        link.rel = 'noopener';
        link.innerHTML = `
            <img src="https://i.ytimg.com/vi/${ch.sampleVideoId || ''}/default.jpg" alt="${ch.name}" onerror="this.style.display='none'">
            <span>${ch.name}</span>
        `;
        grid.appendChild(link);
    });
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const workCards = document.querySelectorAll('.work-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            workCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.classList.remove('hidden');
                    card.style.display = '';
                } else {
                    card.classList.add('hidden');
                    card.style.display = 'none';
                }
            });
        });
    });
}
