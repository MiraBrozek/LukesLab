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
     - Některé prohlížeče blokují autoplay, i když je video bez zvuku.
       Proto ho spustíme ještě jednou ze skriptu.
     - Pokud má návštěvník zapnuté „omezit animace“, video nespustíme
       a zůstane vidět jen statický obrázek (poster).
     - Tlačítko .hero__toggle video pozastaví / znovu spustí (WCAG 2.2.2).
     ------------------------------------------------------------------------ */

  function initHeroVideo() {
    var video = document.querySelector('.hero__video');
    var toggle = document.querySelector('.hero__toggle');
    if (!video) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function updateToggle() {
      if (!toggle) return;
      var paused = video.paused;
      toggle.classList.toggle('is-paused', paused);
      toggle.setAttribute('aria-label', paused ? 'Spustit video na pozadí' : 'Pozastavit video na pozadí');
    }

    // Jistota, že je video ztlumené (podmínka pro autoplay)
    video.muted = true;

    if (reduceMotion) {
      video.removeAttribute('autoplay');
      video.pause();
    } else {
      // play() vrací Promise – chybu (zablokovaný autoplay) tiše ignorujeme
      var playing = video.play();
      if (playing && playing.catch) playing.catch(function () {});
    }

    video.addEventListener('play', updateToggle);
    video.addEventListener('pause', updateToggle);
    updateToggle();

    if (toggle) {
      toggle.addEventListener('click', function () {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      });
    }
  }


  /* 3. Zvýraznění aktuální sekce v menu
     ------------------------------------------------------------------------
     Při posouvání stránky sledujeme, která sekce je právě vidět,
     a odpovídající odkaz v menu dostane třídu .is-active.
     ------------------------------------------------------------------------ */

  function initActiveNav() {
    var links = document.querySelectorAll('.nav__link[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    // Mapa: id sekce -> odkaz v menu
    var linkById = {};
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (section) {
        linkById[id] = link;
        sections.push(section);
      }
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) { link.classList.remove('is-active'); });
        linkById[entry.target.id].classList.add('is-active');
      });
    }, {
      // Sekce je „aktivní“, když protíná pás kousek pod hlavičkou
      rootMargin: '-30% 0px -60% 0px'
    });

    sections.forEach(function (section) { observer.observe(section); });
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

        // Skrýt / zobrazit fotky
        items.forEach(function (item) {
          var categories = item.getAttribute('data-category').split(' ');
          item.hidden = filter !== 'all' && categories.indexOf(filter) === -1;
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


  /* Spuštění – skript je vložený s atributem defer,
     takže HTML je v tuto chvíli už načtené. */
  initMobileMenu();
  initHeroVideo();
  initActiveNav();
  initGalleryFilter();
  initYear();
})();
