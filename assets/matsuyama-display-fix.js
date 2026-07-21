(() => {
  const MATSUYAMA_PREFIX = "matsuyama";

  function currentFacilityCode() {
    const input = document.querySelector("#facility-code");
    return input ? input.value.trim().toLowerCase() : "";
  }

  function isMatsuyamaFacility() {
    return currentFacilityCode().startsWith(MATSUYAMA_PREFIX);
  }

  function setCardVisibility(selector, visible) {
    const target = document.querySelector(selector);
    const card = target ? target.closest(".summary-card") : null;
    if (card) {
      card.style.display = visible ? "" : "none";
    }
  }

  function applyMatsuyamaDisplay() {
    const matsuyama = isMatsuyamaFacility();

    setCardVisibility("#summary-step", !matsuyama);
    setCardVisibility("#summary-schedule", !matsuyama);
    setCardVisibility("#summary-deadline", !matsuyama);

    const linksSection = document.querySelector("#links");
    if (linksSection) {
      linksSection.classList.toggle("hidden", matsuyama);
    }

    document.querySelectorAll('#section-nav a[href="#links"]').forEach((anchor) => {
      anchor.style.display = matsuyama ? "none" : "";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const dashboard = document.querySelector("#dashboard-view");
    const form = document.querySelector("#entry-form");
    const logout = document.querySelector("#logout-button");

    if (form) {
      form.addEventListener("submit", () => setTimeout(applyMatsuyamaDisplay, 0));
    }
    if (logout) {
      logout.addEventListener("click", () => setTimeout(applyMatsuyamaDisplay, 0));
    }
    if (dashboard) {
      const observer = new MutationObserver(() => applyMatsuyamaDisplay());
      observer.observe(dashboard, { childList: true, subtree: true, characterData: true });
    }

    applyMatsuyamaDisplay();
  });
})();
