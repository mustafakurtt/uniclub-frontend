#!/usr/bin/env bash
#
# Bu makinedeki production frontend'ine deploy eder.
#
#   ./scripts/deploy-local.sh              # HEAD'i deploy et
#   IMAGE_TAG=v1.3.0 ./scripts/deploy-local.sh
#
# Yaptıkları, sırayla:
#   1. İmajı release tag'iyle (VITE_API_BASE_URL=/api gömülü) derle
#   2. uniclub_prod_web container'ını yeni imajla başlat
#   3. nginx / (index.html) yeşil yanana kadar bekle
#   4. Yanmazsa ÖNCEKİ imaja geri dön
#
# Backend deploy-local.sh'ının aksine burada YOK: veritabanı yedeği yok (state
# yok), migration yok, caddy reload yok — Caddyfile backend repo'sunda yaşar ve
# bu deploy onu değiştirmez; container aynı adla geri geldiğinde Caddy sonraki
# istekte adı yeniden çözer.
#
# Dev'e (bun run dev) dokunmaz: ayrı proje, ayrı imaj.

set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT="uniclub-frontend-prod"
COMPOSE_FILE="docker-compose.prod.yml"
CONTAINER="uniclub_prod_web"
IMAGE_NAME="uniclub-frontend"
ENV_FILE="${ENV_FILE:-.env.prod}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-60}"

# Çağıranın verdiği etiketi env dosyasını okumadan ÖNCE yakala: .env.prod içindeki
# IMAGE_TAG bir varsayılandır, deploy edilen sürümün kaynağı değil. Aksi halde her
# imaj aynı adı alır ve geri dönülecek önceki imaj kalmaz.
CLI_IMAGE_TAG="${IMAGE_TAG:-}"

# Frontend'de secret yok; .env.prod opsiyoneldir. Varsa yükle ve compose'a ver.
COMPOSE_ENV_ARGS=()
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
  COMPOSE_ENV_ARGS=(--env-file "$ENV_FILE")
fi

WEB_PORT="${WEB_PORT:-8081}"
NEW_TAG="${CLI_IMAGE_TAG:-$(git rev-parse --short HEAD)}"

compose() {
  docker compose -p "$PROJECT" -f "$COMPOSE_FILE" "${COMPOSE_ENV_ARGS[@]}" "$@"
}

# ── Prod ağı hazır mı? ─────────────────────────────────────────
# web, backend prod stack'inin ağına (uniclub-prod_default) bağlanır. O ağ yoksa
# backend prod stack'i hiç ayağa kalkmamış demektir — anlaşılır bir hata ver.
if ! docker network inspect uniclub-prod_default >/dev/null 2>&1; then
  echo "HATA: 'uniclub-prod_default' ağı yok." >&2
  echo "      Frontend, backend prod stack'inin ağına bağlanır; önce backend'i" >&2
  echo "      ayağa kaldır:  (uniclub-backend) ./scripts/deploy-local.sh" >&2
  exit 1
fi

# Şu an çalışan imajın etiketi — rollback için lazım.
PREV_TAG="$(docker inspect "$CONTAINER" -f '{{.Config.Image}}' 2>/dev/null | sed 's/.*://' || true)"

echo "▶ Deploy (frontend): ${NEW_TAG}   (önceki: ${PREV_TAG:-yok})"

# ── 1. İmajı derle ────────────────────────────────────────────
echo "▶ İmaj derleniyor: ${IMAGE_NAME}:${NEW_TAG}  (VITE_API_BASE_URL=${VITE_API_BASE_URL:-/api})"
IMAGE_TAG="$NEW_TAG" compose build web

# ── 2. Başlat ─────────────────────────────────────────────────
echo "▶ uniclub_prod_web başlatılıyor"
IMAGE_TAG="$NEW_TAG" compose up -d --remove-orphans web

# ── 3. Sağlık kontrolü ────────────────────────────────────────
# nginx'in Dockerfile'daki HEALTHCHECK'i de var; burada dışarıdan doğrularız ki
# "container ayakta ama sayfa gelmiyor" durumunu da yakalayalım.
echo "▶ nginx / bekleniyor (en fazla ${HEALTH_TIMEOUT}s)"
HEALTHY=0
for ((i = 1; i <= HEALTH_TIMEOUT; i++)); do
  if curl -fsS "http://localhost:${WEB_PORT}/" >/dev/null 2>&1; then
    echo "  ✓ ${i}. saniyede sağlıklı (HTTP 200)"
    HEALTHY=1
    break
  fi
  sleep 1
done

# ── 4. Rollback ───────────────────────────────────────────────
if [[ "$HEALTHY" -ne 1 ]]; then
  echo "✗ Sağlık kontrolü BAŞARISIZ. Son loglar:" >&2
  compose logs --tail=30 web >&2 || true

  if [[ -n "$PREV_TAG" && "$PREV_TAG" != "$NEW_TAG" ]] && docker image inspect "${IMAGE_NAME}:${PREV_TAG}" >/dev/null 2>&1; then
    echo "▶ ${PREV_TAG} imajına geri dönülüyor" >&2
    IMAGE_TAG="$PREV_TAG" compose up -d --no-build web
    echo "  ⚠ Geri dönüldü: ${IMAGE_NAME}:${PREV_TAG}" >&2
  else
    echo "  ⚠ Geri dönülecek önceki imaj yok." >&2
  fi
  exit 1
fi

echo
echo "✓ Deploy tamam: ${IMAGE_NAME}:${NEW_TAG}"
echo "  Debug portu : http://localhost:${WEB_PORT}"
echo "  Yayın adresi: https://uniclub.test  (Caddy → uniclub_prod_web)"
