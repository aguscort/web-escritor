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
  if (dialog?.open) return;
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

const bookData = {
  bradbury: {
    title: 'La pesadilla de Bradbury',
    status: 'published',
    type: 'Essay · artificial intelligence · consciousness',
    cover: '../assets/la-pesadilla-de-bradbury.webp',
    buyLinks: [{ label: 'Amazon', url: 'https://www.amazon.es/pesadilla-Bradbury-Agust%C3%ADn-Cort%C3%A9s-Marcos/dp/B0D64B7THG' }],
    facts: [
      ['Form', 'Essay'],
      ['Subject', 'Artificial intelligence · consciousness'],
      ['Approach', 'Explanation · humanistic reflection · interdisciplinary analysis'],
      ['Status', 'Published']
    ],
    summary: 'La pesadilla de Bradbury explores the quiet revolution artificial intelligence is bringing about in our society and the questions it raises about consciousness and our own nature.',
    details: [
      'Between rigorous explanation and humanistic reflection, this essay weaves the latest technological advances together with fundamental questions about consciousness and our own nature. Its path leads into territories where the distinction between the human and the artificial becomes increasingly difficult to sustain.',
      'From the subtleties of new computational models to parallels with consciousness in the animal kingdom, the book offers a critical, multidisciplinary analysis of AI. It builds bridges between disciplines in order to examine how these technologies alter our perception of intelligence, consciousness and ourselves.'
    ],
    quote: ''
  },
  abuela: {
    title: 'Cuentos de la abuela robot',
    status: 'published',
    type: 'Short stories · speculative fiction',
    cover: '../assets/cuentos-de-la-abuela-robot.webp',
    buyLinks: [{ label: 'Amazon', url: 'https://www.amazon.es/Cuentos-abuela-robot-Agust%C3%ADn-Cort%C3%A9s/dp/B0DJL3VGFG' }],
    facts: [
      ['Form', 'Short-story collection'],
      ['Structure', 'Reality · Family · Technology · Myth'],
      ['Register', 'Speculative fiction · irony · domestic science fiction'],
      ['Status', 'Published']
    ],
    summary: 'A collection of short stories organized into four territories—Reality, Family, Technology and Myth—in which each story begins with an altered rule and observes what changes from there.',
    details: [
      'The premises range from digital identity and everyday technology to family ties, myth and the perception of reality. The aim is not to describe complete futures but to introduce a precise anomaly into a recognizable life.',
      'That displacement pushes an ordinary situation toward a moral, emotional or social contradiction. Brevity and irony keep the mechanism visible without turning the story into an explanation of its own idea.'
    ],
    quote: '«Pedro era un enorme mastín, viejísimo. Apenas podía caminar. Pero, aun así, se levantaba para recibir al invitado. Era un perro guardián: defendía la casa con su afecto. En cuanto el extraño se acercaba, Pedro caminaba un poco patizambo y con enorme dificultad hasta él y le lamía los zapatos, el pantalón, las manos. Se rozaba con él y expresaba una alegría tan pura que el visitante quedaba rendido y ya daba por buena la visita.»'
  },
  reglas: {
    title: 'Las reglas de la Casa',
    status: 'published',
    type: 'Novel · allegory · total institution',
    cover: '../assets/las-reglas-de-la-casa.webp',
    buyLinks: [
      { label: 'Amazon', url: 'https://www.amazon.es/Las-reglas-Casa-Agust%C3%ADn-Cort%C3%A9s/dp/B0DJZ5V6QG/' },
      { label: 'Libros.market', url: 'https://libros.market/libro/las-reglas-de-la-casa' }
    ],
    facts: [
      ['Form', 'Novel'],
      ['Setting', 'Sweden, 1943'],
      ['Register', 'Allegory · power · identity · institution'],
      ['Status', 'Published']
    ],
    summary: 'In Sweden in 1943, the House turns voluntary blindness into a sign of prestige, discipline and belonging, until renunciation can be presented as a form of freedom.',
    details: [
      'The novel follows the growth of an institution whose power does not rest on coercion alone. The House offers identity, hierarchy and recognition; its effectiveness lies in making desirable what, from the outside, looks like a loss.',
      'The conflict sets that promise of meaning against the individual experience of the body, beauty and sight. The central question is not only how its members obey, but why they come to want to obey.'
    ],
    quote: '«Lars estaba fascinado por el espectáculo. Había una actividad febril, como de colmena. Vio ese aluvión de personas de todo tipo y condición, todas ellas ciegas. Y sus manos. Sus manos flotando por la pared mientras caminaban. Las manos como un río que iba encontrando el camino a lo largo de las paredes. Haciendo ondulaciones, pequeños rizos; avanzando siempre. La visión mareaba y finalmente solo veías esas corrientes de manos, ese universo de manos que avanzaban sin destino y sin tregua, como una estampida de pequeños animales, libres al fin de algún yugo ancestral.»'
  },
  intemperie: {
    title: 'Intemperie',
    status: 'published',
    type: 'Short stories · contemporary fantastic · dark humor',
    cover: '../assets/intemperie.webp',
    buyLinks: [{ label: 'Amazon', url: 'https://www.amazon.es/Intemperie-Agust%C3%ADn-Cort%C3%A9s/dp/B0DY72MFQ9' }],
    facts: [
      ['Form', 'Short-story collection'],
      ['Contents', '15 stories'],
      ['Register', 'Contemporary fantastic · everyday horror · dark humor'],
      ['Status', 'Published']
    ],
    summary: 'Fifteen stories in which an alteration of reality leaves the characters exposed to the body, family, grief, responsibility, illness or loneliness.',
    details: [
      'The anomalies change from one story to another: animalized adults, presences, impossible exchanges, illness, dead people who remain, or families forced to reorganize their rules. The strange needs no complete explanation in order to produce concrete consequences.',
      'The volume concentrates on those consequences. The fantastic removes a protection—a certainty, an identity, a farewell—and forces people to act when no answer can completely solve the problem. Hence the recurrence of care, fragility and responsibility.'
    ],
    quote: '«A veces, se cuenta cómo un animal atrapado en un cepo puede llegar a arrancarse la propia pata para escapar. A menudo se señala la desesperación como motor de ese comportamiento. Eso es una ingenuidad. Exige, en realidad, en la bestia atrapada, una gestión del propio dolor, una capacidad de cálculo dentro de una situación horrible y una determinación que te tendrían que preocupar, a poco sentido común que tuvieses, por si ese animal pusiera sus ojos en ti como presa. Hay gente que, por una compasión equivocada, intentará ayudar liberando al bicho, cuando la actitud correcta es la que tiene el cazador avezado: descerrajarle un tiro lo antes posible.»'
  },
  primavera: {
    title: 'El año que solo hubo primavera',
    status: 'published',
    type: 'Novel · speculative present · catastrophe',
    cover: '../assets/el-ano-que-solo-hubo-primavera.webp',
    buyLinks: [{ label: 'Amazon', url: 'https://www.amazon.es/a%C3%B1o-que-solo-hubo-primavera/dp/B0H6SBKBKV' }],
    facts: [
      ['Form', 'Novel'],
      ['Setting', 'Alicante'],
      ['Register', 'Technology · simulation · intimacy · catastrophe'],
      ['Status', 'Published']
    ],
    summary: 'An anomalous spring, a company that manufactures intimacy, and a man trying to find his way through mediated relationships, emotional simulations and an increasingly unstable city.',
    details: [
      'Jorge enters an environment where loneliness can become a service and intimacy a product. Psychotherapy, social networks, desire and technology converge in an Alicante subjected to a climate that stops behaving as it should.',
      'The novel does not simply equate the artificial with the false. Its conflict emerges when a manufactured experience produces real emotional effects and forces a decision about the value of something whose origin we know, but whose consequences have already become part of life.'
    ],
    quote: '«Nadie parecía interesado por otra cosa que celebrar esta ociosa despreocupación. Solo de vez en cuando la gente recordaba el viento y una congoja trémula atravesaba un instante la euforia para luego desaparecer.»'
  },
  nadie: {
    title: 'Nadie nace sabiendo',
    status: 'unpublished',
    type: 'Unpublished novel · comic fantasy · grief',
    cover: '../assets/nadie-nace-sabiendo.webp',
    buyLinks: [],
    facts: [
      ['Form', 'Novel'],
      ['Status', 'Not yet published'],
      ['Register', 'Comic fantasy · supernatural · grief'],
      ['World', 'The dead, zombies, vampires and bureaucracies of the impossible']
    ],
    summary: 'An as-yet unpublished novel: a fantastic comedy about the dead returning, monsters carrying on, and characters discovering that not even death resolves attachment.',
    details: [
      'The metaphysical becomes domestic: zombies with routines, vampires with opinions, loyal dogs and paperwork for managing situations that should be impossible. The humor comes from treating the supernatural as a practical problem.',
      'Beneath the comedy, the novel explores loss, renunciation and the persistence of bonds. Its characters must learn what it means to move on when neither the body, memory nor death itself is enough to bring a relationship to an end.'
    ],
    quote: '«Quizá esperar el Juicio Final mirando a las musarañas o tarareando canciones de Mecano no estaba tan mal.»'
  }
};

const dialog = document.querySelector('[data-book-dialog]');
const dCover = dialog?.querySelector('[data-dialog-cover]');
const dType = dialog?.querySelector('[data-dialog-type]');
const dTitle = dialog?.querySelector('[data-dialog-title]');
const dSummary = dialog?.querySelector('[data-dialog-summary]');
const dQuote = dialog?.querySelector('[data-dialog-quote]');
const dDetail = dialog?.querySelector('[data-dialog-detail]');
const dPurchase = dialog?.querySelector('[data-dialog-purchase]');
const dBuyList = dialog?.querySelector('[data-dialog-buy-list]');
const dPurchaseLabel = dialog?.querySelector('[data-dialog-purchase-label]');
const dStatusBadge = dialog?.querySelector('[data-dialog-status-badge]');
const dFacts = dialog?.querySelector('[data-dialog-facts]');
const dFragmentSection = dialog?.querySelector('.dialog-fragment');
const dFactsSection = dialog?.querySelector('.dialog-facts');
const dEdition = dialog?.querySelector('[data-dialog-edition]');
const dEditionImg = dialog?.querySelector('[data-dialog-edition-img]');
const dPage = dialog?.querySelector('[data-dialog-page]');


let bookDialogPageY = 0;

const lockBookDialogBackground = () => {
  if (document.body.classList.contains('book-dialog-open')) return;
  bookDialogPageY = window.scrollY || window.pageYOffset || 0;
  document.documentElement.classList.add('book-dialog-open');
  document.body.classList.add('book-dialog-open');
  // position:fixed is deliberate: it prevents wheel/trackpad momentum from
  // leaking through the modal and moving the page behind it.
  document.body.style.position = 'fixed';
  document.body.style.top = `-${bookDialogPageY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
};

const unlockBookDialogBackground = () => {
  if (!document.body.classList.contains('book-dialog-open')) return;
  document.documentElement.classList.remove('book-dialog-open');
  document.body.classList.remove('book-dialog-open');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, bookDialogPageY);
};

document.querySelectorAll('[data-open-book]').forEach(button => {
  button.addEventListener('click', () => {
    const data = bookData[button.dataset.openBook];
    if (!data || !dialog) return;
    // Take the cover from the visible book card instead of relying on a relative
    // asset URL. This also works in the self-contained HTML, where the covers
    // are embedded as data URIs.
    const bookCard = document.querySelector(`[data-book="${button.dataset.openBook}"]`);
    const cardCover = bookCard?.querySelector('.book-visual img');
    dCover.src = cardCover?.currentSrc || cardCover?.src || data.cover;
    // Enlace a la ficha completa del libro: cada libro tiene su propia página indexable.
    if (dPage) {
      const slug = bookCard?.id;
      dPage.hidden = !slug;
      if (slug) dPage.href = `libros/${slug}/`;
    }
    dCover.alt = `Cover of ${data.title}`;
    dType.textContent = data.type;
    dTitle.textContent = data.title;
    dSummary.textContent = data.summary;
    dQuote.textContent = data.quote || '';
    if (dFragmentSection) dFragmentSection.hidden = !data.quote;

    // Published books use the exact editorial-data strip supplied from Amazon.
    // The unpublished novel keeps the ordinary textual ficha.
    const editionSource = document.querySelector(`[data-edition-source="${button.dataset.openBook}"]`);
    if (dEdition && dEditionImg) {
      if (editionSource) {
        dEdition.hidden = false;
        dEditionImg.src = editionSource.currentSrc || editionSource.src;
        dEditionImg.alt = `Edition details for ${data.title}: print length, language, publication date, dimensions and ISBN-13`;
      } else {
        dEdition.hidden = true;
        dEditionImg.removeAttribute('src');
        dEditionImg.alt = '';
      }
    }
    if (dFactsSection) dFactsSection.hidden = Boolean(editionSource);

    dDetail.replaceChildren();
    (data.details || []).forEach(text => {
      const p = document.createElement('p');
      p.textContent = text;
      dDetail.appendChild(p);
    });

    if (dFacts) {
      dFacts.replaceChildren();
      (data.facts || []).forEach(([label, value]) => {
        const item = document.createElement('div');
        item.className = 'dialog-fact';
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = label;
        dd.textContent = value;
        item.append(dt, dd);
        dFacts.appendChild(item);
      });
    }
    const isUnpublished = data.status === 'unpublished';
    dialog.classList.toggle('is-unpublished', isUnpublished);

    // Reset the availability state on every open. This prevents status from
    // leaking from one book to the next when the same dialog is reused.
    if (dStatusBadge) {
      dStatusBadge.hidden = !isUnpublished;
      dStatusBadge.style.display = isUnpublished ? '' : 'none';
    }

    dBuyList.replaceChildren();
    const links = Array.isArray(data.buyLinks) ? data.buyLinks : [];

    if (isUnpublished) {
      dPurchase.hidden = false;
      if (dPurchaseLabel) dPurchaseLabel.textContent = 'Availability';
      const status = document.createElement('p');
      status.className = 'dialog-availability';
      status.textContent = 'Not yet published';
      dBuyList.appendChild(status);
    } else if (links.length) {
      dPurchase.hidden = false;
      if (dPurchaseLabel) dPurchaseLabel.textContent = 'Where to buy';
      links.forEach((link, index) => {
        const a = document.createElement('a');
        a.className = `dialog-buy${link.label === 'Amazon' ? ' dialog-buy-amazon' : ''}${index > 0 ? ' dialog-buy-alt' : ''}`;
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.setAttribute('aria-label', `Buy ${data.title} on ${link.label}`);
        a.innerHTML = `Buy on ${link.label} <span>↗</span>`;
        dBuyList.appendChild(a);
      });
    } else {
      dPurchase.hidden = true;
      if (dPurchaseLabel) dPurchaseLabel.textContent = 'Where to buy';
    }
    lockBookDialogBackground();
    dialog.showModal();
    // Every ficha opens from the top, and the internal text pane can always
    // scroll all the way down to the purchase links.
    requestAnimationFrame(() => {
      dialog.scrollTop = 0;
      const copy = dialog.querySelector('.dialog-copy');
      if (copy) copy.scrollTop = 0;
    });
  });
});

const closeBookDialog = () => {
  if (dialog?.open) dialog.close();
};

// Always restore the exact page position after the modal closes, regardless
// of whether it was closed with the X, Escape or code.
dialog?.addEventListener('close', unlockBookDialogBackground);

// Desktop: one scroll surface for the whole ficha. Even if the pointer is over
// the cover, wheel/trackpad movement scrolls the textual pane and can reach the
// purchase links. It never falls through to the page behind the dialog.
dialog?.addEventListener('wheel', event => {
  if (!dialog.open || window.matchMedia('(max-width: 620px)').matches) return;
  const copy = dialog.querySelector('.dialog-copy');
  if (!copy) return;
  const maxScroll = Math.max(0, copy.scrollHeight - copy.clientHeight);
  if (maxScroll <= 0) {
    event.preventDefault();
    return;
  }
  const next = Math.max(0, Math.min(maxScroll, copy.scrollTop + event.deltaY));
  copy.scrollTop = next;
  event.preventDefault();
}, { passive: false });

dialog?.querySelectorAll('[data-close-dialog]').forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    closeBookDialog();
  });
});

dialog?.addEventListener('click', event => {
  if (event.target === dialog) closeBookDialog();
});

// Keep Escape reliable even in browsers where a nested control has focus.
dialog?.addEventListener('cancel', event => {
  event.preventDefault();
  closeBookDialog();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && dialog?.open) closeBookDialog();
});

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

let timer = setInterval(() => renderQuote(quoteIndex + 1), 6500);
document.querySelector('[data-quote-deck]')?.addEventListener('mouseenter', () => clearInterval(timer));

document.querySelectorAll('[data-jump-book]').forEach(link => {
  link.addEventListener('click', () => {
    const card = document.querySelector(`[data-book="${link.dataset.jumpBook}"]`);
    setTimeout(() => card?.scrollIntoView({ behavior:'smooth', block:'center' }), 40);
  });
});
