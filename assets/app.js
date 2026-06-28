(() => {
  const files = {
    config: "data/config.json",
    municipalities: "data/municipalities.json",
    facilities: "data/facilities.json",
    steps: "data/steps.json",
    links: "data/links.json",
    contents: "data/contents.json",
    deliverables: "data/deliverables.json",
    faq: "data/faq.json",
    terms: "data/terms.json",
    notices: "data/notices.json"
  };
  let data = {};
  let currentFacility = null;
  const $ = (selector) => document.querySelector(selector);
  const arr = (value) => Array.isArray(value) ? value : value ? [value] : [];
  const sort = (a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999);

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    try {
      data = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, path]) => {
        const response = await fetch(path, { cache: "no-cache" });
        if (!response.ok) throw new Error(`${path} を読み込めませんでした`);
        return [key, await response.json()];
      })));
      document.title = data.config.appName;
      $("#login-description").textContent = data.config.description;
      $("#privacy-notice").textContent = data.config.privacyNotice;
      $("#entry-form").addEventListener("submit", handleLogin);
      $("#logout-button").addEventListener("click", logout);
    } catch (error) {
      $("#form-message").textContent = "データを読み込めませんでした。GitHub Pages上で開いてください。";
      console.error(error);
    }
  }

  function handleLogin(event) {
    event.preventDefault();
    const id = $("#common-id").value.trim();
    const password = $("#common-password").value;
    const facilityCode = $("#facility-code").value.trim().toLowerCase();
    $("#form-message").textContent = "";
    if (id !== data.config.commonId || password !== data.config.commonPassword) {
      $("#form-message").textContent = data.config.messages.invalidCredential;
      return;
    }
    const facility = data.facilities.find((item) => item.facilityCode.toLowerCase() === facilityCode && item.isVisible);
    if (!facility) {
      $("#form-message").textContent = data.config.messages.invalidFacility;
      return;
    }
    currentFacility = facility;
    renderDashboard(facility);
    $("#login-view").classList.add("hidden");
    $("#dashboard-view").classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  function logout() {
    currentFacility = null;
    $("#dashboard-view").classList.add("hidden");
    $("#login-view").classList.remove("hidden");
    $("#entry-form").reset();
    $("#form-message").textContent = "";
  }

  function renderDashboard(facility) {
    const municipality = data.municipalities.find((item) => item.municipalityCode === facility.municipalityCode) || {};
    const step = data.steps.find((item) => item.stepId === facility.currentStep) || { stepName: "要設定", defaultActions: [] };
    $("#facility-name").textContent = facility.facilityName;
    $("#facility-meta").textContent = `${municipality.municipalityName || "要設定"} / ${facility.serviceType}`;
    $("#summary").replaceChildren(
      summaryCard("自治体", municipality.municipalityName || "要設定"),
      summaryCard("サービス種別", facility.serviceType),
      summaryCard("現在のステップ", step.stepName),
      summaryCard("次回予定", facility.nextSchedule || "要設定"),
      summaryCard("締切", facility.deadline || "要設定"),
      summaryCard("問い合わせ先", facility.contactNote || municipality.contactNote || "案内メールをご確認ください")
    );
    renderActions(facility, step);
    renderCards("#link-list", scoped(data.links, facility).filter((item) => item.category === "提出・回答" || item.category === "よく使うリンク"), linkCard);
    renderCards("#content-list", scoped(data.contents, facility), contentCard);
    renderCards("#ai-list", scoped(data.links, facility).filter((item) => item.category === "施策検討・AI活用"), linkCard);
    $("#ai-notes").replaceChildren(...data.config.aiUsageNotes.map((note) => notice("AI活用時の注意", note)));
    renderCards("#deliverable-list", [...data.deliverables].sort(sort), deliverableCard);
    renderFaq(facility);
    renderCards("#term-list", [...data.terms].sort(sort), termCard);
    $("#notice-list").replaceChildren(...[...data.notices].sort(sort).map((item) => notice(item.title, item.body)));
  }

  function summaryCard(label, value) {
    const article = document.createElement("article");
    article.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
    return article;
  }

  function renderActions(facility, step) {
    const actions = arr(facility.nextAction).length ? arr(facility.nextAction) : arr(step.defaultActions);
    $("#actions").replaceChildren(...actions.map((action, index) => {
      const article = document.createElement("article");
      article.className = "task";
      article.innerHTML = `<span class="mark">${index + 1}</span><div><h3>${escapeHtml(action)}</h3><p>${escapeHtml(facility.contactNote || "不明点は案内メール記載の問い合わせ先へ確認してください。")}</p></div>`;
      return article;
    }));
  }

  function renderCards(selector, items, mapper) {
    const sorted = [...items].sort((a, b) => (a._scopeRank ?? 9) - (b._scopeRank ?? 9) || sort(a, b));
    const container = $(selector);
    if (!sorted.length) {
      const empty = document.createElement("p");
      empty.className = "item";
      empty.textContent = "現在表示できる項目はありません。";
      container.replaceChildren(empty);
      return;
    }
    container.replaceChildren(...sorted.map(mapper));
  }

  function baseCard(item, buttonText) {
    const ready = Boolean(item.url || item.templateUrl);
    const article = document.createElement("article");
    article.className = "item";
    const targetUrl = item.url || item.templateUrl || "";
    const action = targetUrl ? `<a class="button" target="_blank" rel="noopener noreferrer" href="${escapeAttr(targetUrl)}">${buttonText}</a>` : `<span class="button disabled">準備中</span>`;
    article.innerHTML = `<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description || item.purpose || "説明は準備中です。")}</p><span class="pill ${ready ? "ready" : "pending"}">${ready ? escapeHtml(item.status || "利用可") : "準備中"}</span>${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}${action}`;
    return article;
  }

  function linkCard(item) { return baseCard(item, "開く"); }
  function contentCard(item) { return baseCard(item, "確認する"); }
  function deliverableCard(item) {
    const card = baseCard({ ...item, description: item.purpose, url: item.templateUrl, note: `${item.timing} / ${item.owner}` }, "テンプレートを開く");
    const p = document.createElement("p");
    p.textContent = `記入内容：${arr(item.inputItems).join("、")}`;
    card.insertBefore(p, card.lastElementChild);
    return card;
  }
  function termCard(item) {
    const article = document.createElement("article");
    article.className = "item";
    article.innerHTML = `<h3>${escapeHtml(item.term)}</h3><p>${escapeHtml(item.description)}</p>`;
    return article;
  }

  function renderFaq(facility) {
    const groups = scoped(data.faq, facility).reduce((acc, item) => {
      (acc[item.category] ||= []).push(item);
      return acc;
    }, {});
    $("#faq-list").replaceChildren(...Object.entries(groups).map(([category, items], index) => {
      const details = document.createElement("details");
      details.className = "faq";
      details.open = index === 0;
      details.innerHTML = `<summary>${escapeHtml(category)}</summary><div>${items.sort(sort).map((item) => `<article><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></article>`).join("")}</div>`;
      return details;
    }));
  }

  function notice(title, body) {
    const article = document.createElement("article");
    article.innerHTML = `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p>`;
    return article;
  }

  function scoped(items, facility) {
    return items.map((item) => ({ ...item, _scopeRank: scopeRank(item, facility) })).filter((item) => item._scopeRank < 99);
  }
  function scopeRank(item, facility) {
    if (item.facilityCode === facility.facilityCode) return 1;
    if (item.municipalityCode === facility.municipalityCode && (!item.facilityCode || item.facilityCode === "common")) return 2;
    if ((item.municipalityCode === "common" || !item.municipalityCode) && (!item.facilityCode || item.facilityCode === "common")) return 3;
    return 99;
  }
  function escapeHtml(value) { return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char])); }
  function escapeAttr(value) { return escapeHtml(value); }
})();
