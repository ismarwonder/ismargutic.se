# ismargutic.se

Min personliga sida — kod, homelab och dokumentation. En liten, statisk sida
utan byggsteg: ren HTML, en delad stylesheet och en delad script-fil.

## Struktur

```
index.html        landningssida
homelab.html      dokumentation av homelabben (Proxmox/OMV/Immich/Tailscale)
status.html       visar rå driftdata
api/status.json   live-status (pool, backup) — skrivs av servern, inte av handen
css/base.css      delad grund + komponenter
css/homelab.css   stilar unika för homelab-sidan
css/status.css    stilar unika för status-sidan
site.js           delade interaktioner (tema, typewriter, live-status, m.m.)
```

## Utveckling

Ingen toolchain krävs. Servera mappen lokalt, t.ex.:

```
python3 -m http.server 8000
```

och öppna <http://localhost:8000>.

## Drift

Sidan är statisk och serveras av Caddy på en VPS. `api/status.json` uppdateras
av servern; sidorna pollar filen och visar bara siffror och datum publikt —
inga adresser eller sökvägar.
