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

    // ---------- Venus ERP waves ----------
    // Stacked ERP-shaped curves clipped to a Venus-inspired silhouette.
    // Each curve breathes with a small phase-shifted drift.
    function initVenusFigure() {
        const svg = document.querySelector('.erp-svg');
        if (!svg) return;
        const waveLayer = svg.querySelector('.wave-layer');
        const markerLayer = svg.querySelector('.marker-layer');
        if (!waveLayer) return;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Build one ERP-like trace at baseline y, horizontally spanning viewBox.
        function erpPath(baseY, phase, amp) {
            const pts = [];
            for (let x = 0; x <= 400; x += 4) {
                const t = x / 400;
                let y = baseY;
                // gentle carrier wave
                y += Math.sin(t * 2 * Math.PI + phase) * (2 + amp * 0.4);
                // N170 dip near t=0.32
                y -= Math.exp(-Math.pow((t - 0.32) * 11, 2)) * (8 + amp);
                // P200 peak near t=0.50
                y += Math.exp(-Math.pow((t - 0.50) * 12, 2)) * (6 + amp * 0.8);
                // P300 peak near t=0.72
                y += Math.exp(-Math.pow((t - 0.72) * 9, 2)) * (10 + amp * 1.1);
                pts.push(x + ',' + y.toFixed(2));
            }
            return 'M ' + pts.join(' L ');
        }

        // Draw ~38 stacked ERP traces across the silhouette
        const count = 38;
        const top = 40;
        const bottom = 500;
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            const baseY = top + t * (bottom - top);
            const phase = i * 0.42;
            const amp = 2 + Math.random() * 3;
            const path = document.createElementNS(NS, 'path');
            path.setAttribute('d', erpPath(baseY, phase, amp));
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-width', '0.9');
            path.setAttribute('stroke-linecap', 'round');
            path.classList.add('erp-wave');
            path.style.opacity = (0.35 + Math.random() * 0.5).toFixed(2);
            if (!reduced) {
                path.style.animationDelay = (i * 0.11).toFixed(2) + 's';
                path.style.animationDuration = (5 + (i % 4) * 0.8).toFixed(2) + 's';
            }
            waveLayer.appendChild(path);
        }

        // Markers on the face: N170 (left temporal), P200 (right temporal), P300 (central-parietal)
        const markers = [
            { label: 'N170', x: 130, y: 170 },
            { label: 'P200', x: 270, y: 160 },
            { label: 'P300', x: 200, y: 110 },
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
