const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const navToggle = document.querySelector('[data-nav-toggle]');

const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 18);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

navToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(open));
});
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('is-open');
  navToggle?.setAttribute('aria-expanded', 'false');
}));

const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));


// La navegación superior indica la sección visible sin animar ni desplazar el contenido.
const motionSections = [...document.querySelectorAll('[data-scroll-section]')];
const navSectionLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
if (motionSections.length) {
  const sectionObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navSectionLinks.forEach(link => {
      const active = link.getAttribute('href') === `#${visible.target.id}`;
      link.classList.toggle('is-current', active);
      if (active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
    });
  }, { threshold:[.2,.45,.7] });
  motionSections.forEach(section => sectionObserver.observe(section));
}

// Navegación libro a libro dentro de la biblioteca.
// Un gesto de rueda = un libro. Mientras dura la inercia del trackpad/rueda,
// los eventos restantes se absorben para impedir el desplazamiento continuo.
const bookSteps = [...document.querySelectorAll('.book-feature')];
const booksSection = document.querySelector('#libros');
const booksIntro = booksSection?.querySelector('.section-intro');
const authorSection = document.querySelector('#autor');
const bookSnapTargets = [booksIntro, ...bookSteps].filter(Boolean);
let bookWheelLocked = false;
let bookWheelAccum = 0;
let bookWheelReset = null;
let bookWheelRelease = null;
let bookWheelMinReleaseAt = 0;

const targetTop = element => {
  const headerHeight = header?.getBoundingClientRect().height || 78;
  return Math.max(0, window.scrollY + element.getBoundingClientRect().top - headerHeight - 10);
};

const nearestSnapIndex = () => {
  const headerHeight = header?.getBoundingClientRect().height || 78;
  const anchor = headerHeight + 12;
  let best = 0;
  let distance = Infinity;
  bookSnapTargets.forEach((target, index) => {
    const d = Math.abs(target.getBoundingClientRect().top - anchor);
    if (d < distance) { distance = d; best = index; }
  });
  return best;
};

const booksNavigationActive = () => {
  if (!booksSection) return false;
  const r = booksSection.getBoundingClientRect();
  // Se activa en cuanto la biblioteca ocupa el centro de la pantalla.
  const probe = Math.min(window.innerHeight * .55, 520);
  return r.top <= probe && r.bottom >= probe;
};

const scheduleWheelUnlock = () => {
  clearTimeout(bookWheelRelease);
  const remaining = Math.max(0, bookWheelMinReleaseAt - performance.now());
  bookWheelRelease = setTimeout(() => {
    bookWheelLocked = false;
    bookWheelAccum = 0;
  }, Math.max(220, remaining));
};

window.addEventListener('wheel', event => {
  if (!bookSnapTargets.length || !booksSection) return;
  if (!window.matchMedia('(min-width: 901px)').matches) return;
  if (!booksNavigationActive()) return;
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

  // No hay desplazamiento libre dentro de la biblioteca.
  event.preventDefault();

  if (bookWheelLocked) {
    bookWheelAccum = 0;
    scheduleWheelUnlock();
    return;
  }

  bookWheelAccum += event.deltaY;
  clearTimeout(bookWheelReset);
  bookWheelReset = setTimeout(() => { bookWheelAccum = 0; }, 130);
  if (Math.abs(bookWheelAccum) < 18) return;

  const direction = bookWheelAccum > 0 ? 1 : -1;
  const current = nearestSnapIndex();
  const next = current + direction;
  bookWheelAccum = 0;
  bookWheelLocked = true;
  bookWheelMinReleaseAt = performance.now() + 620;
  scheduleWheelUnlock();

  if (next < 0) {
    // Vuelve a la sección anterior sin quedarse atrapado en la biblioteca.
    window.scrollTo({ top: Math.max(0, targetTop(booksSection) - window.innerHeight * .88), behavior: 'smooth' });
  } else if (next >= bookSnapTargets.length) {
    if (authorSection) window.scrollTo({ top: targetTop(authorSection), behavior: 'smooth' });
  } else {
    window.scrollTo({ top: targetTop(bookSnapTargets[next]), behavior: 'smooth' });
  }
}, { passive: false });

const quotes = [...document.querySelectorAll('[data-quote]')];
const counter = document.querySelector('[data-quote-counter]');
let quoteIndex = 0;
const renderQuote = i => {
  quoteIndex = (i + quotes.length) % quotes.length;
  quotes.forEach((q, idx) => q.classList.toggle('is-active', idx === quoteIndex));
  if (counter) counter.textContent = `${String(quoteIndex + 1).padStart(2,'0')} / ${String(quotes.length).padStart(2,'0')}`;
};
document.querySelector('[data-quote-prev]')?.addEventListener('click', () => renderQuote(quoteIndex - 1));
document.querySelector('[data-quote-next]')?.addEventListener('click', () => renderQuote(quoteIndex + 1));

let timer = setInterval(() => renderQuote(quoteIndex + 1), 10000);
document.querySelector('[data-quote-deck]')?.addEventListener('mouseenter', () => clearInterval(timer));

document.querySelectorAll('[data-jump-book]').forEach(link => {
  link.addEventListener('click', () => {
    const card = document.querySelector(`[data-book="${link.dataset.jumpBook}"]`);
    setTimeout(() => card?.scrollIntoView({ behavior:'smooth', block:'center' }), 40);
  });
});
