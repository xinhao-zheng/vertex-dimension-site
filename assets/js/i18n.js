/* =============================================================================
   VERTEX DIMENSION — Bilingual layer
   English is the source in markup; Chinese lives in data-zh. Default EN;
   choice persisted. <html lang> tracks the active locale.
   ========================================================================== */
(function () {
  "use strict";
  var VD = window.VD;
  var STORE_KEY = "vd-lang";
  var nodes = [];
  var current = "en";

  function collect() {
    nodes = Array.prototype.slice.call(document.querySelectorAll("[data-zh]"));
    nodes.forEach(function (el) {
      if (el.dataset.en == null) el.dataset.en = el.innerHTML;
    });
  }

  function apply(lang) {
    current = lang === "zh" ? "zh" : "en";
    nodes.forEach(function (el) {
      el.innerHTML = current === "zh" ? el.dataset.zh : el.dataset.en;
    });
    document.documentElement.setAttribute(
      "lang",
      current === "zh" ? "zh-CN" : "en"
    );
    document.querySelectorAll("[data-lang]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === current));
    });
    try {
      localStorage.setItem(STORE_KEY, current);
    } catch (e) {}
  }

  VD.i18n = {
    set: apply,
    get: function () {
      return current;
    },
    init: function () {
      collect();
      var saved;
      try {
        saved = localStorage.getItem(STORE_KEY);
      } catch (e) {}
      apply(saved || "en");

      document.querySelectorAll("[data-lang]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          apply(btn.dataset.lang);
        });
      });
    }
  };
})();
