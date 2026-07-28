(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Header shadow on scroll
  const header = $(".site-header");
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 24) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Mobile menu
  const menuBtn = $(".menu-toggle");
  const drawer = $(".nav-drawer");
  if (menuBtn && drawer) {
    const toggle = (open) => {
      const next = open ?? !drawer.classList.contains("is-open");
      drawer.classList.toggle("is-open", next);
      menuBtn.setAttribute("aria-expanded", String(next));
      document.body.style.overflow = next ? "hidden" : "";
    };
    menuBtn.addEventListener("click", () => toggle());
    drawer.addEventListener("click", (e) => {
      if (e.target.tagName === "A") toggle(false);
    });
  }

  // Reveal on scroll
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("is-in"));
  }

  // Year stamp
  $$("[data-year]").forEach((el) => (el.textContent = String(new Date().getFullYear())));

  // Contact form → Salesforce Web-to-Lead（非表示iframe経由でページ遷移なし送信）
  const form = $("#contact-form");
  if (form) {
    const status = $("#contact-status");
    const submit = form.querySelector("button[type=submit]");
    const label = submit?.querySelector(".submit-label");
    const frame = document.querySelector('iframe[name="sf-webtolead"]');
    let submitting = false;

    form.addEventListener("submit", (e) => {
      // 必須項目チェック（未入力なら送信せずブラウザ標準UIで通知）
      if (!form.checkValidity()) {
        e.preventDefault();
        form.reportValidity();
        return;
      }
      // 氏名（1欄）を姓・名に分割し、Web-to-Lead の first_name / last_name へ
      const full = ($("#cf-name").value || "").trim();
      const parts = full.split(/[\s　]+/).filter(Boolean);
      if (parts.length >= 2) {
        // 日本語の「姓 名」順: 1つ目が姓 (last_name)、2つ目以降が名 (first_name)
        $("#cf-last-name").value = parts[0];
        $("#cf-first-name").value = parts.slice(1).join(" ");
      } else {
        // スペースが無い場合は last_name（Salesforce必須項目）へまとめて格納
        $("#cf-first-name").value = "";
        $("#cf-last-name").value = parts[0] || "";
      }
      // ページ遷移はさせず、target の iframe へそのまま送信
      submitting = true;
      submit.disabled = true;
      if (label) { label.dataset.orig = label.textContent; label.textContent = "送信中…"; }
      if (status) { status.style.color = "var(--coral)"; status.textContent = ""; }
    });

    if (frame) {
      frame.addEventListener("load", () => {
        if (!submitting) return; // 初期ロード（about:blank）は無視
        submitting = false;
        if (status) status.textContent = "お問い合わせありがとうございます。担当よりご連絡いたします。";
        form.reset();
        submit.disabled = false;
        if (label && label.dataset.orig) label.textContent = label.dataset.orig;
      });
    }
  }
})();
