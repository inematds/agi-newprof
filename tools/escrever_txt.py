#!/usr/bin/env python3
"""Escreve assets/txt/sN.txt (forma-fala) e SCRIPT.md de cada vídeo a partir de scripts/roteiro.json."""
import json, os, sys
sys.path.insert(0, '/home/nmaldaner/projetos/videos-agnes')
from revisao import revisar  # números/moeda por extenso p/ TTS

R = json.load(open('scripts/roteiro.json'))
for vid in ('principal', 'reel1', 'reel2', 'reel3'):
    v = R[vid]
    txt = os.path.join(vid, 'assets/txt'); os.makedirs(txt, exist_ok=True)
    md = [f'# {v["titulo"]}\n', f'_{R["fonte"]}_\n']
    cenas = v['cenas'] + [{'img': 'cta', 'tela': 'CONTINUA EM INEMA.CLUB', 'fala': R['cta_fala']}]
    for i, c in enumerate(cenas, 1):
        fala, mud = revisar(c['fala'])
        if mud:
            print(f'  [{vid} s{i}] revisão: {mud}')
        open(os.path.join(txt, f's{i}.txt'), 'w').write(fala + '\n')
        md.append(f'## s{i} · {c.get("kicker", "")}\n- **img:** {c["img"]}\n- **tela:** {c.get("tela", "")}\n- **fala:** {fala}\n')
    open(os.path.join(vid, 'SCRIPT.md'), 'w').write('\n'.join(md))
    print(f'{vid}: {len(cenas)} cenas (inclui CTA)')
