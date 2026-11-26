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
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' }
    );
  }

  targets.forEach((el) => activeObserver?.observe(el));
}

/**
 * Lightweight native scroll manager (zero continuous rAF loop, zero body MutationObserver).
 * Keeps scrolling crisp and native while updating the compact header state and scroll reveals.
 */
export function initSmoothScroll(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let ticking = false;
  const handleNativeScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateHeaderState(window.scrollY);
      ticking = false;
    });
  };

  updateHeaderState(window.scrollY);
  refreshScrollReveals();
  window.addEventListener('scroll', handleNativeScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleNativeScroll);
  };
}

export function scrollToTop(immediate = true) {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' });
}
