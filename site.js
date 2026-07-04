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
    initTypewriter();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
