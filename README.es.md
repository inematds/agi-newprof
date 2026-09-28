# agi-newprof — video de YouTube → análisis → video completo + 3 reels

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

## 📖 Guía de uso

Guía completa (landing + paso a paso + los 5 videos): **https://inematds.github.io/agi-newprof/guia/es/**

## Qué es

Pipeline local de INEMA que transforma un video de YouTube en: análisis del contenido, un video completo
narrado (16:9 y 9:16) y tres reels 9:16, con imágenes de **inemaimg** (flux2-klein), clips hero
image-to-video de **Agnes**, narración de **inemavox** (voz rachel) y renderizado con **HyperFrames**, entregados
en Telegram (@inemav3bot).

Primer caso: "GPT-6 Astra Doesn't Need Your Instructions Anymore" (Nate B. Jones, 2026-09-06).

## Estructura

- `build.mjs` — generador de composición HyperFrames (`--video principal|reel1..3 [--vertical] [--out dir]`).
- `tools/` — `gen_img.py` (inemaimg), `agnes_clip.py` (Agnes), `narrar_vc.py` (inemavox), `escrever_txt.py`, `enviar.py` (Telegram).
- `scripts/roteiro.json` — fuente única del texto (pantalla + voz) de los 4 videos; `SCRIPT-*.md` generados.
- `scripts/render.sh` — espera la narración, ejecuta lint y renderiza en alta calidad.
- `guia/` — página landing+guía (GitHub Pages) con los videos en versión web.
- `capa/capa.png` — portada oficial del catálogo.
- `FALHAS.md` — registro de fallas (una línea por falla).

Los assets pesados (imágenes, WAVs, masters en alta) están en `~/projetos/output/agi-newprof/`.
