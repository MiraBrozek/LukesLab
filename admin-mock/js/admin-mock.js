/* ==========================================================================
   Lukeš Lab – administrace svozů (MOCK / návrh obrazovek)
   --------------------------------------------------------------------------
   Ukázková data a klikání v prohlížeči. Nic se neukládá – v ostré verzi
   budou data v databázi na hostingu a tenhle soubor nahradí volání serveru.

   Každá stránka má na <body> atribut data-page a podle něj se spustí
   odpovídající část:
     login     – přihlášení (index.html)
     svozy     – plán svozu a trasa (svozy.html)
     ordinace  – seznam ordinací (ordinace.html)
     upravit   – úprava / přidání ordinace (ordinace-upravit.html)

   Obsah:
     1. Ukázková data (ordinace, výchozí body tras, mapy)
     2. Pomocné funkce (ikony, mapa, vzdálenosti)
     3. Přihlášení
     4. Plán svozu
     5. Seznam ordinací
     6. Úprava ordinace
     7. Spuštění podle stránky
   ========================================================================== */

(function () {
  'use strict';

  /* 1. Ukázková data
     ------------------------------------------------------------------------
     Názvy ordinací a lékařů jsou smyšlené, ulice skutečné (kvůli mapě).
     lat/lng = zeměpisná šířka/délka; v ostré verzi se dopočítá z adresy.
     ------------------------------------------------------------------------ */

  var ORDINACE = [
    { id: 'p1', nazev: 'Zubní ordinace Letná', lekar: 'MUDr. Jana Dvořáková', ulice: 'Milady Horákové 52', mesto: 'Praha 7', psc: '170 00', region: 'praha', lat: 50.0997, lng: 14.4236, telefon: '+420 601 111 222', email: 'letna@example.cz', okno: 'Po–Pá 8:00–15:00', pokyn: 'Zvonit „Ordinace“, předat sestře na recepci.', posledni: '14. 10. 2026' },
    { id: 'p2', nazev: 'Dentální klinika Karlín', lekar: 'MUDr. Tomáš Beneš', ulice: 'Křižíkova 36', mesto: 'Praha 8', psc: '186 00', region: 'praha', lat: 50.0927, lng: 14.4503, telefon: '+420 602 333 444', email: 'karlin@example.cz', okno: 'Po–Čt 7:30–16:00', pokyn: 'Vchod ze dvora, 1. patro.', posledni: '15. 10. 2026' },
    { id: 'p3', nazev: 'Stomatologie Vinohrady', lekar: 'MUDr. Petr Svoboda', ulice: 'Vinohradská 112', mesto: 'Praha 3', psc: '130 00', region: 'praha', lat: 50.0777, lng: 14.4560, telefon: '+420 603 555 666', email: 'vinohrady@example.cz', okno: 'Po–Pá 9:00–17:00', pokyn: 'Krabici nechat na recepci, podepsat předávací list.', posledni: '9. 10. 2026' },
    { id: 'p4', nazev: 'Zubní centrum Dejvice', lekar: 'MUDr. Lenka Horáková', ulice: 'Dejvická 20', mesto: 'Praha 6', psc: '160 00', region: 'praha', lat: 50.1015, lng: 14.3932, telefon: '+420 604 777 888', email: 'dejvice@example.cz', okno: 'Út, Čt 8:00–14:00', pokyn: 'Parkování ve dvoře, zvonek 2. patro.', posledni: '2. 10. 2026' },
    { id: 'p5', nazev: 'Ordinace Smíchov', lekar: 'MUDr. Martin Kučera', ulice: 'Štefánikova 25', mesto: 'Praha 5', psc: '150 00', region: 'praha', lat: 50.0743, lng: 14.4038, telefon: '+420 605 999 000', email: 'smichov@example.cz', okno: 'Po–Pá 7:00–13:00', pokyn: '', posledni: '16. 10. 2026' },
    { id: 'p6', nazev: 'Zubní studio Nusle', lekar: 'MUDr. Eva Malá', ulice: 'Táborská 30', mesto: 'Praha 4', psc: '140 00', region: 'praha', lat: 50.0641, lng: 14.4368, telefon: '+420 606 121 314', email: 'nusle@example.cz', okno: 'Po, St, Pá 8:00–16:00', pokyn: 'Po 14:00 jen přes kolegyni v přízemí.', posledni: '1. 10. 2026' },
    { id: 'p7', nazev: 'Stomatologie Libeň', lekar: 'MUDr. Jakub Novotný', ulice: 'Zenklova 30', mesto: 'Praha 8', psc: '180 00', region: 'praha', lat: 50.1052, lng: 14.4727, telefon: '+420 607 151 617', email: 'liben@example.cz', okno: 'Po–Pá 8:00–16:00', pokyn: '', posledni: '13. 10. 2026' },
    { id: 'p8', nazev: 'DentCare Vysočany', lekar: 'MUDr. Klára Říhová', ulice: 'Sokolovská 200', mesto: 'Praha 9', psc: '190 00', region: 'praha', lat: 50.1009, lng: 14.4930, telefon: '+420 608 181 920', email: 'vysocany@example.cz', okno: 'Po–Čt 8:00–15:00', pokyn: 'Zadní vchod u lékárny.', posledni: '7. 10. 2026' },
    { id: 'z1', nazev: 'Zubní ordinace Americká', lekar: 'MUDr. Tomáš Kříž', ulice: 'Americká 30', mesto: 'Plzeň', psc: '301 00', region: 'plzen', lat: 49.7444, lng: 13.3779, telefon: '+420 721 222 333', email: 'americka@example.cz', okno: 'Po–Pá 8:00–14:00', pokyn: 'Zvonit „Kříž“, 3. patro.', posledni: '12. 10. 2026' },
    { id: 'z2', nazev: 'Stomatologie Slovany', lekar: 'MUDr. Pavla Šimková', ulice: 'Koterovská 50', mesto: 'Plzeň', psc: '326 00', region: 'plzen', lat: 49.7368, lng: 13.3962, telefon: '+420 722 444 555', email: 'slovany@example.cz', okno: 'Út–Pá 9:00–16:00', pokyn: '', posledni: '5. 10. 2026' },
    { id: 'z3', nazev: 'MUDr. Hana Veselá', lekar: 'MUDr. Hana Veselá', ulice: 'Klatovská třída 70', mesto: 'Plzeň', psc: '301 00', region: 'plzen', lat: 49.7385, lng: 13.3716, telefon: '+420 723 666 777', email: 'vesela@example.cz', okno: 'Po, St 7:30–15:00', pokyn: 'Předat přímo paní doktorce.', posledni: '15. 10. 2026' },
    { id: 'z4', nazev: 'Dentální studio Doubravka', lekar: 'MUDr. Ondřej Fiala', ulice: 'Rokycanská 40', mesto: 'Plzeň', psc: '312 00', region: 'plzen', lat: 49.7545, lng: 13.4010, telefon: '+420 724 888 999', email: 'doubravka@example.cz', okno: 'Po–Pá 8:00–15:30', pokyn: '', posledni: '30. 9. 2026' }
  ];

  // Kde trasa začíná a končí – v Praze laboratoř, v Plzni domov majitele
  var ZAKLADNA = {
    praha: { nazev: 'Laboratoř Lukeš Lab', adresa: 'Přístavní 1244/43, Praha 7', lat: 50.1043, lng: 14.4538 },
    plzen: { nazev: 'Plzeň – výchozí místo', adresa: 'Plzeň, Lochotín', lat: 49.7650, lng: 13.3700 }
  };

  // Statické mapy z OpenStreetMap: zoom a levý horní roh v „pixelech světa“
  // (spočítáno při skládání obrázků z dlaždic; obrázek 960 × 640 px)
  var MAPY = {
    praha: { src: 'img/mapa-praha.jpg', zoom: 13, left: 1132238.4, top: 710133.51, w: 960, h: 640 },
    plzen: { src: 'img/mapa-plzen.jpg', zoom: 14, left: 2252630.2, top: 1426639.87, w: 960, h: 640 }
  };

  // Ukázkový plán na den – co je naklikané po otevření stránky
  var VYCHOZI_PLAN = {
    praha: {
      poradi: ['p7', 'p3', 'p5', 'p1'],
      ukoly: {
        p7: { vyzvednout: true, dorucit: false },
        p3: { vyzvednout: false, dorucit: true },
        p5: { vyzvednout: true, dorucit: true },
        p1: { vyzvednout: true, dorucit: false }
      }
    },
    plzen: {
      poradi: ['z1', 'z3'],
      ukoly: {
        z1: { vyzvednout: true, dorucit: true },
        z3: { vyzvednout: false, dorucit: true }
      }
    }
  };


  /* 2. Pomocné funkce
     ------------------------------------------------------------------------ */

  // Malé ikony (obrys, barva podle textu)
  var ICON = {
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
    remove: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"/></svg>',
    note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>',
    up_box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>',
    down_box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 4v12M7 11l5 5 5-5M4 20h16"/></svg>'
  };

  function byId(id) {
    for (var i = 0; i < ORDINACE.length; i++) {
      if (ORDINACE[i].id === id) return ORDINACE[i];
    }
    return null;
  }

  function adresa(o) {
    return o.ulice + ', ' + o.psc + ' ' + o.mesto;
  }

  // Ochrana textu vkládaného do HTML
  function esc(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Převod lat/lng na polohu v obrázku mapy (v procentech, aby mapa
  // mohla měnit velikost). Stejný výpočet jako u dlaždic OpenStreetMap.
  function naMapu(lat, lng, mapa) {
    var n = Math.pow(2, mapa.zoom) * 256;
    var x = (lng + 180) / 360 * n;
    var rad = lat * Math.PI / 180;
    var y = (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * n;
    return {
      x: (x - mapa.left) / mapa.w * 100,
      y: (y - mapa.top) / mapa.h * 100
    };
  }

  // Vzdušná vzdálenost dvou bodů v km (Haversinův vzorec)
  function vzdalenost(a, b) {
    var R = 6371;
    var dLat = (b.lat - a.lat) * Math.PI / 180;
    var dLng = (b.lng - a.lng) * Math.PI / 180;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  // Délka celé trasy: základna → zastávky → základna
  function delkaTrasy(zakladna, body) {
    var km = 0;
    var predchozi = zakladna;
    body.forEach(function (bod) {
      km += vzdalenost(predchozi, bod);
      predchozi = bod;
    });
    if (body.length) km += vzdalenost(predchozi, zakladna);
    return km;
  }

  // Krátká hláška dole na obrazovce
  function toast(text) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  }


  /* 3. Přihlášení
     ------------------------------------------------------------------------
     V mocku stačí kliknout na „Přihlásit“. V ostré verzi ověří jméno
     a heslo server a teprve pak pustí dál.
     ------------------------------------------------------------------------ */

  function initLogin() {
    var form = document.getElementById('login-form');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      window.location.href = 'svozy.html';
    });
  }


  /* 4. Plán svozu
     ------------------------------------------------------------------------
     Vlevo seznam ordinací s tlačítky Vyzvednout / Doručit. Co se zapne,
     přibude do trasy vpravo. Trasu jde ručně přeřadit, nechat seřadit
     na nejkratší, otevřít v Google Maps nebo vytisknout.
     Každý region (Praha / Plzeň) má vlastní plán.
     ------------------------------------------------------------------------ */

  function initSvozy() {
    var region = 'praha';
    var hledat = '';
    var hotovo = {};          // id zastávky -> true, když ji řidič odškrtne
    var plany = JSON.parse(JSON.stringify(VYCHOZI_PLAN));

    var elClinics = document.getElementById('clinics');
    var elStops = document.getElementById('stops');
    var elMapImg = document.getElementById('map-img');
    var elPins = document.getElementById('map-pins');
    var elLine = document.getElementById('map-line');
    var elSummary = document.getElementById('route-summary');
    var elSearch = document.getElementById('clinic-search');
    var elDate = document.getElementById('route-date');
    var elDateLabel = document.getElementById('route-date-label');
    var regionButtons = document.querySelectorAll('[data-region]');

    function plan() {
      return plany[region];
    }

    // Zapne/vypne úkol u ordinace a podle toho ji přidá do trasy / odebere
    function prepni(id, typ) {
      var p = plan();
      var ukol = p.ukoly[id] || { vyzvednout: false, dorucit: false };
      ukol[typ] = !ukol[typ];
      p.ukoly[id] = ukol;

      var vTrase = p.poradi.indexOf(id) !== -1;
      if ((ukol.vyzvednout || ukol.dorucit) && !vTrase) p.poradi.push(id);
      if (!ukol.vyzvednout && !ukol.dorucit) odeber(id);
      vykresli();
    }

    function odeber(id) {
      var p = plan();
      p.poradi = p.poradi.filter(function (x) { return x !== id; });
      delete p.ukoly[id];
      delete hotovo[id];
    }

    function posun(id, smer) {
      var poradi = plan().poradi;
      var i = poradi.indexOf(id);
      var j = i + smer;
      if (j < 0 || j >= poradi.length) return;
      poradi[i] = poradi[j];
      poradi[j] = id;
      vykresli();
    }

    // Seřazení na nejkratší trasu: nejdřív vždy nejbližší další zastávka,
    // pak vylepšení prohazováním úseků (2-opt). Pro pár zastávek denně
    // to dá prakticky nejlepší pořadí. Počítá se vzdušnou čarou –
    // v ostré verzi by se dalo použít plánování tras přes API map.
    function seradit() {
      var zakladna = ZAKLADNA[region];
      var zbyva = plan().poradi.map(byId);
      var trasa = [];
      var aktualni = zakladna;

      while (zbyva.length) {
        zbyva.sort(function (a, b) {
          return vzdalenost(aktualni, a) - vzdalenost(aktualni, b);
        });
        aktualni = zbyva.shift();
        trasa.push(aktualni);
      }

      var zlepseno = true;
      while (zlepseno) {
        zlepseno = false;
        for (var i = 0; i < trasa.length - 1; i++) {
          for (var k = i + 1; k < trasa.length; k++) {
            var nova = trasa.slice(0, i)
              .concat(trasa.slice(i, k + 1).reverse())
              .concat(trasa.slice(k + 1));
            if (delkaTrasy(zakladna, nova) < delkaTrasy(zakladna, trasa) - 0.01) {
              trasa = nova;
              zlepseno = true;
            }
          }
        }
      }

      plan().poradi = trasa.map(function (o) { return o.id; });
      vykresli();
      toast('Trasa seřazena na nejkratší');
    }

    // Odkaz do Google Maps s celou trasou (otevře navigaci v mobilu).
    // Google Maps v odkazu přijme nejvýš 9 průjezdních bodů.
    function odkazGoogleMaps() {
      var zakladna = ZAKLADNA[region];
      var body = plan().poradi.map(function (id) { return adresa(byId(id)); });
      var url = 'https://www.google.com/maps/dir/?api=1&travelmode=driving' +
        '&origin=' + encodeURIComponent(zakladna.adresa) +
        '&destination=' + encodeURIComponent(zakladna.adresa);
      if (body.length) url += '&waypoints=' + encodeURIComponent(body.join('|'));
      return url;
    }

    function stitky(ukol) {
      var html = '';
      if (ukol.vyzvednout) html += '<span class="badge badge--pickup">' + ICON.up_box.replace('<svg', '<svg width="12" height="12"') + 'Vyzvednout</span>';
      if (ukol.dorucit) html += '<span class="badge badge--delivery">' + ICON.down_box.replace('<svg', '<svg width="12" height="12"') + 'Doručit</span>';
      return html;
    }

    // Levý sloupec – ordinace v regionu (s hledáním)
    function vykresliOrdinace() {
      var p = plan();
      var dotaz = hledat.toLowerCase();
      var seznam = ORDINACE.filter(function (o) {
        if (o.region !== region) return false;
        if (!dotaz) return true;
        return (o.nazev + ' ' + o.lekar + ' ' + adresa(o)).toLowerCase().indexOf(dotaz) !== -1;
      });

      if (!seznam.length) {
        elClinics.innerHTML = '<li class="empty">Žádná ordinace neodpovídá hledání.</li>';
        return;
      }

      elClinics.innerHTML = seznam.map(function (o) {
        var ukol = p.ukoly[o.id] || {};
        var naplanovano = ukol.vyzvednout || ukol.dorucit;
        return '<li class="clinic' + (naplanovano ? ' is-planned' : '') + '">' +
          '<div><div class="clinic__name">' + esc(o.nazev) + '</div>' +
          '<div class="clinic__addr">' + esc(adresa(o)) + ' · ' + esc(o.okno) + '</div></div>' +
          '<div class="clinic__actions">' +
            '<button type="button" class="toggle toggle--pickup" data-toggle="vyzvednout" data-id="' + o.id + '" aria-pressed="' + !!ukol.vyzvednout + '">' + ICON.up_box + 'Vyzvednout</button>' +
            '<button type="button" class="toggle toggle--delivery" data-toggle="dorucit" data-id="' + o.id + '" aria-pressed="' + !!ukol.dorucit + '">' + ICON.down_box + 'Doručit</button>' +
          '</div></li>';
      }).join('');
    }

    // Pravý sloupec – zastávky v pořadí
    function vykresliZastavky() {
      var p = plan();
      var zakladna = ZAKLADNA[region];

      function zakladnaHtml(popis) {
        return '<li class="stop stop--base"><span class="stop__num">' + ICON.home + '</span>' +
          '<div class="stop__body"><span class="stop__name">' + popis + ' – ' + esc(zakladna.nazev) + '</span>' +
          '<span class="stop__addr">' + esc(zakladna.adresa) + '</span></div></li>';
      }

      var html = zakladnaHtml('Start');

      if (!p.poradi.length) {
        html += '<li class="empty">Zatím žádné zastávky – vlevo u ordinace klikněte na Vyzvednout nebo Doručit.</li>';
      }

      p.poradi.forEach(function (id, i) {
        var o = byId(id);
        var posledni = i === p.poradi.length - 1;
        html += '<li class="stop' + (hotovo[id] ? ' is-done' : '') + '">' +
          '<span class="stop__num">' + (i + 1) + '</span>' +
          '<div class="stop__body">' +
            '<span class="stop__name">' + esc(o.nazev) + '</span>' +
            '<span class="stop__addr">' + esc(adresa(o)) + ' · ' + esc(o.telefon) + '</span>' +
            '<div class="stop__tags">' + stitky(p.ukoly[id]) + '</div>' +
            (o.pokyn ? '<p class="stop__note">' + ICON.note + esc(o.pokyn) + '</p>' : '') +
          '</div>' +
          '<div class="stop__actions">' +
            '<button type="button" class="icon-btn' + (hotovo[id] ? ' is-on' : '') + '" data-action="done" data-id="' + id + '" aria-label="Hotovo" title="Hotovo">' + ICON.check + '</button>' +
            '<button type="button" class="icon-btn" data-action="up" data-id="' + id + '" aria-label="Posunout nahoru" title="Nahoru"' + (i === 0 ? ' disabled' : '') + '>' + ICON.up + '</button>' +
            '<button type="button" class="icon-btn" data-action="down" data-id="' + id + '" aria-label="Posunout dolů" title="Dolů"' + (posledni ? ' disabled' : '') + '>' + ICON.down + '</button>' +
            '<button type="button" class="icon-btn" data-action="remove" data-id="' + id + '" aria-label="Odebrat z trasy" title="Odebrat">' + ICON.remove + '</button>' +
          '</div></li>';
      });

      html += zakladnaHtml('Cíl');
      elStops.innerHTML = html;
    }

    // Mapa – špendlíky a přerušovaná čára v pořadí trasy
    function vykresliMapu() {
      var mapa = MAPY[region];
      var zakladna = ZAKLADNA[region];
      var p = plan();

      if (elMapImg.getAttribute('src') !== mapa.src) elMapImg.src = mapa.src;

      var bodZakladna = naMapu(zakladna.lat, zakladna.lng, mapa);
      var body = [bodZakladna];
      var html = '<span class="pin pin--base" style="left:' + bodZakladna.x + '%;top:' + bodZakladna.y + '%" title="' + esc(zakladna.nazev) + '">' + ICON.home + '</span>';

      p.poradi.forEach(function (id, i) {
        var o = byId(id);
        var bod = naMapu(o.lat, o.lng, mapa);
        body.push(bod);
        html += '<span class="pin' + (hotovo[id] ? ' is-done' : '') + '" style="left:' + bod.x + '%;top:' + bod.y + '%" title="' + esc(o.nazev) + '">' + (i + 1) + '</span>';
      });

      body.push(bodZakladna);
      elPins.innerHTML = html;
      // SVG má viewBox 0 0 100 100, takže body v procentech sedí přímo
      elLine.setAttribute('points', p.poradi.length ? body.map(function (b) { return b.x + ',' + b.y; }).join(' ') : '');
    }

    // Souhrn: počet zastávek, odhad km a času
    function vykresliSouhrn() {
      var p = plan();
      var body = p.poradi.map(byId);
      var vyzvednout = 0;
      var dorucit = 0;
      p.poradi.forEach(function (id) {
        if (p.ukoly[id].vyzvednout) vyzvednout++;
        if (p.ukoly[id].dorucit) dorucit++;
      });

      // Odhad: silnice jsou cca o 35 % delší než vzdušná čára,
      // ve městě průměrně 22 km/h a 6 minut na každou zastávku
      var km = delkaTrasy(ZAKLADNA[region], body) * 1.35;
      var minut = Math.round(km / 22 * 60 + body.length * 6);
      var cas = minut >= 60 ? Math.floor(minut / 60) + ' h ' + (minut % 60) + ' min' : minut + ' min';

      elSummary.innerHTML =
        '<span><strong>' + body.length + '</strong> zastávek</span>' +
        '<span><strong>' + vyzvednout + '×</strong> vyzvednout</span>' +
        '<span><strong>' + dorucit + '×</strong> doručit</span>' +
        '<span>cca <strong>' + Math.round(km) + ' km</strong> · <strong>' + cas + '</strong></span>';

    }

    function vykresli() {
      regionButtons.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-region') === region));
        b.querySelector('.count').textContent = plany[b.getAttribute('data-region')].poradi.length;
      });
      vykresliOrdinace();
      vykresliZastavky();
      vykresliMapu();
      vykresliSouhrn();
    }

    function popisDatum() {
      var d = new Date(elDate.value + 'T12:00:00');
      elDateLabel.textContent = isNaN(d) ? '' : d.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'numeric' });
    }

    // Kliknutí v seznamu ordinací (jeden posluchač pro všechna tlačítka)
    elClinics.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-toggle]');
      if (btn) prepni(btn.getAttribute('data-id'), btn.getAttribute('data-toggle'));
    });

    // Kliknutí na tlačítka u zastávek
    elStops.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-action]');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      var akce = btn.getAttribute('data-action');
      if (akce === 'up') posun(id, -1);
      if (akce === 'down') posun(id, 1);
      if (akce === 'remove') { odeber(id); vykresli(); }
      if (akce === 'done') { hotovo[id] = !hotovo[id]; vykresli(); }
    });

    regionButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        region = b.getAttribute('data-region');
        vykresli();
      });
    });

    elSearch.addEventListener('input', function () {
      hledat = elSearch.value.trim();
      vykresliOrdinace();
    });

    elDate.addEventListener('change', popisDatum);
    document.getElementById('btn-sort').addEventListener('click', seradit);
    document.getElementById('btn-print').addEventListener('click', function () { window.print(); });
    initPoslatDoTelefonu(odkazGoogleMaps);
    document.getElementById('btn-save').addEventListener('click', function () {
      toast('Plán uložen (ukázka – nic se neukládá)');
    });

    popisDatum();
    vykresli();
  }


  /* 4b. Poslat trasu do telefonu
     ------------------------------------------------------------------------
     Okno s QR kódem (načte se foťákem telefonu) a odkazy pro SMS / e-mail.
     Na mobilu se místo okna rovnou nabídne systémové „Sdílet“.
     getUrl vrací aktuální odkaz na trasu v Google Maps.
     ------------------------------------------------------------------------ */

  function initPoslatDoTelefonu(getUrl) {
    var dialog = document.getElementById('phone-dialog');
    var elQr = document.getElementById('phone-qr');
    var elNumber = document.getElementById('phone-number');
    var elSms = document.getElementById('phone-sms');
    var elMail = document.getElementById('phone-mail');
    var elGmaps = document.getElementById('btn-gmaps');
    var text = 'Trasa svozu Lukeš Lab: ';

    function aktualizujOdkazy() {
      var url = getUrl();
      var cislo = elNumber.value.replace(/\s/g, '');
      elSms.href = 'sms:' + cislo + '?body=' + encodeURIComponent(text + url);
      elMail.href = 'mailto:?subject=' + encodeURIComponent('Trasa svozu') + '&body=' + encodeURIComponent(text + url);
      elGmaps.href = url;
    }

    function otevri() {
      var url = getUrl();

      // Mobil: systémové sdílení (WhatsApp, SMS…) – okno není potřeba
      var jeMobil = window.matchMedia('(pointer: coarse)').matches;
      if (jeMobil && navigator.share) {
        navigator.share({ title: 'Trasa svozu', text: text, url: url }).catch(function () {});
        return;
      }

      // QR kód – knihovna qrcode-generator (načtená z cdnjs)
      if (window.qrcode) {
        var qr = window.qrcode(0, 'L');
        qr.addData(url);
        qr.make();
        elQr.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      } else {
        elQr.textContent = 'QR kód se nepodařilo načíst.';
      }

      aktualizujOdkazy();
      dialog.showModal();
    }

    document.getElementById('btn-phone').addEventListener('click', otevri);
    elNumber.addEventListener('input', aktualizujOdkazy);

    document.getElementById('phone-copy').addEventListener('click', function () {
      navigator.clipboard.writeText(getUrl()).then(function () {
        toast('Odkaz zkopírován');
      });
    });

    // Zavření křížkem nebo kliknutím mimo okno (Esc zvládá <dialog> sám)
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
    });
  }


  /* 5. Seznam ordinací
     ------------------------------------------------------------------------ */

  function initOrdinace() {
    var tbody = document.getElementById('clinic-rows');
    var search = document.getElementById('clinic-search');
    var filterButtons = document.querySelectorAll('[data-filter]');
    var elCount = document.getElementById('clinic-count');
    var filtr = 'vse';

    function vykresli() {
      var dotaz = search.value.trim().toLowerCase();
      var seznam = ORDINACE.filter(function (o) {
        if (filtr !== 'vse' && o.region !== filtr) return false;
        return (o.nazev + ' ' + o.lekar + ' ' + adresa(o) + ' ' + o.telefon).toLowerCase().indexOf(dotaz) !== -1;
      });

      elCount.textContent = seznam.length + ' z ' + ORDINACE.length;

      if (!seznam.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">Žádná ordinace neodpovídá hledání.</td></tr>';
        return;
      }

      tbody.innerHTML = seznam.map(function (o) {
        return '<tr>' +
          '<td><div class="table__name">' + esc(o.nazev) + '</div><div class="table__sub">' + esc(o.lekar) + '</div></td>' +
          '<td>' + esc(o.ulice) + '<div class="table__sub">' + esc(o.psc + ' ' + o.mesto) + '</div></td>' +
          '<td data-hide-mobile>' + esc(o.telefon) + '<div class="table__sub">' + esc(o.email) + '</div></td>' +
          '<td data-hide-mobile>' + esc(o.okno) + '<div class="table__sub">poslední svoz ' + esc(o.posledni) + '</div></td>' +
          '<td class="table__actions"><a class="btn btn--ghost" href="ordinace-upravit.html?id=' + o.id + '">Upravit</a></td>' +
          '</tr>';
      }).join('');
    }

    filterButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        filtr = b.getAttribute('data-filter');
        filterButtons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        vykresli();
      });
    });

    search.addEventListener('input', vykresli);
    vykresli();
  }


  /* 6. Úprava ordinace
     ------------------------------------------------------------------------
     ordinace-upravit.html?id=p1 vyplní formulář údaji ordinace,
     bez id je to formulář pro novou ordinaci.
     ------------------------------------------------------------------------ */

  function initUpravit() {
    var params = new URLSearchParams(window.location.search);
    var o = byId(params.get('id'));
    var form = document.getElementById('clinic-form');

    if (o) {
      document.getElementById('edit-title').textContent = o.nazev;
      document.getElementById('crumb-current').textContent = o.nazev;
      document.title = o.nazev + ' – Lukeš Lab admin';

      // Pole formuláře mají name stejné jako klíče v datech
      Object.keys(o).forEach(function (key) {
        var field = form.elements[key];
        if (field && typeof o[key] === 'string') field.value = o[key];
      });

      // Mapa s polohou ordinace
      var mapa = MAPY[o.region];
      var bod = naMapu(o.lat, o.lng, mapa);
      document.getElementById('map-img').src = mapa.src;
      document.getElementById('map-pins').innerHTML =
        '<span class="pin" style="left:' + bod.x + '%;top:' + bod.y + '%">' + ICON.home.replace('<svg', '<svg width="14" height="14"') + '</span>';
    } else {
      // Nová ordinace – mapa i historie zatím nejsou
      document.getElementById('map-panel').hidden = true;
      document.getElementById('history-panel').hidden = true;
      document.getElementById('btn-delete').hidden = true;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      toast('Uloženo (ukázka – nic se neukládá)');
    });

    document.getElementById('btn-delete').addEventListener('click', function () {
      if (window.confirm('Opravdu archivovat tuto ordinaci? Zmizí z plánování svozů.')) {
        window.location.href = 'ordinace.html';
      }
    });
  }


  /* 7. Spuštění podle stránky
     ------------------------------------------------------------------------ */

  var page = document.body.getAttribute('data-page');
  if (page === 'login') initLogin();
  if (page === 'svozy') initSvozy();
  if (page === 'ordinace') initOrdinace();
  if (page === 'upravit') initUpravit();
})();
