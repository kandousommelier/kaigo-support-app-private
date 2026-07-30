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

  function setSectionVisibility(sectionId, visible) {
    const section = document.querySelector(sectionId);
    if (section) {
      section.classList.toggle("hidden", !visible);
      section.style.display = visible ? "" : "none";
    }
  }

  function setNavVisibility(sectionHref, visible) {
    document.querySelectorAll(`#section-nav a[href="${sectionHref}"]`).forEach((anchor) => {
      anchor.style.display = visible ? "" : "none";
    });
  }

  function applyShigaDisplay() {
    const shiga = isShigaFacility();

    setSummaryCardVisibility("#summary-step", !shiga);
    setSummaryCardVisibility("#summary-schedule", !shiga);
    setSummaryCardVisibility("#summary-deadline", !shiga);

    setSectionVisibility("#links", !shiga);
    setNavVisibility("#links", !shiga);
  }

  function applyRepeatedly() {
    [0, 50, 150, 300, 600, 1000].forEach((delay) => {
      window.setTimeout(applyShigaDisplay, delay);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#entry-form");
    const logout = document.querySelector("#logout-button");
    const dashboard = document.querySelector("#dashboard-view");

    if (form) {
      form.addEventListener("submit", applyRepeatedly);
    }

    if (logout) {
      logout.addEventListener("click", () => window.setTimeout(applyShigaDisplay, 0));
    }

    if (dashboard) {
      const observer = new MutationObserver(() => {
        if (isShigaFacility()) {
          applyShigaDisplay();
        }
      });
      observer.observe(dashboard, { childList: true, subtree: true, characterData: true });
    }

    applyShigaDisplay();
  });
})();
