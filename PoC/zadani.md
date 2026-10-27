# Web zubní laboratoře – Praha 7, Holešovice

Podklady pro vývoj nového webu digitální zubní laboratoře. Tento zip obsahuje **statický HTML náhled** schváleného UX návrhu. Úkolem je z něj udělat produkční, responzivní web.

## Obsah zipu

| Soubor | Co to je |
|---|---|
| `index.html` | Homepage (hero s videem, služby, postup, digitální modelování, technologie, galerie, o nás, CTA, patička) |
| `sluzba.html` | Šablona detailu služby (vzor: Implantologická protetika) |
| `zakazka.html` | Formulář „Poslat zakázku“ pro stomatology (STL upload / svoz otisku) |
| `img/` | Dočasné fotky a video – **budou nahrazeny vlastními**, názvy souborů zachovat |
| `README.md` | Tento soubor |

## Cílová skupina a cíl webu

- **Primárně stomatologové a ordinace (B2B).** Chtějí rychle poslat zakázku, znát dodací lhůty a vidět kvalitu práce.
- Sekundárně pacienti a uchazeči o práci.
- **Hlavní konverze:** tlačítko „Poslat zakázku“. Je vždy v hlavičce, na mobilu ve sticky liště dole.

## Struktura webu (sitemap)

- **Homepage**
- **Služby:** korunky a můstky · implantologická protetika · All-on-4 / All-on-6 · titanové konstrukce a bary · snímatelné náhrady · dlahy, šablony, wax-up
- **Technologie:** frézovací centrum (Zirkonzahn M1) · digitální modelování (Zirkonzahn.Modellier) · materiály · digitální workflow
- **Naše práce:** galerie s filtrem (zirkon / implantáty / titan)
- **Pro stomatology:** poslat zakázku / STL · svoz otisků po Praze · dodací lhůty · ceník na vyžádání · objednávkový list PDF
- **O nás:** tým · laboratoř · kariéra
- **Kontakt:** adresa a mapa · telefon a e-mail · formulář

## Design

**Charakter:** čistý, medicínský, prémiový. Bílá a chladné šedé, jeden akcent. Tmavé jsou jen hero a sekce Technologie.

| Token | Hodnota | Použití |
|---|---|---|
| `--bg` | `#FFFFFF` | pozadí |
| `--surface` | `#F4F6F7` | střídané sekce |
| `--line` | `#E3E7EA` | linky, rámečky karet |
| `--text` | `#14191D` | text |
| `--muted` | `#5A6670` | sekundární text (kontrast vyhovuje AA) |
| `--accent` | `#0B5C6B` | petrolejová – CTA, odkazy, štítky |
| `--accent-hover` | `#08434E` | hover |
| `--accent-soft` | `#E6F0F2` | zvýraznění |
| `--accent-on-dark` | `#9FD0D8` | akcent na tmavém pozadí |
| `--dark` | `#0F1518` | sekce Technologie |

- **Písma (Google Fonts):** Manrope 400–800 na nadpisy a text, IBM Plex Mono 400–500 na technické štítky a čísla sekcí.
- **Rozměry:** kontejner max. 1200 px a okraje 24 px. Karty mají zaoblení 20 px, velké plochy 24–28 px, tlačítka jsou „pill“ s výškou min. 48 px.
- **Mřížka:** odstupy podle 8px rastru, sekce mají svislý padding 96 px (na mobilu 40 px).
- **Fotky produktů** jsou na čistě bílém pozadí s jemným stínem.

## Hero

- **Nadpis:** „Digitální přesnost. **Lidský dotek.**“ (druhá věta barvou `--accent-on-dark`)
- **Malý nadpis nad hlavním:** „Budoucnost je tu“
- **Podtitulek:** „Digitální zubní laboratoř v Praze-Holešovicích. Navrhujeme ve 3D, frézujeme na 5osé fréze Zirkonzahn M1 a ručně dokončujeme. Výsledek? Práce, která sedí napoprvé.“
- **Pozadí:** celoplošné video frézování, černobíle a bez zvuku, s tmavým překryvem kvůli čitelnosti.
  - Tag: `<video autoplay muted loop playsinline poster>`
  - Pro produkci video předem převést do černobílé, odstranit zvukovou stopu a zkomprimovat. Cíl: MP4 (H.264, `+faststart`) a WebM, do cca 4 MB, 1280–1600 px.
  - Na mobilu použít menší verzi nebo jen poster.
  - Tlačítko pauza/přehrát (přístupnost).
  - Respektovat `prefers-reduced-motion`.

### Známý problém: video v náhledu neběží

Vyřešit při vývoji. Kódování je v pořádku (H.264 High, yuv420p). Možné příčiny:

1. Náhled otevřený přímo ze zipu bez rozbalení. Relativní cesta `img/hero-video.mp4` se pak nenačte.
2. Zapnuté „omezit animace“ v OS. Skript v náhledu pak video záměrně pauzuje.
3. Soubor má 21 MB a `moov` atom není na začátku. Některé prohlížeče ho u `file://` nenačtou včas. Řeší re-encode s `-movflags +faststart` a menší velikostí.
4. Prohlížeč blokuje autoplay i u `muted`. Přidat v JS `video.muted = true; video.play().catch(()=>{})`.

## Sekce homepage (v pořadí)

1. **Hlavička:** logo, menu, telefon, CTA „Poslat zakázku“. Sticky.
2. **Hero:** viz výše, plus 4 čísla: 5 os · [X] µm přesnost · 100 % digitální návrh · [X] dní dodání.
3. **Pás „Pracujeme s“:** Zirkonzahn workflow · Prettau® zirkon · Titan Gr. 5 · STL z intraorálních skenerů · [implantátové systémy].
4. **01 Služby:** 6 karet s fotkou a popisem, odkaz na detail.
5. **02 Jak spolupracujeme:** 4 kroky: sken nebo otisk → CAD návrh ke schválení → frézování a sintrace → ruční dokončení a předání.
6. **03 Digitální modelování:** screenshoty Zirkonzahn.Modellier a 6 kroků: import dat → preparační hranice a artikulátor → návrh z knihovny zubů → dolaďování a kontrola skusu → **3D náhled ke schválení** → nesting a frézování. Místo na screen-recording.
7. **04 Technologie:** tmavá sekce, fréza Zirkonzahn M1, parametry (frézka, osy, materiály, software), 3 fotky.
8. **05 Naše práce:** galerie s filtrem.
9. **06 O nás:** foto týmu a medailonky.
10. **CTA blok:** „Vyzkoušejte, jak vypadá protetika bez kompromisů.“
11. **Patička:** adresa, kontakty, odkazy, mapa, upozornění „Zdravotnický prostředek na zakázku dle MDR“.

## Formulář „Poslat zakázku“

- **Krok 1:** přepínač „Digitální sken (STL)“ / „Svoz otisku“.
  - STL: drag & drop upload (STL / PLY / ZIP, max. 500 MB).
  - Svoz: adresa a termín.
- **Krok 2:** typ práce, zuby (FDI), barva, požadovaný termín, poznámka.
- **Krok 3:** ordinace, **kód pacienta (ne jméno – GDPR)**, e-mail, telefon.
- **Po odeslání:** potvrzení s číslem zakázky a „ozveme se do [24 h]“.
- **Backend:** e-mail laboratoři a potvrzení lékaři. Velké soubory řešit přes úložiště (S3 / R2 apod.), ne jako přílohu e-mailu.

## Tón textů

Prémiový, sebevědomý, technicky přesný. **Žádná nepodložená čísla.** Vše v `[hranatých závorkách]` je placeholder, který potvrdí klient (přesnost v µm, roky praxe, lhůty, systémy, kontakty).

## Technické požadavky

- Responzivní (mobile-first), přístupnost WCAG 2.1 AA: kontrast, `alt` texty, ovládání klávesnicí, focus stavy.
- Mobilní menu (hamburger) v náhledu chybí – doplnit.
- Rychlost: obrázky ve WebP/AVIF se `srcset`, lazy-loading mimo hero, video optimalizovat (viz výše).
- SEO: meta title a description pro každou stránku, schema.org `MedicalBusiness` / `LocalBusiness`, Praha 7 – Holešovice.
- GDPR: cookie lišta, zásady ochrany osobních údajů.
- Ceník neveřejný („na vyžádání“), dodací lhůty veřejně v tabulce.
- Volba stacku je na vývoji. Doporučení: statický generátor (např. Astro) a jednoduché CMS pro galerii a texty.

## Média – nahradit vlastními

- Fotky stroje M1 a screenshoty Modellieru jsou od Zirkonzahnu (vodoznak „Zirkonzahn Worldwide“) a video frézování také. **Před spuštěním nahradit vlastními**, nebo mít písemný souhlas Zirkonzahnu či distributora.
- Produktové fotky jsou laboratoře, s pozadím upraveným na bílé.

## Chybí od klienta

Název a logo · adresa, IČO, telefon, e-mail, otevírací doba · roky praxe · dodací lhůty · přesnost (µm) · potvrzení CAD softwaru · podporované implantátové systémy · foto týmu a laboratoře · vlastní video frézování · screen-recording z Modellieru · texty „O nás“.
