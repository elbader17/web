/* ============================================================
   Eduardo Bader — Main Script
   ============================================================ */

(function () {
  'use strict';

  // ---------- Navbar scroll state ----------
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 24) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile Menu ----------
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    let open = false;
    const ICONS = {
      menu:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mobile-burger-icon w-5 h-5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
      close:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mobile-burger-icon w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    };
    const toggle = () => {
      open = !open;
      mobileMenu.classList.toggle('open', open);
      menuBtn.innerHTML = open ? ICONS.close : ICONS.menu;
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    };
    menuBtn.addEventListener('click', toggle);
    document.querySelectorAll('.mobile-link').forEach((link) => {
      link.addEventListener('click', () => {
        if (open) toggle();
      });
    });
  }

  // ---------- Scroll Reveal ----------
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  // ---------- Terminal Typing Sequence ----------
  const term = document.getElementById('terminal-body');
  if (term) {
    const baseLines = [
      '<span class="terminal-prompt">┌──(</span><span class="terminal-ok">eduardo</span><span class="terminal-prompt">@</span><span class="terminal-ok">singularity</span><span class="terminal-prompt">)</span>-[<span class="terminal-warn">~</span>]',
      '<span class="terminal-prompt">└─$</span> <span class="terminal-cmd">./agent.automation --init</span>',
      '<span class="terminal-out">[</span><span class="terminal-ok">✓</span><span class="terminal-out">] Bootstrap .......... </span><span class="terminal-ok">OK</span>',
      '<span class="terminal-out">[</span><span class="terminal-ok">✓</span><span class="terminal-out">] MCP runtime ........ </span><span class="terminal-ok">OK</span>',
      '<span class="terminal-out">[</span><span class="terminal-ok">✓</span><span class="terminal-out">] A2A protocol ....... </span><span class="terminal-ok">OK</span>',
      '<span class="terminal-out">[</span><span class="terminal-ok">✓</span><span class="terminal-out">] Sub-agents online ... </span><span class="terminal-ok">OK</span>',
      '<span class="terminal-out">[</span><span class="terminal-ok">✓</span><span class="terminal-out">] Workflows ready ..... </span><span class="terminal-ok">OK</span>',
      '<span class="terminal-prompt">└─$</span> <span class="terminal-cmd">status --realtime</span>',
      '<span class="terminal-comment"># network: online · latency: 24ms · uptime: 99.97%</span>',
      '<span class="terminal-prompt">└─$</span> <span class="terminal-cmd">_</span><span class="terminal-caret"></span>',
    ];

    let lineIdx = 0;
    let termStarted = false;

    const appendNext = () => {
      if (lineIdx >= baseLines.length) return;
      const lineDiv = document.createElement('div');
      lineDiv.className = 'terminal-line';
      const html = baseLines[lineIdx];
      lineDiv.innerHTML = html;
      term.appendChild(lineDiv);
      lineIdx++;
      while (term.children.length > 30) term.removeChild(term.firstChild);
      setTimeout(appendNext, 180);
    };

    const reset = () => {
      lineIdx = 0;
      term.innerHTML = '';
      termStarted = true;
      appendNext();
    };

    const kickoff = () => {
      if (termStarted) return;
      termStarted = true;
      appendNext();
    };

    if ('IntersectionObserver' in window) {
      const tio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              kickoff();
              tio.disconnect();
            }
          });
        },
        { threshold: 0.4 }
      );
      tio.observe(term);
    } else {
      kickoff();
    }

    document.addEventListener('i18n:applied', reset);
  }

  // ---------- Animated Stat Counters ----------
  const counters = document.querySelectorAll('[data-counter]');
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-counter'), 10) || 0;
            const suffix = el.getAttribute('data-suffix') || '';
            let val = 0;
            const step = Math.max(1, Math.ceil(target / 36));
            const tick = () => {
              val += step;
              if (val >= target) {
                el.textContent = target + suffix;
                return;
              }
              el.textContent = val + suffix;
              requestAnimationFrame(tick);
            };
            tick();
            cio.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  // ---------- Subtle parallax on orbs ----------
  const orbs = document.querySelectorAll('[data-parallax]');
  if (orbs.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener(
      'mousemove',
      (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        orbs.forEach((orb) => {
          const strength = parseFloat(orb.getAttribute('data-parallax')) || 1;
          orb.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
        });
      },
      { passive: true }
    );
  }

  })();