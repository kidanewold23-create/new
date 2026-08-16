function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
window.escapeHtml = escapeHtml;

window.openStudentAuthModal = function(initialTab = "login") {
  const action = initialTab === "signup" ? "signup" : "login";
  if (!window.location.pathname.includes("student-auth.html")) {
    window.location.href = "student-auth.html?action=" + action;
  }
};

window.closeStudentAuthModal = function() {
  const modal = document.getElementById("student-auth-modal");
  if (modal) modal.style.display = "none";
};

window.toggleMobileMenu = function(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }
  const navLinks = document.getElementById("nav-links") || document.querySelector(".nav-links");
  const mobileToggle = document.getElementById("mobile-toggle");
  if (navLinks) {
    const isActive = navLinks.classList.toggle("mobile-active");
    if (mobileToggle) {
      mobileToggle.innerHTML = isActive ? `<i data-lucide="x"></i>` : `<i data-lucide="menu"></i>`;
    }
    if (window.lucide) window.lucide.createIcons();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const isCurrentMaintenancePage = window.location.pathname.includes("maintenance.html");
  const isAdminPath = window.location.pathname.includes("admin") || window.location.pathname.includes("/admin");
  const hasAdminPreview = new URLSearchParams(window.location.search).has("admin_preview");

  // Check Maintenance API Status
  fetch("/api/maintenance?_t=" + Date.now(), { cache: "no-store" })
    .then(res => res.json())
    .then(data => {
      if (data && data.success && data.data) {
        if (data.data.status === "ON" && !isCurrentMaintenancePage && !isAdminPath && !hasAdminPreview) {
          localStorage.setItem("founders_maintenance", "ON");
          if (data.data.title) localStorage.setItem("maint_title", data.data.title);
          if (data.data.message) localStorage.setItem("maint_msg", data.data.message);
          window.location.replace("maintenance.html");
        } else if (data.data.status === "OFF") {
          localStorage.setItem("founders_maintenance", "OFF");
        }
      }
    })
    .catch(() => {
      const isMaint = localStorage.getItem("founders_maintenance") === "ON";
      if (isMaint && !isCurrentMaintenancePage && !isAdminPath && !hasAdminPreview) {
        window.location.replace("maintenance.html");
      }
    });

  // Initialize Lucide Icons with dual-pass
  initLucideIcons();

  function initLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
      setTimeout(() => {
        window.lucide.createIcons();
      }, 60);
    }
  }

  /* ==========================================================================
     0. Preloader Controller Logic
     ========================================================================== */
  /* ==========================================================================
     0. Preloader Controller Logic (Smooth & Fast 1.8-Second Duration)
     ========================================================================== */
  function initPreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) return;

    // Only display preloader on first visit per tab session or when tab is reopened
    if (sessionStorage.getItem("founders_preloader_seen") === "true") {
      preloader.style.display = "none";
      document.body.classList.remove("preloader-lock");
      if (preloader.parentNode) {
        preloader.parentNode.removeChild(preloader);
      }
      return;
    }

    // Record that preloader has been shown for current session
    sessionStorage.setItem("founders_preloader_seen", "true");

    const progressFill = document.getElementById("preloader-progress-fill");
    const percentText = document.getElementById("preloader-percent");
    const statusText = document.getElementById("preloader-status");

    const TOTAL_DURATION = 1800; // 1.8 seconds total for smooth, crisp counting
    const startTime = Date.now();

    const statusMessages = [
      "Initializing Founders Studio...",
      "Connecting to High-Income Skill Servers...",
      "Loading Course Curriculum...",
      "Preparing SMMA & Video Editing Modules...",
      "Configuring Student Portal...",
      "Optimizing Agency Blueprint Assets...",
      "Ready to Elevate Your Future!"
    ];

    let messageIndex = 0;

    const updateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(1, elapsed / TOTAL_DURATION);
      const currentProgress = Math.floor(progressRatio * 100);

      // Update UI elements
      if (progressFill) progressFill.style.width = `${currentProgress}%`;
      if (percentText) percentText.textContent = `${currentProgress}%`;

      // Cycle status message smoothly based on progress ratio
      const nextMsgIndex = Math.min(
        Math.floor(progressRatio * statusMessages.length),
        statusMessages.length - 1
      );

      if (nextMsgIndex !== messageIndex && statusText) {
        messageIndex = nextMsgIndex;
        statusText.style.opacity = "0";
        setTimeout(() => {
          if (statusText) {
            statusText.textContent = statusMessages[messageIndex];
            statusText.style.opacity = "1";
          }
        }, 100);
      }

      // Complete preloader exit transition after 1.8s
      if (elapsed >= TOTAL_DURATION) {
        clearInterval(updateInterval);
        if (progressFill) progressFill.style.width = "100%";
        if (percentText) percentText.textContent = "100%";

        setTimeout(() => {
          preloader.classList.add("preloader-hide");
          document.body.classList.remove("preloader-lock");

          setTimeout(() => {
            if (preloader.parentNode) {
              preloader.parentNode.removeChild(preloader);
            }
          }, 400);
        }, 200);
      }
    }, 20);
  }

  initPreloader();

  // App State
  let currentLang = "en";
  let activeCategory = "all";
  let activeCourseForCheckout = null;

  // DOM Elements
  const coursesGrid = document.getElementById("courses-grid");
  const filterTabs = document.getElementById("filter-tabs");
  const courseSearch = document.getElementById("course-search");
  const testimonialsGrid = document.getElementById("testimonials-grid");
  const faqAccordion = document.getElementById("faq-accordion");

  // Modals & Overlays
  const courseModal = document.getElementById("course-modal");
  const courseModalBody = document.getElementById("course-modal-body");
  const courseModalClose = document.getElementById("course-modal-close");

  const checkoutModal = document.getElementById("checkout-modal");
  const checkoutModalClose = document.getElementById("checkout-modal-close");

  const authModal = document.getElementById("auth-modal");
  const authModalClose = document.getElementById("auth-modal-close");
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const announcementCta = document.getElementById("announcement-cta");
  const langToggle = document.getElementById("lang-toggle");
  const currentLangSpan = document.getElementById("current-lang");

  // Auth Tabs & Forms
  const tabLoginBtn = document.getElementById("tab-login-btn");
  const tabRegisterBtn = document.getElementById("tab-register-btn");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  // Checkout Elements
  const checkoutCourseTitle = document.getElementById("checkout-course-title");
  const summaryOriginalPrice = document.getElementById("summary-original-price");
  const summaryDiscount = document.getElementById("summary-discount");
  const summaryFinalPrice = document.getElementById("summary-final-price");
  const instructionPrice = document.getElementById("instruction-price");
  const applyPromoBtn = document.getElementById("apply-promo-btn");
  const promoCodeInput = document.getElementById("promo-code");
  const confirmPaymentBtn = document.getElementById("confirm-payment-btn");
  const paymentInstructions = document.getElementById("payment-instructions");
  const paymentRadios = document.querySelectorAll('input[name="payment-method"]');

  // Dashboard Tabs
  const portalNavItems = document.querySelectorAll(".portal-nav-item");
  const portalContent = document.getElementById("portal-content");

  // Toast Container
  const toastContainer = document.getElementById("toast-container");

  /* ==========================================================================
     1. Render Courses Grid from Database API / Supabase
     ========================================================================== */
  let apiCoursesList = [];
  let apiBundlesList = [];

  function findCourse(courseId) {
    const safeCourses = typeof COURSES !== 'undefined' ? COURSES : [];
    if (!courseId) return safeCourses.length > 0 ? safeCourses[0] : {};
    const bundlePool = apiBundlesList.map(b => ({
      id: b.id,
      title: b.title,
      priceETB: b.price,
      originalPriceETB: b.total_individual_price_etb && b.total_individual_price_etb !== "N/A" ? b.total_individual_price_etb : "25,000 ETB",
      description: b.description || "Course course bundle package deal.",
      categoryName: "Special Package Bundle",
      category: "bundle",
      badge: "Special Package",
      duration: `${b.total_courses_count || 3} Courses Included`
    }));

    const pool = [...bundlePool, ...apiCoursesList, ...safeCourses];
    let found = pool.find(c => c.id === courseId);
    if (found) return found;

    const clean = String(courseId).replace(/^(course|bundle)-/, "").toLowerCase();
    found = pool.find(c => 
      c.id.toLowerCase() === clean ||
      c.id.toLowerCase().includes(clean) || 
      clean.includes(c.id.toLowerCase()) || 
      c.title.toLowerCase().includes(clean)
    );
    return found || (safeCourses.length > 0 ? safeCourses[0] : {});
  }

  function fetchLiveCoursesFromApi() {
    // Initial immediate render with fallback courses
    renderCourses();

    fetch("/api/courses")
      .then(res => res.json())
      .then(data => {
        const safeCourses = typeof COURSES !== 'undefined' ? COURSES : [];
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          // Map DB records to UI format with fallback to rich curriculum metadata
          apiCoursesList = data.data.filter(c => c.status !== "OFF").map(c => {
            const cleanId = (c.id || "").replace(/^course-/, "").toLowerCase();
            const matchedStatic = safeCourses.find(st => 
              st.id.toLowerCase() === cleanId ||
              st.id === c.id ||
              st.title.toLowerCase().trim() === (c.title || "").toLowerCase().trim() ||
              st.category.toLowerCase() === (c.category || "").toLowerCase()
            ) || safeCourses[0] || {};

            return {
              id: c.id,
              title: c.title || matchedStatic.title,
              category: c.category && c.category.toLowerCase().includes("smma") ? "marketing" :
                        c.category && c.category.toLowerCase().includes("video") ? "video" :
                        c.category && c.category.toLowerCase().includes("content") ? "content" :
                        c.category && c.category.toLowerCase().includes("design") ? "design" :
                        (matchedStatic.category || "marketing"),
              categoryName: c.category || matchedStatic.category,
              priceETB: c.price ? (c.price.includes("ETB") ? c.price : `${c.price} ETB`) : matchedStatic.priceETB,
              originalPriceETB: matchedStatic.originalPriceETB || "12,500 ETB",
              badge: matchedStatic.badge || "Featured",
              description: c.description || matchedStatic.description,
              duration: matchedStatic.duration || "6-8 Weeks",
              modulesCount: matchedStatic.modulesCount || 36,
              rating: matchedStatic.rating || "4.9",
              students: `${c.enrolled_students || 1200} Students`,
              tg_channel: c.tg_channel || "",
              tg_group: c.tg_group || "",
              coupon_code: c.coupon_code || "",
              coupon_discount: c.coupon_discount || "",
              outcomes: matchedStatic.outcomes || [
                "Master fundamental and advanced industry skills",
                "Work on practical portfolio projects & client deliverables",
                "Join private Telegram mentorship and weekly live Q&A",
                "Receive official verified certificate upon completion"
              ],
              bonuses: matchedStatic.bonuses || [
                "Included: Client Pitch & Outreach Scripts",
                "Included: Agency Contract & SLA Templates"
              ],
              modules: matchedStatic.modules || [
                { title: "Module 1: Foundations & Fundamentals", duration: "2h 00m" },
                { title: "Module 2: Advanced Practical Techniques", duration: "3h 30m" },
                { title: "Module 3: Portfolio & Client Acquisition", duration: "2h 45m" }
              ]
            };
          });
          renderCourses();
        } else {
          renderCourses();
        }
      })
      .catch((err) => {
        console.warn("API Courses fetch error:", err);
        renderCourses();
      });
  }

  function isCategoryMatch(course, targetCategory) {
    if (!targetCategory || targetCategory === "all") return true;
    const cat = (course.category || "").toLowerCase();
    const catName = (course.categoryName || "").toLowerCase();
    const target = targetCategory.toLowerCase();
    
    if (cat === target || catName === target) return true;
    if (target === "marketing" && (cat.includes("marketing") || cat.includes("smma") || catName.includes("marketing") || catName.includes("smma"))) return true;
    if (target === "video" && (cat.includes("video") || cat.includes("vfx") || cat.includes("editing") || catName.includes("video") || catName.includes("editing"))) return true;
    if (target === "content" && (cat.includes("content") || cat.includes("viral") || catName.includes("content"))) return true;
    if (target === "design" && (cat.includes("design") || cat.includes("brand") || catName.includes("design"))) return true;
    if (target === "ai" && (cat.includes("ai") || cat.includes("automation") || catName.includes("ai"))) return true;
    return cat.includes(target) || catName.includes(target);
  }

  function renderCourses() {
    const targetGrid = document.getElementById("courses-grid") || coursesGrid;
    if (!targetGrid) return;
    const searchInput = document.getElementById("course-search") || courseSearch;
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const safeCourses = typeof COURSES !== 'undefined' ? COURSES : [];
    const coursesToRender = apiCoursesList.length > 0 ? apiCoursesList : safeCourses;

    const filtered = coursesToRender.filter(course => {
      const matchesCategory = isCategoryMatch(course, activeCategory);
      
      const titleText = (course.title || "").toLowerCase();
      const descText = (course.description || "").toLowerCase();
      const catText = (course.category || "").toLowerCase();
      const catNameText = (course.categoryName || "").toLowerCase();
      const priceText = (course.priceETB || course.price || "").toLowerCase();
      const badgeText = (course.badge || "").toLowerCase();
      const outcomesText = Array.isArray(course.outcomes) ? course.outcomes.join(" ").toLowerCase() : "";
      const modulesText = Array.isArray(course.modules) ? course.modules.map(m => m.title).join(" ").toLowerCase() : "";

      const matchesSearch = !searchTerm || 
                            titleText.includes(searchTerm) || 
                            descText.includes(searchTerm) || 
                            catText.includes(searchTerm) || 
                            catNameText.includes(searchTerm) || 
                            priceText.includes(searchTerm) || 
                            badgeText.includes(searchTerm) ||
                            outcomesText.includes(searchTerm) ||
                            modulesText.includes(searchTerm);

      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      targetGrid.innerHTML = `
        <div class="glass-card" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
          <i data-lucide="search-x" style="width: 48px; height: 48px; color: var(--text-dim); margin-bottom: 16px;"></i>
          <h3>No courses found for "${searchTerm}"</h3>
          <p style="color: var(--text-muted);">Try adjusting your search query or switching category filter.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    targetGrid.innerHTML = filtered.map(course => `
      <div class="glass-card course-card">
        <div class="course-card-top">
          <div class="course-badge-row">
            <span class="course-category">${course.categoryName || course.category}</span>
            <span class="course-price">${course.priceETB}</span>
          </div>

          <h3 class="course-title">${course.title}</h3>
          <p class="course-desc">${course.description}</p>
        </div>

        <div class="course-card-bottom">
          <div class="course-stats-meta">
            <span><i data-lucide="clock"></i> ${course.duration}</span>
            <span><i data-lucide="star" style="color: #fbbf24;"></i> ${course.rating} (${course.students})</span>
          </div>

          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-outline btn-block view-syllabus-btn" data-course-id="${course.id}">
              Syllabus
            </button>
            <button type="button" class="btn btn-primary btn-block enroll-now-btn" data-course-id="${course.id}">
              Enroll
            </button>
          </div>
        </div>
      </div>
    `).join("");

    if (window.lucide) window.lucide.createIcons();

    // Attach Event Listeners to rendered buttons
    targetGrid.querySelectorAll(".view-syllabus-btn").forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        openCourseDrawer(btn.getAttribute("data-course-id"));
      };
    });

    targetGrid.querySelectorAll(".enroll-now-btn").forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        openCheckout(btn.getAttribute("data-course-id"));
      };
    });
  }

  function fetchCategoriesFromApi() {
    if (!filterTabs) return;
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const activeCats = data.data.filter(c => c.status !== "OFF");
          if (activeCats.length > 0) {
            filterTabs.innerHTML = `
              <button class="filter-tab active" data-category="all">All Courses</button>
              ${activeCats.map(c => `
                <button class="filter-tab" data-category="${c.name.toLowerCase()}">${c.name}</button>
              `).join("")}
            `;
          }
        }
      })
      .catch(() => {});
  }

  // Initial fetch from Supabase database
  fetchLiveCoursesFromApi();
  fetchLiveBundlesFromApi();
  fetchCategoriesFromApi();
  fetchLandingConfigFromApi();

  function fetchLiveBundlesFromApi() {
    const containers = document.querySelectorAll("#bundles-grid-container");
    const grids = document.querySelectorAll("#bundles-grid");

    fetch("/api/bundles")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const activeBundles = data.data.filter(b => (b.status === "ON" || (b.status !== "OFF" && b.status !== "inactive")));
          apiBundlesList = activeBundles;

          if (activeBundles.length > 0) {
            containers.forEach(c => c.style.display = "block");
            const html = activeBundles.map(b => {
              const mainTitle = b.main_course ? b.main_course.title : "Main Course";
              const includedCourses = Array.isArray(b.included_courses) ? b.included_courses : [];

              return `
                <div class="glass-card course-card" style="border: 2px solid rgba(212, 175, 55, 0.4); background: linear-gradient(145deg, rgba(20, 20, 30, 0.9) 0%, rgba(30, 25, 15, 0.95) 100%); flex: 1; min-width: 300px; max-width: 450px;">
                  <div class="course-card-top">
                    <div class="course-badge-row">
                      <span class="course-category" style="background: rgba(212, 175, 55, 0.2); color: var(--primary-gold); font-weight: 700;">
                        <i data-lucide="layers"></i> SPECIAL PACKAGE BUNDLE
                      </span>
                      <span class="course-price" style="color: #10b981; font-weight: 800;">${escapeHtml(b.price)}</span>
                    </div>

                    <h3 class="course-title" style="margin-top: 10px;">${escapeHtml(b.title)}</h3>
                    <p class="course-desc">${escapeHtml(b.description || '')}</p>

                    <div style="margin: 14px 0 10px; padding: 12px; background: rgba(212, 175, 55, 0.08); border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.2);">
                      <div style="font-size: 0.78rem; text-transform: uppercase; font-weight: 700; color: var(--primary-gold); margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                        <i data-lucide="star" style="width: 14px; height: 14px;"></i> Core Main Course
                      </div>
                      <div style="font-weight: 700; font-size: 0.92rem; color: var(--text-main);">${escapeHtml(mainTitle)}</div>
                    </div>

                    ${includedCourses.length > 0 ? `
                      <div style="margin-bottom: 14px;">
                        <div style="font-size: 0.78rem; text-transform: uppercase; font-weight: 700; color: #10b981; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
                          <i data-lucide="gift" style="width: 14px; height: 14px;"></i> Included Bonus Courses (${includedCourses.length}):
                        </div>
                        <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px;">
                          ${includedCourses.map(ic => `
                            <li style="font-size: 0.84rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                              <i data-lucide="check-circle-2" style="width: 14px; height: 14px; color: #10b981;"></i>
                              <span>${escapeHtml(ic.title)}</span>
                              ${ic.status === 'OFF' ? '<small style="color:#ef4444; font-weight:700;">[Unlisted Bonus]</small>' : ''}
                            </li>
                          `).join("")}
                        </ul>
                      </div>
                    ` : ''}
                  </div>

                  <div class="course-card-bottom">
                    <div class="course-stats-meta" style="justify-content: space-between;">
                      <span><i data-lucide="check-square"></i> ${b.total_courses_count || (includedCourses.length + 1)} Courses Included</span>
                      ${b.total_individual_price_etb && b.total_individual_price_etb !== "N/A" ? `<span style="text-decoration: line-through; color: var(--text-dim);">Valued at ${escapeHtml(b.total_individual_price_etb)}</span>` : ''}
                    </div>

                    <button type="button" class="btn btn-primary btn-block enroll-bundle-btn" data-bundle-id="${b.id}" style="background: linear-gradient(135deg, var(--primary-gold) 0%, var(--primary-gold-hover) 100%); color: #000; font-weight: 800; margin-top: 10px;">
                      <i data-lucide="shopping-cart"></i> Enroll in Package Bundle (${escapeHtml(b.price)})
                    </button>
                  </div>
                </div>
              `;
            }).join("");

            grids.forEach(g => {
              g.innerHTML = html;
              g.querySelectorAll(".enroll-bundle-btn").forEach(btn => {
                btn.onclick = (e) => {
                  e.preventDefault();
                  openCheckout(btn.getAttribute("data-bundle-id"));
                };
              });
            });

            if (window.lucide) window.lucide.createIcons();
          }
        }
      })
      .catch(err => {
        console.warn("Bundles fetch error:", err);
        containers.forEach(c => c.style.display = "block");
      });
  }

  // Expose global reloader
  window.reloadBundlesFromDatabase = fetchLiveBundlesFromApi;



  // Filter Tabs Handler
  if (filterTabs) {
    filterTabs.addEventListener("click", (e) => {
      if (e.target.classList.contains("filter-tab")) {
        filterTabs.querySelectorAll(".filter-tab").forEach(tab => tab.classList.remove("active"));
        e.target.classList.add("active");
        activeCategory = e.target.dataset.category;
        renderCourses();
      }
    });
  }

  if (courseSearch) {
    courseSearch.addEventListener("input", renderCourses);
  }

  function fetchLandingConfigFromApi() {
    // Check cached config for instant 0ms section & nav link visibility checks
    const cached = localStorage.getItem("founders_landing_config");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        liveLandingConfig = parsed;
        applyLandingConfigToDOM(parsed);
      } catch (_e) {}
    }

    fetch("/api/landing")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          liveLandingConfig = data.data;
          try {
            localStorage.setItem("founders_landing_config", JSON.stringify(data.data));
          } catch (_e) {}
          applyLandingConfigToDOM(data.data);
        }
      })
      .catch(() => {});
  }

  function applySectionVisibilities(config) {
    if (!config) return;

    const sectionMap = [
      {
        key: "hero",
        status: config.hero?.status || config.hero?.heroStatus || "active",
        selectors: [".hero-section", "#home"],
        linkSelectors: ['a[href="#home"]', 'a[href="#hero"]']
      },
      {
        key: "announcement",
        status: config.announcement?.enabled !== false && config.announcement?.status !== "inactive" ? "active" : "inactive",
        selectors: [".announcement-bar"],
        linkSelectors: []
      },
      {
        key: "metrics",
        status: config.metrics?.status || config.metricsStatus || "active",
        selectors: [".metrics-bar", "#metrics"],
        linkSelectors: ['a[href="#metrics"]']
      },
      {
        key: "personas",
        status: config.personasSection?.status || config.personas?.status || config.personasStatus || "active",
        selectors: ["#personas", ".personas-section"],
        linkSelectors: ['a[href="#personas"]']
      },
      {
        key: "instructors",
        status: config.instructorsSection?.status || config.instructors?.status || config.instructorsStatus || "active",
        selectors: ["#instructors", ".instructors-section"],
        linkSelectors: ['a[href="#instructors"]']
      },
      {
        key: "whatYouGet",
        status: config.whatYouGet?.status || config.guaranteeStatus || "active",
        selectors: ["#what-you-get", ".guarantee-section"],
        linkSelectors: ['a[href="#what-you-get"]', 'a[href="#guarantee"]']
      },
      {
        key: "successStories",
        status: config.successStories?.status || config.storiesStatus || "active",
        selectors: ["#success-stories", ".success-stories-section"],
        linkSelectors: ['a[href="#success-stories"]']
      },
      {
        key: "testimonials",
        status: config.testimonialsSection?.status || config.testimonialsStatus || "active",
        selectors: ["#testimonials", ".testimonials-section"],
        linkSelectors: ['a[href="#testimonials"]']
      },
      {
        key: "faqs",
        status: config.faqsSection?.status || config.faqsStatus || "active",
        selectors: ["#faq", "#faqs", ".faq-section"],
        linkSelectors: ['a[href="#faq"]', 'a[href="#faqs"]']
      },
      {
        key: "supportFooter",
        status: config.supportFooter?.status || config.footerStatus || "active",
        selectors: [".support-banner", ".support-section", "#support", ".support-box"],
        linkSelectors: ['a[href="#support"]', 'a[href*="founderssupport"]']
      }
    ];

    sectionMap.forEach(item => {
      const isOff = item.status === "inactive" || item.status === "OFF" || item.status === false || item.status === "disabled";

      // Hide/Show section container elements
      item.selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.style.display = isOff ? "none" : "";
        });
      });

      // Hide/Show any navigation links pointing to this section
      item.linkSelectors.forEach(linkSel => {
        document.querySelectorAll(linkSel).forEach(linkEl => {
          linkEl.style.display = isOff ? "none" : "";
        });
      });
    });
  }

  function applyLandingConfigToDOM(config) {
    if (!config) return;

    applySectionVisibilities(config);

    // 1. Announcement Bar
    if (config.announcement) {
      const annBar = document.querySelector(".announcement-bar");
      if (annBar) {
        if (config.announcement.enabled === false || config.announcement.status === "inactive") {
          annBar.style.display = "none";
        } else {
          annBar.style.display = "";
          const badge = annBar.querySelector(".badge");
          const textSpan = annBar.querySelector("[data-i18n='announcement_text']");
          const ctaBtn = document.getElementById("announcement-cta");
          if (badge) badge.innerHTML = `<i data-lucide="sparkles"></i> ${config.announcement.badge || "NEW ENROLLMENT OPEN"}`;
          if (textSpan) textSpan.textContent = config.announcement.text || "";
          if (ctaBtn) {
            ctaBtn.textContent = config.announcement.ctaText || "Join Now →";
            if (config.announcement.ctaLink) ctaBtn.href = config.announcement.ctaLink;
          }
        }
      }
    }

    // 2. Hero Section & Intro Video
    if (config.hero) {
      const heroBadge = document.querySelector("[data-i18n='hero_badge']");
      const heroTitle = document.querySelector(".hero-title");
      const heroSub = document.querySelector(".hero-subtitle");
      const primaryCta = document.querySelector("[data-i18n='hero_cta_primary']");
      const secondaryCta = document.querySelector("[data-i18n='hero_cta_secondary']");
      const trustSpan = document.querySelector(".hero-trust .trust-text span");

      if (heroBadge) heroBadge.textContent = config.hero.badge || "";
      if (heroTitle) {
        heroTitle.innerHTML = `${config.hero.title || ''} <span class="gradient-text">${config.hero.highlightText || ''}</span>`;
      }
      if (heroSub) heroSub.textContent = config.hero.subtitle || "";
      if (primaryCta) {
        primaryCta.textContent = config.hero.primaryCtaText || "Explore & Join Courses";
        if (config.hero.primaryCtaLink) {
          const pAnchor = primaryCta.closest("a");
          if (pAnchor) pAnchor.href = config.hero.primaryCtaLink;
        }
      }
      if (secondaryCta) secondaryCta.textContent = config.hero.secondaryCtaText || "Watch Intro Video";
      const heroTrust = document.querySelector(".hero-trust");
      if (heroTrust) {
        if (config.hero.trustStatus === "inactive" || config.hero.trustStatus === "OFF" || config.hero.trustStatus === false) {
          heroTrust.style.display = "none";
        } else {
          heroTrust.style.display = "";

          // 1. Render Student Avatars
          const trustAvatarsDiv = heroTrust.querySelector(".trust-avatars");
          if (trustAvatarsDiv && Array.isArray(config.hero.trustAvatars) && config.hero.trustAvatars.length > 0) {
            trustAvatarsDiv.innerHTML = config.hero.trustAvatars
              .filter(url => url && String(url).trim().length > 0)
              .map((url, i) => `<img src="${escapeHtml(url)}" alt="Student ${i + 1}">`)
              .join("");
          }

          // 2. Render Rating Stars
          const trustStarsDiv = heroTrust.querySelector(".stars");
          if (trustStarsDiv) {
            const numStars = parseInt(config.hero.trustRatingStars || 5, 10) || 5;
            let starsHtml = "";
            for (let s = 0; s < numStars; s++) {
              starsHtml += `<i data-lucide="star"></i>`;
            }
            trustStarsDiv.innerHTML = starsHtml;
            if (window.lucide) window.lucide.createIcons();
          }

          // 3. Render Student Count & Subtitle Text
          const trustSpan = heroTrust.querySelector(".trust-text span");
          if (trustSpan) {
            trustSpan.innerHTML = `<strong>${escapeHtml(config.hero.trustStudentsCount || '4,850+')}</strong> ${escapeHtml(config.hero.trustSubtitle || 'Ethiopian youth trained & launching clients')}`;
          }
        }
      }

      // Intro Video Box & Video Modal Frame
      if (config.hero.introVideo) {
        if (config.hero.introVideo.embedUrl) {
          currentIntroVideoEmbedUrl = config.hero.introVideo.embedUrl;
          const introVideoFrame = document.getElementById("intro-video-frame");
          if (introVideoFrame) {
            introVideoFrame.src = formatYouTubeEmbedUrl(currentIntroVideoEmbedUrl, 0);
          }
        }
        const videoBox = document.querySelector(".hero-video-box");
        if (videoBox) {
          const thumbImg = videoBox.querySelector(".video-thumb-img");
          const vTitle = videoBox.querySelector(".video-info-strip h4");
          const vBadge = videoBox.querySelector(".video-info-strip .video-badge");
          if (thumbImg && config.hero.introVideo.thumbUrl) thumbImg.src = config.hero.introVideo.thumbUrl;
          if (vTitle) vTitle.innerHTML = `<i data-lucide="play-circle" style="color: var(--primary-gold);"></i> ${config.hero.introVideo.title || "Founders Academy Video Overview"}`;
          if (vBadge) vBadge.innerHTML = `<i data-lucide="clock"></i> ${config.hero.introVideo.durationBadge || "2:15 MIN TOUR"}`;
        }
      }
    }

    // 3. Metrics Bar
    if (config.metrics && Array.isArray(config.metrics) && config.metrics.length > 0) {
      const metricsGrid = document.querySelector(".metrics-bar .metrics-grid");
      if (metricsGrid) {
        metricsGrid.innerHTML = config.metrics.map(m => `
          <div class="metric-item">
            <h2 class="metric-number" data-target="${m.target}">0${m.suffix || ''}</h2>
            <p class="metric-label">${m.label}</p>
          </div>
        `).join("");
        animateMetrics();
      }
    }

    // 4. Personas (Who is this for?)
    if (config.personas && Array.isArray(config.personas) && config.personas.length > 0) {
      const personaGrid = document.querySelector(".persona-grid");
      if (personaGrid) {
        personaGrid.innerHTML = config.personas.map(p => `
          <div class="glass-card persona-card">
            <div>
              <div class="persona-icon-box">
                <i data-lucide="${p.icon || 'briefcase'}"></i>
              </div>
              <h3>${p.title}</h3>
              <p class="persona-desc">${p.description}</p>
            </div>
            <div>
              <a href="${p.link || 'courses.html'}" class="persona-outcome-tag"><i data-lucide="check-circle-2"></i> ${p.outcome}</a>
            </div>
          </div>
        `).join("");
      }
    }

    // 5. Instructors & Trusted By
    if (config.instructors) {
      const instSection = document.getElementById("instructors");
      if (instSection) {
        const secTag = instSection.querySelector(".section-tag");
        const secTitle = instSection.querySelector(".section-title");
        const secSub = instSection.querySelector(".section-subtitle");
        if (secTag && config.instructors.sectionTag) secTag.innerHTML = `<i data-lucide="award"></i> ${config.instructors.sectionTag}`;
        if (secTitle && config.instructors.sectionTitle) secTitle.innerHTML = `${config.instructors.sectionTitle} <span class="gradient-text">Industry Leaders</span>`;
        if (secSub && config.instructors.sectionSubtitle) secSub.textContent = config.instructors.sectionSubtitle;

        // Partner Logos Strip
        if (config.instructors.partnerLogos && Array.isArray(config.instructors.partnerLogos) && config.instructors.partnerLogos.length > 0) {
          const logosGrid = instSection.querySelector(".trusted-logos-grid");
          if (logosGrid) {
            logosGrid.innerHTML = config.instructors.partnerLogos.map(logo => {
              return `<div class="trusted-logo-pill">${escapeHtml(logo)}</div>`;
            }).join("");
          }
        }

        // Mentors Cards Grid
        if (config.instructors.mentors && Array.isArray(config.instructors.mentors) && config.instructors.mentors.length > 0) {
          const instGrid = instSection.querySelector(".instructors-grid");
          const activeMentors = config.instructors.mentors.filter(m => m.status !== "disabled" && m.status !== "OFF");
          if (instGrid) {
            instGrid.innerHTML = activeMentors.map(m => {
              let photoUrl = m.photo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80';
              if (photoUrl.includes("ibb.co/") && !photoUrl.includes("i.ibb.co")) {
                fetch("/api/resolve-image-url?url=" + encodeURIComponent(photoUrl))
                  .then(r => r.json())
                  .then(d => {
                    if (d.success && d.directUrl) {
                      document.querySelectorAll(`img[data-mentor-id="${m.id}"]`).forEach(img => {
                        img.src = d.directUrl;
                      });
                    }
                  }).catch(() => {});
              }
              return `
                <div class="instructor-card glass-card">
                  <div class="instructor-avatar-wrap">
                    <img src="${photoUrl}" data-mentor-id="${m.id}" alt="${escapeHtml(m.name)}" class="instructor-avatar-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80';">
                    <div class="instructor-badge-icon"><i data-lucide="shield-check"></i></div>
                  </div>
                  <h3 class="instructor-name">${escapeHtml(m.name)}</h3>
                  <span class="instructor-role">${escapeHtml(m.role)}</span>
                  <p class="instructor-bio">${escapeHtml(m.bio)}</p>
                  <div class="instructor-stats-row">
                    <span><i data-lucide="users"></i> ${escapeHtml(m.stat1 || 'Mentored')}</span>
                    <span><i data-lucide="award"></i> ${escapeHtml(m.stat2 || 'Certified')}</span>
                  </div>
                </div>
              `;
            }).join("");
          }
        }
      }
    }

    // 6. What You Get Inside & Guarantee
    if (config.whatYouGet) {
      const whatSection = document.getElementById("what-you-get");
      if (whatSection) {
        const secTag = whatSection.querySelector(".section-tag");
        const secTitle = whatSection.querySelector(".section-title");
        const secSub = whatSection.querySelector(".section-subtitle");
        if (secTag && config.whatYouGet.sectionTag) secTag.innerHTML = `<i data-lucide="package-check"></i> ${config.whatYouGet.sectionTag}`;
        if (secTitle && config.whatYouGet.sectionTitle) secTitle.innerHTML = `${config.whatYouGet.sectionTitle} <span class="gradient-text">Founders Academy</span>`;
        if (secSub && config.whatYouGet.sectionSubtitle) secSub.textContent = config.whatYouGet.sectionSubtitle;

        // Deliverables Grid
        if (config.whatYouGet.deliverables && Array.isArray(config.whatYouGet.deliverables) && config.whatYouGet.deliverables.length > 0) {
          const delivGrid = whatSection.querySelector(".what-you-get-grid");
          if (delivGrid) {
            delivGrid.innerHTML = config.whatYouGet.deliverables.map(d => `
              <div class="what-you-get-card glass-card">
                <div>
                  <div class="what-you-get-header">
                    <div class="what-you-get-icon"><i data-lucide="${d.icon || 'layers'}"></i></div>
                    <span class="value-pill">${d.pill || 'CORE'}</span>
                  </div>
                  <h3>${d.title}</h3>
                  <p>${d.desc}</p>
                </div>
                <ul class="what-you-get-list">
                  ${(d.bullets || []).map(b => `<li><i data-lucide="check"></i> ${b}</li>`).join("")}
                </ul>
              </div>
            `).join("");
          }
        }

        // Guarantee Pillars
        if (config.whatYouGet.guaranteePillars && Array.isArray(config.whatYouGet.guaranteePillars) && config.whatYouGet.guaranteePillars.length > 0) {
          const guarGrid = whatSection.querySelector(".guarantee-section .metrics-grid");
          if (guarGrid) {
            guarGrid.innerHTML = config.whatYouGet.guaranteePillars.map(g => `
              <div class="metric-item" style="padding: 10px; text-align: center;">
                <i data-lucide="${g.icon || 'shield-check'}" style="width: 36px; height: 36px; color: var(--primary-gold); margin-bottom: 10px;"></i>
                <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 6px;">${g.title}</h4>
                <p style="font-size: 0.82rem; color: var(--text-muted);">${g.description || g.desc || ''}</p>
              </div>
            `).join("");
          }
        }
      }
    }

    // 7. Success Stories & Case Studies
    if (config.successStories) {
      const successSec = document.getElementById("success-stories");
      if (successSec) {
        if (config.successStories.status === "inactive" || config.successStories.status === "OFF" || config.successStories.enabled === false) {
          successSec.style.display = "none";
        } else {
          successSec.style.display = "";
        }

        const secTag = successSec.querySelector(".section-tag");
        const secTitle = successSec.querySelector(".section-title");
        const secSub = successSec.querySelector(".section-subtitle");
        if (secTag && config.successStories.sectionTag) secTag.innerHTML = `<i data-lucide="trophy"></i> ${config.successStories.sectionTag}`;
        if (secTitle && config.successStories.sectionTitle) {
          secTitle.innerHTML = config.successStories.sectionTitle.includes("span") 
            ? config.successStories.sectionTitle 
            : `Real Results <span class="gradient-text">${config.successStories.sectionTitle}</span>`;
        }
        if (secSub && config.successStories.sectionSubtitle) secSub.textContent = config.successStories.sectionSubtitle;

        // Case Studies Grid
        if (config.successStories.caseStudies && Array.isArray(config.successStories.caseStudies) && config.successStories.caseStudies.length > 0) {
          const caseGrid = successSec.querySelector(".success-stories-grid");
          if (caseGrid) {
            const activeStories = config.successStories.caseStudies.filter(cs => cs.status !== "inactive" && cs.status !== "disabled" && cs.status !== "OFF");
            caseGrid.innerHTML = activeStories.map(cs => `
              <div class="case-study-card glass-card">
                <div>
                  <div class="case-study-top">
                    <img src="${cs.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}" alt="${cs.name}" class="case-study-avatar">
                    <div class="case-study-author">
                      <h4>${cs.name}</h4>
                      <span>${cs.role}</span>
                    </div>
                  </div>
                  <div class="case-study-revenue-badge">
                    <i data-lucide="trending-up"></i> ${cs.badge}
                  </div>
                  <h3 class="case-study-headline">"${cs.quote}"</h3>
                  <p class="case-study-body">"${cs.story}"</p>
                </div>
                <div>
                  <div class="case-study-keys">
                    <span><i data-lucide="check-circle-2"></i> ${cs.key1}</span>
                    <span><i data-lucide="check-circle-2"></i> ${cs.key2}</span>
                    <span><i data-lucide="check-circle-2"></i> ${cs.key3}</span>
                  </div>
                </div>
              </div>
            `).join("");
          }
        }

        // Earnings Milestone Banner
        if (config.successStories.earningsBanner) {
          const banner = successSec.querySelector(".earnings-banner, .revenue-milestone-banner");
          if (banner) {
            const hNum = banner.querySelector("h3, .banner-number");
            const pSub = banner.querySelector("p");
            const ctaA = banner.querySelector("a.btn");
            if (hNum) hNum.textContent = config.successStories.earningsBanner.totalAmount || "18.5M+ ETB";
            if (pSub) pSub.textContent = config.successStories.earningsBanner.subtitle || "";
            if (ctaA) {
              ctaA.textContent = config.successStories.earningsBanner.ctaText || "Start Your Journey & Join Courses →";
              if (config.successStories.earningsBanner.ctaLink) ctaA.href = config.successStories.earningsBanner.ctaLink;
            }
          }
        }
      }
    }

    // 8. Testimonials
    if (config.testimonials && Array.isArray(config.testimonials) && config.testimonials.length > 0) {
      renderTestimonials(config.testimonials.filter(t => t.status !== "inactive"));
    }

    // 9. FAQs
    if (config.faqs && Array.isArray(config.faqs) && config.faqs.length > 0) {
      renderFAQ(config.faqs.filter(f => f.status !== "inactive"));
    }

    // 10. Support & Footer
    if (config.supportFooter) {
      const supportStatus = config.supportFooter.status;
      const isSupportOff = supportStatus === "inactive" || supportStatus === "OFF" || supportStatus === false || supportStatus === "disabled";

      const supportElements = document.querySelectorAll(".support-banner, .support-section, #support, .support-box");
      supportElements.forEach(el => {
        el.style.display = isSupportOff ? "none" : "";
      });

      const suppTitle = document.querySelector(".support-info h3");
      const suppSub = document.querySelector(".support-info p");
      const tgSuppBtn = document.getElementById("telegram-support-btn");
      const phoneBtn = document.querySelector(".support-actions a[href^='tel:']");

      if (suppTitle && config.supportFooter.supportTitle) suppTitle.textContent = config.supportFooter.supportTitle;
      if (suppSub && config.supportFooter.supportSubtitle) suppSub.textContent = config.supportFooter.supportSubtitle;
      if (tgSuppBtn) {
        if (config.supportFooter.supportTelegramLink) tgSuppBtn.href = config.supportFooter.supportTelegramLink;
        if (config.supportFooter.supportTelegramHandle) {
          tgSuppBtn.innerHTML = `<i data-lucide="send"></i> Message ${config.supportFooter.supportTelegramHandle}`;
        }
      }
      if (phoneBtn && config.supportFooter.supportPhone) {
        phoneBtn.href = `tel:${config.supportFooter.supportPhone.replace(/\s+/g, '')}`;
        phoneBtn.innerHTML = `<i data-lucide="phone"></i> ${config.supportFooter.supportPhone}`;
      }
      if (config.supportFooter.footerCopyright) {
        const copyElem = document.querySelector(".footer-bottom p");
        if (copyElem) copyElem.innerHTML = config.supportFooter.footerCopyright;
      }

      if (Array.isArray(config.supportFooter.socialLinks)) {
        const socialContainers = document.querySelectorAll(".social-links");
        const activeLinks = config.supportFooter.socialLinks.filter(l => l.status === "active" || l.status === "ON" || l.status === true);
        if (socialContainers.length > 0 && activeLinks.length > 0) {
          const html = activeLinks.map(l => {
            const iconSvg = getSocialIconSvg(l.platform, l.iconUrl, l.label);
            const targetAttr = (l.url && l.url.startsWith("http")) ? 'target="_blank" rel="noopener noreferrer"' : '';
            return `<a href="${l.url || '#'}" ${targetAttr} aria-label="${escapeHtml(l.label || l.platform)}" title="${escapeHtml(l.label || '')}">${iconSvg}</a>`;
          }).join("");
          socialContainers.forEach(container => {
            container.innerHTML = html;
          });
        }
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function getSocialIconSvg(platform, customIconUrl, label) {
    if (customIconUrl && String(customIconUrl).trim().length > 0) {
      return `<img src="${escapeHtml(String(customIconUrl).trim())}" alt="${escapeHtml(label || 'Icon')}" style="width: 20px; height: 20px; object-fit: contain; vertical-align: middle;">`;
    }
    const p = (platform || "").toLowerCase();
    if (p === "telegram") {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>`;
    }
    if (p === "youtube") {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>`;
    }
    if (p === "instagram") {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>`;
    }
    if (p === "linkedin") {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>`;
    }
    if (p === "tiktok") {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>`;
    }
    if (p === "twitter") {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" x2="22" y1="12" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
  }

  /* ==========================================================================
     2. Render Testimonials & FAQ
     ========================================================================== */
  function renderTestimonials(customList) {
    if (!testimonialsGrid) return;
    const list = (customList && Array.isArray(customList)) ? customList : (liveLandingConfig?.testimonials || []);
    const activeList = list.filter(t => t.status !== "inactive" && t.status !== "disabled" && t.status !== "OFF");

    testimonialsGrid.innerHTML = activeList.map(t => {
      let photoUrl = t.image || t.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';
      if (photoUrl.includes("ibb.co/") && !photoUrl.includes("i.ibb.co")) {
        fetch("/api/resolve-image-url?url=" + encodeURIComponent(photoUrl))
          .then(r => r.json())
          .then(d => {
            if (d.success && d.directUrl) {
              document.querySelectorAll(`img[data-testimonial-id="${t.id || t.name}"]`).forEach(img => {
                img.src = d.directUrl;
              });
            }
          }).catch(() => {});
      }
      return `
        <div class="glass-card testimonial-card">
          <div class="testimonial-header">
            <img src="${photoUrl}" data-testimonial-id="${t.id || t.name}" alt="${escapeHtml(t.name)}" class="testimonial-avatar" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';">
            <div class="testimonial-info">
              <h4>${escapeHtml(t.name)}</h4>
              <span>${escapeHtml(t.role)}</span>
            </div>
          </div>
          <p>"${escapeHtml(t.quote)}"</p>
          <div>
            <span class="earning-badge"><i data-lucide="trending-up"></i> ${escapeHtml(t.earnings || t.badge || 'Verified Graduate')}</span>
          </div>
        </div>
      `;
    }).join("");
    if (window.lucide) window.lucide.createIcons();
  }

  function renderFAQ(customList) {
    if (!faqAccordion) return;
    const list = (customList && Array.isArray(customList) && customList.length > 0) ? customList : FAQS;
    faqAccordion.innerHTML = list.map((f, index) => `
      <div class="faq-item ${index === 0 ? 'active' : ''}">
        <button class="faq-question">
          <span>${f.question}</span>
          <i data-lucide="chevron-down"></i>
        </button>
        <div class="faq-answer">
          <p>${f.answer}</p>
        </div>
      </div>
    `).join("");

    if (window.lucide) window.lucide.createIcons();

    faqAccordion.querySelectorAll(".faq-question").forEach(btn => {
      btn.addEventListener("click", () => {
        const item = btn.parentElement;
        item.classList.toggle("active");
      });
    });
  }

  /* ==========================================================================
     3. Course Details Drawer / Modal
     ========================================================================== */
  function openCourseDrawer(courseId) {
    const course = findCourse(courseId);
    const targetModal = document.getElementById("course-modal");
    const targetBody = document.getElementById("course-modal-body");
    const targetClose = document.getElementById("course-modal-close");

    if (!course || !targetModal || !targetBody) {
      console.warn("Course drawer target elements not found for courseId:", courseId);
      return;
    }

    const priceText = course.priceETB || course.price || "10,000 ETB";

    targetBody.innerHTML = `
      <div style="padding: 28px 24px;">
        <div class="badge badge-gold" style="margin-bottom: 12px;"><i data-lucide="sparkles"></i> ${course.badge || "Featured Course"}</div>
        <h2 style="font-family: var(--font-heading); font-size: 1.85rem; font-weight: 800; margin-bottom: 12px; color: #fff;">${course.title}</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 24px; line-height: 1.6;">${course.description}</p>
        
        <div class="glass-box" style="margin-bottom: 24px; padding: 20px;">
          <h4 style="color: var(--primary-gold); margin-bottom: 12px; font-size: 1rem;"><i data-lucide="check-circle-2"></i> What You Will Learn & Achieve:</h4>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 10px;">
            ${(course.outcomes || []).map(o => `<li style="font-size: 0.9rem; color: var(--text-main); display: flex; gap: 10px; align-items: flex-start;"><i data-lucide="check" style="color: var(--accent-emerald); width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px;"></i> <span>${o}</span></li>`).join("")}
          </ul>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 style="font-family: var(--font-heading); margin-bottom: 14px; color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;"><i data-lucide="list" style="color: var(--primary-gold);"></i> Course Curriculum & Syllabus</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${(course.modules || []).map((m, idx) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.92rem;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: rgba(245,158,11,0.15); color: var(--primary-gold); font-weight: 800; font-size: 0.8rem;">${idx + 1}</span>
                  <span style="color: #fff;"><strong>${m.title}</strong></span>
                </div>
                <span style="color: var(--text-dim); font-size: 0.85rem;"><i data-lucide="clock" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;"></i>${m.duration}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="glass-box" style="border-color: rgba(99, 102, 241, 0.4); margin-bottom: 24px; padding: 20px;">
          <h4 style="color: var(--accent-indigo); margin-bottom: 10px; font-size: 0.95rem;"><i data-lucide="gift"></i> Included Free Bonus Bundles:</h4>
          ${(course.bonuses || []).map(b => `<p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;"><i data-lucide="sparkles" style="width: 14px; height: 14px; color: var(--primary-gold);"></i> ${b}</p>`).join("")}
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 20px; gap: 16px; flex-wrap: wrap;">
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Enrollment Fee:</span>
            <div style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; color: var(--primary-gold);">${priceText}</div>
          </div>
          <button type="button" class="btn btn-primary btn-lg drawer-enroll-trigger" data-course-id="${course.id}">
            <i data-lucide="rocket"></i> Enroll Now &rarr;
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    targetModal.classList.add("active");
    document.body.style.overflow = "hidden";

    const drawerEnrollBtn = targetBody.querySelector(".drawer-enroll-trigger");
    if (drawerEnrollBtn) {
      drawerEnrollBtn.onclick = (e) => {
        e.preventDefault();
        targetModal.classList.remove("active");
        document.body.style.overflow = "";
        openCheckout(course.id);
      };
    }
  }

  function closeCourseDrawer() {
    const targetModal = document.getElementById("course-modal");
    if (targetModal) targetModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  window.openCourseDrawer = openCourseDrawer;
  window.closeCourseDrawer = closeCourseDrawer;

  const targetModal = document.getElementById("course-modal");
  const targetClose = document.getElementById("course-modal-close");

  if (targetClose) {
    targetClose.onclick = () => closeCourseDrawer();
  }
  if (targetModal) {
    targetModal.onclick = (e) => {
      if (e.target === targetModal) closeCourseDrawer();
    };
  }

  /* ==========================================================================
     4. Direct Buy 3-Step Checkout Flow
     ========================================================================== */
  /* ==========================================================================
     4. Direct Buy 3-Step Checkout Flow with Cookie Storage & Verify.ET
     ========================================================================== */
  let buyerData = { name: "", phone: "", address: "" };

  // Cookie Helpers
  function setCookie(name, value, days = 30) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
  }

  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }

  // Synthesizer Audio Boom Sound Effect
  function playBoomAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Sub-bass oscillator boom
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);

      // High sparkle chime
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'triangle';
      chimeOsc.frequency.setValueAtTime(587.33, ctx.currentTime + 0.1);
      chimeOsc.frequency.setValueAtTime(880, ctx.currentTime + 0.25);

      chimeGain.gain.setValueAtTime(0, ctx.currentTime);
      chimeGain.gain.setValueAtTime(0.3, ctx.currentTime + 0.1);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chimeOsc.start(ctx.currentTime + 0.1);
      chimeOsc.stop(ctx.currentTime + 1.2);
    } catch (_e) { /* ignore browser audio policy */ }
  }

  // Canvas Particle Explosion & Shockwave Boom Animation
  function triggerBoomEffect() {
    playBoomAudio();

    let canvas = document.getElementById("boom-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "boom-canvas";
      canvas.style.position = "fixed";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "99999";
      document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext("2d");
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    const centerX = width / 2;
    const centerY = height / 2;

    const particles = [];
    const colors = ["#f59e0b", "#fbbf24", "#6366f1", "#10b981", "#ec4899", "#3b82f6", "#ffffff"];
    const emojis = ["💥", "🎉", "🚀", "👑", "💰", "✨", "🔥"];

    for (let i = 0; i < 140; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 18;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 5),
        size: 4 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.01 + Math.random() * 0.02,
        gravity: 0.2,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
        emoji: Math.random() < 0.25 ? emojis[Math.floor(Math.random() * emojis.length)] : null
      });
    }

    let shockwaveRadius = 0;
    const maxShockwave = Math.max(width, height) * 0.65;
    const startTime = Date.now();
    let animId;

    function render() {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, width, height);

      if (shockwaveRadius < maxShockwave) {
        shockwaveRadius += 28;
        const opacity = Math.max(0, 1 - (shockwaveRadius / maxShockwave));
        ctx.beginPath();
        ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 158, 11, ${opacity * 0.85})`;
        ctx.lineWidth = 14 * opacity;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, shockwaveRadius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(99, 102, 241, ${opacity * 0.65})`;
        ctx.lineWidth = 8 * opacity;
        ctx.stroke();
      }

      let aliveCount = 0;
      particles.forEach(p => {
        if (p.alpha <= 0) return;
        aliveCount++;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.vRot;
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);

        if (p.emoji) {
          ctx.font = `${p.size * 2.5}px sans-serif`;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillText(p.emoji, -p.size, p.size);
        } else {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      });

      if (aliveCount > 0 && elapsed < 3500) {
        animId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animId);
        ctx.clearRect(0, 0, width, height);
      }
    }

    render();

    const modalCard = document.querySelector(".checkout-card");
    if (modalCard) {
      modalCard.classList.add("boom-shake-active");
      setTimeout(() => modalCard.classList.remove("boom-shake-active"), 1000);
    }
  }

  function setCheckoutStep(stepNumber) {
    document.querySelectorAll(".checkout-step-panel").forEach(panel => panel.classList.add("hidden"));
    document.querySelectorAll(".step-indicator").forEach(ind => ind.classList.remove("active"));

    const targetPanel = document.getElementById(`checkout-step-${stepNumber}`);
    const targetInd = document.getElementById(`step-ind-${stepNumber}`);

    if (targetPanel) targetPanel.classList.remove("hidden");
    if (targetInd) targetInd.classList.add("active");
  }

  function openCheckout(courseId) {
    const activeStudentSession = localStorage.getItem("founders_student_session");
    if (!activeStudentSession) {
      if (typeof showToast === "function") {
        showToast("Please register or create an account first to enroll!", "info");
      }
      setTimeout(() => {
        window.location.href = `student-auth.html?action=signup&redirect_course=${encodeURIComponent(courseId || "")}`;
      }, 400);
      return;
    }

    const course = findCourse(courseId);
    if (!course || !checkoutModal) {
      console.warn("Checkout modal or course target not found for courseId:", courseId);
      return;
    }

    activeCourseForCheckout = course;
    
    // Read student session if logged in
    const sessionRaw = localStorage.getItem("founders_student_session");
    let studentSession = null;
    if (sessionRaw) {
      try { studentSession = JSON.parse(sessionRaw); } catch (_e) {}
    }

    const sName = studentSession?.name || getCookie("fa_user_fullname") || "Student";
    const rawPhone = studentSession?.phone || getCookie("fa_user_phone") || "251900000000";
    let cleanPhone = rawPhone.replace(/\D/g, "");
    if (!cleanPhone.startsWith("251")) {
      cleanPhone = `251${cleanPhone.slice(-9)}`;
    }
    const sCity = studentSession?.email || studentSession?.city || getCookie("fa_user_city") || "Addis Ababa";

    buyerData = {
      name: sName,
      phone: cleanPhone,
      address: sCity
    };

    const nameInput = document.getElementById("buyer-name");
    const phoneInput = document.getElementById("buyer-phone");
    const cityInput = document.getElementById("buyer-address");
    const cookieBadge = document.getElementById("cookie-info-badge");

    if (nameInput) nameInput.value = sName;
    if (phoneInput) phoneInput.value = cleanPhone;
    if (cityInput) cityInput.value = sCity;

    if (cookieBadge && studentSession) {
      cookieBadge.innerHTML = `<i data-lucide="check-circle"></i> Enrolling as <strong>${sName}</strong> (${cleanPhone})`;
      cookieBadge.classList.remove("hidden");
    }

    // Reset coupon state for new checkout session
    appliedCouponState = null;

    const promoCodeInput = document.getElementById("promo-code");
    const applyPromoBtn = document.getElementById("apply-promo-btn");
    if (promoCodeInput) {
      promoCodeInput.value = "";
      if (course.coupon_code) {
        promoCodeInput.placeholder = `Promo Code (e.g. ${course.coupon_code})`;
      } else {
        promoCodeInput.placeholder = "Promo Code (FOUNDER25)";
      }
    }

    // Set course titles and prices in checkout summary
    const titleStep1 = document.getElementById("checkout-course-title-step1");
    const summaryCourseName = document.getElementById("summary-course-name");

    const rawPrice = course.price || course.priceETB || "10,000 ETB";
    const basePriceNum = parseFloat(String(rawPrice).replace(/[^0-9.]/g, "")) || 10000;
    const formattedDbPrice = `${basePriceNum.toLocaleString()} ETB`;
    
    if (titleStep1) titleStep1.textContent = course.title;
    if (summaryCourseName) summaryCourseName.textContent = course.title;
    if (summaryOriginalPrice) summaryOriginalPrice.textContent = formattedDbPrice;
    if (summaryDiscount) summaryDiscount.textContent = "0 ETB";
    if (summaryFinalPrice) summaryFinalPrice.textContent = formattedDbPrice;
    if (instructionPrice) instructionPrice.textContent = formattedDbPrice;

    // Auto-apply course-specific promo code if configured on course
    if (course.coupon_code && promoCodeInput && applyPromoBtn) {
      promoCodeInput.value = course.coupon_code;
      setTimeout(() => {
        applyPromoBtn.click();
      }, 200);
    }

    // Update summary preview
    const previewName = document.getElementById("preview-buyer-name");
    const previewPhone = document.getElementById("preview-buyer-phone");
    if (previewName) previewName.textContent = buyerData.name;
    if (previewPhone) previewPhone.textContent = buyerData.phone;

    // Fetch latest merchant payment details directly from Supabase DB API
    fetchBankConfigFromApi();

    // Directly open Step 2 (Payment Selection) bypassing Step 1 (Name, City, Phone form)
    setCheckoutStep(2);
    checkoutModal.classList.add("active");
    document.body.style.overflow = "hidden";
    if (window.lucide) window.lucide.createIcons();
  }

  function closeCheckoutModal() {
    if (checkoutModal) checkoutModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Global Event Delegation for all Enroll, Bundle, and Syllabus Buttons across the site
  document.addEventListener("click", (e) => {
    const syllabusBtn = e.target.closest(".view-syllabus-btn, .view-syllabus-trigger, [data-action='view-syllabus']");
    if (syllabusBtn) {
      e.preventDefault();
      const courseId = syllabusBtn.dataset.courseId || syllabusBtn.getAttribute("data-course-id");
      openCourseDrawer(courseId);
      return;
    }

    const bundleBtn = e.target.closest(".enroll-bundle-btn") || e.target.closest("[data-bundle-id]");
    if (bundleBtn) {
      e.preventDefault();
      const bundleId = bundleBtn.getAttribute("data-bundle-id") || bundleBtn.dataset.bundleId;
      openCheckout(bundleId);
      return;
    }

    const courseBtn = e.target.closest(".enroll-course-btn, .enroll-now-btn, .enroll-trigger, .drawer-enroll-trigger");
    if (courseBtn) {
      e.preventDefault();
      const courseId = courseBtn.getAttribute("data-course-id") || courseBtn.dataset.courseId;
      openCheckout(courseId);
      return;
    }
  });

  if (checkoutModalClose) {
    checkoutModalClose.onclick = () => closeCheckoutModal();
  }
  if (checkoutModal) {
    checkoutModal.onclick = (e) => {
      if (e.target === checkoutModal) closeCheckoutModal();
    };
  }

  // Step 1 Form Handler -> Validate Phone starts with 251 & Save to Cookie
  const buyerInfoForm = document.getElementById("buyer-info-form");
  if (buyerInfoForm) {
    buyerInfoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("buyer-name").value.trim();
      let phone = document.getElementById("buyer-phone").value.trim();
      const address = document.getElementById("buyer-address").value.trim();

      if (!name || !phone || !address) {
        showToast("Please fill in your full name, phone number, and city.", "error");
        return;
      }

      // Normalize phone: strip leading '+' if typed +251...
      if (phone.startsWith("+")) {
        phone = phone.substring(1);
      }

      const cleanPhone = phone.replace(/[\s\-()]/g, "");

      // Enforce: Phone number MUST start with 251
      if (!cleanPhone.startsWith("251")) {
        showToast("Phone number must start with 251 (e.g. 251911223344)", "error");
        document.getElementById("buyer-phone").focus();
        return;
      }

      if (cleanPhone.length < 12) {
        showToast("Please enter a valid 12-digit phone number starting with 251.", "error");
        return;
      }

      // Update input to clean 251 format
      document.getElementById("buyer-phone").value = cleanPhone;

      // Save to cookies (valid for 30 days)
      setCookie("fa_user_fullname", name, 30);
      setCookie("fa_user_phone", cleanPhone, 30);
      setCookie("fa_user_city", address, 30);

      buyerData = { name, phone: cleanPhone, address };

      // Update previews
      const previewName = document.getElementById("preview-buyer-name");
      const previewPhone = document.getElementById("preview-buyer-phone");
      if (previewName) previewName.textContent = name;
      if (previewPhone) previewPhone.textContent = cleanPhone;

      // Re-fetch latest live merchant bank & telebirr details from DB
      fetchBankConfigFromApi();

      setCheckoutStep(2);
      showToast("Details saved to cookies! Select payment method.", "success");
    });
  }

  // Back Button from Step 2 to Step 1
  const backToStep1Btn = document.getElementById("back-to-step1-btn");
  if (backToStep1Btn) {
    backToStep1Btn.addEventListener("click", () => {
      setCheckoutStep(1);
    });
  }

  let liveBankConfig = {
    cbeAccountName: "Founders Academy LLC",
    cbeAccountNumber: "1000492819482",
    cbeAccountSuffix: "49281948",
    telebirrMerchantPhone: "+251 906 769 999",
    boaAccountNumber: "0132088829100"
  };

  let appliedCouponState = null;

  window.copyTextToClipboard = function(text, label, btnElement) {
    let cleanText = String(text).trim();

    // Strip all spaces, non-breaking spaces, dashes, and commas for account numbers, phone numbers, and amounts
    const isNumberOrAccount = /number|account|phone|telebirr|cbe|boa|amount/i.test(label);
    if (isNumberOrAccount) {
      cleanText = cleanText.replace(/[\s\u00A0\-,\t]/g, "");
    }

    // If amount, keep only digits and decimal point
    if (/amount/i.test(label)) {
      cleanText = cleanText.replace(/[^0-9.]/g, "");
    }

    const doSuccessFeedback = () => {
      showToast(`✅ Copied ${label} (${cleanText}) to clipboard!`, "success");
      if (btnElement) {
        const originalText = btnElement.getAttribute("data-orig-text") || btnElement.innerHTML;
        if (!btnElement.getAttribute("data-orig-text")) btnElement.setAttribute("data-orig-text", originalText);
        btnElement.style.background = "#10b981";
        btnElement.style.borderColor = "#10b981";
        btnElement.style.color = "#fff";
        btnElement.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px;"></i> Copied!`;
        if (window.lucide) window.lucide.createIcons();

        setTimeout(() => {
          btnElement.style.background = "";
          btnElement.style.borderColor = "";
          btnElement.style.color = "";
          btnElement.innerHTML = originalText;
          if (window.lucide) window.lucide.createIcons();
        }, 1800);
      }
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(cleanText).then(() => {
        doSuccessFeedback();
      }).catch(() => {
        fallbackCopyText(cleanText, label, btnElement);
      });
    } else {
      fallbackCopyText(cleanText, label, btnElement);
    }
  };

  function fallbackCopyText(text, label, btnElement) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(`✅ Copied ${label} (${text}) to clipboard!`, "success");
      if (btnElement) {
        btnElement.style.background = "#10b981";
        btnElement.style.color = "#fff";
        btnElement.innerHTML = `Copied!`;
        setTimeout(() => {
          btnElement.style.background = "";
          btnElement.style.color = "";
          btnElement.innerHTML = `Copy`;
        }, 1800);
      }
    } catch (_err) {
      showToast(`Copy failed. Please manually copy: ${text}`, "info");
    }
    document.body.removeChild(textArea);
  }

  function renderPaymentInstructions() {
    const selectedRadio = document.querySelector('input[name="payment-method"]:checked');
    const method = selectedRadio ? selectedRadio.value : "cbe";

    const currentPriceToPay = appliedCouponState 
      ? `${appliedCouponState.finalPrice.toLocaleString()} ETB` 
      : (activeCourseForCheckout ? activeCourseForCheckout.priceETB : "10,000 ETB");

    if (method === "telebirr") {
      let teleAccountsHtml = "";
      let teleSelectHtml = "";
      const teleNumbers = Array.isArray(liveBankConfig.telebirrNumbers) ? liveBankConfig.telebirrNumbers : [];

      if (teleNumbers.length > 1) {
        teleSelectHtml = `
          <div style="margin-bottom: 14px;">
            <label style="font-size: 0.84rem; color: #fff; margin-bottom: 6px; display: block; font-weight: 600;">
              👇 Choose Telebirr Receiving Account:
            </label>
            <select id="checkout-telebirr-account-select" class="form-input" style="padding: 8px 12px; font-size: 0.88rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(0, 136, 204, 0.4); color: #fff; border-radius: 8px; width: 100%;">
              ${teleNumbers.map((t, i) => `
                <option value="${t.merchantPhone}">
                  Telebirr #${i + 1}: ${t.merchantName || 'Founders Academy'} (${t.merchantPhone})
                </option>
              `).join('')}
            </select>
          </div>
        `;
      }

      if (teleNumbers.length > 0) {
        teleAccountsHtml = teleNumbers.map((t, i) => `
          <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(0, 136, 204, 0.3); padding: 12px 14px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; cursor: pointer; transition: all 0.2s;" onclick="copyTextToClipboard('${t.merchantPhone}', 'Telebirr Number', this.querySelector('.btn-copy-target'))" title="Click to copy Telebirr Number">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block;">Telebirr ${i + 1} &bull; ${t.merchantName || 'Founders Academy'}</span>
              <span style="font-family: monospace; font-size: 1.15rem; font-weight: 800; color: #fff; letter-spacing: 1px;">${t.merchantPhone}</span>
            </div>
            <button type="button" onclick="event.stopPropagation(); copyTextToClipboard('${t.merchantPhone}', 'Telebirr Number', this)" class="btn-copy-target btn-dash-action btn-dash-secondary" style="padding: 6px 14px; font-size: 0.8rem; border-color: rgba(0, 136, 204, 0.5); color: #38bdf8; font-weight: 700;">
              <i data-lucide="copy" style="width: 15px; height: 15px;"></i> Copy Number
            </button>
          </div>
        `).join("");
      } else {
        const phone = liveBankConfig.telebirrMerchantPhone || "+251 906 769 999";
        teleAccountsHtml = `
          <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(0, 136, 204, 0.3); padding: 12px 14px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; cursor: pointer;" onclick="copyTextToClipboard('${phone}', 'Telebirr Number', this.querySelector('.btn-copy-target'))" title="Click to copy Telebirr Number">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block;">Telebirr Merchant &bull; Founders Academy</span>
              <span style="font-family: monospace; font-size: 1.15rem; font-weight: 800; color: #fff; letter-spacing: 1px;">${phone}</span>
            </div>
            <button type="button" onclick="event.stopPropagation(); copyTextToClipboard('${phone}', 'Telebirr Number', this)" class="btn-copy-target btn-dash-action btn-dash-secondary" style="padding: 6px 14px; font-size: 0.8rem; border-color: rgba(0, 136, 204, 0.5); color: #38bdf8; font-weight: 700;">
              <i data-lucide="copy" style="width: 15px; height: 15px;"></i> Copy Number
            </button>
          </div>
        `;
      }

      paymentInstructions.innerHTML = `
        <div style="padding: 18px; background: rgba(0, 136, 204, 0.05); border: 1px solid rgba(0, 136, 204, 0.3); border-radius: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid rgba(0, 136, 204, 0.2); padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #fff; font-size: 1.05rem;">
              <i data-lucide="smartphone" style="color: #0088cc; width: 22px; height: 22px;"></i> Telebirr Merchant Payment
            </div>
            <span class="badge" style="background: rgba(0, 136, 204, 0.2); color: #38bdf8; font-size: 0.75rem;">Instant Verification</span>
          </div>

          ${teleSelectHtml}

          <p style="font-size: 0.86rem; color: var(--text-muted); margin-bottom: 12px;">
            Tap any merchant box or click <strong>Copy Number</strong> below to copy instantly:
          </p>

          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
            ${teleAccountsHtml}
          </div>

          <div style="background: rgba(255,255,255,0.03); padding: 12px 14px; border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <span style="font-size: 0.86rem; color: var(--text-muted);">Exact Amount to Transfer:</span>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.2rem; font-weight: 800; color: #38bdf8;">${currentPriceToPay}</span>
              <button type="button" onclick="copyTextToClipboard('${currentPriceToPay}', 'Exact Amount', this)" class="btn-dash-action btn-dash-secondary" style="padding: 4px 10px; font-size: 0.76rem; border-color: rgba(56, 189, 248, 0.4); color: #38bdf8;">
                <i data-lucide="copy" style="width: 14px; height: 14px;"></i> Copy Amount
              </button>
            </div>
          </div>

          <div>
            <label class="form-label" for="tx-ref-input" style="font-size: 0.86rem; color: #fff; margin-bottom: 6px; display: block; font-weight: 600;">
              <i data-lucide="hash"></i> Paste Telebirr Transaction Reference / Ref Number:
            </label>
            <input type="text" id="tx-ref-input" placeholder="e.g. TX129849281" class="form-input" required style="font-family: monospace; font-size: 1rem; padding: 10px 14px;">
          </div>
        </div>
      `;
    } else {
      let cbeAccountsHtml = "";
      let cbeSelectHtml = "";
      const cbeAccounts = Array.isArray(liveBankConfig.cbeAccounts) ? liveBankConfig.cbeAccounts : [];

      if (cbeAccounts.length > 1) {
        cbeSelectHtml = `
          <div style="margin-bottom: 14px;">
            <label style="font-size: 0.84rem; color: #fff; margin-bottom: 6px; display: block; font-weight: 600;">
              👇 Choose CBE Receiving Account:
            </label>
            <select id="checkout-cbe-account-select" class="form-input" style="padding: 8px 12px; font-size: 0.88rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(217, 119, 6, 0.4); color: #fff; border-radius: 8px; width: 100%;">
              ${cbeAccounts.map((c, i) => {
                const sfx = (c.suffix || c.accountNumber || '').trim().slice(-8);
                return `<option value="${sfx}">CBE Account #${i + 1}: ${c.accountName} (${c.accountNumber})</option>`;
              }).join('')}
            </select>
          </div>
        `;
      }

      if (cbeAccounts.length > 0) {
        cbeAccountsHtml = cbeAccounts.map((c, i) => `
          <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(217, 119, 6, 0.3); padding: 12px 14px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; cursor: pointer; transition: all 0.2s;" onclick="copyTextToClipboard('${c.accountNumber}', 'CBE Account Number', this.querySelector('.btn-copy-target'))" title="Click to copy CBE Account Number">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block;">CBE Account ${i + 1} &bull; ${c.accountName}</span>
              <span style="font-family: monospace; font-size: 1.15rem; font-weight: 800; color: #fff; letter-spacing: 1px;">${c.accountNumber}</span>
            </div>
            <button type="button" onclick="event.stopPropagation(); copyTextToClipboard('${c.accountNumber}', 'CBE Account Number', this)" class="btn-copy-target btn-dash-action btn-dash-secondary" style="padding: 6px 14px; font-size: 0.8rem; border-color: rgba(217, 119, 6, 0.5); color: var(--primary-gold); font-weight: 700;">
              <i data-lucide="copy" style="width: 15px; height: 15px;"></i> Copy Number
            </button>
          </div>
        `).join("");
      } else {
        const num = liveBankConfig.cbeAccountNumber || "1000492819482";
        cbeAccountsHtml = `
          <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(217, 119, 6, 0.3); padding: 12px 14px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; cursor: pointer;" onclick="copyTextToClipboard('${num}', 'CBE Account Number', this.querySelector('.btn-copy-target'))" title="Click to copy CBE Account Number">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block;">CBE Account &bull; ${liveBankConfig.cbeAccountName || "Founders Academy LLC"}</span>
              <span style="font-family: monospace; font-size: 1.15rem; font-weight: 800; color: #fff; letter-spacing: 1px;">${num}</span>
            </div>
            <button type="button" onclick="event.stopPropagation(); copyTextToClipboard('${num}', 'CBE Account Number', this)" class="btn-copy-target btn-dash-action btn-dash-secondary" style="padding: 6px 14px; font-size: 0.8rem; border-color: rgba(217, 119, 6, 0.5); color: var(--primary-gold); font-weight: 700;">
              <i data-lucide="copy" style="width: 15px; height: 15px;"></i> Copy Number
            </button>
          </div>
        `;
      }

      paymentInstructions.innerHTML = `
        <div style="padding: 18px; background: rgba(217, 119, 6, 0.05); border: 1px solid rgba(217, 119, 6, 0.3); border-radius: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid rgba(217, 119, 6, 0.2); padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #fff; font-size: 1.05rem;">
              <i data-lucide="building-2" style="color: var(--primary-gold); width: 22px; height: 22px;"></i> Commercial Bank of Ethiopia (CBE)
            </div>
            <span class="badge badge-gold" style="font-size: 0.75rem;">CBE Birr & Mobile</span>
          </div>

          ${cbeSelectHtml}

          <p style="font-size: 0.86rem; color: var(--text-muted); margin-bottom: 12px;">
            Tap any account box or click <strong>Copy Number</strong> below to copy instantly:
          </p>

          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
            ${cbeAccountsHtml}
          </div>

          <div style="background: rgba(255,255,255,0.03); padding: 12px 14px; border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <span style="font-size: 0.86rem; color: var(--text-muted);">Exact Amount to Transfer:</span>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.2rem; font-weight: 800; color: var(--primary-gold);">${currentPriceToPay}</span>
              <button type="button" onclick="copyTextToClipboard('${currentPriceToPay}', 'Exact Amount', this)" class="btn-dash-action btn-dash-secondary" style="padding: 4px 10px; font-size: 0.76rem; border-color: rgba(217, 119, 6, 0.4); color: var(--primary-gold);">
                <i data-lucide="copy" style="width: 14px; height: 14px;"></i> Copy Amount
              </button>
            </div>
          </div>

          <div>
            <label class="form-label" for="tx-ref-input" style="font-size: 0.86rem; color: #fff; margin-bottom: 6px; display: block; font-weight: 600;">
              <i data-lucide="hash"></i> Paste CBE Transaction Reference / FT Code:
            </label>
            <input type="text" id="tx-ref-input" placeholder="e.g. FT2621598492" class="form-input" required style="font-family: monospace; font-size: 1rem; padding: 10px 14px;">
          </div>
        </div>
      `;
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function fetchBankConfigFromApi() {
    fetch("/api/bank-accounts")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          liveBankConfig = data.data;

          // Toggle visibility of payment options on checkout based on admin preferences
          const cbeOpt = document.querySelector('input[value="cbe"]')?.closest(".payment-option");
          const teleOpt = document.querySelector('input[value="telebirr"]')?.closest(".payment-option");

          if (cbeOpt) cbeOpt.style.display = (liveBankConfig.cbeEnabled === false) ? "none" : "flex";
          if (teleOpt) teleOpt.style.display = (liveBankConfig.telebirrEnabled === false) ? "none" : "flex";

          renderPaymentInstructions();
        }
      })
      .catch(() => {});
  }

  fetchBankConfigFromApi();

  // Payment Option Change
  paymentRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      document.querySelectorAll(".payment-option").forEach(opt => opt.classList.remove("active"));
      e.target.closest(".payment-option").classList.add("active");
      renderPaymentInstructions();
    });
  });

  // Apply Promo Code via Backend Coupon Engine
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener("click", async () => {
      const code = promoCodeInput ? promoCodeInput.value.trim().toUpperCase() : "";
      if (!code) {
        showToast("Please enter a promo code", "info");
        return;
      }

      applyPromoBtn.disabled = true;
      applyPromoBtn.innerHTML = `<span>Checking...</span>`;

      try {
        const res = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            couponCode: code,
            courseId: activeCourseForCheckout ? activeCourseForCheckout.id : null,
            price: activeCourseForCheckout ? (activeCourseForCheckout.priceETB || activeCourseForCheckout.price) : null
          })
        });
        const json = await res.json();

        applyPromoBtn.disabled = false;
        applyPromoBtn.innerHTML = `Apply`;

        if (json.success && json.data) {
          appliedCouponState = json.data;
          showToast(json.data.message || `Success! ${json.data.discountStr} discount applied.`, "success");

          if (summaryDiscount) summaryDiscount.textContent = `-${json.data.discountAmount.toLocaleString()} ETB (${json.data.discountStr})`;
          if (summaryFinalPrice) summaryFinalPrice.textContent = `${json.data.finalPrice.toLocaleString()} ETB`;
          if (instructionPrice) instructionPrice.textContent = `${json.data.finalPrice.toLocaleString()} ETB`;

          const activeRadio = document.querySelector('input[name="payment-method"]:checked');
          if (activeRadio) activeRadio.dispatchEvent(new Event('change'));
        } else {
          appliedCouponState = null;
          showToast(json.error || "Invalid promo code", "error");
        }
      } catch (err) {
        applyPromoBtn.disabled = false;
        applyPromoBtn.innerHTML = `Apply`;
        showToast("Error checking coupon code", "error");
      }
    });

    if (promoCodeInput) {
      promoCodeInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          applyPromoBtn.click();
        }
      });
    }
  }

  // Confirm Payment Step 2 -> Verify with Verify.ET backend & Trigger Boom Effect Step 3
  if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener("click", async () => {
      const txInput = document.getElementById("tx-ref-input");
      const txRef = txInput ? txInput.value.trim() : "";
      if (!txRef) {
        showToast("Please enter your transaction reference number.", "error");
        if (txInput) txInput.focus();
        return;
      }

      const selectedRadio = document.querySelector('input[name="payment-method"]:checked');
      const provider = selectedRadio ? selectedRadio.value : "cbe";
      let accountSuffix = "";
      if (provider === "cbe") {
        const cbeSelect = document.getElementById("checkout-cbe-account-select");
        if (cbeSelect && cbeSelect.value) {
          accountSuffix = cbeSelect.value.trim();
        } else {
          accountSuffix = (liveBankConfig.cbeAccountSuffix || liveBankConfig.cbeAccountNumber || "49281948").slice(-8);
        }
      }

      confirmPaymentBtn.disabled = true;
      confirmPaymentBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Verifying with Verify.ET...`;
      if (window.lucide) window.lucide.createIcons();

      try {
        const response = await fetch("/api/verify/transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentName: buyerData.name,
            studentPhone: buyerData.phone,
            courseId: activeCourseForCheckout ? activeCourseForCheckout.id : "smma-accelerator",
            provider,
            referenceNumber: txRef,
            accountSuffix,
            couponCode: appliedCouponState ? appliedCouponState.couponCode : ""
          })
        });

        const data = await response.json();

        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.innerHTML = `<i data-lucide="check-circle"></i> Complete & Get Bot Link`;
        if (window.lucide) window.lucide.createIcons();

        if (data.success && data.verified) {
          showToast("Payment Verified successfully via Verify.ET network! 🎉", "success");

          // Update Step 3 Success Info
          const successCourse = document.getElementById("success-course-name");
          const successName = document.getElementById("success-buyer-name");
          const successPhone = document.getElementById("success-buyer-phone");

          if (successCourse && activeCourseForCheckout) successCourse.textContent = activeCourseForCheckout.title;
          if (successName) successName.textContent = buyerData.name || "Student";
          if (successPhone) successPhone.textContent = buyerData.phone || "";

          // Render 1-time direct join buttons if returned
          const botCard = document.querySelector(".telegram-bot-card");
          if (botCard && data.oneTimeLinks) {
            const links = data.oneTimeLinks;
            let btnsHtml = `<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">`;
            if (links.channel) {
              btnsHtml += `<a href="${links.channel}" target="_blank" class="btn btn-primary btn-lg btn-block" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; text-decoration: none;"><i data-lucide="send"></i> 🎟️ Join 1-Time Classroom Channel</a>`;
            }
            if (links.group) {
              btnsHtml += `<a href="${links.group}" target="_blank" class="btn btn-outline btn-lg btn-block" style="border-color: #38bdf8; color: #38bdf8; text-decoration: none;"><i data-lucide="message-square"></i> 💬 Join 1-Time Mastermind Group</a>`;
            }
            btnsHtml += `</div>`;
            const existingLinksBox = document.getElementById("success-direct-links");
            if (existingLinksBox) {
              existingLinksBox.innerHTML = btnsHtml;
            } else {
              const div = document.createElement("div");
              div.id = "success-direct-links";
              div.innerHTML = btnsHtml;
              botCard.appendChild(div);
            }
          }

          // TRIGGER BOOM ANIMATION & AUDIO EFFECT!
          triggerBoomEffect();

          setCheckoutStep(3);
          if (window.lucide) window.lucide.createIcons();
        } else if (data.pending) {
          showToast(data.message || "Transaction queued for banking network verification.", "info");
        } else {
          showToast(data.error || "Payment verification failed. Check reference number.", "error");
        }
      } catch (err) {
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.innerHTML = `<i data-lucide="check-circle"></i> Complete & Get Bot Link`;
        if (window.lucide) window.lucide.createIcons();

        showToast("Error connecting to Verify.ET backend: " + err.message, "error");
      }
    });
  }

  // Finish Checkout Button in Step 3
  const finishCheckoutBtn = document.getElementById("finish-checkout-btn");
  if (finishCheckoutBtn) {
    finishCheckoutBtn.addEventListener("click", () => {
      checkoutModal.classList.remove("active");
    });
  }

  // Mobile Hamburger Menu Toggle
  const mobileToggle = document.getElementById("mobile-toggle");
  const navLinks = document.getElementById("nav-links") || document.querySelector(".nav-links");
  if (mobileToggle && navLinks) {
    if (!mobileToggle.innerHTML.trim() || !mobileToggle.querySelector("svg, i")) {
      mobileToggle.innerHTML = `<i data-lucide="menu"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }

    mobileToggle.onclick = function(e) {
      window.toggleMobileMenu(e);
    };

    document.addEventListener("click", (e) => {
      if (!navLinks.contains(e.target) && !mobileToggle.contains(e.target)) {
        if (navLinks.classList.contains("mobile-active")) {
          navLinks.classList.remove("mobile-active");
          mobileToggle.innerHTML = `<i data-lucide="menu"></i>`;
          if (window.lucide) window.lucide.createIcons();
        }
      }
    });

    navLinks.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        if (navLinks.classList.contains("mobile-active")) {
          navLinks.classList.remove("mobile-active");
          mobileToggle.innerHTML = `<i data-lucide="menu"></i>`;
          if (window.lucide) window.lucide.createIcons();
        }
      });
    });
  }

  // Global Logout Helper Function
  window.logoutStudent = function(e) {
    if (e) e.preventDefault();
    localStorage.removeItem("founders_student_session");
    localStorage.removeItem("founders_student");
    sessionStorage.removeItem("founders_student_session");
    document.cookie = "student_token=; Max-Age=0; path=/;";
    if (window.showToast) window.showToast("Logged out safely.", "info");
    setTimeout(() => { window.location.href = "student-auth.html"; }, 300);
  };

  // Dynamic Student Auth State Navigation Link Updater (Hamburger Menu & Navbar)
  function updateNavbarAuthState() {
    const sessionRaw = localStorage.getItem("founders_student_session");
    let isLoggedIn = false;
    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw);
        if (parsed && (parsed.id || parsed.phone || parsed.name)) isLoggedIn = true;
      } catch (_e) {}
    }

    const authNavLinks = document.querySelectorAll(".nav-link-login, #nav-link-auth-action");
    authNavLinks.forEach(link => {
      if (isLoggedIn) {
        link.href = "#";
        link.onclick = (e) => window.logoutStudent(e);
        link.innerHTML = `<i data-lucide="log-out"></i> Log Out`;
        link.style.color = "#f87171";
      } else {
        link.href = "student-auth.html";
        link.onclick = null;
        link.innerHTML = `<i data-lucide="log-in"></i> Log In`;
        link.style.color = "";
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  updateNavbarAuthState();

  /* ==========================================================================
     Navbar Active Link & Scroll Spy Handler
     ========================================================================== */
  const allNavLinks = document.querySelectorAll(".nav-link");

  allNavLinks.forEach(link => {
    link.addEventListener("click", function() {
      allNavLinks.forEach(l => l.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Scroll Spy: Automatically highlight active navbar section link on scroll
  const scrollSections = document.querySelectorAll("section[id]");
  if (scrollSections.length > 0) {
    window.addEventListener("scroll", () => {
      let currentSectionId = "";
      const scrollY = window.pageYOffset;

      scrollSections.forEach(section => {
        const sectionTop = section.offsetTop - 120;
        const sectionHeight = section.offsetHeight;
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          currentSectionId = section.getAttribute("id");
        }
      });

      if (currentSectionId) {
        allNavLinks.forEach(link => {
          const href = link.getAttribute("href");
          if (href === `#${currentSectionId}` || href === `index.html#${currentSectionId}`) {
            allNavLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");
          }
        });
      } else if (scrollY < 200) {
        allNavLinks.forEach(link => {
          const href = link.getAttribute("href");
          if (href === "#" || href === "index.html") {
            allNavLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");
          }
        });
      }
    });
  }

  // Footer Login Trigger
  const footerLogin = document.getElementById("footer-login");
  if (footerLogin) {
    footerLogin.addEventListener("click", (e) => {
      e.preventDefault();
      openAuthModal("login");
    });
  }

  /* ==========================================================================
     5. Auth Modal Handler
     ========================================================================== */
  function openAuthModal(tab = "login") {
    if (!authModal) return;
    authModal.classList.add("active");
    if (tab === "login") {
      tabLoginBtn.classList.add("active");
      tabRegisterBtn.classList.remove("active");
      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
    } else {
      tabRegisterBtn.classList.add("active");
      tabLoginBtn.classList.remove("active");
      registerForm.classList.remove("hidden");
      loginForm.classList.add("hidden");
    }
  }

  if (loginBtn) loginBtn.addEventListener("click", () => openAuthModal("login"));
  if (registerBtn) registerBtn.addEventListener("click", () => openAuthModal("register"));
  if (authModalClose) authModalClose.addEventListener("click", () => authModal.classList.remove("active"));

  if (tabLoginBtn) tabLoginBtn.addEventListener("click", () => openAuthModal("login"));
  if (tabRegisterBtn) tabRegisterBtn.addEventListener("click", () => openAuthModal("register"));

  /* Intro Video Modal Management */
  let currentIntroVideoEmbedUrl = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";

  function formatYouTubeEmbedUrl(rawUrl, autoplay = 0) {
    if (!rawUrl || !rawUrl.trim()) {
      return `https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=${autoplay}&rel=0&enablejsapi=1`;
    }

    let url = rawUrl.trim();
    let videoId = "";

    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0]?.split("&")[0];
    } else if (url.includes("youtube.com/watch")) {
      const match = url.match(/[?&]v=([^&]+)/);
      if (match) videoId = match[1];
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("youtube.com/embed/")[1]?.split("?")[0]?.split("&")[0];
    } else if (url.includes("youtube-nocookie.com/embed/")) {
      videoId = url.split("youtube-nocookie.com/embed/")[1]?.split("?")[0]?.split("&")[0];
    }

    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay}&rel=0&enablejsapi=1`;
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}autoplay=${autoplay}&rel=0&enablejsapi=1`;
    }

    return `https://www.youtube-nocookie.com/embed/${url}?autoplay=${autoplay}&rel=0&enablejsapi=1`;
  }

  const videoModal = document.getElementById("video-modal");
  const videoModalClose = document.getElementById("video-modal-close");
  const watchDemoBtn = document.getElementById("watch-demo-btn");
  const heroVideoTrigger = document.getElementById("hero-video-box-trigger");
  const introVideoFrame = document.getElementById("intro-video-frame");

  function openVideoModal() {
    if (!videoModal) return;
    videoModal.classList.add("active");
    if (introVideoFrame) {
      introVideoFrame.src = formatYouTubeEmbedUrl(currentIntroVideoEmbedUrl, 1);
    }
  }

  function closeVideoModal() {
    if (!videoModal) return;
    videoModal.classList.remove("active");
    if (introVideoFrame) {
      introVideoFrame.src = formatYouTubeEmbedUrl(currentIntroVideoEmbedUrl, 0);
    }
  }

  if (watchDemoBtn) watchDemoBtn.addEventListener("click", openVideoModal);
  if (heroVideoTrigger) heroVideoTrigger.addEventListener("click", openVideoModal);
  if (videoModalClose) videoModalClose.addEventListener("click", closeVideoModal);
  if (videoModal) {
    videoModal.addEventListener("click", (e) => {
      if (e.target === videoModal) closeVideoModal();
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Sign in successful! Redirecting to student portal...", "success");
      authModal.classList.remove("active");
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Account created successfully! Welcome aboard.", "success");
      authModal.classList.remove("active");
    });
  }

  /* ==========================================================================
     6. Telegram Bot Interactive Demo Engine
     ========================================================================== */
  const telegramChatWindow = document.getElementById("telegram-chat-window");
  const tgDemoTabs = document.querySelectorAll(".tg-demo-tab");

  function renderTelegramDemo(step = "verify") {
    if (!telegramChatWindow) return;

    if (step === "verify") {
      telegramChatWindow.innerHTML = `
        <div class="chat-date">Today</div>
        
        <div style="display: flex; gap: 8px; margin-bottom: 14px; justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-outline btn-sm active" id="demo-mode-new" style="font-size: 0.78rem; padding: 4px 12px;">🆕 New Student (First Registration)</button>
          <button class="btn btn-outline btn-sm" id="demo-mode-returning" style="font-size: 0.78rem; padding: 4px 12px;">⚡ Already Registered Student</button>
        </div>

        <div id="demo-verify-new-container">
          <div class="chat-bubble bot-bubble">
            <div class="bubble-title"><i data-lucide="bot"></i> Founders Academy Bot</div>
            <p>Welcome to <strong>Founders Academy Bot</strong>! 🎉</p>
            <p>You are enrolling for <strong>SMMA & Agency Growth Accelerator</strong>. Since this is your first time, please tap <strong>"Share Phone Number"</strong> below to register your account.</p>
            <div class="bot-inline-action">
              <button class="btn-tg-action" id="demo-share-phone-btn">
                <i data-lucide="smartphone"></i> 📱 Share Phone Number
              </button>
            </div>
          </div>

          <div class="chat-bubble user-bubble hidden" id="demo-user-phone-msg">
            <p>📱 Shared Contact: <strong>+251 91 122 3344</strong></p>
            <span class="chat-time">Just now ✓✓</span>
          </div>

          <div class="chat-bubble bot-bubble hidden" id="demo-bot-links-msg">
            <div class="bubble-title"><i data-lucide="bot"></i> Founders Academy Bot</div>
            <p>✅ <strong>Phone Registered & Verified!</strong> Welcome Selam Tadesse.</p>
            <p>Here are your <strong>unique, 1-time single-use access links</strong>:</p>
            <div class="bot-links-grid">
              <a href="https://t.me/founders_academybot" target="_blank" class="bot-link-card">
                <i data-lucide="tv"></i>
                <div>
                  <strong>🔒 Join Private HD Video Channel</strong>
                  <span>Unique 1-Time Access Link • Expires after join</span>
                </div>
              </a>
              <a href="https://t.me/founders_academybot" target="_blank" class="bot-link-card">
                <i data-lucide="users"></i>
                <div>
                  <strong>💬 Join Private Student Mentorship Group</strong>
                  <span>Unique 1-Time Access Link • Community & Support</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div id="demo-verify-returning-container" class="hidden">
          <div class="chat-bubble bot-bubble">
            <div class="bubble-title"><i data-lucide="bot"></i> Founders Academy Bot</div>
            <p>Welcome back, <strong>Selam Tadesse</strong>! 👋</p>
            <p>⚡ <strong>Already Registered Student Recognized!</strong> Your phone number (<code>+251 91 122 3344</code>) is active in our database.</p>
            <p>Here are your instant <strong>unique, 1-time access links</strong> for your new course:</p>
            <div class="bot-links-grid">
              <a href="https://t.me/founders_academybot" target="_blank" class="bot-link-card">
                <i data-lucide="tv"></i>
                <div>
                  <strong>🔒 Join Private HD Video Channel</strong>
                  <span>Unique 1-Time Access Link • Delivered Instantly</span>
                </div>
              </a>
              <a href="https://t.me/founders_academybot" target="_blank" class="bot-link-card">
                <i data-lucide="users"></i>
                <div>
                  <strong>💬 Join Private Student Mentorship Group</strong>
                  <span>Unique 1-Time Access Link • Delivered Instantly</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      `;

      const modeNewBtn = document.getElementById("demo-mode-new");
      const modeRetBtn = document.getElementById("demo-mode-returning");
      const newBox = document.getElementById("demo-verify-new-container");
      const retBox = document.getElementById("demo-verify-returning-container");

      if (modeNewBtn && modeRetBtn && newBox && retBox) {
        modeNewBtn.addEventListener("click", () => {
          modeNewBtn.classList.add("active");
          modeRetBtn.classList.remove("active");
          newBox.classList.remove("hidden");
          retBox.classList.add("hidden");
        });

        modeRetBtn.addEventListener("click", () => {
          modeRetBtn.classList.add("active");
          modeNewBtn.classList.remove("active");
          retBox.classList.remove("hidden");
          newBox.classList.add("hidden");
          if (window.lucide) window.lucide.createIcons();
          showToast("Recognized returning registered student! Links delivered instantly.", "info");
        });
      }

      // Attach share phone listener inside demo
      const shareBtn = document.getElementById("demo-share-phone-btn");
      if (shareBtn) {
        shareBtn.addEventListener("click", () => {
          document.getElementById("demo-user-phone-msg").classList.remove("hidden");
          setTimeout(() => {
            document.getElementById("demo-bot-links-msg").classList.remove("hidden");
            if (window.lucide) window.lucide.createIcons();
            showToast("Phone registered! 1-Time Channel & Group links generated.", "success");
          }, 500);
        });
      }
    } else if (step === "quiz") {
      telegramChatWindow.innerHTML = `
        <div class="chat-date">Module 3 Assessment</div>
        
        <div class="chat-bubble bot-bubble">
          <div class="bubble-title"><i data-lucide="bot"></i> Founders Academy Bot</div>
          <p>📝 <strong>Module 3 Quiz: Client Acquisition</strong></p>
          <p><strong>Question 1 of 5:</strong> What is the most effective approach when sending cold emails to local business owners?</p>
          
          <div class="quiz-options-list">
            <button class="quiz-option-btn wrong" id="quiz-opt-a">
              <span>[ A ]</span> Send generic template to 500 email addresses
            </button>
            <button class="quiz-option-btn correct" id="quiz-opt-b">
              <span>[ B ]</span> Send a 90-second personalized Loom video audit (Recommended)
            </button>
            <button class="quiz-option-btn wrong" id="quiz-opt-c">
              <span>[ C ]</span> Offer free services indefinitely without a contract
            </button>
          </div>
        </div>

        <div class="chat-bubble bot-bubble hidden" id="quiz-feedback-msg">
          <p style="color: #10b981;">🎉 <strong>Correct Answer! (+20 Points)</strong></p>
          <p>Personalized video audits build immediate trust and demonstrate high value. Moving to Question 2...</p>
        </div>
      `;

      const quizOptB = document.getElementById("quiz-opt-b");
      if (quizOptB) {
        quizOptB.addEventListener("click", () => {
          quizOptB.style.background = "rgba(16, 185, 129, 0.2)";
          quizOptB.style.borderColor = "#10b981";
          document.getElementById("quiz-feedback-msg").classList.remove("hidden");
          showToast("Quiz Answer Correct! Progress updated in Telegram bot.", "success");
        });
      }

      document.querySelectorAll(".quiz-option-btn.wrong").forEach(btn => {
        btn.addEventListener("click", () => {
          showToast("Incorrect answer. Try again!", "error");
        });
      });
    } else if (step === "cert") {
      telegramChatWindow.innerHTML = `
        <div class="chat-date">Course Completion</div>
        
        <div class="chat-bubble bot-bubble">
          <div class="bubble-title"><i data-lucide="bot"></i> Founders Academy Bot</div>
          <p>🎓 <strong>CONGRATULATIONS SELAM TADESSE!</strong> 🎉</p>
          <p>You have successfully completed 100% of the <strong>SMMA & Agency Growth Accelerator</strong> curriculum and passed all module quizzes.</p>
          
          <div class="bot-cert-card glass-box">
            <i data-lucide="award" style="width: 48px; height: 48px; color: #fbbf24; margin-bottom: 8px;"></i>
            <h4 style="font-family: var(--font-heading); color: var(--primary-gold); font-size: 1.1rem;">Verified Professional Certificate</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted);">Issued to: <strong>Selam Tadesse</strong> • ID: <code>FOUNDERS-2026-89421</code></p>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">Specialization: Social Media Marketing Agency (SMMA)</p>

            <button class="btn btn-primary btn-sm btn-block" id="download-cert-demo-btn">
              <i data-lucide="download"></i> Download Verified Certificate (PDF)
            </button>
          </div>
        </div>
      `;

      const certBtn = document.getElementById("download-cert-demo-btn");
      if (certBtn) {
        certBtn.addEventListener("click", () => {
          showToast("Downloading your Founders Academy Verified Certificate PDF...", "success");
        });
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // Bind Demo Tabs
  tgDemoTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tgDemoTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderTelegramDemo(tab.dataset.demoStep);
    });
  });

  // Initial demo state render
  renderTelegramDemo("verify");

  /* ==========================================================================
     7. Toast Notifications
     ========================================================================== */
  function showToast(message, type = "info") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "info";
    if (type === "success") icon = "check-circle";
    if (type === "error") icon = "alert-circle";

    toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  /* ==========================================================================
     9. Animated Counter for Metrics Bar
     ========================================================================== */
  function animateMetrics() {
    const metricElems = document.querySelectorAll(".metric-number");
    metricElems.forEach(elem => {
      const target = parseInt(elem.dataset.target, 10);
      let count = 0;
      const speed = Math.ceil(target / 40);

      const interval = setInterval(() => {
        count += speed;
        if (count >= target) {
          count = target;
          clearInterval(interval);
        }
        if (target === 5200) elem.textContent = `${count.toLocaleString()}+`;
        else if (target === 96) elem.textContent = `${count}%`;
        else if (target === 1200) elem.textContent = `${count.toLocaleString()}+`;
        else elem.textContent = `${count}K+`;
      }, 30);
    });
  }



  window.openStudentAuthModal = function(initialTab = "login") {
    const action = initialTab === "signup" ? "signup" : "login";
    window.location.href = "student-auth.html?action=" + action;
  };

  window.closeStudentAuthModal = function() {
    const modal = document.getElementById("student-auth-modal");
    if (modal) modal.style.display = "none";
  };

  function updateStudentHeaderAuth() {
    const navActions = document.querySelector(".nav-actions");
    const navLinks = document.getElementById("nav-links");

    const sessionRaw = localStorage.getItem("founders_student_session") || localStorage.getItem("founders_student");
    let session = null;
    if (sessionRaw) {
      try { session = JSON.parse(sessionRaw); } catch (_e) {}
    }

    const loginLinks = document.querySelectorAll(".nav-link-login, a[href*='student-auth.html'], a[href*='student-login']");

    // Clean up any legacy dynamic duplicate buttons from navActions
    const extraLoginBtn = document.getElementById("header-student-login-btn");
    if (extraLoginBtn) extraLoginBtn.remove();
    const extraDashBtn = document.getElementById("header-student-dash-btn");
    if (extraDashBtn) extraDashBtn.remove();

    if (session && (session.id || session.phone || session.name)) {
      // HIDE ALL LOGIN LINKS FOR LOGGED-IN USERS
      loginLinks.forEach(el => {
        if (!el.classList.contains("brand-logo") && !el.id?.includes("dash")) {
          el.style.display = "none";
        }
      });

      // Show Dashboard Link in Navigation Menu if not already present
      const existingDashInNav = navLinks ? (navLinks.querySelector("a[href*='student-dashboard.html']") || document.getElementById("nav-link-dashboard")) : null;
      if (navLinks && !existingDashInNav) {
        const link = document.createElement("a");
        link.id = "nav-link-dashboard";
        link.href = "student-dashboard.html";
        link.className = "nav-link";
        if (window.location.pathname.includes("student-dashboard")) {
          link.classList.add("active");
        }
        link.style.color = "var(--primary-gold)";
        link.style.fontWeight = "700";
        link.innerHTML = `<i data-lucide="layout-dashboard"></i> My Dashboard`;
        navLinks.appendChild(link);
      }
    } else {
      // RESTORE SINGLE LOGIN LINK FOR GUEST VISITORS
      loginLinks.forEach(el => {
        el.style.display = "";
      });

      const dashLink = document.getElementById("nav-link-dashboard");
      if (dashLink && !window.location.pathname.includes("student-dashboard")) dashLink.remove();
    }
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  window.performStudentLogout = function() {
    localStorage.removeItem("founders_student_session");
    localStorage.removeItem("founders_student");
    sessionStorage.removeItem("founders_student_session");
    document.cookie = "student_token=; Max-Age=0; path=/;";
    if (typeof showToast === "function") {
      showToast("Logged out successfully.", "info");
    }
    setTimeout(() => {
      window.location.href = "student-auth.html";
    }, 200);
  };

  // Initial Builds
  fetchLandingConfigFromApi();
  renderCourses();
  renderTestimonials();
  renderFAQ();
  animateMetrics();
  // Global click delegate for mobile toggle, login, and logout buttons
  document.addEventListener("click", (e) => {
    const mobileToggle = e.target.closest("#mobile-toggle, .mobile-toggle");
    if (mobileToggle) {
      e.preventDefault();
      e.stopPropagation();
      const navLinks = document.getElementById("nav-links");
      if (navLinks) {
        navLinks.classList.toggle("mobile-active");
      }
      return;
    }

    const navLinks = document.getElementById("nav-links");
    if (navLinks && navLinks.classList.contains("mobile-active")) {
      if (!navLinks.contains(e.target)) {
        navLinks.classList.remove("mobile-active");
      }
    }

    const logoutBtn = e.target.closest("#btn-student-logout, .btn-student-logout, [data-action='student-logout'], [data-action='logout']");
    if (logoutBtn) {
      e.preventDefault();
      window.performStudentLogout();
      return;
    }

    const loginBtn = e.target.closest("button[id*='login'], .btn-login, [data-action='login']");
    if (loginBtn && !loginBtn.closest("#admin-login-card") && !loginBtn.closest("#form-login") && !loginBtn.closest(".auth-card-ultra") && !loginBtn.id.includes("logout") && !loginBtn.classList.contains("btn-student-logout") && loginBtn.type !== "submit") {
      if (!window.location.pathname.includes("student-auth.html")) {
        e.preventDefault();
        window.location.href = "student-auth.html";
      }
    }
  });

  updateStudentHeaderAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const autoEnrollCourseId = urlParams.get("enroll");
  if (autoEnrollCourseId) {
    setTimeout(() => {
      openCheckout(autoEnrollCourseId);
    }, 500);
  }
});



