/**
 * Progressive enhancements for the redesigned homepage:
 *   1. Count-up numerals (4.9 / 149 / rate-card prices) on first view, ~800ms.
 *   2. Sticky mobile bar show/hide — slides up once the hero scrolls out,
 *      hides again while the quote form is in view.
 * Both are additive: nothing to display without JS, and reduced-motion
 * leaves numbers static (bar toggles instantly — CSS strips the transition).
 */

const reduce = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------- Count-up */

function wireCounters(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-count]');
  if (!els.length || reduce() || !('IntersectionObserver' in window)) return;

  const tail = (el: HTMLElement, n: number): void => {
    const dec = Number(el.dataset.decimals ?? 0);
    el.textContent = `${el.dataset.prefix ?? ''}${n.toFixed(dec)}${el.dataset.suffix ?? ''}`;
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        io.unobserve(el);

        const target = Number(el.dataset.count ?? '0');
        if (!Number.isFinite(target) || target === 0) return; // "$0" animates nothing

        const t0 = performance.now();
        const dur = 800;
        const tick = (t: number): void => {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
          tail(el, target * eased);
          if (p < 1) requestAnimationFrame(tick);
          else tail(el, target);
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.4 }
  );
  els.forEach((el) => io.observe(el));
}

/* ------------------------------------------------- Sticky mobile bar */

function wireMobileBar(): void {
  const bar = document.querySelector<HTMLElement>('.mbar');
  const hero = document.querySelector<HTMLElement>('.hero');
  const quote = document.querySelector<HTMLElement>('#quote');
  if (!bar || !hero || !quote || !('IntersectionObserver' in window)) return;

  let heroOut = false;
  let quoteIn = false;
  const apply = (): void => {
    bar.classList.toggle('mbar--shown', heroOut && !quoteIn);
  };

  new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        heroOut = !e.isIntersecting;
        apply();
      });
    },
    { threshold: 0 }
  ).observe(hero);

  new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        quoteIn = e.isIntersecting;
        apply();
      });
    },
    { threshold: 0 }
  ).observe(quote);
}

wireCounters();
wireMobileBar();

export {};
