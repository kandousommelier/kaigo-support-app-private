(() => {
  const TARGET_PREFIX = "shiga";

  function currentFacilityCode() {
    const input = document.querySelector("#facility-code");
    return input ? input.value.trim().toLowerCase() : "";
  }

  function isShigaFacility() {
    return currentFacilityCode().startsWith(TARGET_PREFIX);
  }

  function setSummaryCardVisibility(selector, visible) {
    const target = document.querySelector(selector);
    const card = target ? target.closest(".summary-card") : null;
    if (card) {
      card.style.display = visible ? "" : "none";
    }
  }

  function applyShigaDisplay() {
    const shiga = isShigaFacility();
    setSummaryCardVisibility("#summary-step", !shiga);
    setSummaryCardVisibility("#summary-schedule", !shiga);
    setSummaryCardVisibility("#summary-deadline", !shiga);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#entry-form");
    const logout = document.querySelector("#logout-button");

    if (form) {
      form.addEventListener("submit", () => {
        window.setTimeout(applyShigaDisplay, 0);
        window.setTimeout(applyShigaDisplay, 100);
        window.setTimeout(applyShigaDisplay, 300);
      });
    }

    if (logout) {
      logout.addEventListener("click", () => window.setTimeout(applyShigaDisplay, 0));
    }
  });
})();
