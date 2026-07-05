# ismargutic.se

Min personliga sida — kod, homelab och dokumentation. En liten, statisk sida
utan byggsteg: ren HTML, en delad stylesheet och en delad script-fil.

## Struktur

```
index.html              landningssida
homelab.html            dokumentation av homelabben (Proxmox/OMV/Immich/Tailscale)
compys.html             min roll som backend lead & delägare på Compys (.NET/Mongo/Azure/Stripe)
status.html             visar rå driftdata
om-sidan.html           hur sidan är byggd och deployad (stack + pipeline)
api/status.json         live-status (pool, backup) — skrivs av servern, inte av handen
css/base.css            delad grund + komponenter
css/homelab.css         stilar unika för homelab-sidan
css/status.css          stilar unika för status-sidan
site.js                 delade interaktioner (tema, typewriter, live-status, m.m.)
scripts/check-links.mjs validerar lokala länkar + JSON (körs i CI)
.github/workflows/      ci.yml (validering) + deploy.yml (rsync till VPS)
```

## Utveckling

Ingen toolchain krävs. Servera mappen lokalt, t.ex.:

```
python3 -m http.server 8000
```

och öppna <http://localhost:8000>.

## CI/CD

Två GitHub Actions-workflows sköter validering och leverans:

- **`ci.yml`** — körs vid varje push/PR. Kontrollerar JS-syntax (`node --check`)
  och kör `scripts/check-links.mjs`, som verifierar att alla lokala `href`/`src`
  pekar på filer som finns och att `api/*.json` parsar.
- **`deploy.yml`** — vid push till `main`: validerar och synkar sedan de statiska
  filerna till VPS:en med `rsync` över SSH.

Deployen läser allt känsligt från **GitHub Secrets** (aldrig committat):

| Secret        | Innehåll                                          |
| ------------- | ------------------------------------------------- |
| `SSH_HOST`    | värdnamn/IP till VPS:en                           |
| `SSH_USER`    | deploy-användare                                  |
| `SSH_KEY`     | privat nyckel (ed25519) för användaren            |
| `KNOWN_HOSTS` | serverns publika nyckel (`ssh-keyscan`)           |
| `DEPLOY_PATH` | sökväg till web-roten som Caddy serverar          |

`api/` exkluderas ur deployen — `status.json` skrivs av servern och ska inte
skrivas över av repots placeholder.

## Drift

Sidan är statisk och serveras av Caddy på en VPS. `api/status.json` uppdateras
av servern; sidorna pollar filen och visar bara siffror och datum publikt —
inga adresser eller sökvägar.
