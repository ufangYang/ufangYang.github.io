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

    // ---------- Venus bubbles ----------
    // Decompose a Venus-inspired silhouette into many small circles whose
    // colour depends on position: gold tones in the hair, peach/cream in the
    // face, deeper shadow at the crown. Inspired by Botticelli's Venus.
    function initVenusFigure() {
        const svg = document.querySelector('.erp-svg');
        if (!svg) return;
        const guidePath = svg.querySelector('#venusPath');
        const bubbleLayer = svg.querySelector('.bubble-layer');
        const markerLayer = svg.querySelector('.marker-layer');
        if (!guidePath || !bubbleLayer) return;

        // Sample positions inside the Venus silhouette
        const pt = svg.createSVGPoint();
        const positions = [];
        const step = 8;
        for (let y = 40; y < 510; y += step) {
            for (let x = 10; x < 395; x += step) {
                const jx = x + (Math.random() - 0.5) * step * 0.7;
                const jy = y + (Math.random() - 0.5) * step * 0.7;
                pt.x = jx; pt.y = jy;
                try { if (guidePath.isPointInFill(pt)) positions.push({ x: jx, y: jy }); } catch (e) {}
            }
        }

        // Shuffle so colours spread rather than painting left-to-right
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        // Botticelli-inspired palette
        const PAL = {
            hairBright: ['#e6bd7c', '#f0c97c', '#d8a65c', '#e4b068', '#ecba70', '#ddab5a'],
            hairDeep:   ['#c8934d', '#b87c35', '#a87f3b', '#9c6e2e', '#b88a45', '#a07432'],
            hairShadow: ['#6d4e34', '#8a6947', '#734f30', '#7d5a3a', '#5e3e24'],
            face:       ['#edc8a8', '#f0d5b8', '#e3b898', '#f5dcc0', '#e8c4a8', '#d8a48a', '#f2d0b4'],
            blush:      ['#d4988a', '#c48070', '#cf8d7a', '#dca394'],
            cool:       ['#b5c6b9', '#c8d4c3', '#a4bbb2', '#cbd6c9']
        };
        function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

        // Face ellipse: center (198, 195), radii (62, 82)
        function pickColour(x, y) {
            const dx = (x - 222) / 62;
            const dy = (y - 198) / 82;
            const distFace = dx * dx + dy * dy;
            if (distFace < 0.65) {
                return pick(PAL.face);
            }
            if (distFace < 1.05) {
                const r = Math.random();
                return r < 0.55 ? pick(PAL.face) : r < 0.8 ? pick(PAL.blush) : pick(PAL.hairBright);
            }
            if (y > 405) {
                const r = Math.random();
                return r < 0.45 ? pick(PAL.face) : r < 0.8 ? pick(PAL.hairDeep) : pick(PAL.cool);
            }
            if (y < 125) {
                const r = Math.random();
                return r < 0.55 ? pick(PAL.hairDeep) : r < 0.85 ? pick(PAL.hairBright) : pick(PAL.hairShadow);
            }
            // flowing hair on the sides — left side brighter/wind-swept
            if (x < 160) {
                const r = Math.random();
                return r < 0.5 ? pick(PAL.hairBright) : r < 0.85 ? pick(PAL.hairDeep) : pick(PAL.hairShadow);
            }
            const r = Math.random();
            return r < 0.6 ? pick(PAL.hairDeep) : r < 0.9 ? pick(PAL.hairBright) : pick(PAL.hairShadow);
        }

        const N = Math.min(positions.length, 520);
        for (let i = 0; i < N; i++) {
            const p = positions[i];
            const roll = Math.random();
            const r = roll < 0.5 ? (2 + Math.random() * 2)
                    : roll < 0.85 ? (3.5 + Math.random() * 2.5)
                    :              (5.5 + Math.random() * 3.5);
            const c = document.createElementNS(NS, 'circle');
            c.setAttribute('cx', p.x.toFixed(2));
            c.setAttribute('cy', p.y.toFixed(2));
            c.setAttribute('r', r.toFixed(2));
            c.setAttribute('fill', pickColour(p.x, p.y));
            c.setAttribute('opacity', (0.55 + Math.random() * 0.4).toFixed(2));
            c.classList.add('bubble');
            bubbleLayer.appendChild(c);
        }

        // Peak markers sit on the face area
        const markers = [
            { label: 'N170', x: 162, y: 190 },
            { label: 'P200', x: 282, y: 175 },
            { label: 'P300', x: 222, y: 115 }
        ];
        markers.forEach((m, idx) => {
            const g = document.createElementNS(NS, 'g');
            g.classList.add('marker');
            const ring = document.createElementNS(NS, 'circle');
            ring.setAttribute('r', 9);
            ring.classList.add('marker-ring');
            ring.style.animationDelay = (idx * 0.5) + 's';
            const dot = document.createElementNS(NS, 'circle');
            dot.setAttribute('r', 3.5);
            dot.classList.add('marker-dot');
            const txt = document.createElementNS(NS, 'text');
            txt.classList.add('marker-label');
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('y', -14);
            txt.textContent = m.label;
            g.appendChild(ring);
            g.appendChild(dot);
            g.appendChild(txt);
            g.style.transform = `translate(${m.x}px, ${m.y}px)`;
            markerLayer.appendChild(g);
        });
    }

    // Run after DOMContent is ready (script is at end of body, so DOM exists)
    // but wrap in requestAnimationFrame so SVG is laid out before sampling
    setTimeout(initVenusFigure, 60);

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
