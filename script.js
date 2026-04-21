/* ============================================================
   Yu-Fang Yang — shared scripts (theme toggle + site behaviors)
   ============================================================ */

(function () {
    'use strict';

    // ---------- Theme toggle ----------
    const root = document.documentElement;
    const themeBtn = document.getElementById('themeToggle');

    function getInitial() {
        try {
            const stored = localStorage.getItem('theme');
            if (stored === 'light' || stored === 'dark') return stored;
        } catch (e) {}
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function applyTheme(t) {
        root.setAttribute('data-theme', t);
        // Update theme-color meta so mobile browser chrome matches
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', t === 'dark' ? '#0a0b10' : '#f6f1e8');
    }
    // Ensure attribute is present even if the inline pre-paint script didn't run
    if (!root.getAttribute('data-theme')) applyTheme(getInitial());

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            try { localStorage.setItem('theme', next); } catch (e) {}
        });
    }

    // ---------- Navbar ----------
    const navbar = document.getElementById('navbar');
    if (navbar) {
        const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    const navToggle = document.getElementById('navToggle');
    const navLinks  = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
        navLinks.querySelectorAll('a').forEach(link =>
            link.addEventListener('click', () => navLinks.classList.remove('open'))
        );
    }

    // ---------- Fade-in observer ----------
    const io = new IntersectionObserver(
        entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
        { threshold: 0.12 }
    );
    document.querySelectorAll('.fade-in').forEach(el => {
        io.observe(el);
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible');
    });

    // ---------- Waveform draw-on ----------
    const wave = document.querySelector('.erp-waveform');
    if (wave && typeof wave.getTotalLength === 'function') {
        const len = wave.getTotalLength();
        wave.style.strokeDasharray = len;
        wave.style.setProperty('--path-len', len);
        wave.style.strokeDashoffset = len;
    }

    // ---------- Publications filter ----------
    const pills = document.querySelectorAll('.pub-filter-bar .pill');
    const pubs  = document.querySelectorAll('.pub-list li');
    if (pills.length && pubs.length) {
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const f = pill.dataset.filter;
                pubs.forEach(li => {
                    const tags = (li.dataset.tags || '').split(/\s+/);
                    li.classList.toggle('hidden', f !== 'all' && !tags.includes(f));
                });
                document.querySelectorAll('.year-group').forEach(g => {
                    const any = [...g.querySelectorAll('.pub-list li')].some(li => !li.classList.contains('hidden'));
                    g.style.display = any ? '' : 'none';
                });
            });
        });
    }

})();
