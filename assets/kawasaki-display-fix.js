(() => {
  const TARGET_CODES = new Set(["kawasaki01", "kawasaki02"]);

  function currentFacilityCode() {
    const input = document.querySelector("#facility-code");
    return input ? input.value.trim().toLowerCase() : "";
  }

  function isTargetFacility() {
    return TARGET_CODES.has(currentFacilityCode());
  }

  function applyFix() {
    if (!isTargetFacility()) {
      return;
    }

    const step = document.querySelector("#summary-step");
    if (step && step.textContent.trim() !== "アンケート・問題虫めがね") {
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
    const form = document.querySelector("#entry-form");
    if (form) {
      form.addEventListener("submit", () => {
        window.setTimeout(applyFix, 0);
        window.setTimeout(applyFix, 50);
        window.setTimeout(applyFix, 200);
      });
    }
  });
})();
