import Lenis from 'lenis';

const PREFERS_REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SCROLL_THRESHOLD = 24;
let headerCompact = false;

function updateHeaderState(scrollY: number) {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  const shouldCompact = scrollY > SCROLL_THRESHOLD;
  if (shouldCompact !== headerCompact) {
    headerCompact = shouldCompact;
    header.classList.toggle('is-scrolled', headerCompact);
  }
}

let activeObserver: IntersectionObserver | null = null;

export function refreshScrollReveals() {
  if (typeof window === 'undefined') return;

  const targets = document.querySelectorAll('.reveal-up:not(.is-visible)');
  if (targets.length === 0) return;

  if (PREFERS_REDUCED_MOTION || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  targets.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const delay = htmlEl.dataset.revealDelay;
    if (delay) {
      htmlEl.style.setProperty('--reveal-delay', `${delay}s`);
    }
  });

  if (!activeObserver) {
    activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            activeObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
  }

  targets.forEach((el) => activeObserver?.observe(el));
}

let lenisInstance: Lenis | null = null;
let rafId: number | null = null;

export function initSmoothScroll(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  if (PREFERS_REDUCED_MOTION) {
    refreshScrollReveals();
    const handleNativeScroll = () => updateHeaderState(window.scrollY);
    window.addEventListener('scroll', handleNativeScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleNativeScroll);
    };
  }

  try {
    if (!lenisInstance) {
      lenisInstance = new Lenis({
        duration: 1.1,
        easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out cubic
        smoothWheel: true,
      });

      (window as any).lenis = lenisInstance;
      document.documentElement.classList.add('lenis', 'lenis-smooth');

      const raf = (time: number) => {
        lenisInstance?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      lenisInstance.on('scroll', ({ scroll }: { scroll: number }) => {
        updateHeaderState(scroll);
      });
    }

    // Initial check
    updateHeaderState(window.scrollY);
    refreshScrollReveals();

    // Observe mutations to automatically reveal new elements on page switch
    const mutationObserver = new MutationObserver(() => {
      refreshScrollReveals();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      lenisInstance?.destroy();
      lenisInstance = null;
      (window as any).lenis = undefined;
      document.documentElement.classList.remove('lenis', 'lenis-smooth');
    };
  } catch (err) {
    console.warn('Smooth scroll unavailable, using native scroll:', err);
    window.addEventListener('scroll', () => updateHeaderState(window.scrollY), {
      passive: true,
    });
    refreshScrollReveals();
    return () => {};
  }
}

export function scrollToTop(immediate = false) {
  if (typeof window === 'undefined') return;
  const currentLenis = (window as any).lenis;
  if (currentLenis && typeof currentLenis.scrollTo === 'function') {
    currentLenis.scrollTo(0, { immediate });
  } else {
    window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' });
  }
}
