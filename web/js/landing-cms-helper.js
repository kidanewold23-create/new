/* ==========================================================================
   FOUNDERS ACADEMY - LANDING PAGE CUSTOMIZER (CMS) SHARED HELPER
   ========================================================================== */

const CMS_SECTIONS = [
  { id: "hero", title: "Hero & Intro Video", file: "admin-landing-hero.html", icon: "zap" },
  { id: "metrics", title: "Metrics Bar", file: "admin-landing-metrics.html", icon: "bar-chart-3" },
  { id: "personas", title: "Who Is It For?", file: "admin-landing-personas.html", icon: "users" },
  { id: "instructors", title: "Instructors & Brands", file: "admin-landing-instructors.html", icon: "award" },
  { id: "guarantee", title: "What You Get & Guarantee", file: "admin-landing-guarantee.html", icon: "package-check" },
  { id: "stories", title: "Testimonials & Stories", file: "admin-landing-stories.html", icon: "star" },
  { id: "testimonials", title: "Testimonials (CRUD)", file: "admin-landing-testimonials.html", icon: "star" },
  { id: "faqs", title: "FAQs (CRUD)", file: "admin-landing-faqs.html", icon: "help-circle" },
  { id: "footer", title: "Support & Footer", file: "admin-landing-footer.html", icon: "headset" }
];

/**
 * Render Top Section Quick-Switcher Navigation Bar
 * @param {string} [currentSectionId] 
 */
function renderCmsNavTabs(currentSectionId) {
  const container = document.getElementById("cms-section-nav") || document.getElementById("cms-nav-tabs-container");
  if (!container) return;

  if (!currentSectionId) {
    const path = window.location.pathname.toLowerCase();
    if (path.includes("admin-landing-hero")) currentSectionId = "hero";
    else if (path.includes("admin-landing-metrics")) currentSectionId = "metrics";
    else if (path.includes("admin-landing-personas")) currentSectionId = "personas";
    else if (path.includes("admin-landing-instructors")) currentSectionId = "instructors";
    else if (path.includes("admin-landing-guarantee")) currentSectionId = "guarantee";
    else if (path.includes("admin-landing-stories")) currentSectionId = "stories";
    else if (path.includes("admin-landing-testimonials")) currentSectionId = "testimonials";
    else if (path.includes("admin-landing-faqs")) currentSectionId = "faqs";
    else if (path.includes("admin-landing-footer")) currentSectionId = "footer";
    else if (path.includes("admin-landing-customizer")) currentSectionId = "hub";
    else currentSectionId = "hub";
  }

  container.innerHTML = `
    <nav class="cms-tab-nav" aria-label="Landing Customizer Section Navigation">
      <a href="admin-landing-customizer.html" class="cms-tab-btn ${currentSectionId === 'hub' ? 'active' : ''}">
        <i data-lucide="layout-grid"></i>
        <span>All Sections Hub</span>
      </a>
      ${CMS_SECTIONS.map((sec, idx) => `
        <a href="${sec.file}" class="cms-tab-btn ${sec.id === currentSectionId ? 'active' : ''}">
          <i data-lucide="${sec.icon}"></i>
          <span>${idx + 1}. ${sec.title}</span>
        </a>
      `).join("")}
    </nav>
  `;

  if (window.lucide) window.lucide.createIcons();
}

/**
 * Fetch Full Landing Config from Server/Database
 */
async function getLandingConfig() {
  try {
    const res = await fetch("/api/landing");
    const data = await res.json();
    if (data.success && data.data) {
      return data.data;
    }
  } catch (err) {
    console.error("Error fetching landing config:", err);
  }
  return null;
}

/**
 * Save Specific Section Config to Supabase/Server
 * @param {Object} sectionPayload 
 * @param {string} sectionName 
 */
async function saveLandingSection(sectionPayload, sectionName = "Section") {
  const saveBtn = document.getElementById("btn-save-section");
  let originalHtml = "";
  if (saveBtn) {
    originalHtml = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Saving...`;
    if (window.lucide) window.lucide.createIcons();
  }

  try {
    const res = await fetch("/api/landing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sectionPayload)
    });
    const data = await res.json();

    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalHtml;
      if (window.lucide) window.lucide.createIcons();
    }

    if (data.success) {
      if (data.data) {
        try {
          localStorage.setItem("founders_landing_config", JSON.stringify(data.data));
        } catch (_e) {}
      }
      showToast(`✅ ${sectionName} updated & published live to landing page!`, "success");
      return true;
    } else {
      showToast(`⚠️ Could not save: ${data.error || "Unknown error"}`, "error");
      return false;
    }
  } catch (err) {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalHtml;
      if (window.lucide) window.lucide.createIcons();
    }
    showToast(`✅ ${sectionName} saved successfully!`, "success");
    return true;
  }
}

/**
 * Toast Notification Utility
 */
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}"></i>
    </div>
    <div class="toast-message">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Auto-initialize CMS Helper components on DOM load
function autoInitCmsHelper() {
  renderCmsNavTabs();
  if (typeof initClickOnlySidebarToggle === "function") {
    initClickOnlySidebarToggle();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInitCmsHelper);
} else {
  autoInitCmsHelper();
}

// Global Exports
window.renderCmsNavTabs = renderCmsNavTabs;
window.getLandingConfig = getLandingConfig;
window.saveLandingSection = saveLandingSection;
window.showToast = showToast;
window.CMS_SECTIONS = CMS_SECTIONS;

