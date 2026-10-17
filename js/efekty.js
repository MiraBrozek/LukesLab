/* ==========================================================================
   Lukeš Lab – animace a interaktivní prvky
   --------------------------------------------------------------------------
   Vše tady je „navíc“: když se skript nenačte, web funguje dál, jen bez
   efektů.

   OMEZENÍ ANIMACÍ: návštěvník si může v systému zapnout „omezit animace“
   (ve Windows = vypnuté „Efekty animací“). Zda to web respektuje, určuje
   přepínač RESPEKTOVAT_OMEZENI_ANIMACI níže:
     false – animace běží vždy (výchozí; splňuje WCAG 2.1 AA)
     true  – při zapnutém omezení se efekty vypnou a obsah se rovnou
             zobrazí v konečném stavu (přísnější WCAG AAA)

   Obsah:
     1. Stín hlavičky po odjetí stránky
     2. Plynulé vyjíždění obsahu při posouvání
     3. Počítání čísel (hero, pás statistik)
     4. Ubíhající pás „Pracujeme s“
     5. Procházení kroků digitálního modelování
     6. Zvětšení fotky z galerie (lightbox)
     7. Tlačítko „nahoru“
   ========================================================================== */

(function () {
  'use strict';

  var RESPEKTOVAT_OMEZENI_ANIMACI = false;

  var reduceMotion = RESPEKTOVAT_OMEZENI_ANIMACI &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasObserver = 'IntersectionObserver' in window;

  // Třída pro CSS (sekce 20 – vypne přechody a animace)
  if (reduceMotion) document.documentElement.classList.add('reduce-motion');


  /* Pomocná funkce: zavolá callback, jakmile je prvek poprvé vidět.
     ------------------------------------------------------------------------ */

  function whenVisible(elements, callback, options) {
    if (!hasObserver) {
      elements.forEach(callback);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        callback(entry.target);
      });
    }, options || { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    elements.forEach(function (el) { observer.observe(el); });
  }


  /* 1. Stín hlavičky
     ------------------------------------------------------------------------
     Po odjetí stránky dolů dostane hlavička jemný stín (.is-scrolled).
     ------------------------------------------------------------------------ */

  function initHeaderShadow() {
    var header = document.querySelector('.header');
    if (!header) return;

    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }


  /* 2. Vyjíždění obsahu při posouvání
     ------------------------------------------------------------------------
     Prvky z REVEAL_SELECTORS dostanou třídu .reveal (v CSS: průhledné,
     trochu posunuté dolů). Jakmile se objeví na obrazovce, přidá se
     .is-visible a prvek plynule „vyjede“ na své místo.
     Sourozenci (např. karty v mřížce) jedou postupně – každý o kousek
     později (proměnná --reveal-delay).
     ------------------------------------------------------------------------ */

  var REVEAL_SELECTORS = [
    '.section-head',
    '.stats__item',
    '.card',
    '.pricing',
    '.step',
    '.modelling__media',
    '.modelling__steps',
    '.tech__text',
    '.tech__photo',
    '.gallery__item',
    '.about__photo',
    '.about__text',
    '.order__intro',
    '.form'
  ];

  function initReveal() {
    if (reduceMotion || !hasObserver) return;

    var elements = document.querySelectorAll(REVEAL_SELECTORS.join(','));

    elements.forEach(function (el) {
      // Pořadí mezi sourozenci, kteří se taky animují (max. 6 kroků zpoždění)
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (child) {
        return child.matches(REVEAL_SELECTORS.join(','));
      });
      var index = siblings.indexOf(el) % 6;

      el.style.setProperty('--reveal-delay', (index * 90) + 'ms');
      el.classList.add('reveal');
    });

    whenVisible(Array.prototype.slice.call(elements), function (el) {
      el.classList.add('is-visible');
    });
  }


  /* 3. Počítání čísel
     ------------------------------------------------------------------------
     Prvek s data-count="98" se při zobrazení „napočítá“ od 0 do 98.
     data-suffix se připojí za číslo (např. " %", "+", " os").
     V HTML je vždy rovnou konečný text – bez JavaScriptu se zobrazí ten.
     ------------------------------------------------------------------------ */

  var COUNT_DURATION = 1600; // délka počítání v ms

  function formatNumber(n) {
    // Česky: mezera mezi tisíci (5 000)
    return n.toLocaleString('cs-CZ');
  }

  function countUp(el) {
    var target = Number(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var start = null;

    function frame(time) {
      if (start === null) start = time;
      var progress = Math.min((time - start) / COUNT_DURATION, 1);
      // Zpomalení ke konci (ease-out), ať číslo „dobrzdí“
      var eased = 1 - Math.pow(1 - progress, 3);

      el.textContent = formatNumber(Math.round(target * eased)) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  function initCountUp() {
    if (reduceMotion) return;

    var elements = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
    if (!elements.length) return;

    // Před začátkem počítání ukážeme nulu
    elements.forEach(function (el) {
      el.textContent = '0' + (el.getAttribute('data-suffix') || '');
    });

    whenVisible(elements, function (el) {
      // Čísla v hero počkají, až dojede úvodní animace textu
      var delay = el.closest('.hero') ? 900 : 150;
      setTimeout(function () { countUp(el); }, delay);
    }, { threshold: 0.6 });
  }


  /* 4. Ubíhající pás „Pracujeme s“
     ------------------------------------------------------------------------
     Položky se zdvojí (kopie je pro čtečky skrytá) a celý pás se v CSS
     posouvá doleva o polovinu své šířky – kopie tak plynule navazuje.
     Zastaví se najetím myši (CSS) nebo kliknutím / ťuknutím (WCAG 2.2.2).
     ------------------------------------------------------------------------ */

  function initMarquee() {
    var track = document.querySelector('.strip__track');
    if (!track || reduceMotion) return;

    Array.prototype.slice.call(track.children).forEach(function (item) {
      var copy = item.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    });

    track.classList.add('is-marquee');

    var strip = track.closest('.strip');
    strip.addEventListener('click', function () {
      strip.classList.toggle('is-paused');
    });
  }


  /* 5. Kroky digitálního modelování
     ------------------------------------------------------------------------
     Když je sekce vidět, kroky 01–06 se samy postupně zvýrazňují
     (.is-active, v CSS s ukazatelem průběhu). Najetí myší nebo kliknutí
     vybere krok ručně a automatické procházení se zastaví; po odjetí
     myši ze seznamu pokračuje.
     ------------------------------------------------------------------------ */

  var TOUR_STEP_MS = 3200; // jak dlouho svítí jeden krok (musí sedět s CSS --tour-step)

  function initModellingTour() {
    var list = document.querySelector('.modelling__steps');
    if (!list) return;

    var steps = Array.prototype.slice.call(list.children);
    var current = -1;
    var timer = null;

    list.style.setProperty('--tour-step', TOUR_STEP_MS + 'ms');

    function activate(index) {
      current = index;
      steps.forEach(function (step, i) {
        step.classList.toggle('is-active', i === index);
      });
    }

    function next() {
      activate((current + 1) % steps.length);
    }

    function play() {
      if (reduceMotion || timer) return;
      list.classList.add('is-playing');
      next();
      timer = setInterval(next, TOUR_STEP_MS);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
      list.classList.remove('is-playing');
    }

    // Ruční výběr: myš, dotyk i klávesnice (Tab + Enter)
    steps.forEach(function (step, i) {
      step.tabIndex = 0;
      step.addEventListener('mouseenter', function () { stop(); activate(i); });
      step.addEventListener('focus', function () { stop(); activate(i); });
      step.addEventListener('click', function () { stop(); activate(i); });
    });

    list.addEventListener('mouseleave', function () {
      if (timer) return;
      // Pokračujeme od vybraného kroku (play() hned posune o jeden dál)
      current = current - 1;
      play();
    });

    // Výchozí stav: zvýrazněný krok „Náhled ke schválení“
    activate(4);

    if (!reduceMotion) {
      whenVisible([list], function () {
        current = -1;
        play();
      }, { threshold: 0.4 });
    }
  }


  /* 6. Lightbox – zvětšená fotka z galerie
     ------------------------------------------------------------------------
     Kliknutí (nebo Enter) na fotku otevře <dialog class="lightbox">.
     Šipky (na obrazovce i na klávesnici) přepínají mezi fotkami, které
     jsou právě vidět podle filtru. Esc nebo klik vedle fotky zavře.
     ------------------------------------------------------------------------ */

  function initLightbox() {
    var dialog = document.querySelector('.lightbox');
    var items = Array.prototype.slice.call(document.querySelectorAll('.gallery__item'));
    if (!dialog || !items.length || typeof dialog.showModal !== 'function') return;

    var img = dialog.querySelector('.lightbox__img');
    var caption = dialog.querySelector('.lightbox__caption');
    var visible = [];
    var current = 0;

    function show(index) {
      current = (index + visible.length) % visible.length;
      var source = visible[current].querySelector('img');

      img.src = source.currentSrc || source.src;
      img.alt = source.alt;
      caption.textContent = visible[current].querySelector('figcaption').textContent;

      // Restart animace prolnutí
      img.classList.remove('is-changing');
      void img.offsetWidth;
      img.classList.add('is-changing');
    }

    function open(item) {
      visible = items.filter(function (i) { return !i.hidden; });
      dialog.showModal();
      show(visible.indexOf(item));
    }

    items.forEach(function (item) {
      var label = item.querySelector('figcaption').textContent;
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', 'Zvětšit fotku: ' + label);

      item.addEventListener('click', function () { open(item); });
      item.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(item);
        }
      });
    });

    dialog.querySelector('.lightbox__close').addEventListener('click', function () { dialog.close(); });
    dialog.querySelector('.lightbox__prev').addEventListener('click', function () { show(current - 1); });
    dialog.querySelector('.lightbox__next').addEventListener('click', function () { show(current + 1); });

    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') show(current - 1);
      if (event.key === 'ArrowRight') show(current + 1);
    });

    // Klik na tmavé pozadí (mimo fotku a tlačítka) zavře
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
  }


  /* 7. Tlačítko „nahoru“
     ------------------------------------------------------------------------ */

  function initBackToTop() {
    var button = document.querySelector('.to-top');
    if (!button) return;

    function update() {
      button.classList.toggle('is-visible', window.scrollY > window.innerHeight);
    }

    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    window.addEventListener('scroll', update, { passive: true });
    update();
  }


  /* Spuštění */
  initHeaderShadow();
  initReveal();
  initCountUp();
  initMarquee();
  initModellingTour();
  initLightbox();
  initBackToTop();
})();
