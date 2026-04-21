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

    // ---------- Bubble face ↔ waveform morph ----------
    function initBubbleFigure() {
        const svg = document.querySelector('.erp-svg');
        if (!svg) return;
        const faceGuide = svg.querySelector('#faceGuide');
        const waveGuide = svg.querySelector('#waveGuide');
        const bubbleLayer = svg.querySelector('.bubble-layer');
        const markerLayer = svg.querySelector('.marker-layer');
        if (!faceGuide || !waveGuide || !bubbleLayer) return;

        // respect reduced motion: render a static face only
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Sample face-interior positions using a jittered grid + isPointInFill
        const pt = svg.createSVGPoint();
        const facePositions = [];
        const step = 10;
        for (let y = 50; y < 490; y += step) {
            for (let x = 55; x < 345; x += step) {
                const jx = x + (Math.random() - 0.5) * step * 0.7;
                const jy = y + (Math.random() - 0.5) * step * 0.7;
                pt.x = jx; pt.y = jy;
                try {
                    if (faceGuide.isPointInFill(pt)) facePositions.push({ x: jx, y: jy });
                } catch (e) { /* some browsers throw if path isn't in DOM yet */ }
            }
        }

        // Shuffle so animation feels organic (not left-to-right)
        for (let i = facePositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [facePositions[i], facePositions[j]] = [facePositions[j], facePositions[i]];
        }

        const N = Math.min(facePositions.length, 150);
        const waveLen = waveGuide.getTotalLength();

        const bubbles = [];
        for (let i = 0; i < N; i++) {
            const face = facePositions[i];
            // Distribute along waveform, with slight vertical jitter so bubbles don't collapse to a line
            const t = i / Math.max(1, N - 1);
            const wavePt = waveGuide.getPointAtLength(t * waveLen);
            const waveJitterY = (Math.random() - 0.5) * 6;
            const waveJitterX = (Math.random() - 0.5) * 3;
            const wave = { x: wavePt.x + waveJitterX, y: wavePt.y + waveJitterY };

            // Size distribution: mostly small, a few larger
            const roll = Math.random();
            const r = roll < 0.6 ? (2.2 + Math.random() * 2.3)        // small
                    : roll < 0.9 ? (4.2 + Math.random() * 2.8)         // medium
                    :              (6.5 + Math.random() * 3.5);        // large

            const c = document.createElementNS(NS, 'circle');
            c.setAttribute('r', r.toFixed(2));
            c.setAttribute('cx', 0);
            c.setAttribute('cy', 0);
            c.classList.add('bubble');
            c.style.opacity = (0.35 + Math.random() * 0.55).toFixed(2);
            c.style.transitionDelay = (Math.random() * 0.5).toFixed(2) + 's';
            c.style.transform = `translate(${face.x.toFixed(2)}px, ${face.y.toFixed(2)}px)`;
            bubbleLayer.appendChild(c);
            bubbles.push({ el: c, face, wave });
        }

        // ---------- Accent markers ----------
        // Three named peaks: N170, P200, P300
        //   face positions = approximate scalp electrode sites on the silhouette
        //   wave positions = matching peaks/troughs along the waveform
        const markers = [
            { label: 'N170', face: { x: 148, y: 140 }, wave: { x: 205, y: 430 } },
            { label: 'P200', face: { x: 252, y: 140 }, wave: { x: 245, y: 318 } },
            { label: 'P300', face: { x: 200, y: 90  }, wave: { x: 305, y: 282 } },
        ];

        markers.forEach((m, idx) => {
            const g = document.createElementNS(NS, 'g');
            g.classList.add('marker');
            const ring = document.createElementNS(NS, 'circle');
            ring.setAttribute('r', 9);
            ring.classList.add('marker-ring');
            ring.style.animationDelay = (idx * 0.5) + 's';
            const dot = document.createElementNS(NS, 'circle');
            dot.setAttribute('r', 4);
            dot.classList.add('marker-dot');
            const txt = document.createElementNS(NS, 'text');
            txt.classList.add('marker-label');
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('y', -14);
            txt.textContent = m.label;
            g.appendChild(ring);
            g.appendChild(dot);
            g.appendChild(txt);
            g.style.transform = `translate(${m.face.x}px, ${m.face.y}px)`;
            markerLayer.appendChild(g);
            m.el = g;
        });

        if (reduced) return;  // Stay in face state only

        // ---------- Morph loop ----------
        let state = 'face';
        function flip() {
            state = state === 'face' ? 'wave' : 'face';
            bubbles.forEach(b => {
                const target = b[state];
                b.el.style.transform = `translate(${target.x.toFixed(2)}px, ${target.y.toFixed(2)}px)`;
            });
            markers.forEach(m => {
                const target = m[state];
                m.el.style.transform = `translate(${target.x}px, ${target.y}px)`;
            });
        }

        // Kick off: hold face 3.5s, then alternate every 6.5s
        setTimeout(flip, 3500);
        setInterval(flip, 6500);
    }

    // Run after DOMContent is ready (script is at end of body, so DOM exists)
    // but wrap in requestAnimationFrame so SVG is laid out before sampling
    setTimeout(initBubbleFigure, 60);

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
