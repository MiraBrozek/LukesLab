/* ==========================================================================
   Lukeš Lab – formulář „Poslat zakázku“ (sekce #zakazka na index.html)
   a žádost o heslo k ceníku
   --------------------------------------------------------------------------
   Web je čistě statický (bez PHP), proto formulář odesílá data přes službu
   Web3Forms (https://web3forms.com). Ta je přepošle e-mailem laboratoři.

   JAK FORMULÁŘ NAPOJIT:
     1. Na https://web3forms.com zadejte e-mail laboratoře
        → přijde „Access Key“ (dlouhý kód).
     2. Vložte ho níže do WEB3FORMS_KEY.
     3. Hotovo. Dokud je klíč prázdný, formulář běží v ukázkovém režimu:
        projde celý postup, ale nic neodešle.

   Co skript dělá:
     1. Přepíná mezi variantou „STL“ a „Svoz otisku“
     2. Kontroluje povinná pole a ukazuje chyby
     3. Vygeneruje číslo zakázky (např. LL-261017-4821)
     4. Odešle data a zobrazí potvrzení
     5. Odešle žádost o heslo k ceníku
   ========================================================================== */

(function () {
  'use strict';

  /* ---- Nastavení --------------------------------------------------------- */

  // Access Key z web3forms.com (prázdný = ukázkový režim)
  var WEB3FORMS_KEY = '';

  var WEB3FORMS_URL = 'https://api.web3forms.com/submit';


  /* ---- Prvky na stránce -------------------------------------------------- */

  var form = document.getElementById('order-form');
  if (!form) return;

  var section = document.getElementById('zakazka');
  var orderBox = document.getElementById('order');
  var sentBox = document.getElementById('sent');
  var boxStl = document.getElementById('box-stl');
  var boxPickup = document.getElementById('box-pickup');
  var errorBox = document.getElementById('form-error');
  var fieldError = document.getElementById('field-error');
  var submitBtn = document.getElementById('submit-btn');


  /* 1. Přepínání STL / Svoz otisku
     ------------------------------------------------------------------------
     Pole ve skryté variantě dostanou atribut disabled. Díky tomu
     se neodesílají a prohlížeč je nekontroluje jako povinná.
     ------------------------------------------------------------------------ */

  function setFieldsEnabled(container, enabled) {
    container.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.disabled = !enabled;
      // Adresa je povinná jen u svozu
      if (field.hasAttribute('data-required-for-pickup')) {
        field.required = enabled;
      }
    });
  }

  function updateDeliveryMode() {
    var pickup = form.elements['Způsob předání'].value === 'Svoz otisku';

    boxStl.hidden = pickup;
    boxPickup.hidden = !pickup;
    fieldError.hidden = true;
    setFieldsEnabled(boxStl, !pickup);
    setFieldsEnabled(boxPickup, pickup);
  }

  form.querySelectorAll('input[name="Způsob předání"]').forEach(function (radio) {
    radio.addEventListener('change', updateDeliveryMode);
  });
  updateDeliveryMode();


  /* 2. Kontrola polí
     ------------------------------------------------------------------------
     Používáme vestavěnou validaci prohlížeče (required, type="email"…).
     Třída was-validated v CSS obarví chybná pole červeně – přidáme ji
     až po prvním pokusu o odeslání, ať uživatele nestrašíme předem.
     ------------------------------------------------------------------------ */

  // Telefon: jen číslice a „+“ na začátku (předvolba), platí i pro vložení ze schránky
  form.elements['Telefon'].addEventListener('input', function () {
    var clean = this.value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
    if (clean !== this.value) this.value = clean;
  });

  function errorText(field) {
    if (field.tagName === 'SELECT') return 'Vyberte prosím ze seznamu.';
    if (field.validity.valueMissing) return 'Vyplňte prosím toto pole.';
    if (field.type === 'email') return 'Zadejte prosím platný e-mail.';
    if (field.type === 'url') return 'Zadejte prosím celý odkaz včetně https://';
    return 'Zkontrolujte prosím toto pole.';
  }

  // Popis zmizí, jakmile je pole pod ním v pořádku
  form.addEventListener('input', function (event) {
    if (event.target.validity && event.target.validity.valid && event.target.parentNode === fieldError.parentNode) {
      fieldError.hidden = true;
    }
  });

  function validate() {
    form.classList.add('was-validated');

    if (form.checkValidity()) {
      fieldError.hidden = true;
      return true;
    }

    // Blikání znovu od začátku při každém pokusu o odeslání
    form.classList.remove('is-blinking');
    void form.offsetWidth;
    form.classList.add('is-blinking');

    // Přesun na první chybné pole a popis chyby pod ním
    var firstInvalid = form.querySelector('.field :invalid');
    fieldError.textContent = errorText(firstInvalid);
    fieldError.hidden = false;
    firstInvalid.parentNode.appendChild(fieldError);
    firstInvalid.focus();
    return false;
  }


  /* 3. Číslo zakázky
     ------------------------------------------------------------------------
     Formát: LL-RRMMDD-XXXX (datum + 4 náhodné číslice).
     Slouží jako reference v e-mailu i v potvrzení pro lékaře.
     ------------------------------------------------------------------------ */

  function createOrderNumber() {
    var now = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var date = String(now.getFullYear()).slice(2) + pad(now.getMonth() + 1) + pad(now.getDate());
    var random = Math.floor(1000 + Math.random() * 9000);
    return 'LL-' + date + '-' + random;
  }


  /* 4. Odeslání
     ------------------------------------------------------------------------ */

  // Datum z políčka typu date (2026-10-24) → česky (24. 10. 2026)
  function formatDate(isoDate) {
    var parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return Number(parts[2]) + '. ' + Number(parts[1]) + '. ' + parts[0];
  }

  function showError(message) {
    errorBox.innerHTML = message;
    errorBox.hidden = false;
    errorBox.scrollIntoView({ block: 'center' });
  }

  function showConfirmation(orderNumber, isDemo) {
    document.getElementById('order-number').textContent = orderNumber;
    document.getElementById('demo-note').hidden = !isDemo;

    orderBox.hidden = true;
    sentBox.hidden = false;
    section.scrollIntoView();

    // Focus na potvrzení, aby ho přečetla i čtečka obrazovky
    sentBox.querySelector('.sent__box').focus();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    errorBox.hidden = true;

    if (!validate()) return;

    var orderNumber = createOrderNumber();

    var fields = new FormData(form);

    // Data pro Web3Forms. Pole se v e-mailu zobrazí v tomto pořadí:
    // nejdřív číslo zakázky, pak pole formuláře shora dolů.
    var data = {
      // Speciální pole Web3Forms (v e-mailu se nezobrazují jako řádky):
      access_key: WEB3FORMS_KEY,
      subject: 'Nová zakázka ' + orderNumber + ' – ' + fields.get('Ordinace'),
      from_name: 'Web Lukeš Lab',
      replyto: fields.get('email'),   // „Odpovědět“ v e-mailu půjde rovnou lékaři

      'Číslo zakázky': orderNumber
    };

    fields.forEach(function (value, key) {
      if (value === '') return;                 // nevyplněná pole do e-mailu nedáváme
      if (key === 'email') key = 'E-mail';      // hezčí název řádku
      if (key === 'Požadovaný termín') value = formatDate(value);
      data[key] = value;
    });

    // Ukázkový režim – formulář ještě není napojený
    if (!WEB3FORMS_KEY) {
      console.warn('Formulář není napojený (chybí WEB3FORMS_KEY v js/zakazka.js). Data:', data);
      showConfirmation(orderNumber, true);
      return;
    }

    // Během odesílání zablokujeme tlačítko (proti dvojímu kliknutí)
    submitBtn.disabled = true;
    submitBtn.textContent = 'Odesílám…';

    fetch(WEB3FORMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (response) { return response.json(); })
      .then(function (result) {
        if (!result.success) throw new Error(result.message);
        showConfirmation(orderNumber, false);
      })
      .catch(function (error) {
        console.error('Odeslání zakázky selhalo:', error);
        showError(
          'Zakázku se nepodařilo odeslat. Zkuste to prosím znovu, nebo nám zavolejte na ' +
          '<a href="tel:+420774652522">+420 774 652 522</a> či napište na ' +
          '<a href="mailto:petr-lukes@seznam.cz">petr-lukes@seznam.cz</a>.'
        );
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Odeslat zakázku';
      });
  });


  /* Tlačítko „Poslat další zakázku“ – vyčistí formulář a zobrazí ho znovu */
  document.getElementById('new-order').addEventListener('click', function () {
    form.reset();
    form.classList.remove('was-validated');
    updateDeliveryMode();

    sentBox.hidden = true;
    orderBox.hidden = false;
    section.scrollIntoView();
  });


  /* 5. Žádost o heslo k ceníku
     ------------------------------------------------------------------------
     Spodní část okna s heslem – návštěvník vyplní e-mail a laboratoř dostane
     žádost přes stejnou službu jako zakázky. Heslo pak posílá ručně.
     ------------------------------------------------------------------------ */

  function initPasswordRequest() {
    var dialog = document.getElementById('cenik-heslo');
    var requestForm = document.getElementById('cenik-zadost');
    if (!dialog || !requestForm) return;

    var input = requestForm.elements.email;
    var button = requestForm.querySelector('[type="submit"]');
    var error = requestForm.querySelector('.cenik-dialog__error');
    var sent = dialog.querySelector('[data-cenik-sent]');
    var demoNote = dialog.querySelector('[data-cenik-demo]');
    var MIN_FILL_MS = 2000; // rychleji e-mail nevyplní ani člověk s automatickým doplněním
    var openedAt = 0;

    document.querySelector('[data-cenik-open]').addEventListener('click', function () {
      openedAt = Date.now();
    });

    function showRequestError(text) {
      error.textContent = text;
      error.hidden = !text;
    }

    function showSent(isDemo) {
      demoNote.hidden = !isDemo;
      requestForm.hidden = true;
      sent.hidden = false;
    }

    // Po zavření okna začíná žádost příště znovu
    dialog.addEventListener('close', function () {
      requestForm.reset();
      showRequestError('');
      requestForm.hidden = false;
      sent.hidden = true;
    });

    requestForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var email = input.value.trim();
      if (!email || !input.checkValidity()) {
        showRequestError('Zadejte prosím platný e-mail.');
        input.focus();
        return;
      }

      showRequestError('');

      // Robot zaškrtne skryté pole nebo odešle hned po otevření okna.
      // Dostane stejné potvrzení jako člověk, žádost se ale neodešle.
      if (requestForm.elements.botcheck.checked || Date.now() - openedAt < MIN_FILL_MS) {
        showSent(false);
        return;
      }

      // Ukázkový režim – formulář ještě není napojený
      if (!WEB3FORMS_KEY) {
        showSent(true);
        return;
      }

      button.disabled = true;

      fetch(WEB3FORMS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: 'Žádost o heslo k ceníku – ' + email,
          from_name: 'Web Lukeš Lab',
          replyto: email,
          'E-mail': email
        })
      })
        .then(function (response) { return response.json(); })
        .then(function (result) {
          if (!result.success) throw new Error(result.message);
          showSent(false);
        })
        .catch(function (err) {
          console.error('Odeslání žádosti selhalo:', err);
          showRequestError('Žádost se nepodařilo odeslat. Zkuste to prosím znovu, nebo nám zavolejte.');
        })
        .finally(function () {
          button.disabled = false;
        });
    });
  }

  initPasswordRequest();
})();
