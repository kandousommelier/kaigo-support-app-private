(() => {
  const DATA_FILES = {
    config: "data/config.json",
    municipalities: "data/municipalities.json",
    facilities: "data/facilities.json",
    steps: "data/steps.json",
    pages: "data/pages.json",
    schedules: "data/schedules.json",
    progress: "data/progress.json",
    links: "data/links.json",
    contents: "data/contents.json",
    faq: "data/faq.json",
    terms: "data/terms.json",
    notices: "data/notices.json",
    contact: "data/contact.json"
  };

  const state = {
    data: null,
    facility: null
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    collectElements();
    setLoadingState(true);

    try {
      state.data = await loadAllData();
      hydrateStaticText();
      buildSectionNav();
      bindEvents();
      setLoadingState(false);
    } catch (error) {
      showMessage("データを読み込めませんでした。GitHub Pagesまたはローカルサーバー上で開いてください。");
      setLoadingState(false);
      console.error(error);
    }
  }

  function collectElements() {
    els.loginView = document.querySelector("#login-view");
    els.dashboardView = document.querySelector("#dashboard-view");
    els.entryForm = document.querySelector("#entry-form");
    els.commonId = document.querySelector("#common-id");
    els.commonPassword = document.querySelector("#common-password");
    els.facilityCode = document.querySelector("#facility-code");
    els.formMessage = document.querySelector("#form-message");
    els.loginNotice = document.querySelector("#login-notice");
    els.loginDescription = document.querySelector("#login-description");
    els.logoutButton = document.querySelector("#logout-button");
    els.sectionNav = document.querySelector("#section-nav");
    els.facilityHeading = document.querySelector("#facility-heading");
    els.facilitySubheading = document.querySelector("#facility-subheading");
    els.summaryMunicipality = document.querySelector("#summary-municipality");
    els.summaryService = document.querySelector("#summary-service");
    els.summaryStep = document.querySelector("#summary-step");
    els.summarySchedule = document.querySelector("#summary-schedule");
    els.summaryDeadline = document.querySelector("#summary-deadline");
    els.summaryContact = document.querySelector("#summary-contact");
    els.scheduleIntro = document.querySelector("#schedule-intro");
    els.scheduleList = document.querySelector("#schedule-list");
    els.scheduleNotes = document.querySelector("#schedule-notes");
    els.progressIntro = document.querySelector("#progress-intro");
    els.progressList = document.querySelector("#progress-list");
    els.submissionLinks = document.querySelector("#submission-links");
    els.contentList = document.querySelector("#content-list");
    els.aiLinks = document.querySelector("#ai-links");
    els.faqList = document.querySelector("#faq-list");
    els.termList = document.querySelector("#term-list");
    els.noticeList = document.querySelector("#notice-list");
    els.contactPanel = document.querySelector("#contact-panel");
  }

  async function loadAllData() {
    const entries = await Promise.all(
      Object.entries(DATA_FILES).map(async ([key, path]) => {
        const response = await fetch(path, { cache: "no-cache" });
        if (!response.ok) {
          throw new Error(`${path} を読み込めませんでした`);
        }
        return [key, await response.json()];
      })
    );
    return Object.fromEntries(entries);
  }

  function hydrateStaticText() {
    document.title = state.data.config.appName;
    els.loginDescription.textContent = state.data.config.description;
    els.loginNotice.textContent = state.data.config.privacyNotice;
  }

  function bindEvents() {
    els.entryForm.addEventListener("submit", handleLogin);
    els.logoutButton.addEventListener("click", () => {
      state.facility = null;
      els.dashboardView.classList.add("hidden");
      els.loginView.classList.remove("hidden");
      els.entryForm.reset();
      showMessage("");
      els.commonId.focus();
    });
  }

  function setLoadingState(isLoading) {
    const button = els.entryForm.querySelector("button");
    button.disabled = isLoading;
    button.textContent = isLoading ? "読み込み中" : "入室する";
  }

  function handleLogin(event) {
    event.preventDefault();
    showMessage("");

    const config = state.data.config;
    const enteredId = els.commonId.value.trim();
    const enteredPassword = els.commonPassword.value;
    const enteredCode = els.facilityCode.value.trim().toLowerCase();

    if (enteredId !== config.commonId || enteredPassword !== config.commonPassword) {
      showMessage(config.messages.invalidCredential);
      return;
    }

    const facility = state.data.facilities.find(
      (item) => item.facilityCode.toLowerCase() === enteredCode && item.isVisible
    );

    if (!facility) {
      showMessage(config.messages.invalidFacility);
      return;
    }

    state.facility = facility;
    renderDashboard(facility);
    els.loginView.classList.add("hidden");
    els.dashboardView.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showMessage(message) {
    els.formMessage.textContent = message;
  }

  function buildSectionNav() {
    const pages = [...state.data.pages]
      .filter((page) => page.isVisible)
      .sort(bySortOrder);
    els.sectionNav.replaceChildren(
      ...pages.map((page) => {
        const anchor = document.createElement("a");
        anchor.href = `#${page.sectionId}`;
        anchor.textContent = page.title;
        return anchor;
      })
    );
  }

  function renderDashboard(facility) {
    const municipality = getMunicipality(facility.municipalityCode);
    const step = getStep(facility.currentStep);

    els.facilityHeading.textContent = facility.facilityName;
    els.facilitySubheading.textContent = `${municipality.municipalityName} / ${facility.serviceType}`;
    els.summaryMunicipality.textContent = municipality.municipalityName;
    els.summaryService.textContent = facility.serviceType;
    els.summaryStep.textContent = step.stepName;
    els.summarySchedule.textContent = facility.nextSchedule || "未設定";
    els.summaryDeadline.textContent = facility.deadline || "未設定";
    els.summaryContact.textContent = state.data.contact.formLabel || facility.contactNote || municipality.contactNote || "案内メールをご確認ください。";

    renderSchedules(facility);
    renderProgress(facility);
    renderLinks(facility);
    renderContents(facility);
    renderAiSection(facility);
    renderFaq(facility);
    renderTerms();
    renderNotices();
    renderContact();
  }

  function renderLinks(facility) {
    const links = scopedItems(state.data.links, facility)
      .filter((item) => item.category === "提出・回答" || item.category === "よく使うリンク")
      .sort(byScopeThenSort);

    renderCardGrid(els.submissionLinks, links, (item) =>
      createInfoCard({
        title: item.title,
        description: item.description,
        status: displayStatus(item),
        statusType: item.url ? "ready" : "pending",
        scope: displayScope(item, facility),
        buttonText: item.url ? "開く" : displayStatus(item),
        url: item.url,
        note: item.note ? `${item.category} / ${item.note}` : item.category
      })
    );
  }

  function renderSchedules(facility) {
    const schedule = scopedItems(state.data.schedules, facility).sort(byScopeThenSort)[0];
    if (!schedule) {
      els.scheduleIntro.textContent = "";
      renderCardGrid(els.scheduleList, [], (item) => item);
      els.scheduleNotes.replaceChildren();
      return;
    }

    els.scheduleIntro.textContent = schedule.description || "今後の予定は以下のとおりです。";
    els.scheduleList.replaceChildren(
      ...normalizeArray(schedule.events).map((event) => {
        const item = document.createElement("article");
        item.className = "schedule-card";

        const date = document.createElement("span");
        date.className = "schedule-date";
        date.textContent = event.date || "日程調整中";

        const title = document.createElement("h3");
        title.textContent = event.title;

        const participants = document.createElement("p");
        participants.textContent = `参加者：${event.participants || "調整中"}`;

        item.append(date, title, participants);
        return item;
      })
    );

    els.scheduleNotes.replaceChildren(
      ...normalizeArray(schedule.notes).map((note) => createNoticeItem("予定の補足", note))
    );
  }

  function renderProgress(facility) {
    const progress = scopedItems(state.data.progress, facility).sort(byScopeThenSort)[0];
    if (!progress) {
      els.progressIntro.textContent = "";
      els.progressList.replaceChildren();
      return;
    }

    els.progressIntro.textContent = progress.description || "本事業の現在の進捗は以下のとおりです。";
    els.progressList.replaceChildren(
      ...normalizeArray(progress.items).map((item) => {
        const row = document.createElement("article");
        row.className = `progress-item ${item.state || "todo"}`;

        const status = document.createElement("span");
        status.className = "progress-status";
        status.textContent = item.status;

        const body = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = item.title;
        const description = document.createElement("p");
        description.textContent = item.description;
        body.append(title, description);

        row.append(status, body);
        return row;
      })
    );
  }

  function renderContents(facility) {
    const contents = scopedItems(state.data.contents, facility).sort(byScopeThenSort);
    renderCardGrid(els.contentList, contents, (item) =>
      createInfoCard({
        title: item.title,
        description: item.description,
        status: displayStatus(item),
        statusType: item.url ? "ready" : "pending",
        scope: displayScope(item, facility),
        buttonText: item.url ? "確認する" : displayStatus(item),
        url: item.url,
        note: item.type
      })
    );
  }

  function renderAiSection(facility) {
    const links = scopedItems(state.data.links, facility)
      .filter((item) => item.category === "施策検討・AI活用")
      .sort(byScopeThenSort);
    renderCardGrid(els.aiLinks, links, (item) =>
      createInfoCard({
        title: item.title,
        description: item.description,
        status: displayStatus(item),
        statusType: item.url ? "ready" : "pending",
        scope: displayScope(item, facility),
        buttonText: item.url ? "開く" : displayStatus(item),
        url: item.url,
        note: item.note
      })
    );

  }

  function renderFaq(facility) {
    const faqs = scopedItems(state.data.faq, facility).sort(byScopeThenSort);
    const byCategory = groupBy(faqs, "category");
    const details = Object.entries(byCategory).map(([category, items], index) => {
      const detail = document.createElement("details");
      detail.className = "faq-category";
      detail.open = index === 0;

      const summary = document.createElement("summary");
      summary.textContent = category;

      const list = document.createElement("div");
      list.className = "faq-items";
      items.forEach((faq) => {
        const item = document.createElement("article");
        item.className = "faq-item";
        const question = document.createElement("strong");
        question.textContent = faq.question;
        const answer = document.createElement("p");
        answer.textContent = faq.answer;
        item.append(question, answer);
        list.append(item);
      });

      detail.append(summary, list);
      return detail;
    });

    renderCardGrid(els.faqList, details, (item) => item);
  }

  function renderTerms() {
    const terms = [...state.data.terms].sort(bySortOrder);
    renderCardGrid(els.termList, terms, (term) => {
      const card = document.createElement("article");
      card.className = "term-card";
      const title = document.createElement("h3");
      title.textContent = term.term;
      const description = document.createElement("p");
      description.textContent = term.description;
      card.append(title, description);
      return card;
    });
  }

  function renderNotices() {
    const notices = [...state.data.notices].sort(bySortOrder);
    els.noticeList.replaceChildren(
      ...notices.map((notice) => createNoticeItem(notice.title, notice.body))
    );
  }

  function renderContact() {
    const contact = state.data.contact;
    const panel = document.createElement("article");
    panel.className = "contact-card";

    const description = document.createElement("div");
    description.className = "contact-description";
    normalizeArray(contact.description).forEach((line) => {
      const text = document.createElement("p");
      text.textContent = line;
      description.append(text);
    });

    const formRow = document.createElement("div");
    formRow.className = "contact-form-row";
    const formLabel = document.createElement("span");
    formLabel.textContent = "問い合わせフォーム：";
    const formLink = document.createElement("a");
    formLink.className = "card-button contact-button";
    formLink.href = contact.formUrl;
    formLink.target = "_blank";
    formLink.rel = "noopener noreferrer";
    formLink.textContent = contact.formLabel || "問い合わせフォームを開く";
    formRow.append(formLabel, formLink);

    const detailList = document.createElement("dl");
    detailList.className = "contact-details";
    [
      ["担当", contact.person],
      ["電話", contact.phone],
      ["対応時間", contact.hours]
    ].forEach(([label, value]) => {
      const term = document.createElement("dt");
      term.textContent = label;
      const detail = document.createElement("dd");
      detail.textContent = value;
      detailList.append(term, detail);
    });

    const note = document.createElement("p");
    note.className = "contact-note";
    note.textContent = contact.note;

    panel.append(description, formRow, detailList, note);
    els.contactPanel.replaceChildren(panel);
  }

  function createInfoCard(options) {
    const card = document.createElement("article");
    card.className = "info-card";

    const title = document.createElement("h3");
    title.textContent = options.title;

    const description = document.createElement("p");
    description.textContent = options.description || "説明は準備中です。";

    const meta = document.createElement("div");
    meta.className = "card-meta";
    const status = document.createElement("span");
    status.className = `pill ${options.statusType || ""}`;
    status.textContent = options.status;
    const scope = document.createElement("span");
    scope.className = "pill scope";
    scope.textContent = options.scope;
    meta.append(status, scope);

    if (options.note) {
      const note = document.createElement("p");
      note.textContent = options.note;
      card.append(title, description, meta, note, createCardButton(options));
      return card;
    }

    card.append(title, description, meta, createCardButton(options));
    return card;
  }

  function createCardButton(options) {
    if (!options.url) {
      const status = document.createElement("span");
      status.className = "status-message card-action";
      status.textContent = options.buttonText || "準備中";
      return status;
    }

    const link = document.createElement("a");
    link.className = "card-button card-action";
    link.href = options.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = options.buttonText || "開く";
    return link;
  }

  function createNoticeItem(title, body) {
    const item = document.createElement("article");
    item.className = "notice-item";
    const heading = document.createElement("h3");
    heading.textContent = title;
    const text = document.createElement("p");
    text.textContent = body;
    item.append(heading, text);
    return item;
  }

  function renderCardGrid(container, items, mapper) {
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "現在表示できる項目はありません。";
      container.replaceChildren(empty);
      return;
    }
    container.replaceChildren(...items.map(mapper));
  }

  function getMunicipality(code) {
    return state.data.municipalities.find((item) => item.municipalityCode === code) || {
      municipalityName: "要設定"
    };
  }

  function getStep(stepId) {
    return state.data.steps.find((item) => item.stepId === stepId) || {
      stepName: "要設定",
      defaultActions: []
    };
  }

  function scopedItems(items, facility) {
    return items
      .map((item) => ({ ...item, _scopeRank: scopeRank(item, facility) }))
      .filter((item) => item._scopeRank < 99);
  }

  function scopeRank(item, facility) {
    if (item.facilityCode === facility.facilityCode) {
      return 1;
    }
    if (item.municipalityCode === facility.municipalityCode && (!item.facilityCode || item.facilityCode === "common")) {
      return 2;
    }
    if ((item.municipalityCode === "common" || !item.municipalityCode) && (!item.facilityCode || item.facilityCode === "common")) {
      return 3;
    }
    return 99;
  }

  function displayScope(item, facility) {
    if (item.facilityCode === facility.facilityCode) {
      return "施設別";
    }
    if (item.municipalityCode === facility.municipalityCode) {
      return "自治体別";
    }
    return "共通";
  }

  function displayStatus(item) {
    if (item.url) {
      return item.status || "利用可";
    }
    return item.displayText || item.status || "準備中";
  }

  function byScopeThenSort(a, b) {
    return (a._scopeRank - b._scopeRank) || bySortOrder(a, b);
  }

  function bySortOrder(a, b) {
    return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
  }

  function normalizeArray(value) {
    if (Array.isArray(value)) {
      return value;
    }
    if (!value) {
      return [];
    }
    return [value];
  }

  function groupBy(items, key) {
    return items.reduce((groups, item) => {
      const groupKey = item[key] || "その他";
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(item);
      return groups;
    }, {});
  }
})();
