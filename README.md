# agi-newprof — vídeo do YouTube → análise → vídeo completo + 3 reels

## 📖 Guia de uso

Guia completo (landing + passo a passo + os 5 vídeos): **https://inematds.github.io/agi-newprof/guia/**

## O que é

Pipeline local INEMA que transforma um vídeo do YouTube em: análise do conteúdo, um vídeo completo
narrado (16:9 e 9:16) e três reels 9:16, com imagens do **inemaimg** (flux2-klein), clipes-herói
image-to-video da **Agnes**, narração **inemavox** (voz rachel) e render **HyperFrames**, entregues
no Telegram (@inemav3bot).

Primeiro caso: "GPT-6 Astra Doesn't Need Your Instructions Anymore" (Nate B. Jones, 2026-09-06).

## Estrutura

- `build.mjs` — gerador de composição HyperFrames (`--video principal|reel1..3 [--vertical] [--out dir]`).
- `tools/` — `gen_img.py` (inemaimg), `agnes_clip.py` (Agnes), `narrar_vc.py` (inemavox), `escrever_txt.py`, `enviar.py` (Telegram).
- `scripts/roteiro.json` — fonte única do texto (tela + fala) dos 4 vídeos; `SCRIPT-*.md` gerados.
- `scripts/render.sh` — espera a narração, faz lint e renderiza em alta.
- `guia/` — página landing+guia (GitHub Pages) com os vídeos em versão web.
- `capa/capa.png` — capa oficial do catálogo.
- `FALHAS.md` — registro de falhas (uma linha por falha).

Os assets pesados (imagens, WAVs, masters em alta) vivem em `~/projetos/output/agi-newprof/`.
