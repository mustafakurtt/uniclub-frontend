# Makine Kurulumu ve Devir Teslim — Frontend

İki bilgisayarlı düzende frontend'in yeri: masaüstünde ne yaptığın, laptop'ta
production'a nasıl çıktığı ve backend ile nasıl aynı adreste yaşadığı.

> Bu frontend'in **ayna** dokümanıdır; backend'in aynısı `uniclub-backend`
> repo'sundadır ve reverse proxy, TLS, DNS ve veritabanı o repo'ya aittir.
> Buradaki her şey o düzenin üstüne oturur.

## Genel resim

```
  MASAÜSTÜ (geliştirme)          GITHUB              LAPTOP (production)
    bun run dev :5173   ──push──▶  CI yeşil            deploy-agent.sh
                                   release kes ◀─poll─  (dışarı doğru okuma)
                                                              │
                                                     yerelde `docker build`
                                                              │
                                                     uniclub_prod_web (nginx :80)
                                                              │
                                          Caddy :443 ── / ───▶ frontend
                                                     └ /api ─▶ backend
                                                              │
                                                     https://uniclub.test
```

Masaüstü production'a **hiç dokunmaz**. GitHub'a push eder; laptop GitHub'dan
çeker ve imajı **kendi üzerinde derler** (GHCR yok — backend ile birebir aynı
model). Prod'a çıkmanın **tek yolu release kesmektir**; `dev`'e push
production'ı etkilemez.

---

## Neden tek origin — frontend kökte, backend `/api` altında

Reverse proxy (backend repo'sundaki `deploy/Caddyfile`) tek bir host'u,
`uniclub.test`'i, path'e göre böler:

| Yol | Nereye |
| --- | --- |
| `/api/*`, `/health` | backend (`uniclub_prod_app:3000`) |
| geri kalan her şey | frontend (`uniclub_prod_web:80`, SPA fallback nginx'te) |

Bunun üç somut kazancı var:

1. **Tek imaj her ortamda çalışır.** Vite, `VITE_API_BASE_URL`'i *build anında*
   pakete gömer. Adres göreli (`/api`) olduğu için imaj hangi host'ta servis
   edilirse edilsin doğru backend'i bulur — ortam başına ayrı imaj gerekmez.
2. **CORS tamamen ortadan kalkar** — tarayıcı için tek origin.
3. **WebSocket de aynı origin'den** bağlanır; ayrı bir ws host'u yoktur.
   (`src/features/notifications/socket.ts`, göreli `/api`'yi sayfanın
   konumundan `wss://uniclub.test/api/...`'ya çevirir.)

---

## Şu ana kadar kurulanlar (frontend)

| Ne | Nerede |
| --- | --- |
| CI (lint → typecheck → build + Docker build) | `.github/workflows/ci.yml` |
| İmaj derleme + duman testi (nginx SPA'yı servis ediyor mu) | `.github/workflows/release-check.yml` |
| Production stack (izole) | `docker-compose.prod.yml`, `.env.prod` |
| Statik imaj (Vite build → nginx) | `Dockerfile`, `nginx.conf` |
| Pull-based deploy | `scripts/deploy-agent.sh` → `scripts/deploy-local.sh` |
| Task Scheduler sarmalayıcısı | `scripts/run-agent.sh` |

Reverse proxy, TLS (yerel CA), `hosts` + kök sertifika kurulumu ve `uniclub.test`
host'unun kendisi **backend repo'suna** aittir (`docker-compose.proxy.yml`,
`deploy/Caddyfile`, `scripts/setup-local-dns.ps1`). Frontend yeni bir host
eklemez; yalnızca kökü doldurur.

---

## MASAÜSTÜ — geliştirme makinesi kurulumu

Masaüstü **yalnızca geliştirme** yapar. Production'a ait hiçbir şey oraya gitmez.

### Gerekenler

- [Bun](https://bun.sh) `>= 1.1`
- Çalışan bir backend (dev): `uniclub-backend` içinde `bun run dev` (:3000)
- Docker Desktop (yalnızca prod imajını denemek istersen)

### Adımlar

```sh
git clone https://github.com/mustafakurtt/uniclub-frontend.git
cd uniclub-frontend
git switch dev

bun install
cp .env.example .env      # VITE_API_BASE_URL'i backend'e göster
bun run dev               # http://localhost:5173
```

Dev'de backend ayrı bir origin'de (`http://localhost:3000/api`) çalışır, bu
yüzden `.env`'de mutlak adres kullanılır. Tek-origin (göreli `/api`) yalnızca
proxy arkasındaki prod içindir.

### Masaüstünde YAPMA

- **`.env.prod`'u kopyalama, `docker-compose.prod.yml` ayağa kaldırma.**
  Prod tek yerde (laptop) yaşar.
- **`deploy-agent.sh` çalıştırma, scheduled task kurma.** Deploy laptop'un işi.

---

## Günlük geliştirme akışı

```sh
git switch dev && git pull
# ... kod yaz ...
bun run lint
bun run typecheck
bun run build                # push'tan önce; CI tam olarak bunları koşar
git add -A && git commit -m "feat(clubs): kulüp aramasına filtre ekle"
git push
```

Yayınlamaya hazır olunca (backend ile **aynı** akış):

```sh
gh pr create --base main --head dev --title "release: v1.3.0"
gh pr merge --merge          # dev ile main ayrışmasın diye squash değil merge
git switch main && git pull
git tag -a v1.3.0 -m "v1.3.0" && git push origin v1.3.0
gh release create v1.3.0 --generate-notes
```

Laptop uyanıksa 5 dakika içinde `v1.3.0`'ı kendi kendine deploy eder.
`main`'e doğrudan push **edemezsin** — koruma reddeder: `CI` yeşil olmadan
merge yok.

---

## LAPTOP — production kurulumu (ilk sefer)

Frontend, backend prod stack'inin **yanında** çalışır ve onun docker ağını
kullanır. Bu yüzden **önce backend prod'u ayağa kalkmış olmalı** (o,
`uniclub-prod_default` ağını ve `uniclub_prod_web`'e giden Caddy rotasını
sağlar).

### 1. gh CLI ile giriş

```sh
gh auth login            # ajan release'leri OKUMAK için gh kullanır
```

### 2. Deploy klonunu ilk kez oluştur

Ajan bunu ilk koşuda kendi yapar, ama elle de başlatabilirsin:

```sh
mkdir -p ~/uniclub-frontend-prod
cd ~/uniclub-frontend-prod
git init && git remote add origin https://github.com/mustafakurtt/uniclub-frontend.git
git fetch --tags origin
# (opsiyonel) ağ/port ayarı — secret yok:
# cp <repo>/.env.prod.example .env.prod
```

### 3. Task Scheduler görevi

Ajan sarmalayıcısını klona kopyala ve 5 dakikada bir çalışacak bir görev kur:

```powershell
Copy-Item <repo>\scripts\run-agent.sh $HOME\uniclub-frontend-prod\run-agent.sh

$bash = "C:\Program Files\Git\bin\bash.exe"
$action  = New-ScheduledTaskAction -Execute $bash -Argument "$HOME\uniclub-frontend-prod\run-agent.sh"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
             -RepetitionInterval (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName "uniclub-frontend-deploy-agent" `
  -Action $action -Trigger $trigger -Description "UniClub frontend pull-based deploy"
```

> Görev adı backend'inkinden (`uniclub-deploy-agent`) **farklı**
> (`uniclub-frontend-deploy-agent`) — iki ajan bağımsız çalışır.

---

## Push'tan production'a: ne oluyor, nereden izlenir

### 1. `dev`/`main`'e push → CI

`CI` (lint → typecheck → build → Docker build) ve `Release check` (imajı derle,
nginx'i çalıştır, `/` ve derin bir SPA rotası 200 mü diye bak) koşar.
**Production'a hiçbir şey olmaz.**

```sh
gh run list --branch dev --limit 3
gh run watch
```

### 2. Release kesmek — deploy'un insan kapısı

```sh
git switch main && git pull
git tag -a v1.3.0 -m "v1.3.0" && git push origin v1.3.0
gh release create v1.3.0 --generate-notes
```

Bu, prod'a çıkışın **tek tetikleyicisidir**.

### 3. Ajan devralır (laptop, 5 dakikada bir)

`~/uniclub-frontend-prod/run-agent.sh` → `deploy-agent.sh`. Ajan sırayla:

1. En son release'i sorar (`gh api .../releases/latest`)
2. Çalışan imaj etiketiyle karşılaştırır (`docker inspect uniclub_prod_web`)
3. Farklıysa **o commit'in `CI`'ı yeşil mi** diye bakar — değilse deploy etmez
4. Deploy klonunu o commit'e alır
5. `deploy-local.sh`'a devreder

`deploy-local.sh` ise: imajı release tag'iyle (`VITE_API_BASE_URL=/api` gömülü)
**derle** → `uniclub_prod_web`'i yeniden başlat → nginx `/` 200 dönene kadar
bekle → yanmazsa **önceki imaja geri dön**. Veritabanı olmadığı için yedek ve
migration yoktur; rollback yalnızca imajı geri alır.

Caddy `uniclub_prod_web`'e adıyla ulaştığından ve container aynı adla geri
geldiğinden **proxy reload gerekmez** — Docker DNS bir sonraki istekte yeni
container'ı çözer. (Backend deploy-local'ı Caddyfile'ı sahiplendiği için reload
eder; frontend etmez.)

### 4. İzleme

```sh
bun run deploy:logs     # ajanın canlı akışı
bun run deploy:agent    # elle tetikle, beklemeden gör
bun run prod:ps         # container ve sağlık durumu
bun run prod:logs       # nginx erişim logları
docker inspect uniclub_prod_web -f '{{.Config.Image}}'   # hangi sürüm çalışıyor
```

```powershell
Get-ScheduledTaskInfo -TaskName "uniclub-frontend-deploy-agent"
Start-ScheduledTask   -TaskName "uniclub-frontend-deploy-agent"
```

---

## Sorun giderme

| Belirti | Sebep | Çözüm |
| --- | --- | --- |
| `deploy-local.sh`: "'uniclub-prod_default' ağı yok" | Backend prod ayağa kalkmamış | Önce backend'i deploy et (`uniclub-backend` → `deploy-local.sh`) |
| `https://uniclub.test` → "Frontend henüz deploy edilmedi" | Frontend container yok | `bun run deploy:agent` (ya da bir release kes) |
| Sayfa geliyor ama `/api` çağrıları 404 | Backend `/api` altında değil / proxy rotası bozuk | Backend `deploy/Caddyfile` ve `bun run prod:ps` |
| Tarayıcı sertifika uyarısı | Kök sertifika kurulu değil | Backend'in `setup-local-dns.ps1`'i (frontend'in değil) |
| Deploy olmuyor | Release kesilmemiş ya da `CI` yeşil değil | `gh release list`, `gh run list` |
| WebSocket bağlanmıyor (prod) | Göreli `/api` sağlam çözülmüyor | `socket.ts` `wsBaseUrl()` sayfa origin'ini kullanmalı; TLS kökü kurulu mu? |
| `bun run dev` "port in use" | Eski bir vite süreci | `tasklist \| findstr bun` → `taskkill /PID <pid> /F` |
