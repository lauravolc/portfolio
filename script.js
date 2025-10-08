(() => {
    // ===== Cache DOM
    const nav = document.querySelector('nav');
    const links = Array.from(document.querySelectorAll('.links a[href^="#"]'));
    const sections = links
        .map(a => document.querySelector(a.getAttribute('href')))
        .filter(Boolean);

    // ===== Smooth scroll (s presným offsetom na sticky navbar)
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smoothTo = (el) => {
        const navH = nav?.offsetHeight || 0;
        const extraGap = 12;
        const y = el.getBoundingClientRect().top + window.pageYOffset - navH - extraGap;
        window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    };

    // Delegovaný klik na odkazy v navbare
    document.addEventListener('click', (e) => {
        const a = e.target.closest('.links a[href^="#"]');
        if (!a) return;
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        smoothTo(target);
        links.forEach(l => l.classList.remove('active'));
        a.classList.add('active');
        history.pushState(null, '', a.getAttribute('href'));
    });

    // ===== Highlight aktívnej položky pri scrolle (throttled)
    let ticking = false;
    const highlight = () => {
        const y = window.scrollY + (nav?.offsetHeight || 0) + 60;
        for (let i = sections.length - 1; i >= 0; i--) {
            const s = sections[i];
            if (s.offsetTop <= y) {
                links.forEach(l => l.classList.remove('active'));
                const link = links.find(l => l.getAttribute('href') === `#${s.id}`);
                if (link) link.classList.add('active');
                break;
            }
        }
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(highlight);
            ticking = true;
        }
    }, { passive: true });
    highlight();

    // ===== Skills: animácia kruhov + percent
    const circles = document.querySelectorAll('#skills .circle');
    if (circles.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (!e.isIntersecting) return;

                const wrap = e.target;
                const bar  = wrap.querySelector('.bar');
                const pct  = wrap.querySelector('.pct');
                const lvl  = wrap.querySelector('.lvl');

                const level = wrap.dataset.level;
                if (level && lvl) lvl.textContent = level;

                const r = parseFloat(bar.getAttribute('r'));      // napr. 64
                const C = 2 * Math.PI * r;                        // ≈ 402
                const target = Math.max(0, Math.min(100, parseFloat(wrap.dataset.progress) || 0));
                const offset = C - (C * target) / 100;

                bar.style.strokeDasharray = `${C}`;

                if (prefersReduced) {
                    bar.style.strokeDashoffset = `${offset}`;
                    if (pct) pct.textContent = `${Math.round(target)}%`;
                } else {
                    bar.animate(
                        [{ strokeDashoffset: C }, { strokeDashoffset: offset }],
                        { duration: 1100, easing: 'ease-out', fill: 'forwards' }
                    );
                    if (pct) {
                        const start = performance.now(), dur = 1100;
                        const tick = (t) => {
                            const p = Math.min(1, (t - start) / dur);
                            pct.textContent = `${Math.round(target * p)}%`;
                            if (p < 1) requestAnimationFrame(tick);
                        };
                        requestAnimationFrame(tick);
                    }
                }
                io.unobserve(wrap);
            });
        }, { threshold: 0.5 });

        circles.forEach(c => io.observe(c));
    }
})();
