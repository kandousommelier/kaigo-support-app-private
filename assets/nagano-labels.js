(() => {
  const SOURCE = "問題虫めがね";
  const TARGET = "気づきシート";
  const NAGANO_PREFIX = "nagano";

  function isNaganoFacility() {
    const input = document.querySelector("#facility-code");
    return Boolean(input && input.value.trim().toLowerCase().startsWith(NAGANO_PREFIX));
  }

  function replaceTextNodes(root) {
    if (!root || !isNaganoFacility()) {
      return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach((node) => {
      if (node.nodeValue && node.nodeValue.includes(SOURCE)) {
        node.nodeValue = node.nodeValue.replaceAll(SOURCE, TARGET);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const dashboard = document.querySelector("#dashboard-view");
    if (!dashboard) {
      return;
    }

    const observer = new MutationObserver(() => replaceTextNodes(dashboard));
    observer.observe(dashboard, { childList: true, subtree: true, characterData: true });
    replaceTextNodes(dashboard);
  });
})();
