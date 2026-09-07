#!/usr/bin/env python3
"""Narração via tts_direct.py (engine chatterbox-vc, voz rachel) — SEM passar pelo daemon do inemavox.

Motivo (2026-09-07): o systemd-oomd mata o inemavox-api (e o chatterbox puro) por pressão de memória
ao carregar o modelo T3; o chatterbox-vc (Edge TTS + conversão de timbre) carrega um modelo menor e passa.
Cada chamada roda num scope systemd próprio (blast radius contido se o oomd matar).

Uso: python3 narrar_vc.py <projeto_dir>   (idempotente; grava assets/audio/sN.wav + durations.json)
"""
import json, os, re, shutil, subprocess, sys, tempfile

TTS = os.path.expanduser('~/projetos/inemavox/tts_direct.py')
REF = f'/home/nmaldaner/projetos/timesmkt3/media/voice-refs/{os.environ.get("VOZ", "rachel")}.wav'
ENV = dict(os.environ, XDG_RUNTIME_DIR=f'/run/user/{os.getuid()}',
           DBUS_SESSION_BUS_ADDRESS=f'unix:path=/run/user/{os.getuid()}/bus')


def dur(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p],
                       capture_output=True, text=True)
    return float(r.stdout.strip() or 0)


def mean_db(p):
    r = subprocess.run(['ffmpeg', '-nostdin', '-i', p, '-af', 'volumedetect', '-f', 'null', '-'],
                       capture_output=True, text=True)
    m = re.search(r'mean_volume: ([-\d.]+) dB', r.stderr)
    return float(m.group(1)) if m else -99.0


def gerar(texto, dest, tentativas=3):
    for t in range(1, tentativas + 1):
        tmp = tempfile.mkdtemp(prefix='ttsvc-')
        cmd = ['systemd-run', '--user', '--scope', '--quiet', f'--unit=tts-agi-{os.getpid()}-{t}',
               'python3', TTS, '--text', texto, '--lang', 'pt', '--engine', 'chatterbox-vc', '--ref', REF, '--outdir', tmp]
        r = subprocess.run(cmd, env=ENV, capture_output=True, text=True, timeout=900)
        out = os.path.join(tmp, 'generated.wav')
        if r.returncode == 0 and os.path.exists(out) and mean_db(out) > -50:
            shutil.move(out, dest); shutil.rmtree(tmp, ignore_errors=True)
            return True
        print(f'    tentativa {t} falhou (exit {r.returncode}): {(r.stdout + r.stderr)[-200:]}', flush=True)
        shutil.rmtree(tmp, ignore_errors=True)
    return False


def main():
    proj = sys.argv[1]
    txt, aud = os.path.join(proj, 'assets/txt'), os.path.join(proj, 'assets/audio')
    os.makedirs(aud, exist_ok=True)
    ids = sorted([f[:-4] for f in os.listdir(txt) if f.endswith('.txt')], key=lambda s: int(re.sub(r'\D', '', s) or 0))
    res = {}
    for sid in ids:
        dest = os.path.join(aud, sid + '.wav')
        if not os.path.exists(dest):
            if not gerar(open(os.path.join(txt, sid + '.txt')).read().strip(), dest):
                print(f'  ❌ {sid}', flush=True); continue
        d, db = dur(dest), mean_db(dest)
        print(f'  {"✅" if db > -50 else "🔇 MUDO"} {sid}: {d:.3f}s  mean {db:.1f} dB', flush=True)
        res[sid] = d
    json.dump(res, open(os.path.join(aud, 'durations.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
