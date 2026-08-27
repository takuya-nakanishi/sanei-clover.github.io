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

  // Contact form → Cloudflare Worker 経由で Notion へ登録
  //
  // 以前はSalesforce Web-to-Leadへ非表示iframe経由で投げていたが、
  // iframeのloadイベントは「何かが読み込まれた」ことしか示さず、
  // 送信が成功したのか失敗したのかを区別できなかった。
  // fetchならレスポンスで実際の可否が分かるため、嘘の完了メッセージを出さずに済む。
  const form = $("#contact-form");
  if (form) {
    const status = $("#contact-status");
    const submit = form.querySelector("button[type=submit]");
    const label = submit?.querySelector(".submit-label");
    let submitting = false;

    const setStatus = (text) => { if (status) status.textContent = text; };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (submitting) return;

      // 必須項目チェック（未入力ならブラウザ標準UIで通知）
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      submitting = true;
      submit.disabled = true;
      if (label) { label.dataset.orig = label.textContent; label.textContent = "送信中…"; }
      setStatus("");

      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          throw new Error(data.error || `送信に失敗しました (${res.status})`);
        }
        setStatus("お問い合わせありがとうございます。担当よりご連絡いたします。");
        form.reset();
      } catch (err) {
        // 失敗を黙って飲み込まない。電話という代替手段を必ず案内する
        setStatus(`送信できませんでした（${err.message}）。お手数ですが 03-6876-4989 までご連絡ください。`);
      } finally {
        submitting = false;
        submit.disabled = false;
        if (label && label.dataset.orig) label.textContent = label.dataset.orig;
      }
    });
  }
})();
