/* ismargutic.se — shared interactions */
(function () {
  "use strict";

  var STORAGE_THEME = "ismargutic-theme";

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
    document.querySelectorAll("[data-typewriter]").forEach(function (el) {
      var text = el.getAttribute("data-typewriter-text") || el.textContent;
      typeText(el, text, {
        mode: el.getAttribute("data-typewriter-mode") || "char",
        ms: Number(el.getAttribute("data-typewriter-ms")) || undefined,
        startDelay: Number(el.getAttribute("data-typewriter-delay")) || 400
      });
    });
  }

  function boot() {
    initTheme();
    initIcloud();
    initBackupSim();
    initNetMap();
    initTypewriter();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
