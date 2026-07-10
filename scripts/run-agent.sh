#!/usr/bin/env bash
# Task Scheduler sarmalayıcısı (frontend). Deploy klonuna (~/uniclub-frontend-prod)
# elle kopyalanır; repo'nun kendisinde tutulmaz, çünkü deploy klonu her release'de
# o release'in commit'ine sıfırlanır — repo içindeki bir dosyaya güvenirsek log
# ayarı sürüme bağımlı olur.
#
# Ajanın hangi sürümünü çalıştırırsak çalıştıralım, çıktısı buraya düşer.
set -uo pipefail
DIR="$HOME/uniclub-frontend-prod"
LOG="$DIR/logs/deploy-agent.log"
mkdir -p "$DIR/logs"

echo "──────── $(date '+%Y-%m-%d %H:%M:%S') tetiklendi ────────" >> "$LOG"
LOG_FILE=/dev/null bash "$DIR/scripts/deploy-agent.sh" >> "$LOG" 2>&1
echo "[exit=$?]" >> "$LOG"

# Log şişmesin: son 2000 satırı tut.
if [ "$(wc -l < "$LOG")" -gt 2000 ]; then
  tail -n 2000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi
