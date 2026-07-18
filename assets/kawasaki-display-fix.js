(() => {
  const TARGET_CODES = new Set(["kawasaki01", "kawasaki02"]);

  function isTargetFacility() {
    const input = document.querySelector("#facility-code");
    return Boolean(input && TARGET_CODES.has(input.value.trim().toLowerCase()));
  }

  function applyFix() {
    if (!isTargetFacility()) {
      return;
    }

    const step = document.querySelector("#summary-step");
    if (step) {
      step.textContent = "アンケート・問題虫めがね";
    }

    document.querySelectorAll("#term-list .term-card").forEach((card) => {
      const title = card.querySelector("h3");
      if (title && title.textContent.trim() === "AIコンシェルジュ") {
        card.remove();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const dashboard = document.querySelector("#dashboard-view");
    if (!dashboard) {
      return;
    }

    const observer = new MutationObserver(applyFix);
    observer.observe(dashboard, { childList: true, subtree: true, characterData: true });
    document.querySelector("#entry-form")?.addEventListener("submit", () => {
      window.setTimeout(applyFix, 0);
      window.setTimeout(applyFix, 50);
      window.setTimeout(applyFix, 200);
    });
    applyFix();
  });
})();
