#!/usr/bin/env bash
# Espera durations.json de cada vídeo (narração), monta, lint, render high.
# Saída: <video>/<video>-16x9.mp4 e/ou <video>/<video>-9x16.mp4
set -u
cd ~/projetos/output/agi-newprof
esperar() { while [ ! -f "$1/assets/audio/durations.json" ]; do sleep 15; done; }
render() {  # video, flag(--vertical|""), sufixo
  local v="$1" flag="$2" suf="$3"
  node build.mjs --video "$v" $flag | head -1
  (cd "$v" && npx hyperframes lint 2>&1 | grep -E 'error\(s\)') || true
  local nerr; nerr=$(cd "$v" && npx hyperframes lint 2>&1 | grep -oE '[0-9]+ error' | grep -oE '[0-9]+')
  if [ "${nerr:-1}" != "0" ]; then echo "❌ lint $v $suf com erros"; (cd "$v" && npx hyperframes lint 2>&1 | grep '✗'); return 1; fi
  (cd "$v" && npx hyperframes render --quality high --output "$v-$suf.mp4" 2>&1 | grep -E 'MB ·|✗|Error') || true
  ls -la "$v/$v-$suf.mp4" 2>/dev/null
}
for v in "$@"; do
  echo "=== $v (esperando narração)"; esperar "$v"
  # confere que nenhum WAV está mudo
  grep -q '🔇\|❌' scripts/log-narracao.txt && echo "⚠ há WAV mudo/falho no log de narração — conferir"
  if [ "$v" = principal ]; then render principal "" 16x9; render principal --vertical 9x16; else render "$v" "" 9x16; fi
done
echo "=== render.sh concluído: $*"
