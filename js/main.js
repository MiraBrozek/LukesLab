/* ==========================================================================
   Lukeš Lab – společný skript pro všechny stránky
   --------------------------------------------------------------------------
   Každá funkce si nejdřív ověří, že na stránce existuje prvek, se kterým
   pracuje. Díky tomu může být tento soubor vložený na každé stránce.

   Obsah:
     1. Mobilní menu (hamburger)
     2. Video v hero sekci (autoplay, pauza, omezení animací)
     3. Zvýraznění aktuální sekce v menu
     4. Aktuální rok v patičce
     5. DOČASNÉ: přepínač barev
     6. Stažení ceníku po zadání hesla
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


  /* 4. Aktuální rok v patičce (© 2026 …)
     ------------------------------------------------------------------------ */

  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }


  /* 5. DOČASNÉ: přepínač barev
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


  /* 6. Stažení ceníku po zadání hesla
     ------------------------------------------------------------------------
     Web nemá server, proto je ceník ve složce cenik/ zašifrovaný. Klíč k němu
     je v klice.json uložený zvlášť pro každé heslo, samotná hesla na webu
     nejsou. Soubory vytváří skript _doc/Cenik/zasifrovat-cenik.js.
     ------------------------------------------------------------------------ */

  function initCenik() {
    var dialog = document.getElementById('cenik-heslo');
    var openBtn = document.querySelector('[data-cenik-open]');
    if (!dialog || !openBtn || typeof dialog.showModal !== 'function') return;

    var form = dialog.querySelector('form');
    var input = form.elements.heslo;
    var submit = form.querySelector('[type="submit"]');
    var error = form.querySelector('.cenik-dialog__error');
    var openLink = form.querySelector('[data-cenik-link]');
    var isTouch = window.matchMedia('(pointer: coarse)').matches;

    function showError(text) {
      error.textContent = text;
      error.hidden = !text;
    }

    // Stejná úprava jako při šifrování – nezáleží na velikosti písmen a háčcích
    function normalize(heslo) {
      return heslo.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function bytes(base64) {
      return Uint8Array.from(atob(base64), function (char) { return char.charCodeAt(0); });
    }

    function load(path, type) {
      return fetch(path, { cache: 'no-cache' }).then(function (response) {
        if (!response.ok) throw new Error('Soubor nenalezen: ' + path);
        return response[type]();
      });
    }

    // Vrátí klíč k ceníku; špatné heslo skončí chybou OperationError
    function unlockKey(heslo, data) {
      var subtle = crypto.subtle;
      return subtle.importKey('raw', new TextEncoder().encode(heslo), 'PBKDF2', false, ['deriveKey'])
        .then(function (base) {
          return subtle.deriveKey(
            { name: 'PBKDF2', hash: 'SHA-256', salt: bytes(data.salt), iterations: data.iterace },
            base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
          );
        })
        .then(function (key) {
          return data.klice.reduce(function (found, item) {
            return found.catch(function () {
              return subtle.decrypt({ name: 'AES-GCM', iv: bytes(item.iv) }, key, bytes(item.data));
            });
          }, Promise.reject(new Error('Žádný klíč')));
        });
    }

    function decryptFile(rawKey, file) {
      return crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt'])
        .then(function (key) {
          return crypto.subtle.decrypt({ name: 'AES-GCM', iv: file.slice(0, 12) }, key, file.slice(12));
        });
    }

    // Telefon: PDF v nové záložce, odkud ho lze prohlédnout i uložit. Když
    // prohlížeč záložku zablokuje, nabídne se tlačítko – klepnutí už projde.
    function openInTab(pdf) {
      var url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
      if (window.open(url, '_blank')) {
        dialog.close();
        return;
      }
      openLink.href = url;
      openLink.hidden = false;
      submit.hidden = true;
    }

    function download(pdf) {
      var url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
      var link = document.createElement('a');
      link.href = url;
      link.download = 'Cenik-Petr-Lukes.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    }

    openBtn.addEventListener('click', function () {
      form.reset();
      showError('');
      openLink.hidden = true;
      submit.hidden = false;
      dialog.showModal();
    });

    openLink.addEventListener('click', function () { dialog.close(); });

    dialog.querySelector('.cenik-dialog__close').addEventListener('click', function () { dialog.close(); });

    // Kliknutí na ztmavené pozadí mimo okno
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var heslo = normalize(input.value);
      if (!heslo) {
        showError('Zadejte heslo.');
        input.focus();
        return;
      }

      showError('');
      submit.disabled = true;

      load('cenik/klice.json', 'json')
        .then(function (data) { return unlockKey(heslo, data); })
        .then(function (rawKey) {
          return load('cenik/cenik.bin', 'arrayBuffer').then(function (file) {
            return decryptFile(rawKey, file);
          });
        })
        .then(function (pdf) {
          if (isTouch) {
            openInTab(pdf);
          } else {
            download(pdf);
            dialog.close();
          }
        })
        .catch(function (err) {
          showError(err && err.name === 'OperationError'
            ? 'Heslo nesouhlasí.'
            : 'Ceník se nepodařilo načíst. Zkuste to znovu.');
          input.focus();
        })
        .then(function () {
          submit.disabled = false;
        });
    });
  }


  /* Spuštění – skript je vložený s atributem defer,
     takže HTML je v tuto chvíli už načtené. */
  initMobileMenu();
  initHeroVideo();
  initActiveNav();
  initYear();
  initThemeSwitcher();
  initCenik();
})();
