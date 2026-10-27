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
    }, options || {
      // threshold 0 = stačí, aby byl vidět kousek prvku. Vyšší hodnota
      // by u vysokých prvků (formulář na mobilu) čekala, až je vidět
      // velká část – po skoku na kotvu by prvek zůstal neviditelný.
      threshold: 0,
      rootMargin: '0px 0px -8% 0px'
    });

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
    '.why__intro',
    '.why__item',
    '.pricing',
    '.step',
    '.modelling__media',
    '.modelling__steps',
    '.tech__text',
    '.tech__photo',
    '.carousel',
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
     Když je sekce poprvé vidět, kroky 01–06 se JEDNOU postupně zvýrazní
     (.is-active + běžící čára, třída .is-playing) a na 6. kroku se
     procházení zastaví. Znovu se spustí až po obnovení stránky.
     Najetí myší, kliknutí nebo Tab krok jen zvýrazní – čára je hned celá.
     Pokud k tomu dojde během procházení, procházení skončí.
     ------------------------------------------------------------------------ */

  var TOUR_STEP_MS = 2400; // jak dlouho svítí jeden krok (musí sedět s CSS --tour-step)

  function initModellingTour() {
    var list = document.querySelector('.modelling__steps');
    if (!list) return;

    var steps = Array.prototype.slice.call(list.children);
    var current = -1;
    var timer = null;
    var userTookOver = false; // návštěvník už vybral krok sám → žádné další procházení

    list.style.setProperty('--tour-step', TOUR_STEP_MS + 'ms');

    function activate(index) {
      current = index;
      steps.forEach(function (step, i) {
        step.classList.toggle('is-active', i === index);
      });
    }

    function next() {
      // Po posledním kroku konec – 6. krok zůstane zvýrazněný
      if (current >= steps.length - 1) {
        stop();
        return;
      }
      activate(current + 1);
    }

    function play() {
      if (reduceMotion || timer || userTookOver) return;
      list.classList.add('is-playing');
      next();
      timer = setInterval(next, TOUR_STEP_MS);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
      list.classList.remove('is-playing');
    }

    // Ruční výběr kroku: zastaví procházení a krok jen zvýrazní
    function select(index) {
      userTookOver = true;
      stop();
      activate(index);
    }

    // Myš, dotyk i klávesnice (Tab)
    steps.forEach(function (step, i) {
      step.tabIndex = 0;
      step.addEventListener('mouseenter', function () { select(i); });
      step.addEventListener('focus', function () { select(i); });
      step.addEventListener('click', function () { select(i); });
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


  /* 6. Lightbox – zvětšená fotka
     ------------------------------------------------------------------------
     Kliknutí (nebo Enter) na fotku otevře <dialog class="lightbox">.
     Fotky jsou ve skupinách podle sekce (LIGHTBOX_GROUPS); šipky (na
     obrazovce i na klávesnici) přepínají jen v rámci skupiny – v galerii
     jen mezi fotkami, které jsou právě vidět podle filtru.
     Esc nebo klik vedle fotky zavře.
     ------------------------------------------------------------------------ */

  var LIGHTBOX_GROUPS = [
    '.gallery__item',          // Naše práce
    '.card__img',              // Služby
    '.modelling__media img',   // Digitální modelování
    '.tech__photo'             // Technologie
  ];

  // Prvek, na který se kliká, může být <figure> s fotkou, nebo rovnou <img>
  function lightboxImage(item) {
    return item.tagName === 'IMG' ? item : item.querySelector('img');
  }

  // Popisek: figcaption fotky, u karet služeb nadpis karty, jinak alt
  function lightboxCaption(item) {
    var figcaption = item.querySelector('figcaption');
    if (figcaption) return figcaption.textContent;
    var card = item.closest('.card');
    if (card) return card.querySelector('h3').textContent;
    return lightboxImage(item).alt;
  }

  function initLightbox() {
    var dialog = document.querySelector('.lightbox');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    var img = dialog.querySelector('.lightbox__img');
    var caption = dialog.querySelector('.lightbox__caption');
    var visible = [];
    var current = 0;

    function show(index) {
      current = (index + visible.length) % visible.length;
      var source = lightboxImage(visible[current]);

      img.src = source.currentSrc || source.src;
      img.alt = source.alt;
      caption.textContent = lightboxCaption(visible[current]);

      // Restart animace prolnutí
      img.classList.remove('is-changing');
      void img.offsetWidth;
      img.classList.add('is-changing');
    }

    function open(items, item) {
      visible = items.filter(function (i) { return !i.hidden; });
      dialog.classList.toggle('is-single', visible.length < 2);
      dialog.showModal();
      show(visible.indexOf(item));
    }

    LIGHTBOX_GROUPS.forEach(function (selector) {
      var items = Array.prototype.slice.call(document.querySelectorAll(selector));

      items.forEach(function (item) {
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', 'Zvětšit fotku: ' + lightboxCaption(item));

        item.addEventListener('click', function () { open(items, item); });
        item.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open(items, item);
          }
        });
      });
    });

    dialog.querySelector('.lightbox__close').addEventListener('click', function () { dialog.close(); });
    dialog.querySelector('.lightbox__prev').addEventListener('click', function () { show(current - 1); });
    dialog.querySelector('.lightbox__next').addEventListener('click', function () { show(current + 1); });

    dialog.addEventListener('keydown', function (event) {
      if (visible.length < 2) return;
      if (event.key === 'ArrowLeft') show(current - 1);
      if (event.key === 'ArrowRight') show(current + 1);
    });

    // Klik na tmavé pozadí (mimo fotku a tlačítka) zavře
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
  }


  /* 6b. 3D karusel „Naše práce“ (kolotoč)
     ------------------------------------------------------------------------
     Fotky stojí na elipse kolem středu. Přední je největší, čím dál dozadu,
     tím menší, průhlednější a víc schovaná za ostatními – vzniká dojem
     kruhu, který se otáčí. Poloha se přepočítává v každém snímku animace,
     takže fotky jedou po elipse, ne napřímo.
     - sám se otočí o jednu fotku každých AUTOPLAY_MS, když na něm není myš
       a není otevřená zvětšená fotka,
     - šipky, tah prstem nebo klik na boční fotku ho otočí ručně – pak už se
       sám neotáčí (návštěvník si prohlíží vlastním tempem),
     - klik na přední fotku ji zvětší (lightbox výše).
     ------------------------------------------------------------------------ */

  var AUTOPLAY_MS = 3500;

  function initCarousel() {
    var carousel = document.querySelector('.carousel');
    if (!carousel) return;

    var stage = carousel.querySelector('.gallery');
    var items = Array.prototype.slice.call(stage.querySelectorAll('.gallery__item'));
    var count = items.length;
    if (count < 2) return;

    var current = 0;         // kde kruh právě je (plynule, i desetinné číslo)
    var target = 0;          // kam se má dotočit (celé číslo, může jít i do minusu)
    var radiusX = 0;
    var animating = false;
    var timer = null;
    var userTookOver = false;
    var hovering = false;

    function activeIndex() {
      return ((Math.round(target) % count) + count) % count;
    }

    // Šířka elipsy podle šířky scény a fotky (na mobilu boční fotky jen vykukují)
    function measure() {
      var cardWidth = items[0].offsetWidth;
      radiusX = Math.max(80, Math.min(420, stage.clientWidth / 2 - cardWidth * 0.3));
    }

    function draw() {
      var active = activeIndex();
      items.forEach(function (item, i) {
        var theta = (i - current) / count * Math.PI * 2;
        var depth = Math.cos(theta);              // 1 = vepředu, -1 = úplně vzadu
        var front = (depth + 1) / 2;              // 1 … 0
        var x = Math.sin(theta) * radiusX * (0.5 + 0.5 * front); // vzdálenější blíž ke středu (perspektiva)
        var y = (1 - front) * -70;                // zadní fotky výš – jako pohled na kruh trochu shora
        var scale = 0.42 + 0.58 * front;
        var tilt = Math.sin(theta) * 32;          // boční fotky natočené po obvodu kruhu

        item.style.transform = 'translateX(' + x.toFixed(1) + 'px) translateY(' + y.toFixed(1) + 'px) ' +
          'scale(' + scale.toFixed(3) + ') rotateY(' + tilt.toFixed(1) + 'deg)';
        // Přední a boční fotky plné (nic přes ně neprosvítá), zadní slábnou
        item.style.opacity = front > 0.7 ? 1 : (0.3 + 0.7 * front / 0.7).toFixed(3);
        item.style.zIndex = Math.round(front * 100);
        item.classList.toggle('is-active', i === active);
        item.tabIndex = i === active ? 0 : -1;   // Tabem jen na přední fotku
      });
    }

    // Plynulé dotáčení: každý snímek ujede kus zbývající vzdálenosti
    function animate() {
      var distance = target - current;
      if (Math.abs(distance) < 0.002 || reduceMotion) {
        current = target;
        draw();
        animating = false;
        return;
      }
      current += distance * 0.09;
      draw();
      requestAnimationFrame(animate);
    }

    function turn(steps) {
      target += steps;
      if (!animating) {
        animating = true;
        requestAnimationFrame(animate);
      }
    }

    function takeOver() {
      userTookOver = true;
      clearInterval(timer);
      timer = null;
    }

    function play() {
      if (reduceMotion || timer || userTookOver) return;
      timer = setInterval(function () {
        var lightbox = document.querySelector('.lightbox');
        if (hovering || document.hidden || (lightbox && lightbox.open)) return;
        turn(1);
      }, AUTOPLAY_MS);
    }

    carousel.querySelector('.carousel__btn--prev').addEventListener('click', function () { takeOver(); turn(-1); });
    carousel.querySelector('.carousel__btn--next').addEventListener('click', function () { takeOver(); turn(1); });

    stage.addEventListener('mouseenter', function () { hovering = true; });
    stage.addEventListener('mouseleave', function () { hovering = false; });

    // Tah prstem (nebo myší) doleva / doprava
    var startX = null;
    var swiped = false;
    stage.addEventListener('pointerdown', function (event) {
      startX = event.clientX;
      swiped = false;
    });
    stage.addEventListener('pointerup', function (event) {
      if (startX === null) return;
      var distance = event.clientX - startX;
      startX = null;
      if (Math.abs(distance) < 40) return;
      swiped = true;
      takeOver();
      turn(distance < 0 ? 1 : -1);
    });

    // Klik na boční fotku kruh natočí k ní (a fotku nezvětší). Zachytává se
    // už cestou dolů (capture), dřív než klik dostane lightbox.
    stage.addEventListener('click', function (event) {
      var item = event.target.closest('.gallery__item');
      if (!item) return;
      if (swiped) {
        event.stopPropagation();
        swiped = false;
        return;
      }
      var diff = items.indexOf(item) - activeIndex();
      if (diff === 0) return;
      event.stopPropagation();
      // Kratší cestou (např. o 2 doleva místo o 5 doprava)
      if (diff > count / 2) diff -= count;
      if (diff < -count / 2) diff += count;
      takeOver();
      turn(diff);
    }, true);

    window.addEventListener('resize', function () {
      measure();
      draw();
    });

    measure();
    draw();
    whenVisible([carousel], play);
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
  initCarousel();
  initBackToTop();
})();
