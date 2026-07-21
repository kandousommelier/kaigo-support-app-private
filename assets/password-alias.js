(() => {
  const ACCEPTED_ALIAS = "sipport2026";
  const CANONICAL_PASSWORD = "support2026";

  function normalizePasswordBeforeLogin(event) {
    const form = event.target;
    if (!form || form.id !== "entry-form") {
      return;
    }

    const passwordInput = document.querySelector("#common-password");
    if (!passwordInput) {
      return;
    }

    if (passwordInput.value === ACCEPTED_ALIAS) {
      passwordInput.value = CANONICAL_PASSWORD;
    }
  }

  document.addEventListener("submit", normalizePasswordBeforeLogin, true);
})();
