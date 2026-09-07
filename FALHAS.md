# FALHAS — agi-newprof

| data | o que quebrou | menor correção | prompt \| infra |
|---|---|---|---|
| 2026-09-07 | Narração via daemon inemavox (`/api/jobs/tts/upload`, engine `chatterbox`) morria com "Connection refused": o `systemd-oomd` mata o `inemavox-api.service` (SIGKILL, pressão de memória Avg10 74%) toda vez que o chatterbox carrega o modelo T3 — host com 83 GB usados (Ollama 22 GB residente + inemaimg 25 GB). O chatterbox puro direto pelo `tts_direct.py` também morre (exit 137). | Trocar pra `--engine chatterbox-vc` (Edge + conversão de timbre, modelo menor) chamando `tts_direct.py` direto, cada cena num `systemd-run --user --scope` próprio (`tools/narrar_vc.py`). Proteção que faltava: checar `mean_volume` do WAV e não depender do daemon quando o host está sob pressão. | infra |
| 2026-09-07 | `musica_v1.py` (inemavox) falhou "FREESOUND_API_KEY not set" — a chave existe em `~/projetos/inemavox/.env`, mas o script lê só `os.environ`. | Rodar com `set -a; . ./.env` antes. | infra |
