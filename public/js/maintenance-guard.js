/**
 * FOUNDERS ACADEMY - GLOBAL INSTANT MAINTENANCE GUARD
 * Protects all public pages. When maintenance is active, redirects visitors immediately to maintenance.html.
 */
(function () {
  try {
    const currentPath = window.location.pathname.toLowerCase();
    const isMaintenancePage = currentPath.includes("maintenance.html") || currentPath.endsWith("/maintenance");
    const isAdminPath = currentPath.includes("admin") || currentPath.includes("/admin");
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminPreview = urlParams.has("admin_preview") || urlParams.has("preview");

    // Never block admin pages or explicit admin preview mode
    if (isAdminPath || isAdminPreview) {
      return;
    }

    // 1. Instant Synchronous Check from localStorage cache for 0ms redirect
    const cachedStatus = localStorage.getItem("founders_maintenance");
    if (cachedStatus === "ON" && !isMaintenancePage) {
      window.location.replace("maintenance.html");
      return;
    }

    // 2. Real-time Live Check against Supabase API
    fetch("/api/maintenance?_t=" + Date.now(), { cache: "no-store" })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.success && data.data) {
          const state = data.data;
          const isON = (state.status === "ON");

          if (isON) {
            localStorage.setItem("founders_maintenance", "ON");
            if (state.title) localStorage.setItem("maint_title", state.title);
            if (state.message) localStorage.setItem("maint_msg", state.message);

            if (!isMaintenancePage) {
              window.location.replace("maintenance.html");
            }
          } else {
            localStorage.setItem("founders_maintenance", "OFF");
            if (isMaintenancePage) {
              window.location.replace("index.html");
            }
          }
        }
      })
      .catch(function () {
        // Fallback gracefully
      });
  } catch (_e) {}
})();
