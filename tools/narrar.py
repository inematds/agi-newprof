#!/usr/bin/env python3
"""Narração via inemavox (localhost:8010), engine chatterbox, voz rachel (default global).

Uso: python3 narrar.py <projeto_dir>
  lê  <projeto_dir>/assets/txt/sN.txt  (forma-fala já revisada)
  grava <projeto_dir>/assets/audio/sN.wav e imprime duração + volume médio.
Idempotente (pula WAV existente). Falha visível se o áudio sair mudo (< -50 dB).
"""
import json, os, re, subprocess, sys, time, urllib.request, uuid

VOX = 'http://localhost:8010'
REF_DIR = '/home/nmaldaner/projetos/timesmkt3/media/voice-refs'
VOZ = os.environ.get('VOZ', 'rachel')


def dur(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p],
                       capture_output=True, text=True)
    return float(r.stdout.strip() or 0)


def mean_db(p):
    r = subprocess.run(['ffmpeg', '-nostdin', '-i', p, '-af', 'volumedetect', '-f', 'null', '-'],
                       capture_output=True, text=True)
    m = re.search(r'mean_volume: ([-\d.]+) dB', r.stderr)
    return float(m.group(1)) if m else -99.0


def narrar(dest, texto, voz=VOZ):
    ref = f'{REF_DIR}/{voz}.wav'
    cfg = {'text': texto, 'engine': 'chatterbox', 'voice': voz, 'lang': 'pt'}
    b = '----inema' + uuid.uuid4().hex
    partes = [f'--{b}\r\nContent-Disposition: form-data; name="config_json"\r\n\r\n{json.dumps(cfg)}\r\n'.encode(),
              f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="{voz}.wav"\r\n'
              f'Content-Type: audio/wav\r\n\r\n'.encode() + open(ref, 'rb').read() + b'\r\n',
              f'--{b}--\r\n'.encode()]
    r = urllib.request.Request(f'{VOX}/api/jobs/tts/upload', data=b''.join(partes))
    r.add_header('Content-Type', f'multipart/form-data; boundary={b}')
    j = json.loads(urllib.request.urlopen(r, timeout=120).read())
    jid = j.get('job_id') or j.get('id')
    t0 = time.time()
    while time.time() - t0 < 1200:
        d = json.loads(urllib.request.urlopen(f'{VOX}/api/jobs/{jid}', timeout=30).read())
        st = d.get('status')
        if st in ('completed', 'done', 'finished'):
            open(dest, 'wb').write(urllib.request.urlopen(f'{VOX}/api/jobs/{jid}/audio', timeout=180).read())
            return True
        if st in ('failed', 'error'):
            print(f'    job {jid} falhou: {json.dumps(d)[:200]}', flush=True)
            return False
        time.sleep(4)
    print(f'    job {jid} timeout', flush=True)
    return False


def main():
    proj = sys.argv[1]
    txt, aud = os.path.join(proj, 'assets/txt'), os.path.join(proj, 'assets/audio')
    os.makedirs(aud, exist_ok=True)
    ids = sorted([f[:-4] for f in os.listdir(txt) if f.endswith('.txt')],
                 key=lambda s: int(re.sub(r'\D', '', s) or 0))
    res = {}
    for sid in ids:
        dest = os.path.join(aud, sid + '.wav')
        if not os.path.exists(dest):
            ok = narrar(dest, open(os.path.join(txt, sid + '.txt')).read().strip())
            if not ok:
                print(f'  ❌ {sid}', flush=True); continue
        d, db = dur(dest), mean_db(dest)
        flag = '✅' if db > -50 else '🔇 MUDO'
        print(f'  {flag} {sid}: {d:.3f}s  mean {db:.1f} dB', flush=True)
        res[sid] = d
    json.dump(res, open(os.path.join(aud, 'durations.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
