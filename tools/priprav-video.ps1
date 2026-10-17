<#
  priprav-video.ps1
  -----------------
  Připraví video na pozadí úvodní sekce (hero) webu Lukeš Lab.

  Co skript dělá:
    1. převede video do černobílé,
    2. zesvětlí ho (tmavá místa zvedne víc než světlá),
    3. odstraní zvukovou stopu,
    4. zmenší ho a zkomprimuje pro web (H.264, "faststart" = video začne hrát dřív, než se celé stáhne),
    5. vytvoří dvě verze (počítač a mobil) a statický obrázek (poster), který se ukáže, než se video načte.

  Výstup (složka video/ v kořeni webu):
    hero-1280.mp4   – verze pro počítače (šířka 1280 px)
    hero-720.mp4    – lehčí verze pro mobily (šířka 720 px)
    hero-poster.jpg – snímek z videa

  Použití (PowerShell, v kořeni projektu):
    .\tools\priprav-video.ps1 -Vstup "cesta\k\novemu-videu.mp4"

  Volitelné parametry:
    -Snimek  sekunda videa, ze které se udělá poster (výchozí 12)
    -Ffmpeg  cesta k ffmpeg.exe, pokud není v PATH

  Potřebuje ffmpeg (instalace: winget install Gyan.FFmpeg).
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Vstup,

    [int]$Snimek = 12,

    [string]$Ffmpeg = "ffmpeg"
)

$ErrorActionPreference = "Stop"

# Výstupní složka = <kořen projektu>\video
$vystup = Join-Path (Split-Path $PSScriptRoot -Parent) "video"
New-Item -ItemType Directory -Force $vystup | Out-Null

# Úprava obrazu:
#   hue=s=0 ...... odebere barvy (černobílé)
#   curves ....... tónová křivka "vstup/výstup" (0 = černá, 1 = bílá);
#                  stíny zvedá výrazně, světla jen mírně, aby se nepřepálila.
#                  Pokud bude nové video světlejší, stačí křivku zmírnit,
#                  např. '0/0.02 0.25/0.35 1/1'.
$obraz = "hue=s=0,curves=all='0/0.06 0.08/0.25 0.25/0.5 0.6/0.8 1/1'"

# Společné parametry kódování:
#   -an ................... bez zvuku
#   -c:v libx264 .......... kodek H.264 (přehraje každý prohlížeč)
#   -crf .................. kvalita (vyšší číslo = menší soubor, horší obraz)
#   -preset slow .......... pomalejší kódování, menší soubor
#   -pix_fmt yuv420p ...... nejkompatibilnější barevný formát
#   -movflags +faststart .. přehrávání začne ještě během stahování
$spolecne = @("-an", "-c:v", "libx264", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart")

Write-Host "1/3 Verze pro počítače (1280 px)..."
& $Ffmpeg -v error -y -i $Vstup -vf "$obraz,scale=1280:-2,fps=25" -crf 31 @spolecne (Join-Path $vystup "hero-1280.mp4")

Write-Host "2/3 Verze pro mobily (720 px)..."
& $Ffmpeg -v error -y -i $Vstup -vf "$obraz,scale=720:-2,fps=25" -crf 30 @spolecne (Join-Path $vystup "hero-720.mp4")

Write-Host "3/3 Poster (snímek v $Snimek. sekundě)..."
& $Ffmpeg -v error -y -ss $Snimek -i $Vstup -frames:v 1 -vf "$obraz,scale=1280:-2" -q:v 4 (Join-Path $vystup "hero-poster.jpg")

Write-Host ""
Write-Host "Hotovo. Velikosti souborů:"
Get-ChildItem $vystup | ForEach-Object { "{0,-18} {1,8:N1} MB" -f $_.Name, ($_.Length / 1MB) }
