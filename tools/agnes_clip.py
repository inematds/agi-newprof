#!/usr/bin/env python3
"""Clipes image-to-video via Agnes (videos-agnes.pipeline.gerar_video), keyframes A→B.

B = A com dolly-in (crop 88% + rescale) → movimento de câmera determinístico e coerente.
Uso: python3 agnes_clip.py jobs.json
  jobs.json = [{"id":"p-s1","png":"img/p-s1.png","w":1312,"h":736,"seg":8,"prompt":"slow dolly in, ..."}]
Idempotente (pula MP4 existente). Rate limit real: 6 req/min → espaça 12s entre submissões.
"""
import json, os, subprocess, sys, time
sys.path.insert(0, '/home/nmaldaner/projetos/videos-agnes')
import pipeline as P  # noqa: E402


def zoom_b(png, dest, w, h):
    # crop central 88% e volta ao tamanho → keyframe B "mais perto"
    cw, ch = int(w * 0.88) // 2 * 2, int(h * 0.88) // 2 * 2
    subprocess.run(['ffmpeg', '-nostdin', '-y', '-loglevel', 'error', '-i', png,
                    '-vf', f'scale={w}:{h},crop={cw}:{ch},scale={w}:{h}:flags=lanczos', dest], check=True)


def main():
    jobs = json.load(open(sys.argv[1]))
    os.makedirs('clips', exist_ok=True)
    for j in jobs:
        dest = f'clips/{j["id"]}.mp4'
        if os.path.exists(dest):
            print(f'  = {j["id"]} existe', flush=True); continue
        w, h = j.get('w', 1312), j.get('h', 736)
        a = f'clips/{j["id"]}-A.png'; b = f'clips/{j["id"]}-B.png'
        subprocess.run(['ffmpeg', '-nostdin', '-y', '-loglevel', 'error', '-i', j['png'], '-vf', f'scale={w}:{h}', a], check=True)
        zoom_b(j['png'], b, w, h)
        frames = P.frames_para(j.get('seg', 8))
        print(f'  ▶ {j["id"]} {w}x{h} {frames} frames', flush=True)
        # gerar_video fixa 1312x736 no body — sobrescreve pelo formato pedido
        body_w, body_h = w, h
        orig = P.gerar_video

        def gv(dest, kf_a, kf_b, prompt, frames, tentativas=4, _w=body_w, _h=body_h):
            import urllib.error
            body = {'model': 'agnes-video-v2.0',
                    'prompt': f'Smooth cinematic camera move between the keyframes: {prompt}. '
                              f'Subtle natural motion, consistent scene, no new objects, no text.',
                    'num_frames': frames, 'frame_rate': P.FPS, 'seed': P.SEED,
                    'width': _w, 'height': _h,
                    'extra_body': {'image': [kf_a, kf_b], 'mode': 'keyframes'}}
            vid = None
            for t in range(1, tentativas + 1):
                try:
                    d = P._post(P.VID_API, body, timeout=300)
                    vid = d.get('video_id') or d.get('task_id') or d.get('id'); break
                except urllib.error.HTTPError as e:
                    print(f'    HTTP {e.code}: {e.read()[:120].decode(errors="ignore")}', flush=True)
                    time.sleep(70 if e.code == 429 else 6 * t)
                except Exception as e:
                    print(f'    erro: {str(e)[:80]}', flush=True); time.sleep(6 * t)
            if not vid:
                print(f'  ❌ {dest} não aceito', flush=True); return None
            json.dump({'video_id': vid}, open(dest + '.job.json', 'w'))
            t0 = time.time()
            while time.time() - t0 < P.ESPERA_VIDEO:
                try:
                    d = P._get(P.VID_GET + vid); st = d.get('status')
                    if st == 'completed':
                        u = d.get('url') or (d.get('data') or [{}])[0].get('url') or d.get('video_url')
                        open(dest, 'wb').write(urllib.request.urlopen(u, timeout=300).read())
                        print(f'  ✅ {dest} {P.dur(dest):.1f}s', flush=True); return dest
                    if st == 'failed':
                        print(f'  ❌ {dest} falhou: {json.dumps(d)[:150]}', flush=True); return None
                except Exception:
                    pass
                time.sleep(12)
            print(f'  ❌ {dest} timeout (video_id={vid})', flush=True); return None

        import urllib.request  # noqa
        gv(dest, P.keyframe(a), P.keyframe(b), j.get('prompt', 'slow dolly in'), frames)
        time.sleep(12)


if __name__ == '__main__':
    main()
