<#
  priprav-video.ps1
  -----------------
  Připraví video na pozadí úvodní sekce (hero) webu Lukeš Lab.

  Co skript dělá:
    1. převede video do černobílé (s volitelným poměrem barevných kanálů, viz -Kanaly),
    2. volitelně ho zesvětlí tónovou křivkou (-Krivka),
    3. odstraní zvukovou stopu,
    4. zmenší ho a zkomprimuje pro web (H.264, "faststart" = video začne hrát dřív, než se celé stáhne),
    5. vytvoří verzi pro počítače, výřez na výšku pro mobily a statický obrázek (poster).

  Výstup (složka video/ v kořeni webu):
    hero-pc.mp4           – verze pro počítače (1280 × 720)
    hero-mobil.mp4        – výřez na výšku pro mobily (540 × 720)
    hero-poster-pc.jpg    – snímek z videa (zobrazí se, než se video načte)
    hero-poster-mobil.jpg – totéž ve výřezu pro mobily

  Použití (PowerShell, v kořeni projektu):
    .\tools\priprav-video.ps1 -Vstup "cesta\k\novemu-videu.mp4"

  Volitelné parametry:
    -Kanaly  podíl červené, zelené a modré při převodu do černobílé (součet = 1).
             Výchozí "0.1,0.3,0.6" bere hlavně modrou – vhodné pro současné video,
             které je nasvícené modře (běžný převod by ho udělal velmi tmavé).
             Pro normálně barevné video použijte "0.3,0.59,0.11".
    -Krivka  tónová křivka "vstup/výstup" (0 = černá, 1 = bílá).
             Výchozí "0/0 1/1" = beze změny. Zesvětlení stínů např. "0/0.03 0.25/0.36 1/1".
    -StredX  kde je ve videu hlavní dění, vodorovně od 0 (vlevo) do 1 (vpravo).
             Podle toho se dělá mobilní výřez. Výchozí 0.62 = fréza v současném videu.
    -Snimek  sekunda videa, ze které se udělá poster (výchozí 12)
    -Ffmpeg  cesta k ffmpeg.exe, pokud není v PATH

  Potřebuje ffmpeg (instalace: winget install Gyan.FFmpeg).
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Vstup,

    [string]$Kanaly = "0.1,0.3,0.6",

    [string]$Krivka = "0/0 1/1",

    [double]$StredX = 0.62,

    [int]$Snimek = 12,

    [string]$Ffmpeg = "ffmpeg"
)

$ErrorActionPreference = "Stop"

# Desetinná tečka i na českých Windows (jinak by z 0.62 bylo "0,62")
$inv = [Globalization.CultureInfo]::InvariantCulture

# Výstupní složka = <kořen projektu>\video
$vystup = Join-Path (Split-Path $PSScriptRoot -Parent) "video"
New-Item -ItemType Directory -Force $vystup | Out-Null

# --- Úprava obrazu ------------------------------------------------------------
# colorchannelmixer: každý výstupní kanál (R, G, B) složíme ze stejného poměru
# vstupních kanálů → vznikne černobílý obraz.
$r, $g, $b = $Kanaly.Split(",")
$cernobile = "colorchannelmixer=" +
    "rr=${r}:rg=${g}:rb=${b}:" +
    "gr=${r}:gg=${g}:gb=${b}:" +
    "br=${r}:bg=${g}:bb=${b}"
$obraz = "$cernobile,curves=all='$Krivka'"

# --- Mobilní výřez ------------------------------------------------------------
# Z videa vyřízneme obdélník na výšku (poměr 3 : 4) se středem v $StredX.
# Výraz pro x hlídá, aby výřez nevyjel mimo obraz.
$stred = $StredX.ToString($inv)
$vyrez = "crop=w=ih*3/4:h=ih:x='max(0,min(iw-ih*3/4,iw*$stred-ih*3/8))':y=0"

# --- Společné parametry kódování ---------------------------------------------
#   -an ................... bez zvuku
#   -c:v libx264 .......... kodek H.264 (přehraje každý prohlížeč)
#   -crf .................. kvalita (vyšší číslo = menší soubor, horší obraz)
#   -preset slow .......... pomalejší kódování, menší soubor
#   -pix_fmt yuv420p ...... nejkompatibilnější barevný formát
#   -movflags +faststart .. přehrávání začne ještě během stahování
$spolecne = @("-an", "-c:v", "libx264", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart")

Write-Host "1/4 Verze pro počítače (1280 × 720)..."
& $Ffmpeg -v error -y -i $Vstup -vf "$obraz,scale=1280:-2,fps=25" -crf 31 @spolecne (Join-Path $vystup "hero-pc.mp4")

Write-Host "2/4 Výřez pro mobily (540 × 720)..."
& $Ffmpeg -v error -y -i $Vstup -vf "$vyrez,$obraz,scale=540:720,fps=25" -crf 32 @spolecne (Join-Path $vystup "hero-mobil.mp4")

Write-Host "3/4 Poster pro počítače (snímek v $Snimek. sekundě)..."
& $Ffmpeg -v error -y -ss $Snimek -i $Vstup -frames:v 1 -vf "$obraz,scale=1280:-2" -q:v 4 (Join-Path $vystup "hero-poster-pc.jpg")

Write-Host "4/4 Poster pro mobily..."
& $Ffmpeg -v error -y -ss $Snimek -i $Vstup -frames:v 1 -vf "$vyrez,$obraz,scale=540:720" -q:v 4 (Join-Path $vystup "hero-poster-mobil.jpg")

Write-Host ""
Write-Host "Hotovo. Velikosti souborů:"
Get-ChildItem $vystup | ForEach-Object { "{0,-18} {1,8:N1} MB" -f $_.Name, ($_.Length / 1MB) }
