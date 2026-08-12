window.openStudentAuthModal = function(initialTab = "login") {
  const action = initialTab === "signup" ? "signup" : "login";
  if (!window.location.pathname.includes("student-login.html")) {
    window.location.href = "student-login.html?action=" + action;
  }
};

window.closeStudentAuthModal = function() {
  const modal = document.getElementById("student-auth-modal");
  if (modal) modal.style.display = "none";
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
     0. Preloader Controller Logic (15-Second Duration)
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

    const TOTAL_DURATION = 15000; // 15 seconds total
    const startTime = Date.now();

    const statusMessages = [
      "Initializing Founders Studio...",
      "Connecting to High-Income Skill Servers...",
      "Loading Course Curriculum...",
      "Preparing SMMA & Video Editing Modules...",
      "Configuring Ethiopian Student Portal...",
      "Optimizing Agency Blueprint Assets...",
      "Empowering Digital Entrepreneurs...",
      "Finalizing Interactive Workspace...",
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
        }, 150);
      }

      // Complete preloader exit transition after 15s
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
          }, 650);
        }, 300);
      }
    }, 50);
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

  function findCourse(courseId) {
    if (!courseId) return COURSES[0];
    const pool = [...apiCoursesList, ...COURSES];
    let found = pool.find(c => c.id === courseId);
    if (found) return found;

    const clean = String(courseId).replace(/^course-/, "").toLowerCase();
    found = pool.find(c => 
      c.id.toLowerCase() === clean ||
      c.id.toLowerCase().includes(clean) || 
      clean.includes(c.id.toLowerCase()) || 
      c.title.toLowerCase().includes(clean)
    );
    return found || COURSES[0];
  }

  function fetchLiveCoursesFromApi() {
    if (!coursesGrid) return;

    fetch("/api/courses")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          // Map DB records to UI format with fallback to rich curriculum metadata
          apiCoursesList = data.data.filter(c => c.status !== "OFF").map(c => {
            const cleanId = (c.id || "").replace(/^course-/, "").toLowerCase();
            const matchedStatic = COURSES.find(st => 
              st.id.toLowerCase() === cleanId ||
              st.id === c.id ||
              st.title.toLowerCase().trim() === (c.title || "").toLowerCase().trim() ||
              st.category.toLowerCase() === (c.category || "").toLowerCase()
            ) || COURSES[0];

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
      .catch(() => renderCourses());
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
    if (!coursesGrid) return;
    const searchInput = document.getElementById("course-search") || courseSearch;
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const coursesToRender = apiCoursesList.length > 0 ? apiCoursesList : COURSES;

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
      coursesGrid.innerHTML = `
        <div class="glass-card" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
          <i data-lucide="search-x" style="width: 48px; height: 48px; color: var(--text-dim); margin-bottom: 16px;"></i>
          <h3>No courses found for "${searchTerm}"</h3>
          <p style="color: var(--text-muted);">Try adjusting your search query or switching category filter.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    coursesGrid.innerHTML = filtered.map(course => `
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
    coursesGrid.querySelectorAll(".view-syllabus-btn").forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        openCourseDrawer(btn.getAttribute("data-course-id"));
      };
    });

    coursesGrid.querySelectorAll(".enroll-now-btn").forEach(btn => {
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
  fetchCategoriesFromApi();
  fetchLandingConfigFromApi();

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

  let liveLandingConfig = null;

  function fetchLandingConfigFromApi() {
    fetch("/api/landing")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          liveLandingConfig = data.data;
          applyLandingConfigToDOM(data.data);
        }
      })
      .catch(() => {});
  }

  function applyLandingConfigToDOM(config) {
    if (!config) return;

    // 1. Announcement Bar
    if (config.announcement) {
      const annBar = document.querySelector(".announcement-bar");
      if (annBar) {
        if (config.announcement.enabled === false) {
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
      if (trustSpan) {
        trustSpan.innerHTML = `<strong>${config.hero.trustStudentsCount || '4,850+'}</strong> ${config.hero.trustSubtitle || 'Ethiopian youth trained & launching clients'}`;
      }

      // Intro Video Box
      if (config.hero.introVideo) {
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
            const logoIcons = {
              "safaricom": "radio", "canal+": "tv", "dstv": "play-square",
              "upwork": "star", "telebirr": "smartphone", "cbe": "building-2",
              "meta": "globe", "youtube": "youtube"
            };
            logosGrid.innerHTML = config.instructors.partnerLogos.map(logo => {
              const iconName = logoIcons[logo.toLowerCase()] || "check-circle";
              return `<div class="trusted-logo-pill"><i data-lucide="${iconName}"></i> ${logo}</div>`;
            }).join("");
          }
        }

        // Mentors Cards Grid
        if (config.instructors.mentors && Array.isArray(config.instructors.mentors) && config.instructors.mentors.length > 0) {
          const instGrid = instSection.querySelector(".instructors-grid");
          if (instGrid) {
            instGrid.innerHTML = config.instructors.mentors.map(m => `
              <div class="instructor-card glass-card">
                <div class="instructor-avatar-wrap">
                  <img src="${m.photo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'}" alt="${m.name}" class="instructor-avatar-img">
                  <div class="instructor-badge-icon"><i data-lucide="shield-check"></i></div>
                </div>
                <h3 class="instructor-name">${m.name}</h3>
                <span class="instructor-role">${m.role}</span>
                <p class="instructor-bio">${m.bio}</p>
                <div class="instructor-stats-row">
                  <span><i data-lucide="users"></i> ${m.stat1 || 'Mentored'}</span>
                  <span><i data-lucide="award"></i> ${m.stat2 || 'Certified'}</span>
                </div>
              </div>
            `).join("");
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
        const secTag = successSec.querySelector(".section-tag");
        const secTitle = successSec.querySelector(".section-title");
        const secSub = successSec.querySelector(".section-subtitle");
        if (secTag && config.successStories.sectionTag) secTag.innerHTML = `<i data-lucide="trophy"></i> ${config.successStories.sectionTag}`;
        if (secTitle && config.successStories.sectionTitle) secTitle.innerHTML = `${config.successStories.sectionTitle} <span class="gradient-text">Graduates</span>`;
        if (secSub && config.successStories.sectionSubtitle) secSub.textContent = config.successStories.sectionSubtitle;

        // Case Studies Grid
        if (config.successStories.caseStudies && Array.isArray(config.successStories.caseStudies) && config.successStories.caseStudies.length > 0) {
          const caseGrid = successSec.querySelector(".success-stories-grid");
          if (caseGrid) {
            caseGrid.innerHTML = config.successStories.caseStudies.map(cs => `
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
    }

    if (window.lucide) window.lucide.createIcons();
  }

  /* ==========================================================================
     2. Render Testimonials & FAQ
     ========================================================================== */
  function renderTestimonials(customList) {
    if (!testimonialsGrid) return;
    const list = (customList && Array.isArray(customList) && customList.length > 0) ? customList : TESTIMONIALS;
    testimonialsGrid.innerHTML = list.map(t => `
      <div class="glass-card testimonial-card">
        <div class="testimonial-header">
          <img src="${t.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}" alt="${t.name}" class="testimonial-avatar">
          <div class="testimonial-info">
            <h4>${t.name}</h4>
            <span>${t.role}</span>
          </div>
        </div>
        <p>"${t.quote}"</p>
        <div>
          <span class="earning-badge"><i data-lucide="trending-up"></i> ${t.earnings}</span>
        </div>
      </div>
    `).join("");
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
    if (!course || !courseModal || !courseModalBody) return;

    courseModalBody.innerHTML = `
      <div style="padding: 30px;">
        <div class="badge badge-gold" style="margin-bottom: 12px;">${course.badge || "Featured Course"}</div>
        <h2 style="font-family: var(--font-heading); font-size: 2rem; font-weight: 800; margin-bottom: 12px;">${course.title}</h2>
        <p style="color: var(--text-muted); font-size: 1rem; margin-bottom: 24px;">${course.description}</p>
        
        <div class="glass-box" style="margin-bottom: 24px;">
          <h4 style="color: var(--primary-gold); margin-bottom: 12px;"><i data-lucide="check-circle-2"></i> What You Will Learn & Achieve:</h4>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px;">
            ${(course.outcomes || []).map(o => `<li style="font-size: 0.9rem; color: var(--text-main); display: flex; gap: 8px;"><i data-lucide="check" style="color: var(--accent-emerald);"></i> ${o}</li>`).join("")}
          </ul>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 style="font-family: var(--font-heading); margin-bottom: 14px;"><i data-lucide="list"></i> Course Curriculum & Syllabus</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${(course.modules || []).map((m) => `
              <div style="display: flex; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.9rem;">
                <span><strong>${m.title}</strong></span>
                <span style="color: var(--text-dim);">${m.duration}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="glass-box" style="border-color: rgba(99, 102, 241, 0.4); margin-bottom: 24px;">
          <h4 style="color: var(--accent-indigo); margin-bottom: 8px;"><i data-lucide="gift"></i> Included Free Bonus Bundles:</h4>
          ${(course.bonuses || []).map(b => `<p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">• ${b}</p>`).join("")}
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Enrollment Fee:</span>
            <div style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; color: var(--primary-gold);">${course.priceETB}</div>
          </div>
          <button type="button" class="btn btn-primary btn-lg drawer-enroll-trigger" data-course-id="${course.id}">
            <i data-lucide="rocket"></i> Enroll in Course
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    courseModal.classList.add("active");

    const drawerEnrollBtn = courseModalBody.querySelector(".drawer-enroll-trigger");
    if (drawerEnrollBtn) {
      drawerEnrollBtn.onclick = (e) => {
        e.preventDefault();
        courseModal.classList.remove("active");
        openCheckout(course.id);
      };
    }
  }

  if (courseModalClose) {
    courseModalClose.onclick = () => courseModal.classList.remove("active");
  }
  if (courseModal) {
    courseModal.onclick = (e) => {
      if (e.target === courseModal) courseModal.classList.remove("active");
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
      if (window.showToast) {
        window.showToast("Please register or log in first to enroll in masterclasses!", "info");
      }
      setTimeout(() => {
        window.location.href = `student-login.html?action=signup&redirect_course=${encodeURIComponent(courseId || "")}`;
      }, 600);
      return;
    }

    const course = findCourse(courseId);
    if (!course || !checkoutModal) return;

    activeCourseForCheckout = course;
    
    // Read student session if logged in
    const sessionRaw = localStorage.getItem("founders_student_session");
    let studentSession = null;
    if (sessionRaw) {
      try { studentSession = JSON.parse(sessionRaw); } catch (_e) {}
    }

    const nameInput = document.getElementById("buyer-name");
    const phoneInput = document.getElementById("buyer-phone");
    const cityInput = document.getElementById("buyer-address");
    const cookieBadge = document.getElementById("cookie-info-badge");

    if (studentSession) {
      if (nameInput && studentSession.name) nameInput.value = studentSession.name;
      if (phoneInput && studentSession.phone) phoneInput.value = studentSession.phone;
      if (cityInput && studentSession.email) cityInput.value = studentSession.email;

      if (cookieBadge) {
        cookieBadge.innerHTML = `<i data-lucide="check-circle"></i> Logged in as <strong>${studentSession.name}</strong> (${studentSession.phone})`;
        cookieBadge.classList.remove("hidden");
      }
    } else {
      // Read stored details from cookies
      const savedName = getCookie("fa_user_fullname");
      const savedPhone = getCookie("fa_user_phone");
      const savedCity = getCookie("fa_user_city");

      if (savedName && nameInput) nameInput.value = savedName;
      if (savedPhone && phoneInput) phoneInput.value = savedPhone;
      if (savedCity && cityInput) cityInput.value = savedCity;

      if ((savedName || savedPhone || savedCity) && cookieBadge) {
        cookieBadge.classList.remove("hidden");
      } else if (cookieBadge) {
        cookieBadge.classList.add("hidden");
      }
    }

    // Set course titles in step 1, step 2, step 3
    const titleStep1 = document.getElementById("checkout-course-title-step1");
    const summaryCourseName = document.getElementById("summary-course-name");
    
    if (titleStep1) titleStep1.textContent = course.title;
    if (summaryCourseName) summaryCourseName.textContent = course.title;
    if (summaryOriginalPrice) summaryOriginalPrice.textContent = course.originalPriceETB || "12,500 ETB";
    if (summaryDiscount) summaryDiscount.textContent = "-2,500 ETB";
    if (summaryFinalPrice) summaryFinalPrice.textContent = course.priceETB;
    if (instructionPrice) instructionPrice.textContent = course.priceETB;

    // Fetch latest merchant payment details directly from Supabase DB API
    fetchBankConfigFromApi();

    setCheckoutStep(1);
    checkoutModal.classList.add("active");
    if (window.lucide) window.lucide.createIcons();
  }

  if (checkoutModalClose) {
    checkoutModalClose.onclick = () => checkoutModal.classList.remove("active");
  }
  if (checkoutModal) {
    checkoutModal.onclick = (e) => {
      if (e.target === checkoutModal) checkoutModal.classList.remove("active");
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
            courseId: activeCourseForCheckout ? activeCourseForCheckout.id : null
          })
        });
        const json = await res.json();

        applyPromoBtn.disabled = false;
        applyPromoBtn.innerHTML = `Apply`;

        if (json.success && json.data) {
          appliedCouponState = json.data;
          showToast(json.data.message || `Success! ${json.data.discountStr} discount applied.`, "success");

          if (summaryDiscount) summaryDiscount.textContent = `-${json.data.discountAmount.toLocaleString()} ETB`;
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

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById("mobile-toggle");
  const navLinks = document.getElementById("nav-links");
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener("click", () => {
      navLinks.classList.toggle("mobile-active");
    });

    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("mobile-active");
      });
    });
  }

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
  const videoModal = document.getElementById("video-modal");
  const videoModalClose = document.getElementById("video-modal-close");
  const watchDemoBtn = document.getElementById("watch-demo-btn");
  const heroVideoTrigger = document.getElementById("hero-video-box-trigger");
  const introVideoFrame = document.getElementById("intro-video-frame");

  function openVideoModal() {
    if (!videoModal) return;
    videoModal.classList.add("active");
    if (introVideoFrame) {
      // Autoplay video when opened
      introVideoFrame.src = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0";
    }
  }

  function closeVideoModal() {
    if (!videoModal) return;
    videoModal.classList.remove("active");
    if (introVideoFrame) {
      // Stop video playback when closed
      introVideoFrame.src = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0";
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
            <div class="bubble-title"><i data-lucide="bot"></i> Khilx Academy Bot</div>
            <p>Welcome to <strong>Khilx Academy Bot</strong>! 🎉</p>
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
            <div class="bubble-title"><i data-lucide="bot"></i> Khilx Academy Bot</div>
            <p>✅ <strong>Phone Registered & Verified!</strong> Welcome Selam Tadesse.</p>
            <p>Here are your <strong>unique, 1-time single-use access links</strong>:</p>
            <div class="bot-links-grid">
              <a href="https://t.me/KhilxAcademyBot" target="_blank" class="bot-link-card">
                <i data-lucide="tv"></i>
                <div>
                  <strong>🔒 Join Private HD Video Channel</strong>
                  <span>Unique 1-Time Access Link • Expires after join</span>
                </div>
              </a>
              <a href="https://t.me/KhilxAcademyBot" target="_blank" class="bot-link-card">
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
            <div class="bubble-title"><i data-lucide="bot"></i> Khilx Academy Bot</div>
            <p>Welcome back, <strong>Selam Tadesse</strong>! 👋</p>
            <p>⚡ <strong>Already Registered Student Recognized!</strong> Your phone number (<code>+251 91 122 3344</code>) is active in our database.</p>
            <p>Here are your instant <strong>unique, 1-time access links</strong> for your new masterclass:</p>
            <div class="bot-links-grid">
              <a href="https://t.me/KhilxAcademyBot" target="_blank" class="bot-link-card">
                <i data-lucide="tv"></i>
                <div>
                  <strong>🔒 Join Private HD Video Channel</strong>
                  <span>Unique 1-Time Access Link • Delivered Instantly</span>
                </div>
              </a>
              <a href="https://t.me/KhilxAcademyBot" target="_blank" class="bot-link-card">
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
          <div class="bubble-title"><i data-lucide="bot"></i> Khilx Academy Bot</div>
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
          <div class="bubble-title"><i data-lucide="bot"></i> Khilx Academy Bot</div>
          <p>🎓 <strong>CONGRATULATIONS SELAM TADESSE!</strong> 🎉</p>
          <p>You have successfully completed 100% of the <strong>SMMA & Agency Growth Accelerator</strong> curriculum and passed all module quizzes.</p>
          
          <div class="bot-cert-card glass-box">
            <i data-lucide="award" style="width: 48px; height: 48px; color: #fbbf24; margin-bottom: 8px;"></i>
            <h4 style="font-family: var(--font-heading); color: var(--primary-gold); font-size: 1.1rem;">Verified Professional Certificate</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted);">Issued to: <strong>Selam Tadesse</strong> • ID: <code>KHILX-2026-89421</code></p>
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

  // Delegated Global Trigger for Enrollment and Syllabus Triggers
  document.addEventListener("click", (e) => {
    const enrollBtn = e.target.closest(".enroll-trigger, .enroll-now-btn, .drawer-enroll-trigger");
    if (enrollBtn) {
      e.preventDefault();
      const courseId = enrollBtn.dataset.courseId || enrollBtn.getAttribute("data-course-id");
      if (courseModal) courseModal.classList.remove("active");
      openCheckout(courseId);
      return;
    }
    const syllabusBtn = e.target.closest(".view-syllabus-btn");
    if (syllabusBtn) {
      e.preventDefault();
      const courseId = syllabusBtn.dataset.courseId || syllabusBtn.getAttribute("data-course-id");
      openCourseDrawer(courseId);
      return;
    }
  });

  window.openStudentAuthModal = function(initialTab = "login") {
    const action = initialTab === "signup" ? "signup" : "login";
    window.location.href = "student-login.html?action=" + action;
  };

  window.closeStudentAuthModal = function() {
    const modal = document.getElementById("student-auth-modal");
    if (modal) modal.style.display = "none";
  };

  function updateStudentHeaderAuth() {
    const navActions = document.querySelector(".nav-actions");
    const navLinks = document.getElementById("nav-links");
    if (!navActions) return;

    const sessionRaw = localStorage.getItem("founders_student_session");
    let session = null;
    if (sessionRaw) {
      try { session = JSON.parse(sessionRaw); } catch (_e) {}
    }

    let dashBtn = document.getElementById("header-student-dash-btn");
    let loginBtn = document.getElementById("header-student-login-btn");

    if (session) {
      if (loginBtn) loginBtn.remove();
      if (!dashBtn) {
        dashBtn = document.createElement("a");
        dashBtn.id = "header-student-dash-btn";
        dashBtn.href = "student-dashboard.html";
        dashBtn.className = "btn btn-outline";
        dashBtn.style.borderColor = "var(--primary-gold)";
        dashBtn.style.color = "var(--primary-gold)";
        dashBtn.innerHTML = `<i data-lucide="layout-dashboard"></i> Dashboard`;
        navActions.insertBefore(dashBtn, navActions.firstChild);
      }
      if (navLinks && !document.getElementById("nav-link-dashboard")) {
        const link = document.createElement("a");
        link.id = "nav-link-dashboard";
        link.href = "student-dashboard.html";
        link.className = "nav-link";
        link.innerHTML = `<i data-lucide="layout-dashboard"></i> My Dashboard`;
        navLinks.appendChild(link);
      }
    } else {
      if (dashBtn) dashBtn.remove();
      if (!loginBtn || loginBtn.tagName !== "A") {
        if (loginBtn) loginBtn.remove();
        loginBtn = document.createElement("a");
        loginBtn.id = "header-student-login-btn";
        loginBtn.href = "student-login.html";
        loginBtn.className = "btn btn-outline";
        loginBtn.style.borderColor = "rgba(255, 255, 255, 0.25)";
        loginBtn.innerHTML = `<i data-lucide="log-in"></i> Login`;
        navActions.insertBefore(loginBtn, navActions.firstChild);
      } else {
        loginBtn.href = "student-login.html";
      }
    }
    if (window.lucide) window.lucide.createIcons();
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
      window.location.href = "student-login.html";
    }, 200);
  };

  // Initial Builds
  renderCourses();
  renderTestimonials();
  renderFAQ();
  animateMetrics();
  // Global click delegate for login and logout buttons
  document.addEventListener("click", (e) => {
    const logoutBtn = e.target.closest("#btn-student-logout, .btn-student-logout, [data-action='student-logout'], [data-action='logout']");
    if (logoutBtn) {
      e.preventDefault();
      window.performStudentLogout();
      return;
    }

    const loginBtn = e.target.closest("button[id*='login'], .btn-login, [data-action='login']");
    if (loginBtn && !loginBtn.closest("#admin-login-card") && !loginBtn.id.includes("logout") && !loginBtn.classList.contains("btn-student-logout")) {
      e.preventDefault();
      window.location.href = "student-login.html";
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



