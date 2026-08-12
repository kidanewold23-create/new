/* ==========================================================================
   FOUNDERS ACADEMY - LANDING PAGE CUSTOMIZER (CMS) SHARED HELPER
   ========================================================================== */

const CMS_SECTIONS = [
  { id: "hero", title: "Hero & Intro Video", file: "admin-landing-hero.html", icon: "zap" },
  { id: "metrics", title: "Metrics Bar", file: "admin-landing-metrics.html", icon: "bar-chart-3" },
  { id: "personas", title: "Who Is It For?", file: "admin-landing-personas.html", icon: "users" },
  { id: "instructors", title: "Instructors & Brands", file: "admin-landing-instructors.html", icon: "award" },
  { id: "guarantee", title: "What You Get & Guarantee", file: "admin-landing-guarantee.html", icon: "package-check" },
  { id: "stories", title: "Success Stories", file: "admin-landing-stories.html", icon: "trophy" },
  { id: "testimonials", title: "Testimonials (CRUD)", file: "admin-landing-testimonials.html", icon: "star" },
  { id: "faqs", title: "FAQs (CRUD)", file: "admin-landing-faqs.html", icon: "help-circle" },
  { id: "footer", title: "Support & Footer", file: "admin-landing-footer.html", icon: "headset" }
];

/**
 * Render Top Section Quick-Switcher Navigation Bar
 * @param {string} currentSectionId 
 */
function renderCmsNavTabs(currentSectionId) {
  const container = document.getElementById("cms-section-nav");
  if (!container) return;

  container.innerHTML = `
    <div class="cms-tab-nav" style="margin-bottom: 20px; overflow-x: auto; display: flex; gap: 8px; padding-bottom: 8px;">
      <a href="admin-landing-customizer.html" class="cms-tab-btn ${currentSectionId === 'hub' ? 'active' : ''}" style="text-decoration: none;">
        <i data-lucide="layout-grid"></i> All Sections Hub
      </a>
      ${CMS_SECTIONS.map((sec, idx) => `
        <a href="${sec.file}" class="cms-tab-btn ${sec.id === currentSectionId ? 'active' : ''}" style="text-decoration: none;">
          <i data-lucide="${sec.icon}"></i> ${idx + 1}. ${sec.title}
        </a>
      `).join("")}
    </div>
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

// Global Exports
window.renderCmsNavTabs = renderCmsNavTabs;
window.getLandingConfig = getLandingConfig;
window.saveLandingSection = saveLandingSection;
window.showToast = showToast;
window.CMS_SECTIONS = CMS_SECTIONS;

if (typeof initClickOnlySidebarToggle === "function") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initClickOnlySidebarToggle);
  } else {
    initClickOnlySidebarToggle();
  }
}
