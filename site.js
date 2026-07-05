/* ismargutic.se — shared interactions */
(function () {
  "use strict";

  var STORAGE_THEME = "ismargutic-theme";
  var STATUS_URL = "api/status.json";
  var STATUS_INTERVAL = 60000;

  /* ── theme ── */
  function initTheme() {
    var btn = document.getElementById("theme-toggle");
    var stored = localStorage.getItem(STORAGE_THEME);
    if (stored) document.documentElement.setAttribute("data-theme", stored);
    if (!btn) return;
    btn.addEventListener("click", function () {
      var root = document.documentElement;
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem(STORAGE_THEME, next);
      btn.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
      btn.textContent = next === "dark" ? "☀" : "☾";
    });
    var current = document.documentElement.getAttribute("data-theme") || "light";
    if (localStorage.getItem(STORAGE_THEME)) {
      btn.setAttribute("aria-pressed", current === "dark" ? "true" : "false");
      btn.textContent = current === "dark" ? "☀" : "☾";
    }
  }

  /* ── live status ── */
  function formatRelative(iso) {
    if (!iso) return "okänd";
    var diff = Date.now() - new Date(iso).getTime();
    var h = Math.floor(diff / 3600000);
    if (h < 1) return "nyss";
    if (h < 24) return h + " h sedan";
    var d = Math.floor(h / 24);
    return d + " d sedan";
  }

  function initStatus() {
    var bar = document.getElementById("live-status");
    if (!bar || bar.getAttribute("data-status-mode") !== "homelab") return;

    function render(data) {
      var dot = bar.querySelector("[data-status-dot]");
      var h = data.homelab;
      if (!h) return;
      var ok = h.proxmox === "ok" && h.backup === "ok";
      if (h.backup === "stale") ok = false;
      var pool =
        h.pool_used_tb != null && h.pool_total_tb != null
          ? h.pool_used_tb + "/" + h.pool_total_tb + " TB"
          : "pool ?";
      setText(bar, "pool", pool);
      setText(
        bar,
        "backup",
        h.last_nightly
          ? "nattbackup · " + formatRelative(h.last_nightly)
          : "nattbackup · okänd"
      );
      setText(
        bar,
        "usb",
        h.last_offline
          ? "USB-backup · " + formatRelative(h.last_offline)
          : "USB-backup · aldrig?"
      );
      if (dot) {
        dot.classList.toggle("status-dot--warn", !ok);
        dot.classList.toggle("status-dot--ok", ok);
      }
    }

    function setText(root, key, val) {
      var el = root.querySelector('[data-status="' + key + '"]');
      if (el) el.textContent = val;
    }

    function poll() {
      fetch(STATUS_URL + "?t=" + Date.now(), { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) { if (data) render(data); })
        .catch(function () { /* static fallback stays */ });
    }
    poll();
    setInterval(poll, STATUS_INTERVAL);
  }

  /* ── iCloud calculator ── */
  function initIcloud() {
    var slider = document.getElementById("icloud-years");
    var yearsEl = document.getElementById("icloud-years-val");
    var totalEl = document.getElementById("icloud-total");
    if (!slider || !yearsEl || !totalEl) return;
    var yearsLabel = document.getElementById("icloud-years-label");
    var totalPlain = document.getElementById("icloud-total-plain");
    var monthly = 129;
    function update() {
      var years = Number(slider.value);
      var total = (monthly * 12 * years).toLocaleString("sv-SE");
      yearsEl.textContent = years;
      totalEl.textContent = total;
      if (yearsLabel) yearsLabel.textContent = years;
      if (totalPlain) totalPlain.textContent = total;
    }
    slider.addEventListener("input", update);
    update();
  }

  /* ── backup scenario sim ── */
  function initBackupSim() {
    var root = document.getElementById("backup-sim");
    if (!root) return;
    var layers = root.querySelectorAll(".backup-layer");
    var result = root.querySelector(".backup-sim-result");
    function scenarios() {
      return {
        delete: {
          active: [2, 3],
          text: root.getAttribute("data-sc-delete")
        },
        disk: {
          active: [1],
          text: root.getAttribute("data-sc-disk")
        },
        fire: {
          active: [3],
          text: root.getAttribute("data-sc-fire")
        }
      };
    }
    root.querySelectorAll("[data-scenario]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var s = scenarios()[btn.getAttribute("data-scenario")];
        layers.forEach(function (l, i) {
          l.classList.toggle("backup-layer--active", s.active.indexOf(i + 1) >= 0);
        });
        result.textContent = s.text;
        root.querySelectorAll("[data-scenario]").forEach(function (b) {
          b.classList.toggle("backup-sim-btn--active", b === btn);
        });
      });
    });
  }

  /* ── network map hover ── */
  function initNetMap() {
    var map = document.getElementById("net-map");
    if (!map) return;
    var routes = {
      public: ["internet", "vps", "tailscale", "proxmox"],
      photos: ["immich", "nfs", "omv", "pool"],
      storage: ["proxmox", "omv", "pool", "usb"]
    };
    map.querySelectorAll(".net-node").forEach(function (node) {
      function activate() {
        var route = routes[node.getAttribute("data-route")] || [node.getAttribute("data-id")];
        map.querySelectorAll(".net-node").forEach(function (n) {
          n.classList.toggle("net-node--active", route.indexOf(n.getAttribute("data-id")) >= 0);
        });
        map.querySelectorAll(".net-edge").forEach(function (e) {
          var from = e.getAttribute("data-from");
          var to = e.getAttribute("data-to");
          var fi = route.indexOf(from);
          var ti = route.indexOf(to);
          var adj = fi >= 0 && ti >= 0 && Math.abs(fi - ti) === 1;
          e.classList.toggle("net-edge--active", adj);
        });
      }
      function reset() {
        map.querySelectorAll(".net-node, .net-edge").forEach(function (el) {
          el.classList.remove("net-node--active", "net-edge--active");
        });
      }
      node.addEventListener("mouseenter", activate);
      node.addEventListener("focus", activate);
      node.addEventListener("mouseleave", reset);
      node.addEventListener("blur", reset);
    });
  }

  /* ── typewriter ── */
  function typeText(el, text, opts) {
    opts = opts || {};
    text = text.trim().replace(/\s+/g, " ");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.textContent = text;
      return;
    }

    var mode = opts.mode || "char";
    var delay = opts.ms != null ? opts.ms : (mode === "words" ? 24 : 30);
    var startDelay = opts.startDelay != null ? opts.startDelay : 0;
    var i = 0;

    el.textContent = "";
    el.classList.add("cursor-line--typing");
    el.setAttribute("aria-busy", "true");

    function done() {
      el.classList.remove("cursor-line--typing");
      el.removeAttribute("aria-busy");
    }

    function tickWord() {
      if (i >= words.length) {
        done();
        return;
      }
      if (i > 0) el.textContent += " ";
      el.textContent += words[i];
      i += 1;
      setTimeout(tickWord, delay);
    }

    function tickChar() {
      if (i >= text.length) {
        done();
        return;
      }
      el.textContent += text.charAt(i);
      i += 1;
      setTimeout(tickChar, delay);
    }

    var words = text.split(" ");
    setTimeout(mode === "words" ? tickWord : tickChar, startDelay);
  }

  function initTypewriter() {
    if (document.documentElement.classList.contains("homelab-plain")) return;
    document.querySelectorAll("[data-typewriter]").forEach(function (el) {
      var text = el.getAttribute("data-typewriter-text") || el.textContent;
      typeText(el, text, {
        mode: el.getAttribute("data-typewriter-mode") || "char",
        ms: Number(el.getAttribute("data-typewriter-ms")) || undefined,
        startDelay: Number(el.getAttribute("data-typewriter-delay")) || 400
      });
    });
  }

  /* ── homelab plain mode ── */
  /* plain = samma fakta som tech-läget, fast förklarat som för ett barn — inte en annan story */
  var HOMELAB_PLAIN = {
    "hero-em": "Och varför jag skrev ner allt.",
    "hero-intro": "Jag har mina egna bilder och filer sparade på en dator hemma, i stället för hos stora företag. Inte för att det är häftigt — utan för att jag vill veta var mina saker faktiskt ligger. Det mesta av tiden har inte gått åt till att sätta upp saker, utan till att lista ut varför något slutade funka — och skriva ner svaret så att jag minns det nästa gång.",
    "hero-aside": "Det här är ingen stor serverhall. Det är en liten begagnad dator i ett hörn (en Lenovo M70q), ett par extra hårddiskar och en massa anteckningar. Det du läser här är kortversionen — den riktiga manualen skriver jag för mig själv.",
    "status-lead": "Den här raden fyller i sig själv med riktiga siffror från datorn hemma. Det är inget jag skrivit för hand.",
    "status-dd-pool": "Hur full lagringen är — hur mycket plats som redan är använd.",
    "status-dd-natt": "När datorn senast tog en säkerhetskopia på natten.",
    "status-dd-usb": "När den extra USB-disken senast blev färdigkopierad — sätt i sladden, vänta, dra ur.",
    "tldr-tag": "historien i korthet",
    "tldr-meta": "hela sidan i korthet · ~3 min",
    "git1-subject": "Första testet: en USB-sticka i speldatorn",
    "git1-body": "Jag testade allt på en USB-sticka och en gammal hårddisk kopplad till speldatorn. Ett billigt sätt att prova — men datorn blev varm och seg när jag ville spela.",
    "git2-subject": "En egen liten dator (Lenovo M70q) + två stora diskar",
    "git2-body": "Köpte en begagnad minidator och två stora hårddiskar. Nu kan allt vara igång dygnet runt utan att störa speldatorn.",
    "git3-subject": "Proxmox kör programmen, OMV sköter diskarna",
    "git3-body": "Datorn är uppdelad i små separata \"lådor\". En låda (OMV) sköter bara hårddiskarna och kopiorna. Bildalbumet (Immich) hämtar sina foton därifrån utan att behöva veta hur det funkar inuti.",
    "git4-subject": "Backup: tre lager, en sladd",
    "git4-body": "Ett skydd om en disk går sönder. En kopia varje natt. Och en USB-disk som jag kopplar in ibland och sen drar ur. Samma disk kan rädda mig om något större går sönder.",
    "git5-subject": "Ut på nätet: sidan syns, hemmet är stängt",
    "git5-body": "ismargutic.se går för vem som helst att besöka, men ingen släpps in i mitt hemnät. Min telefon når mina grejer hemifrån via en privat, säker tunnel (Tailscale).",
    "tldr-today-label": "idag",
    "tldr-today-body": "En liten dator hemma (Lenovo M70q) med två stora diskar. Eget bildalbum (Immich) i stället för att hyra plats hos iCloud. Jag når allt hemifrån på ett säkert sätt (Tailscale), och den här sidan ligger på en hyrd dator ute på nätet. Kopiorna sköter sig själva på natten; USB-kopian behöver bara rätt sladd. Det svåraste var inte att välja program — utan att våga lita på att bilderna verkligen är trygga.",
    "vad-h2": "Vad som faktiskt tog tid",
    "vad-p1": "Att sätta upp allt tar en helg. Att hålla igång det i åratal är det svåra. Det mesta jag lärt mig kom när något gick sönder: en backup jag inte vågade lita på, ett nätverk som såg rätt ut hemma men inte utifrån, och en webbadress som skulle funka utan att öppna hela hemmet för främlingar.",
    "vad-p2": "Så det här handlar mindre om vilka program jag valde — och mer om problemen som dök upp och hur jag löste dem.",
    "net-hint": "peka på en ruta — så lyser vägen upp",
    "infra-h2": "Proxmox och OMV: en kör programmen, en sköter diskarna",
    "infra-p1": "Det började inte så fint. Först körde jag allt från en USB-sticka i speldatorn, med en gammal hårddisk som enda lagring. Ett billigt sätt att testa om det här var något för mig. Det funkade — men speldatorn blev varm och seg när jag ville spela.",
    "infra-p2": "Så jag köpte en begagnad liten dator (en Lenovo M70q) och två stora hårddiskar. Nu kan allt vara igång dygnet runt utan att störa speldatorn. Bonus: jag vågar prova nya saker utan att vara rädd att förstöra allt, för datorn kan spara \"lägen\" som jag kan gå tillbaka till.",
    "infra-p3": "Jag delade upp jobbet med flit. Ett program som heter Proxmox sköter själva datorn och kör varje app i sin egen lilla låda. Ett annat som heter OMV är som en \"dator i datorn\" och tar bara hand om det tråkiga men viktiga: hårddiskarna, kopiorna och skyddet mot att förlora något.",
    "infra-p4": "Bildalbumet (Immich) behöver inte veta hur skyddet funkar — det hittar bara sina bilder i en mapp. Och OMV behöver inte veta något om bildalbumet — det lämnar bara ut filerna. När något krånglar vet jag ungefär vilken del jag ska titta på först.",
    "proxmox-h3": "Proxmox — kör alla program",
    "proxmox-p": "Den lilla datorn hemma (Lenovo M70q). Det är här allt startas.",
    "proxmox-li1": "Kör varje program i sin egen lilla låda (Immich, Tailscale …)",
    "proxmox-li2": "Disk-skötaren OMV kör som en egen \"dator i datorn\"",
    "proxmox-li3": "Hårddiskarna kopplas rakt in till OMV",
    "proxmox-li4": "Sparar sina inställningar en gång i veckan, ifall allt måste byggas om",
    "omv-h3": "OMV — sköter diskarna",
    "omv-p": "Den del som tar hand om allt som ska sparas.",
    "omv-li1": "Slår ihop två diskar så de ser ut som en enda stor mapp",
    "omv-li2": "Har ett skydd som kan återskapa filer om en disk dör",
    "omv-li3": "En USB-disk för en extra kopia, som kopplas in ibland",
    "omv-li4": "Kör några extra program som hör hemma nära filerna",
    "omv-li5": "Skickar bilderna vidare till bildalbumet (Immich)",
    "projekt-h2": "Fyra saker som inte var självklara",
    "photo-tag": "foton",
    "photo-h3": "Foton som andra faktiskt bryr sig om",
    "photo-lead": "Apple ville ha 129 kr i månaden för att förvara mina bilder i iCloud — i praktiken resten av livet. Räknar man på det blir det tiotusentals kronor för bilder jag redan äger.",
    "photo-p1": "Då blev mitt eget bildalbum (ett program som heter Immich) ett ekonomiskt beslut, inte ett teknikexperiment. Att flytta alla bilder från iCloud tog tid — jag fick exportera dem i omgångar — men målet var enkelt: sluta betala hyra varje månad för samma foton.",
    "photo-p2": "Sen gällde det att våga lita på att det håller. Det räcker inte att bilderna ligger hemma — jag måste veta vad som händer om en disk går sönder. Så: skydd mot att en disk dör, en extra kopia som ligger frånkopplad, en kopia varje natt, och ett mejl till mig om något går fel.",
    "photo-note": "immich · flytt från icloud · backup · mejl om något går fel",
    "net-tag": "nå hemifrån",
    "net-h3": "Ut från hemmet utan att öppna dörren",
    "net-lead": "Jag ville kunna nå mina grejer hemifrån när jag inte är hemma. Men jag ville inte öppna hela hemnätet för hela internet.",
    "net-p1": "Att öppna upp hemnätet mot nätet kändes riskabelt. I stället använder jag en privat, säker tunnel som heter Tailscale. Min telefon når då samma saker som om jag satt hemma, utan att någon annan släpps in.",
    "net-p2": "Jag ville också att ismargutic.se skulle funka för alla att besöka — utan att lägga hela hemmet direkt på internet. Lösningen: en liten hyrd dator ute på nätet visar sidan och pratar med hemmet genom Tailscale-tunneln. Publik adress, privat hem.",
    "net-note": "tailscale · hyrd dator · privat hem",
    "auto-tag": "sköter sig självt",
    "auto-h3": "Saker som ska hända utan att jag minns dem",
    "auto-lead": "Att sätta upp är en engångsgrej. Det som lätt glöms bort är allt som ska hända varje natt och varje vecka.",
    "auto-p1": "Jag ville slippa logga in varje kväll och kolla att allt funkar och att kopiorna kördes. I stället sköter datorn det själv: den tar kopior på natten, skyddar filerna, och mejlar mig om något faktiskt går fel — så att jag inte upptäcker det först när någon undrar vart bilderna tog vägen.",
    "auto-p2": "Uppdateringar funkar likadant: ett enda kommando i stället för tjugo steg i huvudet. Och när något krånglar har jag en anteckningsfil som börjar där jag slutade sist — inte på Googles första sida.",
    "auto-note": "kopior på natten · mejl om något går fel · enkla uppdateringar",
    "backup-tag": "backup",
    "backup-h3": "Backup — tre lager, en sladd",
    "backup-lead": "När bilder som andra bryr sig om låg hemma räckte det inte med \"två diskar och hoppas på det bästa\". Jag behövde förstå vad som skyddar mot vad — och göra USB-kopian så enkel att jag faktiskt orkar köra den.",
    "backup-p1": "Jag har en disk för själva filerna och en extra disk som fungerar som skydd. Om en disk dör kan filerna räknas fram igen. Men det skyddar inte om jag råkar radera något själv — då behövs en kopia som ligger frånkopplad.",
    "backup-p2": "En frånkopplad kopia hjälper bara om man faktiskt gör den. Så jag gjorde den enkel: sätt i USB-disken i en särskilt märkt kontakt (bara den funkar), vänta på ett mejl som säger \"klart\", dra ur. Datorn känner igen disken själv och kopierar allt. Samma disk kan också användas som reserv om något större går sönder, medan jag lagar resten.",
    "backup-p3": "På natten fylls lagringen med färska kopior, så att USB-kopian fångar allt på en gång. Den dyraste läxan: jag trodde att inställningarna redan sparades — men det gjorde de inte, förrän jag upptäckte en stor fil som hamnat helt utanför kopieringen.",
    "backup-note": "skydd om en disk dör · kopia varje natt · frånkopplad usb-kopia",
    "backup-sim-q": "Vad gick sönder?",
    "backup-sim-default": "Välj ett exempel — rutorna ovan är de tre skydden jag menar.",
    "backup-sim-delete": "Raderade en fil",
    "backup-sim-disk": "En disk dog",
    "backup-sim-fire": "Brand eller stöld",
    "backup-layer-1": "1 · Skydd om en disk dör",
    "backup-layer-2": "2 · Kopia varje natt",
    "backup-layer-3": "3 · Frånkopplad USB",
    "backup-sc-delete": "Om raderingen redan hunnit spridas till skyddet är det USB-kopian (om du kört den nyligen) som räddar filen. Skyddet mot diskkrasch hjälper inte mot saker man råkat radera.",
    "backup-sc-disk": "En disk med filer dör — då räknas filerna fram igen med hjälp av skyddsdisken, och allt fortsätter funka.",
    "backup-sc-fire": "Om datorn och diskarna förstörs hemma räcker inte USB:n om den ligger kvar bredvid. Då måste kopian faktiskt finnas på ett annat ställe.",
    "docs-h2": "Det som egentligen är hela poängen",
    "docs-p": "Om ett halvår kommer jag undra \"varför gjorde jag så här?\". Då ska svaret finnas nedskrivet — inte bara i huvudet. Varje del har samma upplägg, från vardag till katastrof. Det är kanske det nyttigaste jag tagit med mig, mer än själva prylarna.",
    "docs-d1": "Vardag — hur jag håller igång det",
    "docs-d2": "När det krånglar — vad som hände och hur jag fixade det",
    "docs-d3": "På djupet — hela upplägget om jag måste bygga om",
    "docs-d4": "Automatiskt — saker som körs av sig själva",
    "plain-net-body": "Internet → min webbsida (hyrd dator) → säker tunnel hem → routern → lilla datorn → bildalbum och filer → USB-kopia ibland."
  };

  function initHomelabPlain() {
    var btn = document.getElementById("plain-toggle");
    if (!btn) return;

    btn.setAttribute("tabindex", "-1");

    var STORAGE = "homelab-plain";
    var swapEls = document.querySelectorAll("[data-swap]");
    swapEls.forEach(function (el) {
      var typed = el.getAttribute("data-typewriter-text");
      if (typed) el._techText = typed.trim();
      else el._techHtml = el.innerHTML;
    });

    var backupSim = document.getElementById("backup-sim");
    var backupScenarios = backupSim ? {
      tech: {
        delete: backupSim.getAttribute("data-sc-delete"),
        disk: backupSim.getAttribute("data-sc-disk"),
        fire: backupSim.getAttribute("data-sc-fire")
      },
      plain: {
        delete: HOMELAB_PLAIN["backup-sc-delete"],
        disk: HOMELAB_PLAIN["backup-sc-disk"],
        fire: HOMELAB_PLAIN["backup-sc-fire"]
      }
    } : null;

    function setBackupScenarioMode(plain) {
      if (!backupSim || !backupScenarios) return;
      var set = plain ? backupScenarios.plain : backupScenarios.tech;
      backupSim.setAttribute("data-sc-delete", set.delete);
      backupSim.setAttribute("data-sc-disk", set.disk);
      backupSim.setAttribute("data-sc-fire", set.fire);
      var result = backupSim.querySelector(".backup-sim-result");
      if (result && !backupSim.querySelector(".backup-sim-btn--active")) {
        result.textContent = plain ? HOMELAB_PLAIN["backup-sim-default"] : backupSim.getAttribute("data-sc-default");
      }
    }

    function scrollAnchor() {
      var node = document.elementFromPoint(window.innerWidth * 0.5, Math.min(140, window.innerHeight * 0.25));
      if (!node || !node.closest) return null;
      return node.closest("section") || node.closest(".story") || node.closest(".tldr-card") || node.closest("header") || node.closest(".status-wrap");
    }

    var anchorEl = null;
    var anchorTop = null;

    function applyPlain(plain, anchor, topBefore) {
      document.documentElement.classList.toggle("homelab-plain", plain);
      btn.setAttribute("aria-pressed", plain ? "true" : "false");
      btn.querySelector(".plain-toggle-on").hidden = plain;
      btn.querySelector(".plain-toggle-off").hidden = !plain;
      localStorage.setItem(STORAGE, plain ? "1" : "0");
      setBackupScenarioMode(plain);
      if (backupSim) {
        backupSim.querySelectorAll(".backup-layer").forEach(function (l) {
          l.classList.remove("backup-layer--active");
        });
        backupSim.querySelectorAll("[data-scenario]").forEach(function (b) {
          b.classList.remove("backup-sim-btn--active");
        });
      }

      swapEls.forEach(function (el) {
        var key = el.getAttribute("data-swap");
        var text = plain ? HOMELAB_PLAIN[key] : null;
        if (plain) {
          if (!text) return;
          el.textContent = text;
        } else {
          if (el._techHtml != null) el.innerHTML = el._techHtml;
          else if (el._techText) el.textContent = el._techText;
          el.classList.remove("cursor-line--typing");
          el.removeAttribute("aria-busy");
        }
      });

      function fixScroll() {
        if (!anchor || topBefore == null || !document.body.contains(anchor)) return;
        var topAfter = anchor.getBoundingClientRect().top;
        if (Math.abs(topAfter - topBefore) > 1) {
          document.documentElement.style.scrollBehavior = "auto";
          window.scrollBy(0, topAfter - topBefore);
          document.documentElement.style.scrollBehavior = "";
        }
      }

      fixScroll();
      requestAnimationFrame(fixScroll);
    }

    btn.addEventListener("pointerdown", function () {
      anchorEl = scrollAnchor();
      anchorTop = anchorEl ? anchorEl.getBoundingClientRect().top : null;
    });

    btn.addEventListener("pointerup", function (e) {
      e.preventDefault();
      applyPlain(!document.documentElement.classList.contains("homelab-plain"), anchorEl, anchorTop);
    });

    if (localStorage.getItem(STORAGE) === "1") applyPlain(true, null, null);
  }

  /* ── homelab status explainer ── */
  function initStatusExplainer() {
    var btn = document.getElementById("status-homelab-toggle");
    var panel = document.getElementById("status-explainer");
    var wrap = document.getElementById("status-wrap");
    if (!btn || !panel || !wrap) return;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      panel.hidden = open;
      wrap.classList.toggle("status-wrap--open", !open);
    });
  }

  function boot() {
    initTheme();
    initStatus();
    initStatusExplainer();
    initIcloud();
    initBackupSim();
    initNetMap();
    initHomelabPlain();
    initTypewriter();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  console.assert(formatRelative(new Date(Date.now() - 7200000).toISOString()) === "2 h sedan");
  console.assert(formatRelative(new Date(Date.now() - 86400000 * 2).toISOString()) === "2 d sedan");
})();
