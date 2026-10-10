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
    type: 'Ensayo · inteligencia artificial · consciencia',
    cover: 'assets/la-pesadilla-de-bradbury.webp',
    buyLinks: [{ label: 'Amazon', url: 'https://www.amazon.es/pesadilla-Bradbury-Agust%C3%ADn-Cort%C3%A9s-Marcos/dp/B0D64B7THG' }],
    facts: [
      ['Forma', 'Ensayo'],
      ['Tema', 'Inteligencia artificial · consciencia'],
      ['Enfoque', 'Divulgación · reflexión humanista · análisis interdisciplinar'],
      ['Estado', 'Publicado']
    ],
    summary: 'Un ensayo sobre la revolución silenciosa que la inteligencia artificial está provocando en nuestra sociedad y sobre las preguntas que abre acerca de la consciencia y nuestra propia naturaleza.',
    details: [
      'Entre la divulgación rigurosa y la reflexión humanista, el libro entrelaza los últimos avances tecnológicos con preguntas fundamentales sobre la consciencia y sobre la frontera, cada vez menos nítida, entre lo humano y lo artificial.',
      'Desde los nuevos modelos computacionales hasta los paralelismos con la consciencia en el reino animal, la obra construye puentes entre disciplinas para examinar cómo estas tecnologías están transformando nuestra percepción del mundo y de nosotros mismos, así como sus implicaciones éticas y sociales.'
    ],
    quote: ''
  },
  abuela: {
    title: 'Cuentos de la abuela robot',
    status: 'published',
    type: 'Relatos · ficción especulativa',
    cover: 'assets/cuentos-de-la-abuela-robot.webp',
    buyLinks: [{ label: 'Amazon', url: 'https://www.amazon.es/Cuentos-abuela-robot-Agust%C3%ADn-Cort%C3%A9s/dp/B0DJL3VGFG' }],
    facts: [
      ['Forma', 'Libro de relatos'],
      ['Estructura', 'Realidad · Familia · Tecnología · Mito'],
      ['Registro', 'Ficción especulativa · ironía · ciencia ficción doméstica'],
      ['Estado', 'Publicado']
    ],
    summary: 'Un libro de relatos breves organizado en cuatro territorios —Realidad, Familia, Tecnología y Mito—, donde cada historia parte de una regla alterada y observa qué cambia a partir de ella.',
    details: [
      'Las premisas van de la identidad digital y la tecnología cotidiana a los vínculos familiares, el mito y la percepción de lo real. El interés no está en describir futuros completos, sino en introducir una anomalía precisa dentro de una vida reconocible.',
      'Ese desplazamiento sirve para llevar una situación corriente hasta una contradicción moral, afectiva o social. La brevedad y la ironía mantienen el mecanismo visible sin convertir el relato en una explicación de su propia idea.'
    ],
    quote: '«Pedro era un enorme mastín, viejísimo. Apenas podía caminar. Pero, aun así, se levantaba para recibir al invitado. Era un perro guardián: defendía la casa con su afecto. En cuanto el extraño se acercaba, Pedro caminaba un poco patizambo y con enorme dificultad hasta él y le lamía los zapatos, el pantalón, las manos. Se rozaba con él y expresaba una alegría tan pura que el visitante quedaba rendido y ya daba por buena la visita.»'
  },
  reglas: {
    title: 'Las reglas de la Casa',
    status: 'published',
    type: 'Novela · alegoría · institución total',
    cover: 'assets/las-reglas-de-la-casa.webp',
    buyLinks: [
      { label: 'Amazon', url: 'https://www.amazon.es/Las-reglas-Casa-Agust%C3%ADn-Cort%C3%A9s/dp/B0DJZ5V6QG/' },
      { label: 'Libros.market', url: 'https://libros.market/libro/las-reglas-de-la-casa' }
    ],
    facts: [
      ['Forma', 'Novela'],
      ['Ambientación', 'Suecia, 1943'],
      ['Registro', 'Alegoría · poder · identidad · institución'],
      ['Estado', 'Publicado']
    ],
    summary: 'En la Suecia de 1943, la Casa convierte la ceguera voluntaria en signo de prestigio, disciplina y pertenencia, hasta lograr que la renuncia pueda presentarse como una forma de libertad.',
    details: [
      'La novela sigue el crecimiento de una institución cuyo poder no descansa únicamente en la coerción. La Casa ofrece identidad, jerarquía y reconocimiento; su eficacia consiste en hacer deseable aquello que, visto desde fuera, parece una pérdida.',
      'El conflicto enfrenta esa promesa de sentido con la experiencia individual del cuerpo, la belleza y la mirada. La cuestión central no es solo cómo obedecen sus miembros, sino por qué llegan a querer obedecer.'
    ],
    quote: '«Lars estaba fascinado por el espectáculo. Había una actividad febril, como de colmena. Vio ese aluvión de personas de todo tipo y condición, todas ellas ciegas. Y sus manos. Sus manos flotando por la pared mientras caminaban. Las manos como un río que iba encontrando el camino a lo largo de las paredes. Haciendo ondulaciones, pequeños rizos; avanzando siempre. La visión mareaba y finalmente solo veías esas corrientes de manos, ese universo de manos que avanzaban sin destino y sin tregua, como una estampida de pequeños animales, libres al fin de algún yugo ancestral.»'
  },
  intemperie: {
    title: 'Intemperie',
    status: 'published',
    type: 'Relatos · fantástico contemporáneo · humor negro',
    cover: 'assets/intemperie.webp',
    buyLinks: [{ label: 'Amazon', url: 'https://www.amazon.es/Intemperie-Agust%C3%ADn-Cort%C3%A9s/dp/B0DY72MFQ9' }],
    facts: [
      ['Forma', 'Libro de relatos'],
      ['Composición', '15 relatos'],
      ['Registro', 'Fantástico contemporáneo · horror cotidiano · humor negro'],
      ['Estado', 'Publicado']
    ],
    summary: 'Quince relatos en los que una alteración de la realidad deja a los personajes expuestos al cuerpo, la familia, el duelo, la responsabilidad, la enfermedad o la soledad.',
    details: [
      'Las anomalías cambian de un cuento a otro: adultos animalizados, presencias, intercambios imposibles, enfermedad, muertos que permanecen o familias obligadas a reorganizar sus reglas. Lo extraño no necesita una explicación completa para producir consecuencias concretas.',
      'El volumen se concentra en esas consecuencias. El fantástico retira una protección —una certeza, una identidad, una despedida— y obliga a actuar cuando ninguna respuesta elimina del todo el problema. De ahí la recurrencia del cuidado, la fragilidad y la responsabilidad.'
    ],
    quote: '«A veces, se cuenta cómo un animal atrapado en un cepo puede llegar a arrancarse la propia pata para escapar. A menudo se señala la desesperación como motor de ese comportamiento. Eso es una ingenuidad. Exige, en realidad, en la bestia atrapada, una gestión del propio dolor, una capacidad de cálculo dentro de una situación horrible y una determinación que te tendrían que preocupar, a poco sentido común que tuvieses, por si ese animal pusiera sus ojos en ti como presa. Hay gente que, por una compasión equivocada, intentará ayudar liberando al bicho, cuando la actitud correcta es la que tiene el cazador avezado: descerrajarle un tiro lo antes posible.»'
  },
  primavera: {
    title: 'El año que solo hubo primavera',
    status: 'published',
    type: 'Novela · presente especulativo · catástrofe',
    cover: 'assets/el-ano-que-solo-hubo-primavera.webp',
    buyLinks: [{ label: 'Amazon', url: 'https://www.amazon.es/a%C3%B1o-que-solo-hubo-primavera/dp/B0H6SBKBKV' }],
    facts: [
      ['Forma', 'Novela'],
      ['Ambientación', 'Alicante'],
      ['Registro', 'Tecnología · simulacro · intimidad · catástrofe'],
      ['Estado', 'Publicado']
    ],
    summary: 'Una primavera anómala, una empresa que fabrica intimidad y un hombre que intenta orientarse entre relaciones mediadas, simulacros afectivos y una ciudad cada vez más inestable.',
    details: [
      'Jorge entra en un entorno donde la soledad puede convertirse en servicio y la intimidad en producto. Psicoterapia, redes, deseo y tecnología confluyen en una Alicante sometida a un clima que deja de comportarse como debería.',
      'La novela no identifica de manera simple lo artificial con lo falso. Su conflicto aparece cuando una experiencia fabricada produce efectos afectivos reales y obliga a decidir qué valor tiene algo cuyo origen conocemos, pero cuyas consecuencias ya forman parte de la vida.'
    ],
    quote: '«Nadie parecía interesado por otra cosa que celebrar esta ociosa despreocupación. Solo de vez en cuando la gente recordaba el viento y una congoja trémula atravesaba un instante la euforia para luego desaparecer.»'
  },
  nadie: {
    title: 'Nadie nace sabiendo',
    status: 'unpublished',
    type: 'Novela inédita · fantasía humorística · duelo',
    cover: 'assets/nadie-nace-sabiendo.webp',
    buyLinks: [],
    facts: [
      ['Forma', 'Novela'],
      ['Estado', 'Aún no publicada'],
      ['Registro', 'Fantasía humorística · sobrenatural · duelo'],
      ['Universo', 'Muertos, zombis, vampiros y burocracias de lo imposible']
    ],
    summary: 'Sexta obra del catálogo y todavía inédita: una comedia sobrenatural sobre muertos que vuelven y personajes que descubren que ni siquiera la muerte resuelve el apego.',
    details: [
      'Lo metafísico se vuelve doméstico: zombis con rutinas, vampiros con opiniones, perros fieles y trámites para gestionar situaciones que deberían ser imposibles. El humor nace de tratar lo sobrenatural como un problema práctico.',
      'Bajo esa comicidad, la novela trabaja la pérdida, la renuncia y la persistencia de los vínculos. Sus personajes deben aprender qué significa seguir adelante cuando ni el cuerpo, ni la memoria, ni la propia muerte bastan para cerrar una relación.'
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
    dCover.alt = `Portada de ${data.title}`;
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
        dEditionImg.alt = `Datos de edición de ${data.title}: longitud de impresión, idioma, fecha de publicación, dimensiones e ISBN-13`;
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
      if (dPurchaseLabel) dPurchaseLabel.textContent = 'Disponibilidad';
      const status = document.createElement('p');
      status.className = 'dialog-availability';
      status.textContent = 'Aún no publicada';
      dBuyList.appendChild(status);
    } else if (links.length) {
      dPurchase.hidden = false;
      if (dPurchaseLabel) dPurchaseLabel.textContent = 'Dónde comprar';
      links.forEach((link, index) => {
        const a = document.createElement('a');
        a.className = `dialog-buy${link.label === 'Amazon' ? ' dialog-buy-amazon' : ''}${index > 0 ? ' dialog-buy-alt' : ''}`;
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.setAttribute('aria-label', `Comprar ${data.title} en ${link.label}`);
        a.innerHTML = `Comprar en ${link.label} <span>↗</span>`;
        dBuyList.appendChild(a);
      });
    } else {
      dPurchase.hidden = true;
      if (dPurchaseLabel) dPurchaseLabel.textContent = 'Dónde comprar';
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

let timer = setInterval(() => renderQuote(quoteIndex + 1), 10000);
document.querySelector('[data-quote-deck]')?.addEventListener('mouseenter', () => clearInterval(timer));

document.querySelectorAll('[data-jump-book]').forEach(link => {
  link.addEventListener('click', () => {
    const card = document.querySelector(`[data-book="${link.dataset.jumpBook}"]`);
    setTimeout(() => card?.scrollIntoView({ behavior:'smooth', block:'center' }), 40);
  });
});
