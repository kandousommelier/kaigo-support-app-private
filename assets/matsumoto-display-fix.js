(() => {
  const MATSUMOTO_PREFIX = "matsumoto";

  function currentFacilityCode() {
    const input = document.querySelector("#facility-code");
    return input ? input.value.trim().toLowerCase() : "";
  }

  function isMatsumotoFacility() {
    return currentFacilityCode().startsWith(MATSUMOTO_PREFIX);
  }

  function setCardVisibility(selector, visible) {
    const target = document.querySelector(selector);
    const card = target ? target.closest(".summary-card") : null;
    if (card) {
      card.style.display = visible ? "" : "none";
    }
  }

  function applyMatsumotoDisplay() {
    const matsumoto = isMatsumotoFacility();

    setCardVisibility("#summary-step", !matsumoto);
    setCardVisibility("#summary-schedule", !matsumoto);
    setCardVisibility("#summary-deadline", !matsumoto);

    const linksSection = document.querySelector("#links");
    if (linksSection) {
      linksSection.classList.toggle("hidden", matsumoto);
    }

    document.querySelectorAll('#section-nav a[href="#links"]').forEach((anchor) => {
      anchor.style.display = matsumoto ? "none" : "";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const dashboard = document.querySelector("#dashboard-view");
    const form = document.querySelector("#entry-form");
    const logout = document.querySelector("#logout-button");

    if (form) {
      form.addEventListener("submit", () => setTimeout(applyMatsumotoDisplay, 0));
    }
    if (logout) {
      logout.addEventListener("click", () => setTimeout(applyMatsumotoDisplay, 0));
    }
    if (dashboard) {
      const observer = new MutationObserver(() => applyMatsumotoDisplay());
      observer.observe(dashboard, { childList: true, subtree: true, characterData: true });
    }

    applyMatsumotoDisplay();
  });
})();
