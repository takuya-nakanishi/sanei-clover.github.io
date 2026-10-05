(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Header shadow on scroll
  // scrollイベントは1フレームに何度も飛んでくるので、rAFで1フレーム1回にまとめ、
  // 状態が変わったときだけclassを触る(毎回 add/remove するとスタイル再計算が走る)
  const header = $(".site-header");
  if (header) {
    let scrolled = null;
    let ticking = false;
    const update = () => {
      ticking = false;
      const next = window.scrollY > 24;
      if (next === scrolled) return;
      scrolled = next;
      header.classList.toggle("is-scrolled", next);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
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

  // Contact form → 自作 CRM「Works」の Web フォームの受け口へ直に送り、「リード」に登録する
  //
  // 2026-10-05 に Cloudflare Worker(Notion へ登録)から移した。
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
        // 成功は作ったレコード、失敗は {code, message}(Works の API の契約)
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.record) {
          throw new Error(data.message || `送信に失敗しました (${res.status})`);
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
