/* ============================================================
   Yu-Fang Yang — shared scripts
   Theme toggle · Bubble face ↔ ERP waveform morph · Nav · Pubs filter
   ============================================================ */

(function () {
    'use strict';

    const NS = 'http://www.w3.org/2000/svg';

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
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', t === 'dark' ? '#0a0b10' : '#f6f1e8');
    }
    if (!root.getAttribute('data-theme')) applyTheme(getInitial());
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            try { localStorage.setItem('theme', next); } catch (e) {}
        });
    }

    // ---------- Navbar scroll ----------
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

    // ---------- Live ERP waveform next to the brain ----------
    // The wave path is rebuilt every animation frame so it "flows" in real time.
    // The underlying shape keeps three named peaks (N170, P200, P300) anchored
    // to the labelled markers in the SVG.
    function initBrainErp() {
        const svg = document.querySelector('.brain-erp');
        if (!svg) return;
        const wave = svg.querySelector('.erp-live-wave');
        if (!wave) return;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Anchor points (x, y) for the three named peaks — match the SVG markers.
        const N170 = { x: 322, y: 82 };
        const P200 = { x: 408, y: 34 };
        const P300 = { x: 506, y: 26 };
        const baseline = 60;
        const xStart = 246;
        const xEnd   = 600;

        function buildPath(t) {
            const pts = [];
            for (let x = xStart; x <= xEnd; x += 3) {
                let y = baseline;
                // carrier ripple that scrolls in time
                y += Math.sin((x - xStart) * 0.05 + t * 2.0) * 1.4;
                // N170 trough
                y += (N170.y - baseline) * Math.exp(-Math.pow((x - N170.x) / 22, 2));
                // P200 peak
                y += (P200.y - baseline) * Math.exp(-Math.pow((x - P200.x) / 20, 2));
                // P300 peak (broader)
                y += (P300.y - baseline) * Math.exp(-Math.pow((x - P300.x) / 28, 2));
                pts.push(x + ',' + y.toFixed(2));
            }
            return 'M ' + pts.join(' L ');
        }

        // paint the static shape immediately so it works even before rAF fires
        wave.setAttribute('d', buildPath(0));
        if (reduced) return;

        // then animate with setInterval (works even when the tab is hidden,
        // unlike requestAnimationFrame which gets throttled)
        const started = Date.now();
        setInterval(() => {
            const t = (Date.now() - started) / 1000;
            wave.setAttribute('d', buildPath(t));
        }, 60);
    }

    // Run after DOMContent is ready (script is at end of body, so DOM exists)
    // but wrap in requestAnimationFrame so SVG is laid out before sampling
    setTimeout(initBrainErp, 30);

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
