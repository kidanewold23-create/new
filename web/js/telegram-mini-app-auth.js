/* ==========================================================================
   FOUNDERS ACADEMY - TELEGRAM MINI APP AUTO-LOGIN ENGINE
   ========================================================================== */

(async function initTelegramMiniAppAuth() {
  if (typeof window === "undefined") return;

  const tg = window.Telegram?.WebApp;
  if (!tg || !tg.initData) return;

  try {
    tg.ready();
    tg.expand();
  } catch (_e) {}

  try {
    const apiBase = typeof getApiBaseUrl === "function" ? getApiBaseUrl() : "";
    const res = await fetch(`${apiBase}/api/auth/telegram-mini-app`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData })
    });

    const data = await res.json();
    if (res.ok && data.success && data.isRegistered && data.user) {
      localStorage.setItem("founders_student_session", JSON.stringify(data.user));
      console.log("⚡ Telegram Mini App Auto-Logged In:", data.user.name);

      if (window.location.pathname.includes("student-auth.html")) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get("redirect") || "student-dashboard.html";
        window.location.href = redirect;
      }
    }
  } catch (err) {
    console.warn("Telegram Mini App Auto-Login Check Error:", err);
  }
})();
