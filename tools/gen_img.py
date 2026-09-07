#!/usr/bin/env python3
"""Gera imagens no inemaimg (flux2-klein, localhost:8000) a partir de um JSON de prompts.

Uso: python3 gen_img.py prompts.json outdir
  prompts.json = [{"id":"p-s1", "prompt":"...", "w":1344, "h":768, "seed":11}, ...]
Idempotente: pula o que já existe (apague o PNG pra regerar).
"""
import base64, json, os, sys, time, urllib.request

URL = 'http://localhost:8000/generate'
STYLE = (' Cinematic editorial photograph, dark moody atmosphere, deep navy blue shadows with warm amber '
         'highlights and a subtle teal accent, volumetric light, shallow depth of field, film grain, '
         'no text, no letters, no watermark.')


def gerar(prompt, w, h, seed, dest, tentativas=3):
    body = {'model': 'flux2-klein', 'prompt': prompt + STYLE, 'width': w, 'height': h, 'steps': 4, 'seed': seed}
    for t in range(1, tentativas + 1):
        try:
            r = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
            d = json.loads(urllib.request.urlopen(r, timeout=600).read())
            open(dest, 'wb').write(base64.b64decode(d['image']))
            return d.get('generation_time_s')
        except Exception as e:
            print(f'    falha {t}: {str(e)[:120]}', flush=True)
            time.sleep(5 * t)
    return None


def main():
    spec, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    itens = json.load(open(spec))
    so = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None
    for it in itens:
        if so and it['id'] not in so:
            continue
        dest = os.path.join(outdir, it['id'] + '.png')
        if os.path.exists(dest):
            print(f'  = {it["id"]} (existe)', flush=True)
            continue
        t = gerar(it['prompt'], it.get('w', 1344), it.get('h', 768), it.get('seed', 7), dest)
        print(f'  {"✅" if t else "❌"} {it["id"]} {it.get("w")}x{it.get("h")} {t}s', flush=True)


if __name__ == '__main__':
    main()
