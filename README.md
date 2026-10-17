# Lukeš Lab – web zubní laboratoře

Statický web (HTML + CSS + JavaScript, bez frameworku a bez PHP) pro digitální
zubní laboratoř Petra Lukeše v Praze-Holešovicích.

## Struktura

```
index.html                  homepage (hero s videem, sekce 01–06, 07 formulář, kontakt)
sluzba.html                 detail služby – šablona (Implantologická protetika)
ochrana-osobnich-udaju.html zásady ochrany osobních údajů (pracovní text)
css/style.css               všechny styly (barvy a rozměry nahoře v :root)
js/main.js                  menu, video, filtr galerie, přepínač barev
js/zakazka.js               logika formuláře „Poslat zakázku“ a odeslání
img/                        fotky (názvy souborů zachovat při výměně)
video/                      hero video (PC + výřez na výšku pro mobil) + postery
tools/priprav-video.ps1     převod nového videa (černobílé, světlejší, bez zvuku)
PoC/                        původní návrh a podklady (_claude_readme.md)
```

## Spuštění

Stačí otevřít `index.html` v prohlížeči. Nic se nekompiluje ani neinstaluje.

## Napojení formuláře

Formulář odesílá přes službu [Web3Forms](https://web3forms.com) (zdarma, bez PHP):

1. Na web3forms.com zadat e-mail laboratoře, přijde Access Key.
2. Vložit ho do `js/zakazka.js` → `WEB3FORMS_KEY`.

Dokud je klíč prázdný, formulář běží v ukázkovém režimu a nic neodešle.
STL soubory se neposílají přílohou (bývají stovky MB). Lékař vloží odkaz
z Úschovny / WeTransferu, nebo je pošle e-mailem přímo ze skeneru.

## Výměna videa

```powershell
.\tools\priprav-video.ps1 -Vstup "cesta\k\novemu-videu.mp4"
```

Skript přepíše soubory ve složce `video/` (potřebuje ffmpeg: `winget install Gyan.FFmpeg`).

## Přepínač barev (dočasný)

Lišta nad hlavičkou přepíná akcentní barvu webu (petrolejová, půlnoční modrá,
kobaltová, bronzová, grafitová). Po výběru: hodnoty zvolené barvy zkopírovat
v `css/style.css` do `:root`, smazat bloky `[data-accent=…]`, sekci 21
v CSS, lištu `.theme-bar` a skript „přepínač barev“ v `index.html`
a funkci `initThemeSwitcher` v `js/main.js`.

## Co je potřeba doplnit

Vše v `[hranatých závorkách]` je placeholder: přesnost v µm, dodací lhůty,
otevírací doba, implantátové systémy, CAD software, foto týmu, texty „O nás“.
Fotky přístrojů, screenshoty Modellieru a video jsou od Zirkonzahnu –
před spuštěním nahradit vlastními nebo mít písemný souhlas.
