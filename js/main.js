/* ==========================================================================
   Lukeš Lab – společný skript pro všechny stránky
   --------------------------------------------------------------------------
   Každá funkce si nejdřív ověří, že na stránce existuje prvek, se kterým
   pracuje. Díky tomu může být tento soubor vložený na každé stránce.

   Obsah:
     1. Mobilní menu (hamburger)
     2. Video v hero sekci (autoplay, pauza, omezení animací)
     3. Zvýraznění aktuální sekce v menu
     4. Filtr galerie „Naše práce“
     5. Aktuální rok v patičce
     6. DOČASNÉ: přepínač barev
   ========================================================================== */

(function () {
  'use strict';


  /* 1. Mobilní menu
     ------------------------------------------------------------------------
     Tlačítko .burger otevírá a zavírá menu #nav. Menu se zavře také
     po kliknutí na odkaz, klávesou Escape nebo kliknutím mimo hlavičku.
     ------------------------------------------------------------------------ */

  function initMobileMenu() {
    var burger = document.querySelector('.burger');
    var nav = document.getElementById('nav');
    if (!burger || !nav) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
    }

    burger.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });

    // Klik na odkaz v menu = přechod na sekci, menu zavřeme
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    // Escape zavře menu a vrátí focus na hamburger
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        burger.focus();
      }
    });

    // Klik kamkoli mimo hlavičku menu zavře
    document.addEventListener('click', function (event) {
      if (!event.target.closest('.header')) setOpen(false);
    });
  }


  /* 2. Video v hero sekci
     ------------------------------------------------------------------------
     - Některé prohlížeče (např. Brave) blokují autoplay, i když je video
       bez zvuku. Proto ho spustíme ze skriptu, a když to prohlížeč
       odmítne, zkusíme to znovu při první akci návštěvníka (klik,
       posun stránky, klávesa).
     - Tlačítko .hero__toggle video pozastaví / znovu spustí (WCAG 2.2.2).
       Když ho návštěvník sám pozastaví, už ho automaticky nespouštíme.
     ------------------------------------------------------------------------ */

  function initHeroVideo() {
    var video = document.querySelector('.hero__video');
    var toggle = document.querySelector('.hero__toggle');
    if (!video) return;

    var pausedByUser = false;
    var retryEvents = ['pointerdown', 'touchstart', 'keydown', 'scroll'];

    function updateToggle() {
      if (!toggle) return;
      var paused = video.paused;
      toggle.classList.toggle('is-paused', paused);
      toggle.setAttribute('aria-label', paused ? 'Spustit video na pozadí' : 'Pozastavit video na pozadí');
    }

    // Pokus o spuštění; play() vrací Promise, která selže při zablokování
    function tryPlay() {
      if (pausedByUser || !video.paused) return;
      var playing = video.play();
      if (playing && playing.catch) {
        playing.catch(function () {
          // Zablokováno → počkáme na první akci návštěvníka
          retryEvents.forEach(function (name) {
            window.addEventListener(name, retryOnce, { once: true, passive: true });
          });
        });
      }
    }

    function retryOnce() {
      retryEvents.forEach(function (name) {
        window.removeEventListener(name, retryOnce);
      });
      tryPlay();
    }

    // Ztlumení je podmínka pro autoplay – nastavíme i ze skriptu pro jistotu
    video.muted = true;
    video.defaultMuted = true;

    video.addEventListener('play', updateToggle);
    video.addEventListener('pause', updateToggle);
    updateToggle();
    tryPlay();

    if (toggle) {
      toggle.addEventListener('click', function () {
        if (video.paused) {
          pausedByUser = false;
          tryPlay();
        } else {
          pausedByUser = true;
          video.pause();
        }
      });
    }
  }


  /* 3. Zvýraznění aktuální sekce v menu
     ------------------------------------------------------------------------
     Při posouvání stránky hledáme poslední sekci, jejíž začátek už minul
     pomyslnou čáru ve 30 % výšky okna. Odpovídající odkaz v menu dostane
     třídu .is-active. Na úplném konci stránky se zvýrazní poslední odkaz
     (Kontakt), protože patička k čáře nikdy nedojede.
     Po kliknutí na odkaz v menu se kliknutá položka označí hned a během
     plynulého posunu ji výpočet nepřepíše – jinak by se u nízké sekce
     (Ceník) mohla označit sousední sekce.
     ------------------------------------------------------------------------ */

  function initActiveNav() {
    var links = document.querySelectorAll('.nav__link[href^="#"]');
    if (!links.length) return;

    // Dvojice sekce + odkaz v menu (v pořadí, v jakém jsou v menu)
    var items = [];
    links.forEach(function (link) {
      var section = document.getElementById(link.getAttribute('href').slice(1));
      if (section) items.push({ section: section, link: link });
    });
    if (!items.length) return;

    // Po kliknutí v menu: true, dokud posun ke kotvě neskončí
    var clickLock = false;
    var unlockTimer;

    function setActive(current) {
      items.forEach(function (item) {
        item.link.classList.toggle('is-active', item === current);
      });
    }

    function update() {
      if (clickLock) return;
      var line = window.innerHeight * 0.3;
      var current = null;

      items.forEach(function (item) {
        if (item.section.getBoundingClientRect().top <= line) current = item;
      });

      // Dole na stránce – zvýraznit poslední položku
      var atBottom = window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) current = items[items.length - 1];

      setActive(current);
    }

    function unlock() {
      clickLock = false;
      clearTimeout(unlockTimer);
    }

    // Kliknutí v menu – označit hned a zamknout přepočet do konce posunu.
    // Událost scrollend znají novější prohlížeče, časovač je pojistka.
    items.forEach(function (item) {
      item.link.addEventListener('click', function () {
        setActive(item);
        clickLock = true;
        clearTimeout(unlockTimer);
        unlockTimer = setTimeout(unlock, 1500);
      });
    });
    window.addEventListener('scrollend', unlock);

    // Výpočet je nenáročný (pár sekcí), stačí ho spustit při každém posunu
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }


  /* 4. Filtr galerie
     ------------------------------------------------------------------------
     Tlačítka mají data-filter="zirkon" apod., fotky data-category
     s jednou nebo více kategoriemi oddělenými mezerou
     (např. data-category="implantaty titan"). „all“ zobrazí vše.
     ------------------------------------------------------------------------ */

  function initGalleryFilter() {
    var buttons = document.querySelectorAll('.filter__btn');
    var items = document.querySelectorAll('.gallery__item');
    if (!buttons.length || !items.length) return;

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var filter = button.getAttribute('data-filter');

        // Stav tlačítek (aria-pressed čtou i čtečky obrazovky)
        buttons.forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === button));
        });

        // Skrýt / zobrazit fotky; zobrazené krátce „naskočí“ (CSS .is-entering)
        items.forEach(function (item) {
          var categories = item.getAttribute('data-category').split(' ');
          item.hidden = filter !== 'all' && categories.indexOf(filter) === -1;

          if (!item.hidden) {
            item.classList.remove('is-entering');
            void item.offsetWidth; // restart animace
            item.classList.add('is-entering');
          }
        });
      });
    });
  }


  /* 5. Aktuální rok v patičce (© 2026 …)
     ------------------------------------------------------------------------ */

  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }


  /* 6. DOČASNÉ: přepínač barev
     ------------------------------------------------------------------------
     Kolečka v liště .theme-bar nastaví atribut data-accent na <html>
     (barvy jsou definované v css/style.css). Volba se pamatuje
     v prohlížeči (localStorage). Po výběru finální barvy smazat.
     ------------------------------------------------------------------------ */

  function initThemeSwitcher() {
    var swatches = document.querySelectorAll('.swatch');
    var nameEl = document.querySelector('.theme-bar__name');
    if (!swatches.length) return;

    var root = document.documentElement;

    function select(accent) {
      // „petrol“ je výchozí barva v :root, nepotřebuje atribut
      if (accent === 'petrol') {
        root.removeAttribute('data-accent');
      } else {
        root.setAttribute('data-accent', accent);
      }

      swatches.forEach(function (swatch) {
        var active = swatch.getAttribute('data-accent-choice') === accent;
        swatch.setAttribute('aria-pressed', String(active));
        if (active && nameEl) nameEl.textContent = swatch.title;
      });

      try { localStorage.setItem('accent', accent); } catch (e) {}
    }

    swatches.forEach(function (swatch) {
      swatch.addEventListener('click', function () {
        select(swatch.getAttribute('data-accent-choice'));
      });
    });

    select(root.getAttribute('data-accent') || 'petrol');
  }


  /* Spuštění – skript je vložený s atributem defer,
     takže HTML je v tuto chvíli už načtené. */
  initMobileMenu();
  initHeroVideo();
  initActiveNav();
  initGalleryFilter();
  initYear();
  initThemeSwitcher();
})();
