# agi-newprof — YouTube video → analysis → full video + 3 reels

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

## 📖 Usage guide

Complete guide (landing page + step-by-step instructions + the 5 videos): **https://inematds.github.io/agi-newprof/guia/en/**

## What it is

An INEMA local pipeline that turns a YouTube video into: a content analysis, a full narrated video
(16:9 and 9:16), and three 9:16 reels, with images from **inemaimg** (flux2-klein), Agnes
image-to-video hero clips, **inemavox** narration (rachel voice), and **HyperFrames** rendering, delivered
on Telegram (@inemav3bot).

First case: "GPT-6 Astra Doesn't Need Your Instructions Anymore" (Nate B. Jones, 2026-09-06).

## Structure

- `build.mjs` — HyperFrames composition generator (`--video principal|reel1..3 [--vertical] [--out dir]`).
- `tools/` — `gen_img.py` (inemaimg), `agnes_clip.py` (Agnes), `narrar_vc.py` (inemavox), `escrever_txt.py`, `enviar.py` (Telegram).
- `scripts/roteiro.json` — single source for the on-screen text and narration of the 4 videos; generated `SCRIPT-*.md` files.
- `scripts/render.sh` — waits for the narration, runs lint, and renders in high quality.
- `guia/` — landing page + guide (GitHub Pages) with web versions of the videos.
- `capa/capa.png` — official catalog cover.
- `FALHAS.md` — failure log (one line per failure).

The large assets (images, WAVs, high-resolution masters) are stored in `~/projetos/output/agi-newprof/`.
