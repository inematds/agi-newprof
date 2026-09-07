#!/usr/bin/env python3
"""Envia texto/vídeo pro Telegram via @inemav3bot (token openpcbotv3, chat ALLOWED_CHAT_ID do openpcbotv2).

Uso: python3 enviar.py texto "mensagem"
     python3 enviar.py video arquivo.mp4 "legenda" [WxH]
"""
import json, os, subprocess, sys, urllib.request, uuid


def env(path):
    d = {}
    for line in open(path):
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1); d[k] = v.strip().strip('"').strip("'")
    return d


TOKEN = env('/home/nmaldaner/projetos/openpcbotv3/.env')['TELEGRAM_BOT_TOKEN_V3']
CHAT = env('/home/nmaldaner/projetos/openpcbotv2/.env')['ALLOWED_CHAT_ID']
API = f'https://api.telegram.org/bot{TOKEN}'


def texto(msg):
    body = json.dumps({'chat_id': CHAT, 'text': msg, 'parse_mode': 'HTML', 'disable_web_page_preview': True}).encode()
    r = urllib.request.Request(f'{API}/sendMessage', data=body, headers={'Content-Type': 'application/json'})
    d = json.loads(urllib.request.urlopen(r, timeout=60).read())
    print('✅ texto' if d.get('ok') else f'❌ {d}')
    return d.get('ok')


def video(path, legenda, wh=None):
    size = os.path.getsize(path)
    if size > 49 * 1024 * 1024:
        print(f'❌ {path} tem {size//1048576}MB (> 49MB) — comprimir antes'); return False
    b = '----tg' + uuid.uuid4().hex
    campos = [('chat_id', CHAT), ('caption', legenda), ('parse_mode', 'HTML'), ('supports_streaming', 'true')]
    if wh:
        w, h = wh.split('x'); campos += [('width', w), ('height', h)]
    p = []
    for k, v in campos:
        p.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    p.append(f'--{b}\r\nContent-Disposition: form-data; name="video"; filename="{os.path.basename(path)}"\r\n'
             f'Content-Type: video/mp4\r\n\r\n'.encode() + open(path, 'rb').read() + b'\r\n')
    p.append(f'--{b}--\r\n'.encode())
    r = urllib.request.Request(f'{API}/sendVideo', data=b''.join(p))
    r.add_header('Content-Type', f'multipart/form-data; boundary={b}')
    d = json.loads(urllib.request.urlopen(r, timeout=900).read())
    print(f'{"✅" if d.get("ok") else "❌"} {os.path.basename(path)} ({size//1048576}MB) {"" if d.get("ok") else d}')
    return d.get('ok')


if __name__ == '__main__':
    if sys.argv[1] == 'texto':
        texto(sys.argv[2])
    else:
        video(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else None)
