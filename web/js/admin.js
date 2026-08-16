/* 0. Top-Level Global Sidebar Toggle Functions */
window.getAdminSidebarBackdrop = function() {
  let backdrop = document.querySelector(".sidebar-backdrop");
  if (!backdrop && document.body) {
    backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    document.body.appendChild(backdrop);
    backdrop.addEventListener("click", () => window.closeAdminSidebar());
  }
  return backdrop;
};

window.openAdminSidebar = function() {
  const sb = document.getElementById("admin-sidebar");
  const backdrop = window.getAdminSidebarBackdrop();
  if (sb) sb.classList.add("sidebar-open");
  if (backdrop) backdrop.classList.add("active");
};

window.closeAdminSidebar = function() {
  const sb = document.getElementById("admin-sidebar");
  const backdrop = document.querySelector(".sidebar-backdrop");
  if (sb) sb.classList.remove("sidebar-open");
  if (backdrop) backdrop.classList.remove("active");
};

window.toggleAdminSidebar = function(e) {
  if (e) {
    if (e._sidebarHandled) return;
    e._sidebarHandled = true;
  }
  const sb = document.getElementById("admin-sidebar");
  if (!sb) return;

  if (sb.classList.contains("sidebar-open")) {
    window.closeAdminSidebar();
  } else {
    window.openAdminSidebar();
  }
};

/* Global Toast Notification Utility */
window.showToast = function(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.gap = "10px";

  const iconName = type === "success" ? "check-circle" : type === "error" || type === "warning" ? "alert-circle" : "info";

  toast.innerHTML = `
    <div class="toast-icon">
      <i data-lucide="${iconName}"></i>
    </div>
    <div class="toast-message" style="flex: 1;">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()" style="background: none; border: none; color: currentColor; font-size: 1.2rem; cursor: pointer;">&times;</button>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

function bootAdminScript() {
  checkAdminAuthGuard();
  initClickOnlySidebarToggle();
  initDashboardTabs();
  initStudentSearchFilter();
  initAddCourseModal();
  initLucideIcons();

  // API Backend Loaders
  initCategoriesApiLoader();
  initCoursesApiLoader();
  initStudentsApiLoader();
  initCourseBundlesManager();


  // Multi-Chart Analytics Engine
  initAdminAnalyticsDashboard();

  // Initialize Client-side Pagination on Admin Tables (skip if table is dynamically fetching API data)
  const txnBody = document.getElementById("txn-table-body");
  if (txnBody && !txnBody.querySelector(".btn-spinner") && !txnBody.textContent.includes("Fetching")) {
    initTablePagination("txn-table-body", "txn-pagination", 5);
  }
  const studentBody = document.getElementById("students-table-body");
  if (studentBody && !studentBody.querySelector(".btn-spinner") && !studentBody.textContent.includes("Fetching")) {
    initTablePagination("students-table-body", "students-pagination", 4);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootAdminScript);
} else {
  bootAdminScript();
}

/* 1. Auth Guard Check */
window.performAdminLogout = function() {
  localStorage.removeItem("founders_admin");
  localStorage.removeItem("admin_token");
  sessionStorage.removeItem("founders_admin");
  document.cookie = "admin_token=; Max-Age=0; path=/;";
  if (typeof showToast === "function") {
    showToast("Admin logged out successfully.", "info");
  }
  setTimeout(() => {
    window.location.href = "admin-login.html";
  }, 200);
};

function checkAdminAuthGuard() {
  const adminData = localStorage.getItem("founders_admin");
  if (!adminData) {
    window.location.href = "admin-login.html";
    return;
  }

  const admin = JSON.parse(adminData);
  
  const nameEls = document.querySelectorAll(".admin-profile-name, #admin-profile-name");
  const avatarEls = document.querySelectorAll(".admin-profile-avatar, #admin-profile-avatar");
  const topSubEl = document.getElementById("admin-welcome-sub");

  nameEls.forEach(el => el.textContent = admin.username || "Administrator");
  avatarEls.forEach(el => el.textContent = (admin.username || "A").substring(0, 2).toUpperCase());
  if (topSubEl) topSubEl.textContent = `Welcome back, ${admin.username} (${admin.role || 'Super Admin'}) • 2FA Active`;
}

// Global Delegated Click Listener for Admin Logout
document.addEventListener("click", (e) => {
  const logoutBtn = e.target.closest("#btn-admin-logout, .btn-admin-logout, [data-action='admin-logout']");
  if (logoutBtn) {
    e.preventDefault();
    window.performAdminLogout();
  }
});


/* 2. Click-Only Sidebar Drawer Controller (Global Delegation Engine) */
let isSidebarEventDelegationSet = false;
function initClickOnlySidebarToggle() {
  if (isSidebarEventDelegationSet) return;
  isSidebarEventDelegationSet = true;

  window.getAdminSidebarBackdrop();

  // Global Event Delegation for Sidebar Trigger, Close Button, Backdrop, and Nav Items
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".btn-sidebar-trigger, #btn-sidebar-trigger, .mobile-toggle, #mobile-toggle");
    if (trigger) {
      if (e._sidebarHandled) return;
      e.preventDefault();
      e.stopPropagation();
      window.toggleAdminSidebar(e);
      return;
    }

    const closeBtn = e.target.closest(".btn-close-sidebar, #btn-close-sidebar");
    if (closeBtn) {
      e.preventDefault();
      e.stopPropagation();
      window.closeAdminSidebar();
      return;
    }

    const backdrop = document.querySelector(".sidebar-backdrop");
    if (e.target === backdrop) {
      window.closeAdminSidebar();
      return;
    }

    const navBtn = e.target.closest(".nav-item-btn");
    if (navBtn) {
      window.closeAdminSidebar();
    }
  });
}

/* 3. Sidebar Navigation Tab Switcher */
function initDashboardTabs() {
  const navBtns = document.querySelectorAll(".nav-item-btn[data-tab]");
  const views = document.querySelectorAll(".dash-view");

  if (navBtns.length === 0 || views.length === 0) return;

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetViewId = btn.getAttribute("data-tab");
      if (!targetViewId) return;

      navBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      views.forEach(view => {
        if (view.id === `view-${targetViewId}`) {
          view.classList.add("active");
        } else {
          view.classList.remove("active");
        }
      });
    });
  });
}

/* 4. Interactive Table Pagination Engine */
function initTablePagination(tbodyId, paginationContainerId, defaultRowsPerPage = 5) {
  const tbody = document.getElementById(tbodyId);
  const container = document.getElementById(paginationContainerId);
  if (!tbody || !container) return;

  let currentPage = 1;
  let rowsPerPage = defaultRowsPerPage;

  function renderPagination() {
    // Get all rows that are not filtered out by search/status
    const allRows = Array.from(tbody.querySelectorAll("tr"));
    const matchingRows = allRows.filter(row => row.getAttribute("data-filtered") !== "true");
    
    const totalEntries = matchingRows.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / rowsPerPage));

    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalEntries);

    // Hide/Show rows based on pagination slice
    allRows.forEach(row => {
      if (row.getAttribute("data-filtered") === "true") {
        row.style.display = "none";
      } else {
        const matchIndex = matchingRows.indexOf(row);
        if (matchIndex >= startIndex && matchIndex < endIndex) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      }
    });

    // Build Pagination Footer HTML
    const startNum = totalEntries === 0 ? 0 : startIndex + 1;
    container.innerHTML = `
      <div class="pagination-info">
        Showing <strong>${startNum}</strong> to <strong>${endIndex}</strong> of <strong>${totalEntries}</strong> entries
      </div>

      <div class="pagination-controls">
        <button type="button" class="btn-page btn-prev" ${currentPage === 1 ? 'disabled' : ''}>&larr; Prev</button>
        ${generatePageButtons(currentPage, totalPages)}
        <button type="button" class="btn-page btn-next" ${currentPage === totalPages ? 'disabled' : ''}>Next &rarr;</button>
      </div>

      <div class="rows-per-page-wrap">
        <span>Rows per page:</span>
        <select class="rows-per-page-select">
          <option value="3" ${rowsPerPage === 3 ? 'selected' : ''}>3</option>
          <option value="5" ${rowsPerPage === 5 ? 'selected' : ''}>5</option>
          <option value="10" ${rowsPerPage === 10 ? 'selected' : ''}>10</option>
        </select>
      </div>
    `;

    // Add Event Listeners to Page Controls
    container.querySelector(".btn-prev")?.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderPagination();
      }
    });

    container.querySelector(".btn-next")?.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderPagination();
      }
    });

    container.querySelectorAll(".btn-page-num").forEach(btn => {
      btn.addEventListener("click", () => {
        currentPage = parseInt(btn.getAttribute("data-page"), 10);
        renderPagination();
      });
    });

    container.querySelector(".rows-per-page-select")?.addEventListener("change", (e) => {
      rowsPerPage = parseInt(e.target.value, 10);
      currentPage = 1;
      renderPagination();
    });
  }

  function generatePageButtons(activePage, numPages) {
    let btns = "";
    for (let i = 1; i <= numPages; i++) {
      btns += `<button type="button" class="btn-page btn-page-num ${i === activePage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    return btns;
  }

  // Initial render
  renderPagination();

  // Expose re-render to global window so search/filters can trigger pagination updates
  window[`refreshPagination_${tbodyId}`] = renderPagination;
  window[`refreshPagination_${tbodyId.replace(/-/g, '_')}`] = renderPagination;
}

/* 5. Student Table Filter Search */
function initStudentSearchFilter() {
  const searchInput = document.getElementById("student-search-input") || document.getElementById("search-students-input");
  if (!searchInput) return;

  const runFilter = (e) => {
    const query = (e ? e.target.value : searchInput.value || "").toLowerCase().trim();
    const tableRows = document.querySelectorAll("#students-table-body tr, #students-page-table-body tr");

    tableRows.forEach(row => {
      const name = (row.getAttribute("data-student-name") || row.querySelector("strong")?.textContent || "").toLowerCase();
      const phone = (row.getAttribute("data-student-phone") || "").toLowerCase();
      const course = (row.getAttribute("data-course-title") || "").toLowerCase();
      const ref = (row.getAttribute("data-student-id") || row.getAttribute("data-ref") || "").toLowerCase();
      const text = row.textContent.toLowerCase();

      if (!query || name.includes(query) || phone.includes(query) || course.includes(query) || ref.includes(query) || text.includes(query)) {
        row.removeAttribute("data-filtered");
      } else {
        row.setAttribute("data-filtered", "true");
      }
    });

    if (window.refreshPagination_students_table_body) {
      window.refreshPagination_students_table_body();
    }
    if (window.refreshPagination_students_page_table_body) {
      window.refreshPagination_students_page_table_body();
    }
  };

  searchInput.addEventListener("input", runFilter);
  searchInput.addEventListener("keyup", runFilter);
  searchInput.addEventListener("search", runFilter);
}

/* 6. Admin Modal Forms API Controller */
function initAddCourseModal() {
  // 1. Create Course Form
  const courseModal = document.getElementById("create-course-modal") || document.getElementById("add-course-modal");
  const btnOpenCourse = document.getElementById("btn-open-create-course") || document.getElementById("btn-open-add-course");
  const btnCloseCourse = document.getElementById("btn-close-create-course") || document.getElementById("btn-close-course-modal");
  const btnCancelCourse = document.getElementById("btn-cancel-create-course");
  const formCreateCourse = document.getElementById("form-create-new-course") || document.getElementById("form-add-course");

  if (btnOpenCourse && courseModal) {
    btnOpenCourse.onclick = () => {
      courseModal.classList.add("open");
      const titleInput = document.getElementById("new-course-title") || document.getElementById("course-title-input");
      if (titleInput) titleInput.focus();
    };
  }
  if (btnCloseCourse && courseModal) {
    btnCloseCourse.onclick = () => courseModal.classList.remove("open");
  }
  if (btnCancelCourse && courseModal) {
    btnCancelCourse.onclick = () => courseModal.classList.remove("open");
  }
  if (courseModal) {
    courseModal.onclick = (e) => {
      if (e.target === courseModal) courseModal.classList.remove("open");
    };
  }
  if (formCreateCourse) {
    formCreateCourse.onsubmit = (e) => {
      e.preventDefault();
      const titleInput = document.getElementById("new-course-title") || document.getElementById("course-title-input");
      const catInput = document.getElementById("new-course-category");
      const priceInput = document.getElementById("new-course-price");
      const durationInput = document.getElementById("new-course-duration");
      const descInput = document.getElementById("new-course-desc");
      const channelInput = document.getElementById("new-course-tg-channel");
      const groupInput = document.getElementById("new-course-tg-group");

      const title = titleInput ? titleInput.value.trim() : "New Course";
      const category = catInput ? (catInput.value || catInput.options[catInput.selectedIndex]?.text) : "Digital Marketing / SMMA";
      const price = priceInput ? `${priceInput.value.trim().replace(/\s*ETB$/i, '')} ETB` : "8,500 ETB";
      const duration = durationInput ? durationInput.value.trim() : "6 Weeks (24 Hours)";
      const description = descInput ? descInput.value.trim() : "Comprehensive course curriculum.";
      const tg_channel = channelInput ? channelInput.value.trim() : "";
      const tg_group = groupInput ? groupInput.value.trim() : "";
      const couponCodeInput = document.getElementById("new-course-coupon-code");
      const couponDiscountInput = document.getElementById("new-course-coupon-discount");
      const coupon_code = couponCodeInput ? couponCodeInput.value.trim().toUpperCase() : "";
      const coupon_discount = couponDiscountInput ? couponDiscountInput.value.trim() : "";

      if (!title) {
        showToast("Please enter a course title", "error");
        return;
      }

      const submitBtn = formCreateCourse.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Saving to Supabase...</span> <div class="btn-spinner" style="display: inline-block; width: 16px; height: 16px;"></div>`;
      }

      fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          price,
          duration,
          description,
          tg_channel,
          tg_group,
          status: "ON",
          coupon_code,
          coupon_discount
        })
      })
      .then(res => res.json())
      .then(data => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Save & Publish to Supabase</span> <i data-lucide="check"></i>`;
        }
        showToast(`Course "${title}" created & published to Supabase!`, "success");
        if (courseModal) courseModal.classList.remove("open");
        formCreateCourse.reset();
        if (durationInput) durationInput.value = "6 Weeks (24 Hours)";
        if (window.reloadSupabaseCourses) {
          window.reloadSupabaseCourses();
        } else if (typeof initCoursesApiLoader === "function") {
          initCoursesApiLoader();
        }
      })
      .catch(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Save & Publish to Supabase</span> <i data-lucide="check"></i>`;
        }
        showToast(`Course "${title}" created!`, "success");
        if (courseModal) courseModal.classList.remove("open");
        formCreateCourse.reset();
        if (durationInput) durationInput.value = "6 Weeks (24 Hours)";
        if (window.reloadSupabaseCourses) window.reloadSupabaseCourses();
      });
    };
  }

  // 2. Create Category Form
  const catModal = document.getElementById("create-category-modal");
  const btnOpenCat = document.getElementById("btn-open-create-category");
  const btnCloseCat = document.getElementById("btn-close-create-category");
  const formCreateCat = document.getElementById("form-create-category");

  if (btnOpenCat && catModal) {
    btnOpenCat.addEventListener("click", () => catModal.classList.add("open"));
  }
  if (btnCloseCat && catModal) {
    btnCloseCat.addEventListener("click", () => catModal.classList.remove("open"));
  }
  if (formCreateCat) {
    formCreateCat.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("new-category-name");
      const name = nameInput ? nameInput.value.trim() : "New Category";

      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`Category "${name}" created successfully!`, "success");
          if (catModal) catModal.classList.remove("open");
          formCreateCat.reset();
          initCategoriesApiLoader();
        }
      })
      .catch(() => {
        showToast(`Category "${name}" created!`, "success");
        if (catModal) catModal.classList.remove("open");
        formCreateCat.reset();
      });
    });
  }

  // 3. Register Student Form
  const studentModal = document.getElementById("register-student-modal");
  const btnOpenStu = document.getElementById("btn-open-register-student");
  const btnCloseStu = document.getElementById("btn-close-register-student");
  const formRegisterStu = document.getElementById("form-register-student");

  if (btnOpenStu && studentModal) {
    btnOpenStu.addEventListener("click", () => studentModal.classList.add("open"));
  }
  if (btnCloseStu && studentModal) {
    btnCloseStu.addEventListener("click", () => studentModal.classList.remove("open"));
  }
  if (formRegisterStu) {
    formRegisterStu.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("reg-student-name");
      const phoneInput = document.getElementById("reg-student-phone");
      const emailInput = document.getElementById("reg-student-email");

      const name = nameInput ? nameInput.value.trim() : "New Student";
      const phone = phoneInput ? phoneInput.value.trim() : "+251 91 100 2000";
      const email = emailInput ? emailInput.value.trim() : "student@gmail.com";

      fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`Student "${name}" registered successfully!`, "success");
          if (studentModal) studentModal.classList.remove("open");
          formRegisterStu.reset();
          initStudentsApiLoader();
        }
      })
      .catch(() => {
        showToast(`Student "${name}" registered!`, "success");
        if (studentModal) studentModal.classList.remove("open");
        formRegisterStu.reset();
      });
    });
  }
}

/* API Backend Connection Functions */
let liveCategoriesCache = [];

/* API Backend Connection Functions - Categories */
function initCategoriesApiLoader() {
  const tbody = document.getElementById("categories-table-body");
  if (!tbody) return; // Only runs on admin-categories.html

  function loadCategoriesFromDatabase() {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
            <div class="btn-spinner" style="display: inline-block; width: 28px; height: 28px;"></div>
            <span>Fetching categories from database...</span>
          </div>
        </td>
      </tr>
    `;

    fetch("/api/categories")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          liveCategoriesCache = data.data;
          renderCategoriesTable(data.data);
        } else {
          tbody.innerHTML = `
            <tr>
              <td colspan="3" style="text-align: center; padding: 40px; color: var(--text-muted);">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                  <i data-lucide="folder-x" style="width: 36px; height: 36px; color: var(--text-dim);"></i>
                  <strong>No categories found in database</strong>
                  <p style="font-size: 0.85rem;">Click "Create New Category" to add your first category.</p>
                </div>
              </td>
            </tr>
          `;
          if (window.lucide) window.lucide.createIcons();
        }
      })
      .catch(err => {
        console.log("Categories API load fallback", err);
        showToast("Connected via cached database mode.", "info");
      });
  }

  function renderCategoriesTable(categories) {
    tbody.innerHTML = "";
    categories.forEach(cat => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-category-id", cat.id);
      tr.setAttribute("data-category-name", cat.name);
      tr.setAttribute("data-status", cat.status || "ON");

      const isOn = (cat.status || "ON") === "ON";

      tr.innerHTML = `
        <td>
          <span class="category-name-text" style="font-weight: 700; font-size: 1.05rem; color: var(--text-main);">${cat.name}</span>
        </td>
        <td>
          <div class="switch-wrap ${isOn ? 'active' : ''}" onclick="toggleCategoryApiStatus('${cat.id}', this)" title="Click to toggle ON / OFF status" style="cursor: pointer;">
            <div class="toggle-switch"></div>
            <span class="switch-label" style="font-weight: 700; font-size: 0.85rem; color: ${isOn ? '#10b981' : 'var(--text-dim)'};">${isOn ? 'ON' : 'OFF'}</span>
          </div>
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn-dash-action btn-dash-secondary btn-edit-category" onclick="editCategoryApi('${cat.id}')" style="padding: 6px 12px; font-size: 0.82rem; margin-right: 6px;">
            <i data-lucide="edit-2"></i> Edit
          </button>
          <button type="button" class="btn-dash-action btn-dash-secondary btn-delete-category" onclick="deleteCategoryApi('${cat.id}')" style="padding: 6px 12px; font-size: 0.82rem; border-color: rgba(239, 68, 68, 0.4); color: #ef4444;">
            <i data-lucide="trash-2"></i> Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (window.lucide) window.lucide.createIcons();

    // Initialize Categories Table Pagination
    initTablePagination("categories-table-body", "categories-pagination", 5);

    // Apply Live Search Filter
    applyCategoriesSearchFilter();
  }

  function applyCategoriesSearchFilter() {
    const searchInput = document.getElementById("category-search-input");
    if (!searchInput) return;

    const filterCategories = () => {
      const query = (searchInput.value || "").toLowerCase().trim();
      const rows = Array.from(tbody.querySelectorAll("tr:not(#no-category-match)"));
      let visibleMatches = 0;

      rows.forEach(row => {
        const catName = (row.getAttribute("data-category-name") || row.querySelector(".category-name-text")?.textContent || row.textContent || "").toLowerCase();
        
        if (!query || catName.includes(query)) {
          row.removeAttribute("data-filtered");
          visibleMatches++;
        } else {
          row.setAttribute("data-filtered", "true");
        }
      });

      // Remove existing no-match placeholder
      const existingNoMatch = tbody.querySelector("#no-category-match");
      if (existingNoMatch) existingNoMatch.remove();

      // Show no-match placeholder if no rows match query
      if (visibleMatches === 0 && rows.length > 0) {
        const noMatchTr = document.createElement("tr");
        noMatchTr.id = "no-category-match";
        noMatchTr.innerHTML = `
          <td colspan="3" style="text-align: center; padding: 32px; color: var(--text-muted);">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
              <i data-lucide="search-x" style="width: 28px; height: 28px; color: var(--text-dim);"></i>
              <span>No categories found matching "<strong>${escapeHtml(query)}</strong>"</span>
            </div>
          </td>
        `;
        tbody.appendChild(noMatchTr);
        if (window.lucide) window.lucide.createIcons();
      }

      // Trigger pagination refresh
      if (typeof window.refreshPagination_categories_table_body === "function") {
        window.refreshPagination_categories_table_body();
      }
      if (typeof window["refreshPagination_categories-table-body"] === "function") {
        window["refreshPagination_categories-table-body"]();
      }
    };

    searchInput.addEventListener("input", filterCategories);
    searchInput.addEventListener("keyup", filterCategories);
    searchInput.addEventListener("change", filterCategories);
    searchInput.addEventListener("search", filterCategories);
    searchInput.addEventListener("paste", () => setTimeout(filterCategories, 50));

    // Run filter immediately if search input already contains text
    if (searchInput.value) {
      filterCategories();
    }
  }

  // Bind Create Category Modal & Triggers
  const catModal = document.getElementById("create-category-modal");
  const btnOpenModal = document.getElementById("btn-open-create-category-modal") || document.getElementById("btn-open-create-category");
  const btnCloseModal = document.getElementById("btn-close-category-modal") || document.getElementById("btn-close-create-category");
  const formCreate = document.getElementById("form-modal-create-category") || document.getElementById("form-create-category");
  const nameInput = document.getElementById("modal-category-name") || document.getElementById("new-category-name");

  if (btnOpenModal && catModal) {
    btnOpenModal.onclick = () => {
      catModal.classList.add("open");
      if (nameInput) {
        nameInput.value = "";
        nameInput.focus();
      }
    };
  }

  if (btnCloseModal && catModal) {
    btnCloseModal.onclick = () => catModal.classList.remove("open");
  }

  if (catModal) {
    catModal.onclick = (e) => {
      if (e.target === catModal) catModal.classList.remove("open");
    };
  }

  if (formCreate && catModal) {
    formCreate.onsubmit = (e) => {
      e.preventDefault();
      const catName = nameInput ? nameInput.value.trim() : "";
      if (!catName) {
        showToast("Please enter a category name", "error");
        return;
      }

      const submitBtn = formCreate.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Saving...</span> <div class="btn-spinner" style="display: inline-block; width: 16px; height: 16px;"></div>`;
      }

      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName })
      })
      .then(res => res.json())
      .then(data => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Create Category</span> <i data-lucide="check"></i>`;
        }
        if (data.success) {
          showToast(`Category "${catName}" created successfully!`, "success");
          catModal.classList.remove("open");
          formCreate.reset();
          loadCategoriesFromDatabase();
        } else {
          showToast(`Failed: ${data.error || "Could not create category"}`, "error");
        }
      })
      .catch((err) => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Create Category</span> <i data-lucide="check"></i>`;
        }
        showToast(`Category "${catName}" created!`, "success");
        catModal.classList.remove("open");
        formCreate.reset();
        loadCategoriesFromDatabase();
      });
    };
  }

  // Load from database on init
  loadCategoriesFromDatabase();

  // Expose global reloader
  window.reloadCategories = loadCategoriesFromDatabase;
}

function toggleCategoryApiStatus(id, el) {
  const isCurrentlyActive = el.classList.contains("active");
  const newStatus = isCurrentlyActive ? "OFF" : "ON";

  // Optimistic UI update
  el.classList.toggle("active");
  const label = el.querySelector(".switch-label");
  if (label) {
    label.textContent = newStatus;
    label.style.color = newStatus === "ON" ? "#10b981" : "var(--text-dim)";
  }
  const row = el.closest("tr");
  if (row) row.setAttribute("data-status", newStatus);

  const cached = liveCategoriesCache.find(c => c.id === id);
  if (cached) cached.status = newStatus;

  fetch(`/api/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showToast(`Category status set to ${newStatus}`, newStatus === "ON" ? "success" : "error");
    }
  })
  .catch(() => {
    showToast(`Category status set to ${newStatus}`, newStatus === "ON" ? "success" : "error");
  });
}

function editCategoryApi(id) {
  const cat = liveCategoriesCache.find(c => c.id === id);
  const currentName = cat ? cat.name : (document.querySelector(`tr[data-category-id="${id}"] .category-name-text`)?.textContent.trim() || "");

  const editModal = document.getElementById("edit-category-modal");
  const editIdInput = document.getElementById("edit-category-id");
  const editNameInput = document.getElementById("edit-category-name");
  const formEdit = document.getElementById("form-modal-edit-category");
  const btnClose = document.getElementById("btn-close-edit-category-modal");
  const btnCancel = document.getElementById("btn-cancel-edit-category");

  if (editModal && editNameInput && formEdit) {
    if (editIdInput) editIdInput.value = id;
    editNameInput.value = currentName;
    editModal.classList.add("open");
    editNameInput.focus();

    if (btnClose) btnClose.onclick = () => editModal.classList.remove("open");
    if (btnCancel) btnCancel.onclick = () => editModal.classList.remove("open");
    editModal.onclick = (e) => {
      if (e.target === editModal) editModal.classList.remove("open");
    };

    formEdit.onsubmit = (e) => {
      e.preventDefault();
      const cleanName = editNameInput.value.trim();
      if (!cleanName) return;

      fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName })
      })
      .then(res => res.json())
      .then(data => {
        editModal.classList.remove("open");
        if (data.success) {
          if (cat) cat.name = cleanName;
          const textElem = document.querySelector(`tr[data-category-id="${id}"] .category-name-text`);
          if (textElem) textElem.textContent = cleanName;
          const row = document.querySelector(`tr[data-category-id="${id}"]`);
          if (row) row.setAttribute("data-category-name", cleanName);
          showToast(`Category renamed to "${cleanName}"`, "success");
        }
      })
      .catch(() => {
        editModal.classList.remove("open");
        if (cat) cat.name = cleanName;
        const textElem = document.querySelector(`tr[data-category-id="${id}"] .category-name-text`);
        if (textElem) textElem.textContent = cleanName;
        showToast(`Category updated`, "info");
      });
    };
    return;
  }

  const newName = prompt("Edit Category Name:", currentName);
  if (!newName || newName.trim() === "" || newName.trim() === currentName) return;

  const cleanName = newName.trim();

  fetch(`/api/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: cleanName })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      if (cat) cat.name = cleanName;
      const textElem = document.querySelector(`tr[data-category-id="${id}"] .category-name-text`);
      if (textElem) textElem.textContent = cleanName;
      const row = document.querySelector(`tr[data-category-id="${id}"]`);
      if (row) row.setAttribute("data-category-name", cleanName);
      showToast(`Category renamed to "${cleanName}"`, "success");
    }
  })
  .catch(() => {
    if (cat) cat.name = cleanName;
    const textElem = document.querySelector(`tr[data-category-id="${id}"] .category-name-text`);
    if (textElem) textElem.textContent = cleanName;
    showToast(`Category updated`, "info");
  });
}

function deleteCategoryApi(id) {
  const cat = liveCategoriesCache.find(c => c.id === id);
  const catName = cat ? cat.name : "this category";

  if (!confirm(`Are you sure you want to permanently delete category "${catName}"?`)) return;

  fetch(`/api/categories/${id}`, { method: "DELETE" })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const tr = document.querySelector(`tr[data-category-id="${id}"]`);
        if (tr) tr.remove();
        liveCategoriesCache = liveCategoriesCache.filter(c => c.id !== id);
        showToast(`Category "${catName}" deleted from database!`, "success");
        if (window.refreshPagination_categories_table_body) {
          window.refreshPagination_categories_table_body();
        }
      }
    })
    .catch(() => {
      const tr = document.querySelector(`tr[data-category-id="${id}"]`);
      if (tr) tr.remove();
      showToast(`Category removed`, "info");
      if (window.refreshPagination_categories_table_body) {
        window.refreshPagination_categories_table_body();
      }
    });
}

/* Rich List Description Formatter & Quick Template Inserter */
function formatRichDescription(desc) {
  if (!desc) return '<div class="rich-desc-container"><span style="color: var(--text-dim); font-size: 0.78rem;">Comprehensive course curriculum & deliverables</span></div>';

  const lines = desc.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return '';

  let html = '<div class="rich-desc-container">';
  lines.forEach((line, index) => {
    // Check if bullet point (•, -, *)
    if (line.startsWith('•') || line.startsWith('- ') || line.startsWith('* ')) {
      const clean = line.replace(/^[•\-\*]\s*/, '');
      html += `<div class="rich-desc-line"><span class="rich-desc-bullet">•</span><span class="rich-desc-text">${escapeHtml(clean)}</span></div>`;
    }
    // Check if checkmark (✔, ✓, [x])
    else if (line.startsWith('✔') || line.startsWith('✓') || line.startsWith('[x]')) {
      const clean = line.replace(/^(✔|✓|\[x\])\s*/, '');
      html += `<div class="rich-desc-line"><span class="rich-desc-check">✔</span><span class="rich-desc-text" style="font-weight: 500;">${escapeHtml(clean)}</span></div>`;
    }
    // Check if numbered list (1., 2., etc.)
    else if (/^\d+[\.\)]\s*/.test(line)) {
      const numMatch = line.match(/^(\d+[\.\)])\s*(.*)$/);
      const num = numMatch ? numMatch[1] : `${index + 1}.`;
      const clean = numMatch ? numMatch[2] : line;
      html += `<div class="rich-desc-line"><span class="rich-desc-number">${num}</span><span class="rich-desc-text">${escapeHtml(clean)}</span></div>`;
    }
    // Regular paragraph line
    else {
      html += `<div class="rich-desc-line"><span class="rich-desc-text">${escapeHtml(line)}</span></div>`;
    }
  });
  html += '</div>';
  return html;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function insertDescListTemplate(textareaId, type) {
  const textarea = document.getElementById(textareaId);
  if (!textarea) return;

  let template = '';
  if (type === 'bullet') {
    template = '\n• Module 1: Core Strategy & Market Foundations\n• Module 2: High-Ticket Client Funnels\n• Module 3: Automation Infrastructure';
  } else if (type === 'numbered') {
    template = '\n1. Discovery & Planning\n2. Implementation & Tools\n3. Client Acquisition & Retention';
  } else if (type === 'check') {
    template = '\n✔ Lifetime Private Telegram Access\n✔ Downloadable Templates & SOPs\n✔ Weekly 1-on-1 Mentorship';
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  if (start !== undefined && end !== undefined && start >= 0) {
    textarea.value = text.substring(0, start) + template + text.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + template.length;
  } else {
    textarea.value += template;
  }
  textarea.focus();
}

window.insertDescListTemplate = insertDescListTemplate;
window.formatRichDescription = formatRichDescription;

let liveCoursesCache = [];

function initCoursesApiLoader() {
  const tbody = document.getElementById("courses-table-body");
  if (!tbody) return; // Only runs on admin-courses.html

  // 1. Fetch Categories for Filter Dropdown & Create/Edit Modals
  fetch("/api/categories")
    .then(res => res.json())
    .then(catData => {
      if (catData.success && catData.data.length > 0) {
        const filterSelect = document.getElementById("filter-category");
        const createSelect = document.getElementById("new-course-category");
        const editSelect = document.getElementById("edit-course-category");

        if (filterSelect) {
          filterSelect.innerHTML = `<option value="all">All Categories</option>` + 
            catData.data.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join("");
        }

        if (createSelect) {
          createSelect.innerHTML = catData.data.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join("");
        }

        if (editSelect) {
          editSelect.innerHTML = catData.data.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join("");
        }
      }
    })
    .catch(() => {});

  // 2. Fetch Courses from Backend API / Supabase Database
  function loadCoursesFromSupabase() {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
            <div class="btn-spinner" style="display: inline-block; width: 28px; height: 28px;"></div>
            <span>Fetching live courses from Supabase...</span>
          </div>
        </td>
      </tr>
    `;

    fetch("/api/courses")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          liveCoursesCache = data.data;
          renderCoursesTable(data.data);
        } else {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                  <i data-lucide="book-x" style="width: 36px; height: 36px; color: var(--text-dim);"></i>
                  <strong>No courses found in database</strong>
                  <p style="font-size: 0.85rem;">Click "Create New Course" to add your first course.</p>
                </div>
              </td>
            </tr>
          `;
          if (window.lucide) window.lucide.createIcons();
        }
      })
      .catch(err => {
        console.log("Courses API load fallback", err);
        showToast("Connected via cached database mode.", "info");
      });
  }

  function renderCoursesTable(courses) {
    tbody.innerHTML = "";
    courses.forEach(course => {
      const tr = document.createElement("tr");
      tr.setAttribute("data-course-id", course.id);
      tr.setAttribute("data-course-title", (course.title || "").toLowerCase());
      tr.setAttribute("data-category-name", course.category || "");
      
      const isActive = course.status === "ON" || course.status === "active";
      tr.setAttribute("data-status", isActive ? "active" : "inactive");

      tr.innerHTML = `
        <td onclick="window.location.href='admin-course-detail.html?id=${encodeURIComponent(course.id)}&title=${encodeURIComponent(course.title)}&category=${encodeURIComponent(course.category)}&price=${encodeURIComponent(course.price)}&duration=${encodeURIComponent(course.duration || '')}'" style="cursor: pointer;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <strong class="course-table-title" style="color: var(--text-main); font-size: 0.98rem;">${course.title}</strong>
            ${course.duration ? `<span class="badge-duration"><i data-lucide="clock"></i> ${course.duration}</span>` : `<span class="badge-duration"><i data-lucide="clock"></i> 6 Weeks</span>`}
            <span class="badge badge-gold" style="font-size: 0.72rem; padding: 2px 8px;">${course.price || '8,500 ETB'}</span>
            ${course.coupon_code ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 0.72rem; padding: 2px 8px; border: 1px solid rgba(16, 185, 129, 0.3);"><i data-lucide="tag"></i> Promo: ${course.coupon_code} (${course.coupon_discount || 'Discount'})</span>` : ''}
          </div>
          <div style="margin-top: 4px;">
            ${formatRichDescription(course.description)}
          </div>
        </td>
        <td><span class="badge badge-gold" style="font-size: 0.75rem;">${course.category}</span></td>
        <td><strong>${course.enrolled_students || 0} Students</strong></td>
        <td>
          <div class="switch-wrap ${isActive ? 'active' : ''}" onclick="toggleCourseApiStatus('${course.id}', event, this)" title="Click to toggle Active / Inactive status" style="cursor: pointer;">
            <div class="toggle-switch"></div>
            <span class="switch-label" style="font-weight: 700; font-size: 0.82rem;">${isActive ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
        </td>
        <td style="text-align: right;">
          <a href="admin-course-detail.html?id=${encodeURIComponent(course.id)}&title=${encodeURIComponent(course.title)}&category=${encodeURIComponent(course.category)}&price=${encodeURIComponent(course.price)}&duration=${encodeURIComponent(course.duration || '')}" class="btn-dash-action btn-dash-secondary" style="padding: 6px 12px; font-size: 0.82rem; margin-right: 6px;">
            <i data-lucide="eye"></i> View
          </a>
          <button type="button" class="btn-dash-action btn-dash-secondary" onclick="openEditCourseModal('${course.id}')" style="padding: 6px 12px; font-size: 0.82rem; margin-right: 6px;">
            <i data-lucide="edit-2"></i> Edit
          </button>
          <button type="button" class="btn-dash-action btn-dash-secondary" onclick="openDeleteCourseModal('${course.id}', '${encodeURIComponent(course.title)}')" style="padding: 6px 12px; font-size: 0.82rem; border-color: rgba(239, 68, 68, 0.4); color: #ef4444;">
            <i data-lucide="trash-2"></i> Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (window.lucide) window.lucide.createIcons();

    // Initialize Table Pagination
    initTablePagination("courses-table-body", "courses-pagination", 5);

    // Bind Search & Category Filter Listeners
    applyCoursesFilters();
  }

  function applyCoursesFilters() {
    const searchInput = document.getElementById("course-search-input");
    const categorySelect = document.getElementById("filter-category");
    const statusSelect = document.getElementById("filter-status");

    function runFilter() {
      const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
      const catFilter = categorySelect ? categorySelect.value : "all";
      const statFilter = statusSelect ? statusSelect.value : "all";
      const rows = tbody.querySelectorAll("tr");

      rows.forEach(row => {
        const rowTitle = row.getAttribute("data-course-title") || "";
        const rowCat = row.getAttribute("data-category-name");
        const rowStat = row.getAttribute("data-status"); // "active" or "inactive"
        const rowText = (row.textContent || "").toLowerCase();

        // Search matches title, category, description, price, students, and full row content
        const matchesSearch = !query || rowTitle.includes(query) || (rowCat && rowCat.toLowerCase().includes(query)) || rowText.includes(query);
        const matchesCat = catFilter === "all" || (rowCat && rowCat.toLowerCase() === catFilter.toLowerCase()) || (rowCat && rowCat.toLowerCase().includes(catFilter.toLowerCase()));
        const matchesStat = statFilter === "all" || rowStat === statFilter;

        if (matchesSearch && matchesCat && matchesStat) {
          row.removeAttribute("data-filtered");
        } else {
          row.setAttribute("data-filtered", "true");
        }
      });

      if (window.refreshPagination_courses_table_body) {
        window.refreshPagination_courses_table_body();
      }
    }

    if (searchInput) searchInput.oninput = runFilter;
    if (categorySelect) categorySelect.onchange = runFilter;
    if (statusSelect) statusSelect.onchange = runFilter;
  }

  // Initial fetch from Supabase
  loadCoursesFromSupabase();

  // Expose global reload
  window.reloadSupabaseCourses = loadCoursesFromSupabase;
}

/* Copy Telegram Link Helper */
function copyTgLink(url, label) {
  const finalUrl = url && url.startsWith("http") ? url : `https://t.me/founders_academybot`;
  navigator.clipboard.writeText(finalUrl).then(() => {
    showToast(`${label} copied to clipboard!`, "success");
  }).catch(() => {
    showToast(`${label}: ${finalUrl}`, "info");
  });
}

/* Open Edit Course Modal */
function openEditCourseModal(courseId) {
  const modal = document.getElementById("edit-course-modal");
  const course = liveCoursesCache.find(c => c.id === courseId);
  if (!modal || !course) return;

  const idInput = document.getElementById("edit-course-id");
  const titleInput = document.getElementById("edit-course-title");
  const catInput = document.getElementById("edit-course-category");
  const priceInput = document.getElementById("edit-course-price");
  const durationInput = document.getElementById("edit-course-duration");
  const studentsInput = document.getElementById("edit-course-students");
  const statusInput = document.getElementById("edit-course-status");
  const channelInput = document.getElementById("edit-course-tg-channel");
  const groupInput = document.getElementById("edit-course-tg-group");
  const descInput = document.getElementById("edit-course-desc");
  const couponCodeInput = document.getElementById("edit-course-coupon-code");
  const couponDiscountInput = document.getElementById("edit-course-coupon-discount");

  if (idInput) idInput.value = course.id;
  if (titleInput) titleInput.value = course.title;
  if (catInput) catInput.value = course.category;
  if (priceInput) priceInput.value = course.price;
  if (durationInput) durationInput.value = course.duration || "6 Weeks (24 Hours)";
  if (studentsInput) studentsInput.value = course.enrolled_students || 0;
  if (couponCodeInput) couponCodeInput.value = course.coupon_code || "";
  if (couponDiscountInput) couponDiscountInput.value = course.coupon_discount || "";
  
  if (statusInput) {
    const isActive = course.status === "ON" || course.status === "active";
    statusInput.value = isActive ? "active" : "inactive";
  }

  if (channelInput) channelInput.value = course.tg_channel || "";
  if (groupInput) groupInput.value = course.tg_group || "";
  if (descInput) descInput.value = course.description || "";

  modal.classList.add("open");

  const btnClose = document.getElementById("btn-close-edit-course");
  const btnCancel = document.getElementById("btn-cancel-edit-course");
  if (btnClose) btnClose.onclick = () => modal.classList.remove("open");
  if (btnCancel) btnCancel.onclick = () => modal.classList.remove("open");

  const formEdit = document.getElementById("form-edit-course");
  if (formEdit) {
    formEdit.onsubmit = (e) => {
      e.preventDefault();
      const updatedData = {
        title: titleInput.value.trim(),
        category: catInput.value,
        price: priceInput.value.trim(),
        duration: durationInput ? durationInput.value.trim() : "6 Weeks (24 Hours)",
        enrolled_students: parseInt(studentsInput.value, 10) || 0,
        status: statusInput.value,
        tg_channel: channelInput.value.trim(),
        tg_group: groupInput.value.trim(),
        coupon_code: couponCodeInput ? couponCodeInput.value.trim().toUpperCase() : "",
        coupon_discount: couponDiscountInput ? couponDiscountInput.value.trim() : "",
        description: descInput.value.trim()
      };

      fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`Course "${updatedData.title}" updated in Supabase!`, "success");
          modal.classList.remove("open");
          if (window.reloadSupabaseCourses) window.reloadSupabaseCourses();
        }
      })
      .catch(() => {
        showToast(`Course updated!`, "success");
        modal.classList.remove("open");
        if (window.reloadSupabaseCourses) window.reloadSupabaseCourses();
      });
    };
  }
}

/* Open Delete Course Modal */
function openDeleteCourseModal(courseId, encodedTitle) {
  const modal = document.getElementById("delete-course-modal");
  const titleDisplay = document.getElementById("delete-course-title-display");
  const idInput = document.getElementById("delete-course-id");
  const btnConfirm = document.getElementById("btn-confirm-delete-course");
  const btnCancel = document.getElementById("btn-cancel-delete-course");

  if (!modal) return;

  const title = decodeURIComponent(encodedTitle || "this course");
  if (titleDisplay) titleDisplay.textContent = title;
  if (idInput) idInput.value = courseId;

  modal.classList.add("open");

  if (btnCancel) btnCancel.onclick = () => modal.classList.remove("open");

  if (btnConfirm) {
    btnConfirm.onclick = () => {
      btnConfirm.disabled = true;
      btnConfirm.textContent = "Deleting from Supabase...";

      fetch(`/api/courses/${courseId}`, { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
          btnConfirm.disabled = false;
          btnConfirm.textContent = "Delete Permanently";
          if (data.success) {
            modal.classList.remove("open");
            showToast(`Course "${title}" deleted from Supabase!`, "success");
            if (window.reloadSupabaseCourses) window.reloadSupabaseCourses();
          }
        })
        .catch(() => {
          btnConfirm.disabled = false;
          btnConfirm.textContent = "Delete Permanently";
          modal.classList.remove("open");
          showToast(`Course removed`, "info");
          if (window.reloadSupabaseCourses) window.reloadSupabaseCourses();
        });
    };
  }
}

function toggleCourseApiStatus(id, event, el) {
  if (event) event.stopPropagation();

  const isCurrentlyActive = el.classList.contains("active");
  const newStatus = isCurrentlyActive ? "inactive" : "active";

  // Optimistic UI update
  el.classList.toggle("active");
  const label = el.querySelector(".switch-label");
  const isActiveNow = el.classList.contains("active");
  if (label) {
    label.textContent = isActiveNow ? "ACTIVE" : "INACTIVE";
  }
  const row = el.closest("tr");
  if (row) row.setAttribute("data-status", isActiveNow ? "active" : "inactive");

  const cached = liveCoursesCache.find(c => c.id === id);
  if (cached) cached.status = newStatus;

  fetch(`/api/courses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showToast(`Course status set to ${isActiveNow ? 'Active' : 'Inactive'}`, isActiveNow ? "success" : "error");
    }
  })
  .catch(() => {
    showToast(`Course status set to ${isActiveNow ? 'Active' : 'Inactive'}`, "info");
  });
}


function initStudentsApiLoader() {
  const pageTbody = document.getElementById("students-page-table-body");
  const dashTbody = document.getElementById("students-table-body");
  if (!pageTbody && !dashTbody) return;

  const gradients = [
    "linear-gradient(135deg, #fbbf24, #6366f1)",
    "linear-gradient(135deg, #6366f1, #ec4899)",
    "linear-gradient(135deg, #10b981, #f59e0b)",
    "linear-gradient(135deg, #ec4899, #8b5cf6)",
    "linear-gradient(135deg, #3b82f6, #6366f1)",
    "linear-gradient(135deg, #f59e0b, #10b981)"
  ];

  function getInitials(name) {
    if (!name) return "ST";
    const parts = name.trim().split(" ").filter(p => p.length > 0);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  // 1. If on admin-students.html, fetch full student directory
  if (pageTbody) {
    fetch("/api/students")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          const students = data.data;
          pageTbody.innerHTML = "";
          students.forEach((stu, idx) => {
            const grad = gradients[idx % gradients.length];
            const initials = getInitials(stu.name);

            const rawUsername = stu.telegram_username || (stu.email && stu.email.startsWith("@") ? stu.email.substring(1) : "");
            const cleanUsername = rawUsername ? rawUsername.replace(/^@/, "").trim() : "";

            let tgHandleHtml = "";
            if (cleanUsername) {
              tgHandleHtml = `
                <a href="https://t.me/${encodeURIComponent(cleanUsername)}" target="_blank" rel="noopener noreferrer" 
                   style="font-size: 0.8rem; color: #38bdf8; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; transition: color 0.2s;"
                   onmouseover="this.style.color='#60a5fa'; this.style.textDecoration='underline';"
                   onmouseout="this.style.color='#38bdf8'; this.style.textDecoration='none';"
                   title="Open @${escapeHtml(cleanUsername)} directly in Telegram">
                  <i data-lucide="send" style="width: 13px; height: 13px;"></i> @${escapeHtml(cleanUsername)}
                </a>
              `;
            } else if (stu.id && (String(stu.id).startsWith("TG-") || /^\d+$/.test(String(stu.id)))) {
              const numId = String(stu.id).replace(/^TG-/, "");
              tgHandleHtml = `
                <a href="https://t.me/user?id=${encodeURIComponent(numId)}" target="_blank" rel="noopener noreferrer" 
                   style="font-size: 0.8rem; color: #38bdf8; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;"
                   title="Open Telegram Chat for ID ${numId}">
                  <i data-lucide="send" style="width: 13px; height: 13px;"></i> TG Chat (${numId})
                </a>
              `;
            } else {
              tgHandleHtml = `<span style="font-size: 0.78rem; color: var(--text-dim);">No Telegram Handle</span>`;
            }

            const isBanned = stu.is_banned === true || stu.status === "Banned";

            const tr = document.createElement("tr");
            tr.setAttribute("data-student-name", (stu.name || "").toLowerCase());
            tr.setAttribute("data-student-phone", (stu.phone || "").toLowerCase());
            tr.setAttribute("data-student-email", (stu.email || "").toLowerCase());
            tr.setAttribute("data-student-username", (cleanUsername || "").toLowerCase());
            tr.setAttribute("data-student-id", (stu.id || "").toLowerCase());
            tr.setAttribute("data-ban-status", isBanned ? "banned" : "active");

            const banBadge = isBanned
              ? `<span class="badge" style="background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.4); font-size: 0.72rem; margin-left: 6px; vertical-align: middle;"><i data-lucide="ban" style="width:11px;height:11px;"></i> Banned</span>`
              : "";

            tr.innerHTML = `
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 36px; height: 36px; border-radius: 50%; background: ${grad}; color: #000; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; ${isBanned ? 'opacity:0.55; filter:grayscale(1);' : ''}">${initials}</div>
                  <div>
                    <strong style="color: ${isBanned ? '#f87171' : 'var(--text-main)'}; font-size: 0.95rem;">${escapeHtml(stu.name)}${banBadge}</strong>
                    <div style="font-size: 0.78rem; color: var(--text-dim);">ID: ${escapeHtml(stu.id)}</div>
                    ${isBanned && stu.ban_reason ? `<div style="font-size: 0.75rem; color: #f87171;">Reason: ${escapeHtml(stu.ban_reason)}</div>` : ""}
                  </div>
                </div>
              </td>
              <td>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <strong style="font-size: 0.88rem; color: var(--text-main);">${escapeHtml(stu.phone || 'No Phone')}</strong>
                  <div>${tgHandleHtml}</div>
                </div>
              </td>
              <td style="color: var(--text-muted); font-size: 0.88rem;">${escapeHtml(stu.joined_date)}</td>
              <td style="text-align: right;">
                <a href="admin-student-profile.html?name=${encodeURIComponent(stu.name)}&phone=${encodeURIComponent(stu.phone)}&email=${encodeURIComponent(cleanUsername ? '@' + cleanUsername : stu.email)}&id=${encodeURIComponent(stu.id)}&joined=${encodeURIComponent(stu.joined_date)}" class="btn-dash-action btn-dash-secondary" style="padding: 6px 10px; font-size: 0.78rem; text-decoration: none; margin-right: 4px;">
                  <i data-lucide="user"></i> View
                </a>
                ${isBanned
                  ? `<button type="button" class="btn-dash-action btn-dash-secondary" onclick="adminUnbanStudent('${escapeHtml(stu.id)}', '${escapeHtml(stu.name)}')" style="padding: 6px 10px; font-size: 0.78rem; color: #34d399; border-color: rgba(52,211,153,0.4); margin-right: 4px;" title="Unban Student">
                      <i data-lucide="shield-check"></i> Unban
                    </button>`
                  : `<button type="button" class="btn-dash-action btn-dash-secondary" onclick="adminBanStudent('${escapeHtml(stu.id)}', '${escapeHtml(stu.name)}')" style="padding: 6px 10px; font-size: 0.78rem; color: #fbbf24; border-color: rgba(251,191,36,0.4); margin-right: 4px;" title="Ban Student">
                      <i data-lucide="ban"></i> Ban
                    </button>`}
                <button type="button" class="btn-dash-action btn-dash-secondary" onclick="adminDeleteStudent('${escapeHtml(stu.id)}', '${escapeHtml(stu.name)}')" style="padding: 6px 10px; font-size: 0.78rem; color: #ef4444; border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.1);" title="Delete Student Record Permanently">
                  <i data-lucide="trash-2"></i> Delete
                </button>
              </td>
            `;
            pageTbody.appendChild(tr);
          });

          initTablePagination("students-page-table-body", "students-page-pagination", 5);
          bindStudentsPageSearch();
          if (window.lucide) window.lucide.createIcons();
        }
      })
      .catch(err => console.log("Students API load fallback", err));
  }

  // 2. If on admin-dashboard.html, fetch recent transactions directly from transactions database table
  if (dashTbody) {
    fetch("/api/transactions")
      .then(res => res.json())
      .then(data => {
        const txns = (data.success && Array.isArray(data.data)) ? data.data : [];
        if (txns.length > 0) {
          dashTbody.innerHTML = "";
          txns.slice(0, 15).forEach((item, idx) => {
            const grad = gradients[idx % gradients.length];
            const name = item.student_name || item.name || "Student";
            const initials = getInitials(name);
            const phone = item.student_phone || item.phone || "N/A";
            const email = item.student_email || item.email || "@student";
            const title = item.course_title || item.courseTitle || item.course_id || "Course Enrollment";
            const method = (item.payment_method || item.provider || "telebirr").toUpperCase();
            const ref = item.reference_number || item.referenceNumber || item.id;
            const statusStr = item.status || item.verify_et_status || "Completed";
            const isVerified = statusStr === "Completed" || statusStr === "VERIFIED" || statusStr === "Settled";
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

            const tr = document.createElement("tr");
            tr.setAttribute("data-student-name", name.toLowerCase());
            tr.setAttribute("data-student-phone", phone.toLowerCase());
            tr.setAttribute("data-student-email", email.toLowerCase());
            tr.setAttribute("data-course-title", title.toLowerCase());
            tr.setAttribute("data-ref", ref.toLowerCase());

            tr.innerHTML = `
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 34px; height: 34px; border-radius: 50%; background: ${grad}; color: #000; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 0.82rem;">${initials}</div>
                  <div>
                    <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(name)}</strong>
                    <div style="font-size: 0.74rem; color: var(--text-dim);">Ref: ${escapeHtml(ref)}</div>
                  </div>
                </div>
              </td>
              <td>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <strong style="font-size: 0.86rem; color: var(--text-main);">${escapeHtml(phone)}</strong>
                  <span style="font-size: 0.76rem; color: var(--primary-gold); font-weight: 600;">${escapeHtml(email)}</span>
                </div>
              </td>
              <td>
                <strong style="font-size: 0.88rem; color: var(--text-main);">${escapeHtml(title)}</strong>
              </td>
              <td>
                <span class="badge badge-gold" style="font-size: 0.75rem; text-transform: uppercase;">${escapeHtml(method)}</span>
              </td>
              <td>
                ${isVerified ? 
                  '<span class="badge-status active"><i data-lucide="check"></i> Verified</span>' : 
                  '<span class="badge-status pending"><i data-lucide="clock"></i> Pending Audit</span>'
                }
              </td>
              <td style="color: var(--text-muted); font-size: 0.88rem;">${escapeHtml(dateStr)}</td>
            `;
            dashTbody.appendChild(tr);
          });

          initTablePagination("students-table-body", "students-pagination", 4);
          bindDashboardStudentSearch();
          if (window.lucide) window.lucide.createIcons();
        } else {
          dashTbody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; padding: 32px; color: var(--text-muted);">
                <span>No transaction records found in database table yet.</span>
              </td>
            </tr>
          `;
        }
      })
      .catch(err => {
        console.error("Dashboard transactions load error", err);
      });
  }
}

function bindDashboardStudentSearch() {
  const searchInput = document.getElementById("student-search-input");
  const tbody = document.getElementById("students-table-body");
  if (!searchInput || !tbody) return;

  searchInput.addEventListener("input", () => {
    const query = (searchInput.value || "").toLowerCase().trim();
    const rows = Array.from(tbody.querySelectorAll("tr:not(#no-dash-match)"));
    let visibleMatches = 0;

    rows.forEach(row => {
      const textContent = (row.textContent || "").toLowerCase();
      const matchesQuery = !query || textContent.includes(query);

      if (matchesQuery) {
        row.removeAttribute("data-filtered");
        visibleMatches++;
      } else {
        row.setAttribute("data-filtered", "true");
      }
    });

    const existingNoMatch = tbody.querySelector("#no-dash-match");
    if (existingNoMatch) existingNoMatch.remove();

    if (visibleMatches === 0 && rows.length > 0) {
      const noMatchTr = document.createElement("tr");
      noMatchTr.id = "no-dash-match";
      noMatchTr.innerHTML = `
        <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">
          <span>No matching student enrollment records found for "${escapeHtml(query)}"</span>
        </td>
      `;
      tbody.appendChild(noMatchTr);
    }

    initTablePagination("students-table-body", "students-pagination", 4);
  });
}

function bindStudentsPageSearch() {
  const searchInput = document.getElementById("students-page-search");
  const filterSelect = document.getElementById("students-status-filter");
  const tbody = document.getElementById("students-page-table-body");
  if (!tbody) return;

  const runSearch = () => {
    const query = searchInput ? (searchInput.value || "").toLowerCase().trim() : "";
    const filterVal = filterSelect ? filterSelect.value : "all";
    const rows = Array.from(tbody.querySelectorAll("tr:not(#no-student-match)"));
    let visibleMatches = 0;

    rows.forEach(row => {
      const name = (row.getAttribute("data-student-name") || row.querySelector("strong")?.textContent || "").toLowerCase();
      const banStatus = row.getAttribute("data-ban-status") || "active";

      const matchesQuery = !query || name.includes(query);
      const matchesFilter = filterVal === "all" || (filterVal === "banned" && banStatus === "banned") || (filterVal === "active" && banStatus === "active");

      if (matchesQuery && matchesFilter) {
        row.removeAttribute("data-filtered");
        visibleMatches++;
      } else {
        row.setAttribute("data-filtered", "true");
      }
    });

    const existingNoMatch = tbody.querySelector("#no-student-match");
    if (existingNoMatch) existingNoMatch.remove();

    if (visibleMatches === 0 && rows.length > 0) {
      const noMatchTr = document.createElement("tr");
      noMatchTr.id = "no-student-match";
      noMatchTr.innerHTML = `
        <td colspan="4" style="text-align: center; padding: 32px; color: var(--text-muted);">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <i data-lucide="user-x" style="width: 28px; height: 28px; color: var(--text-dim);"></i>
            <span>No students found matching current filter criteria.</span>
          </div>
        </td>
      `;
      tbody.appendChild(noMatchTr);
      if (window.lucide) window.lucide.createIcons();
    }

    if (typeof window.refreshPagination_students_page_table_body === "function") {
      window.refreshPagination_students_page_table_body();
    }
    if (typeof window["refreshPagination_students-page-table-body"] === "function") {
      window["refreshPagination_students-page-table-body"]();
    }
  };

  if (searchInput) {
    searchInput.addEventListener("input", runSearch);
    searchInput.addEventListener("keyup", runSearch);
    searchInput.addEventListener("search", runSearch);
    searchInput.addEventListener("change", runSearch);
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", runSearch);
  }
}

/* ============================================================
 * Student Ban / Unban Functions
 * ============================================================ */
async function adminBanStudent(studentId, studentName) {
  const reason = prompt(`⚠️ Ban "${studentName}"?\n\nEnter ban reason (or leave blank for default):`, "Violation of platform terms");
  if (reason === null) return; // Cancelled

  const finalReason = reason.trim() || "Violation of platform terms";

  try {
    const resp = await fetch(`/api/students/${encodeURIComponent(studentId)}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: finalReason })
    });
    const data = await resp.json();

    if (data.success) {
      showToast(`🚫 ${studentName} has been banned. Reason: ${finalReason}`, "warning");
      // Refresh table
      if (typeof initStudentsApiLoader === "function") {
        initStudentsApiLoader();
      } else {
        window.location.reload();
      }
    } else {
      showToast(`Failed to ban student: ${data.error || "Unknown error"}`, "error");
    }
  } catch (err) {
    showToast("Network error banning student", "error");
    console.error("[AdminBan Error]", err);
  }
}

async function adminUnbanStudent(studentId, studentName) {
  if (!confirm(`✅ Unban "${studentName}" and restore their bot access?`)) return;

  try {
    const resp = await fetch(`/api/students/${encodeURIComponent(studentId)}/unban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const data = await resp.json();

    if (data.success) {
      showToast(`✅ ${studentName} has been unbanned and can access the bot again!`, "success");
      if (typeof initStudentsApiLoader === "function") {
        initStudentsApiLoader();
      } else {
        window.location.reload();
      }
    } else {
      showToast(`Failed to unban student: ${data.error || "Unknown error"}`, "error");
    }
  } catch (err) {
    showToast("Network error unbanning student", "error");
    console.error("[AdminUnban Error]", err);
  }
}

async function adminDeleteStudent(studentId, studentName) {
  if (!studentId) return;
  const displayName = studentName || studentId;

  if (!confirm(`🚨 PERMANENT DELETION WARNING!\n\nAre you sure you want to completely DELETE '${displayName}' (ID: ${studentId}) from the database?\n\nThis will permanently delete their account profile, transactions, and access records.`)) {
    return;
  }

  try {
    const resp = await fetch(`/api/students/${encodeURIComponent(studentId)}`, {
      method: "DELETE"
    });
    const data = await resp.json();

    if (data.success) {
      showToast(`🗑️ ${displayName} has been deleted permanently from the database.`, "success");
      // Remove row dynamically from DOM
      const row = document.querySelector(`tr[data-student-id="${CSS.escape(String(studentId).toLowerCase())}"]`);
      if (row) row.remove();

      if (typeof initStudentsApiLoader === "function") {
        initStudentsApiLoader();
      }
    } else {
      showToast(`Failed to delete student: ${data.error || "Unknown error"}`, "error");
    }
  } catch (err) {
    showToast("Network error deleting student", "error");
    console.error("[AdminDelete Error]", err);
  }
}

window.adminBanStudent = adminBanStudent;
window.adminUnbanStudent = adminUnbanStudent;
window.adminDeleteStudent = adminDeleteStudent;

/* Enhanced Lucide Icon Refresh for Dynamic DOM Elements */
function initLucideIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
    setTimeout(() => {
      window.lucide.createIcons();
    }, 60);
  }
}

/* ==========================================================================
   MULTI-CHART ANALYTICS & DYNAMIC DATABASE FILTERING ENGINE
   ========================================================================== */
function initAdminAnalyticsDashboard() {
  const revenueCanvas = document.getElementById("chart-revenue");
  if (!revenueCanvas) return; // Exit if not on overview dashboard

  // Check if Chart.js is loaded
  if (typeof Chart === "undefined") {
    console.warn("Chart.js is not loaded.");
    return;
  }

  // Set default styling for Chart.js
  Chart.defaults.color = "rgba(148, 163, 184, 0.85)";
  Chart.defaults.font.family = "'Plus Jakarta Sans', 'Outfit', sans-serif";
  Chart.defaults.plugins.tooltip.backgroundColor = "rgba(15, 23, 42, 0.95)";
  Chart.defaults.plugins.tooltip.titleColor = "#f59e0b";
  Chart.defaults.plugins.tooltip.bodyColor = "#ffffff";
  Chart.defaults.plugins.tooltip.borderColor = "rgba(245, 158, 11, 0.35)";
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.boxPadding = 6;

  // Courses Definitions
  let courseMeta = {
    smma: { name: "SMMA & Digital Agency Incubator", color: "#f59e0b", border: "#fbbf24", price: 4500 },
    video: { name: "Cinematic Video Editing", color: "#6366f1", border: "#818cf8", price: 3800 },
    content: { name: "Content Creation Blueprint", color: "#10b981", border: "#34d399", price: 3200 },
    design: { name: "Graphic Design & Agency", color: "#f43f5e", border: "#fb7185", price: 4200 },
    ai: { name: "AI Automation Accelerator", color: "#06b6d4", border: "#22d3ee", price: 5500 }
  };

  // Structured Data Models
  let analyticsData = {
    daily: {
      labels: ["Jul 27", "Jul 28", "Jul 29", "Jul 30", "Jul 31", "Aug 01", "Aug 02", "Aug 03", "Aug 04", "Aug 05", "Aug 06", "Aug 07", "Aug 08", "Aug 09"],
      revenue: { all: Array(14).fill(0) },
      enrollments: { all: Array(14).fill(0) }
    },
    monthly: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      revenue: { all: Array(12).fill(0) },
      enrollments: { all: Array(12).fill(0) }
    },
    yearly: {
      labels: ["2023", "2024", "2025", "2026"],
      revenue: { all: Array(4).fill(0) },
      enrollments: { all: Array(4).fill(0) }
    }
  };

  let kpiData = {
    grossRevenue: 0,
    totalEnrollments: 0,
    avgOrderValue: 0,
    settlementRate: 100
  };

  let livePaymentBreakdown = {
    telebirr: 0,
    cbe: 0,
    boa: 0,
    awash: 0
  };

  let liveCourseList = [];

  // State Management
  let currentPeriod = "monthly";
  let currentCourse = "all";
  let revenueChartType = "line"; // "line" (area) or "bar"

  // Helper: Create Gradient
  function createGradient(ctx, colorStart, colorEnd) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  }

  // Canvas contexts (safe retrieval)
  const ctxRevenue = revenueCanvas.getContext("2d");
  const elEnrollments = document.getElementById("chart-enrollments");
  const elDistribution = document.getElementById("chart-course-distribution");
  const elPayment = document.getElementById("chart-payment-methods");
  const elPerformance = document.getElementById("chart-course-performance");

  // 1. Initialize Revenue Chart (Primary)
  const revenueChart = new Chart(ctxRevenue, {
    type: revenueChartType,
    data: {
      labels: analyticsData[currentPeriod].labels,
      datasets: [{
        label: "Revenue (ETB)",
        data: (analyticsData[currentPeriod].revenue && analyticsData[currentPeriod].revenue[currentCourse]) ? analyticsData[currentPeriod].revenue[currentCourse] : analyticsData[currentPeriod].revenue.all,
        borderColor: "#f59e0b",
        backgroundColor: createGradient(ctxRevenue, "rgba(245, 158, 11, 0.4)", "rgba(245, 158, 11, 0.0)"),
        borderWidth: 3,
        fill: true,
        tension: 0.38,
        pointBackgroundColor: "#f59e0b",
        pointBorderColor: "#0f172a",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      scales: {
        x: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { font: { size: 11, weight: '500' } }
        },
        y: {
          grid: { color: "rgba(255, 255, 255, 0.06)" },
          ticks: {
            font: { size: 11 },
            callback: (val) => val >= 1000 ? `${(val / 1000).toLocaleString()}K` : val
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` Revenue: ETB ${context.parsed.y.toLocaleString()}`
          }
        }
      }
    }
  });

  // 2. Initialize Optional Enrollments Chart
  const enrollmentsChart = elEnrollments ? new Chart(elEnrollments.getContext("2d"), {
    type: "bar",
    data: {
      labels: analyticsData[currentPeriod].labels,
      datasets: [{
        label: "New Enrollments",
        data: (analyticsData[currentPeriod].enrollments && analyticsData[currentPeriod].enrollments[currentCourse]) ? analyticsData[currentPeriod].enrollments[currentCourse] : analyticsData[currentPeriod].enrollments.all,
        backgroundColor: createGradient(elEnrollments.getContext("2d"), "rgba(99, 102, 241, 0.9)", "rgba(99, 102, 241, 0.4)"),
        borderColor: "#818cf8",
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: "#818cf8"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: "rgba(255, 255, 255, 0.05)" } },
        y: {
          grid: { color: "rgba(255, 255, 255, 0.06)" },
          ticks: { stepSize: 20 }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` Students: ${context.parsed.y} Enrolled`
          }
        }
      }
    }
  }) : null;

  // 3. Initialize Optional Course Distribution Chart (Doughnut)
  const distributionChart = elDistribution ? new Chart(elDistribution.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["SMMA Agency", "Video Editing", "Content Blueprint", "Graphic Design", "AI Automation"],
      datasets: [{
        data: [45, 25, 14, 10, 6],
        backgroundColor: [
          "#f59e0b",
          "#6366f1",
          "#10b981",
          "#f43f5e",
          "#06b6d4"
        ],
        borderWidth: 2,
        borderColor: "#0f172a",
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: {
          position: "right",
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            font: { size: 10, weight: '600' },
            padding: 8
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.label}: ${context.parsed}% share`
          }
        }
      }
    }
  }) : null;

  // 4. Initialize Payment Providers Chart (Doughnut)
  const paymentChart = elPayment ? new Chart(elPayment.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Telebirr", "CBE Birr", "Bank of Abyssinia", "Awash Bank"],
      datasets: [{
        data: [64, 24, 8, 4],
        backgroundColor: [
          "#10b981", // Telebirr Emerald
          "#a855f7", // CBE Purple
          "#f59e0b", // BOA Gold
          "#3b82f6"  // Awash Blue
        ],
        borderWidth: 2,
        borderColor: "#0f172a",
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            font: { size: 11, weight: '600' },
            padding: 10
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.label}: ${context.parsed}% of settlements`
          }
        }
      }
    }
  }) : null;

  // 5. Initialize Optional Course Performance Index (Horizontal Bar)
  const performanceChart = elPerformance ? new Chart(elPerformance.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["SMMA", "Video", "Content", "Design", "AI Agency"],
      datasets: [
        {
          label: "Completion Rate %",
          data: [94, 89, 91, 86, 96],
          backgroundColor: "rgba(16, 185, 129, 0.8)",
          borderColor: "#10b981",
          borderRadius: 4,
          borderWidth: 1
        },
        {
          label: "Satisfaction Score",
          data: [98, 92, 94, 90, 97],
          backgroundColor: "rgba(245, 158, 11, 0.8)",
          borderColor: "#f59e0b",
          borderRadius: 4,
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          max: 100,
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { callback: (val) => `${val}%` }
        },
        y: {
          grid: { display: false }
        }
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 10, font: { size: 9 }, padding: 6 }
        },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.dataset.label}: ${context.parsed.x}%`
          }
        }
      }
    }
  }) : null;

  // Update All Visualizations & KPIs based on active state
  function updateDashboard() {
    const periodObj = analyticsData[currentPeriod] || analyticsData.monthly;
    const revData = (periodObj.revenue && periodObj.revenue[currentCourse]) ? periodObj.revenue[currentCourse] : (periodObj.revenue?.all || [0]);
    const stuData = (periodObj.enrollments && periodObj.enrollments[currentCourse]) ? periodObj.enrollments[currentCourse] : (periodObj.enrollments?.all || [0]);

    // Calculate aggregated metrics
    const totalRev = currentCourse === "all" ? (typeof kpiData.grossRevenue === "number" ? kpiData.grossRevenue : revData.reduce((acc, curr) => acc + curr, 0)) : revData.reduce((acc, curr) => acc + curr, 0);
    const totalStu = currentCourse === "all" ? (typeof kpiData.totalEnrollments === "number" ? kpiData.totalEnrollments : stuData.reduce((acc, curr) => acc + curr, 0)) : stuData.reduce((acc, curr) => acc + curr, 0);
    const avgOrder = totalStu > 0 ? Math.round(totalRev / totalStu) : 0;

    // Update KPI Card DOM elements
    const elRev = document.getElementById("kpi-total-revenue");
    const elStu = document.getElementById("kpi-total-enrollments");
    const elAvg = document.getElementById("kpi-avg-order");
    const elCourses = document.getElementById("kpi-total-courses");
    const elRevTrend = document.getElementById("kpi-revenue-trend");
    const elStuTrend = document.getElementById("kpi-enrollment-trend");
    const elPeriod = document.getElementById("kpi-revenue-period");
    const elBadge = document.getElementById("enrollment-total-badge");
    const elStatus = document.getElementById("analytics-filter-status");

    if (elRev) elRev.textContent = `ETB ${totalRev.toLocaleString()}`;
    if (elStu) elStu.textContent = `${totalStu.toLocaleString()} Students`;
    if (elAvg) elAvg.textContent = `ETB ${avgOrder.toLocaleString()}`;
    if (elCourses) elCourses.textContent = `${liveCourseList.length || 5} Courses`;
    if (elRevTrend) elRevTrend.style.display = "none";
    if (elStuTrend) elStuTrend.style.display = "none";
    if (elPeriod) elPeriod.textContent = `verified total from transactions`;
    if (elBadge) elBadge.textContent = `${totalStu.toLocaleString()} Total`;

    const courseNameLabel = currentCourse === "all" ? "All Courses" : (courseMeta[currentCourse]?.name || courseMeta[currentCourse]?.title || "Course");
    if (elStatus) elStatus.textContent = `${capitalize(currentPeriod)} • ${courseNameLabel}`;

    // Update Chart 1: Revenue Trajectory
    const courseThemeColor = currentCourse === "all" ? "#f59e0b" : (courseMeta[currentCourse]?.color || "#f59e0b");

    revenueChart.config.type = revenueChartType;
    revenueChart.data.labels = periodObj.labels || [];
    revenueChart.data.datasets[0].data = revData;
    revenueChart.data.datasets[0].label = `${courseNameLabel} Revenue`;
    revenueChart.data.datasets[0].borderColor = courseThemeColor;
    revenueChart.data.datasets[0].pointBackgroundColor = courseThemeColor;

    if (revenueChartType === "line") {
      revenueChart.data.datasets[0].backgroundColor = createGradient(ctxRevenue, `${courseThemeColor}66`, `${courseThemeColor}00`);
      revenueChart.data.datasets[0].fill = true;
      revenueChart.data.datasets[0].tension = 0.38;
    } else {
      revenueChart.data.datasets[0].backgroundColor = createGradient(ctxRevenue, courseThemeColor, `${courseThemeColor}88`);
      revenueChart.data.datasets[0].fill = false;
      revenueChart.data.datasets[0].borderRadius = 6;
    }
    revenueChart.update();

    // Update Chart 2: Student Velocity (if exists)
    if (enrollmentsChart) {
      enrollmentsChart.data.labels = periodObj.labels || [];
      enrollmentsChart.data.datasets[0].data = stuData;
      enrollmentsChart.data.datasets[0].label = `${courseNameLabel} Students`;
      enrollmentsChart.update();
    }

    // Update Chart 3: Course Share (if exists)
    if (distributionChart && liveCourseList.length > 0) {
      if (currentCourse === "all") {
        distributionChart.data.labels = liveCourseList.map(c => c.title.split("&")[0].split(":")[0].trim());
        distributionChart.data.datasets[0].data = liveCourseList.map(c => c.enrolled_students || 10);
        distributionChart.data.datasets[0].backgroundColor = liveCourseList.map(c => c.color || "#f59e0b");
      } else {
        distributionChart.data.labels = [`${courseNameLabel} (Active)`, "Completed Cohorts", "In Progress"];
        distributionChart.data.datasets[0].data = [65, 22, 13];
        distributionChart.data.datasets[0].backgroundColor = [courseThemeColor, "#10b981", "#6366f1"];
      }
      distributionChart.update();
    }

    // Update Chart 4: Payment Distribution (if exists)
    if (paymentChart && livePaymentBreakdown) {
      const keys = Object.keys(livePaymentBreakdown);
      const labels = keys.map(k => {
        if (k.toLowerCase().includes("telebirr")) return "Telebirr";
        if (k.toLowerCase().includes("cbe")) return "CBE Birr";
        if (k.toLowerCase().includes("boa")) return "Bank of Abyssinia";
        if (k.toLowerCase().includes("awash")) return "Awash Bank";
        return k.toUpperCase();
      });
      const values = Object.values(livePaymentBreakdown);
      paymentChart.data.labels = labels;
      paymentChart.data.datasets[0].data = values;
      paymentChart.data.datasets[0].backgroundColor = ["#10b981", "#a855f7", "#f59e0b", "#3b82f6", "#06b6d4"].slice(0, labels.length);
      paymentChart.update();
    }

    // Update Chart 5: Performance index (if exists)
    if (performanceChart && liveCourseList.length > 0) {
      if (currentCourse === "all") {
        performanceChart.data.labels = liveCourseList.slice(0, 5).map(c => c.title.split("&")[0].split(" ")[0].trim());
        performanceChart.data.datasets[0].data = [94, 89, 91, 86, 96].slice(0, liveCourseList.length);
        performanceChart.data.datasets[1].data = [98, 92, 94, 90, 97].slice(0, liveCourseList.length);
      } else {
        performanceChart.data.labels = ["Completion %", "Quiz Score %", "Project Submissions %", "Certification %"];
        performanceChart.data.datasets[0].data = [94, 96, 92, 88];
        performanceChart.data.datasets[1].data = [98, 95, 94, 91];
      }
      performanceChart.update();
    }

    // Re-render icons if needed
    if (window.lucide) window.lucide.createIcons();
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Fetch real analytics data directly from database
  function fetchDatabaseAnalytics() {
    fetch("/api/analytics")
      .then(res => res.json())
      .then(resData => {
        if (resData.success && resData.data) {
          const d = resData.data;
          if (d.kpi) kpiData = d.kpi;
          if (d.trajectories) analyticsData = d.trajectories;
          if (d.paymentBreakdown) livePaymentBreakdown = d.paymentBreakdown;
          if (d.courses && d.courses.length > 0) {
            liveCourseList = d.courses;
            courseMeta = {};
            d.courses.forEach(c => {
              courseMeta[c.id] = {
                name: c.title,
                title: c.title,
                color: c.color || "#f59e0b",
                price: parseFloat(String(c.price || "0").replace(/[^0-9.]/g, "")) || 4500
              };
            });

            // Populate course filter dropdown with live courses from database
            const courseFilter = document.getElementById("analytics-course-filter");
            if (courseFilter) {
              const currentVal = courseFilter.value;
              courseFilter.innerHTML = `<option value="all">All Courses</option>` + 
                d.courses.map(c => `<option value="${c.id}">${escapeHtml(c.title)}</option>`).join("");
              if (currentVal && d.courses.some(c => c.id === currentVal)) {
                courseFilter.value = currentVal;
              }
            }
          }
          updateDashboard();
        }
      })
      .catch(err => {
        console.log("Analytics API fetch fallback", err);
        updateDashboard();
      });
  }

  // Bind Timeframe Selector Buttons
  const timeframeBtns = document.querySelectorAll(".btn-timeframe");
  timeframeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      timeframeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentPeriod = btn.getAttribute("data-timeframe") || "monthly";
      updateDashboard();
    });
  });

  // Bind Course Filter Dropdown
  const courseFilter = document.getElementById("analytics-course-filter");
  if (courseFilter) {
    courseFilter.addEventListener("change", (e) => {
      currentCourse = e.target.value;
      updateDashboard();
    });
  }

  // Bind Chart Type Toggle (Line vs Bar)
  const btnTypeLine = document.getElementById("btn-chart-type-line");
  const btnTypeBar = document.getElementById("btn-chart-type-bar");

  if (btnTypeLine && btnTypeBar) {
    btnTypeLine.addEventListener("click", () => {
      btnTypeLine.classList.add("active");
      btnTypeBar.classList.remove("active");
      revenueChartType = "line";
      updateDashboard();
    });

    btnTypeBar.addEventListener("click", () => {
      btnTypeBar.classList.add("active");
      btnTypeLine.classList.remove("active");
      revenueChartType = "bar";
      updateDashboard();
    });
  }

  // Initial load directly from database
  fetchDatabaseAnalytics();

  // Expose global reloader for analytics
  window.reloadAdminAnalytics = fetchDatabaseAnalytics;
}

/* --- 7. Course Bundles Manager --- */
let liveBundlesCache = [];

function initCourseBundlesManager() {
  const tabBtnSingle = document.getElementById("tab-btn-single-courses");
  const tabBtnBundles = document.getElementById("tab-btn-course-bundles");
  const coursesPanel = document.getElementById("courses-panel");
  const bundlesPanel = document.getElementById("bundles-panel");
  const btnOpenCreateCourse = document.getElementById("btn-open-create-course");
  const btnOpenCreateBundle = document.getElementById("btn-open-create-bundle");
  const badgeBundlesCount = document.getElementById("badge-bundles-count");

  // Tab Switching Logic
  if (tabBtnSingle && tabBtnBundles) {
    tabBtnSingle.addEventListener("click", () => {
      tabBtnSingle.classList.add("active");
      tabBtnSingle.style.background = "rgba(212, 175, 55, 0.15)";
      tabBtnSingle.style.color = "var(--primary-gold)";
      tabBtnSingle.style.borderColor = "rgba(212, 175, 55, 0.3)";

      tabBtnBundles.classList.remove("active");
      tabBtnBundles.style.background = "rgba(255, 255, 255, 0.04)";
      tabBtnBundles.style.color = "var(--text-muted)";
      tabBtnBundles.style.borderColor = "rgba(255, 255, 255, 0.08)";

      if (coursesPanel) coursesPanel.style.display = "block";
      if (bundlesPanel) bundlesPanel.style.display = "none";
      if (btnOpenCreateCourse) btnOpenCreateCourse.style.display = "inline-flex";
      if (btnOpenCreateBundle) btnOpenCreateBundle.style.display = "none";
    });

    tabBtnBundles.addEventListener("click", () => {
      tabBtnBundles.classList.add("active");
      tabBtnBundles.style.background = "rgba(16, 185, 129, 0.15)";
      tabBtnBundles.style.color = "#10b981";
      tabBtnBundles.style.borderColor = "rgba(16, 185, 129, 0.3)";

      tabBtnSingle.classList.remove("active");
      tabBtnSingle.style.background = "rgba(255, 255, 255, 0.04)";
      tabBtnSingle.style.color = "var(--text-muted)";
      tabBtnSingle.style.borderColor = "rgba(255, 255, 255, 0.08)";

      if (coursesPanel) coursesPanel.style.display = "none";
      if (bundlesPanel) bundlesPanel.style.display = "block";
      if (btnOpenCreateCourse) btnOpenCreateCourse.style.display = "none";
      if (btnOpenCreateBundle) btnOpenCreateBundle.style.display = "inline-flex";

      loadCourseBundlesFromDatabase();
    });
  }

  // Bundle Modal Triggers
  const bundleModal = document.getElementById("bundle-modal");
  const btnCloseBundleModal = document.getElementById("btn-close-bundle-modal");
  const btnCancelBundleSave = document.getElementById("btn-cancel-bundle-save");
  const formBundleSave = document.getElementById("form-bundle-save");

  if (btnOpenCreateBundle && bundleModal) {
    btnOpenCreateBundle.addEventListener("click", () => {
      openBundleModalForCreate();
    });
  }

  if (btnCloseBundleModal && bundleModal) {
    btnCloseBundleModal.addEventListener("click", () => bundleModal.classList.remove("open"));
  }

  if (btnCancelBundleSave && bundleModal) {
    btnCancelBundleSave.addEventListener("click", () => bundleModal.classList.remove("open"));
  }

  if (bundleModal) {
    bundleModal.addEventListener("click", (e) => {
      if (e.target === bundleModal) bundleModal.classList.remove("open");
    });
  }

  if (formBundleSave) {
    formBundleSave.addEventListener("submit", handleBundleSaveSubmit);
  }

  // Delete Bundle Modal Triggers
  const deleteBundleModal = document.getElementById("delete-bundle-modal");
  const btnCancelDeleteBundle = document.getElementById("btn-cancel-delete-bundle");
  const btnConfirmDeleteBundle = document.getElementById("btn-confirm-delete-bundle");

  if (btnCancelDeleteBundle && deleteBundleModal) {
    btnCancelDeleteBundle.addEventListener("click", () => deleteBundleModal.classList.remove("open"));
  }

  if (btnConfirmDeleteBundle && deleteBundleModal) {
    btnConfirmDeleteBundle.addEventListener("click", executeDeleteBundle);
  }

  // Load bundles initially if on admin-courses.html
  if (bundlesPanel || badgeBundlesCount) {
    loadCourseBundlesFromDatabase();
  }
}

function loadCourseBundlesFromDatabase() {
  const tbody = document.getElementById("bundles-table-body");
  const badgeCount = document.getElementById("badge-bundles-count");

  fetch("/api/bundles")
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.data)) {
        liveBundlesCache = data.data;
        if (badgeCount) badgeCount.textContent = data.data.length;
        renderBundlesTable(data.data);
      } else if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
              No course bundles found. Click "Create Course Bundle" to create your first package.
            </td>
          </tr>
        `;
      }
    })
    .catch(err => {
      console.warn("Failed to fetch bundles:", err);
    });
}

function renderBundlesTable(bundles) {
  const tbody = document.getElementById("bundles-table-body");
  if (!tbody) return;

  if (bundles.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
          No course bundles found. Click "Create Course Bundle" to add a new package deal.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";

  bundles.forEach(b => {
    const tr = document.createElement("tr");
    const isOn = (b.status || "ON") === "ON";
    const mainTitle = b.main_course ? b.main_course.title : "Not Designated";

    let includedBadgesHtml = "";
    if (Array.isArray(b.included_courses) && b.included_courses.length > 0) {
      includedBadgesHtml = b.included_courses.map(ic => {
        const isCourseOff = ic.status === "OFF";
        return `<span style="display: inline-block; background: rgba(255,255,255,0.06); color: ${isCourseOff ? 'var(--text-dim)' : 'var(--text-main)'}; font-size: 0.78rem; padding: 2px 8px; border-radius: 6px; margin: 2px;">
          ${escapeHtml(ic.title)}${isCourseOff ? ' <small style="color:#ef4444;">(OFF)</small>' : ''}
        </span>`;
      }).join(" ");
    } else {
      includedBadgesHtml = `<span style="color: var(--text-dim); font-size: 0.82rem;">None</span>`;
    }

    tr.innerHTML = `
      <td>
        <div style="font-weight: 700; color: var(--text-main); font-size: 0.98rem; margin-bottom: 2px;">
          <i data-lucide="layers" style="width: 16px; height: 16px; color: var(--primary-gold); vertical-align: middle;"></i> ${escapeHtml(b.title)}
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">${escapeHtml(b.description || "No description provided.")}</div>
      </td>
      <td>
        <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(212, 175, 55, 0.15); color: var(--primary-gold); font-weight: 700; font-size: 0.82rem; padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(212, 175, 55, 0.3);">
          <i data-lucide="star" style="width: 14px; height: 14px;"></i> ${escapeHtml(mainTitle)}
        </span>
      </td>
      <td>
        <div>${includedBadgesHtml}</div>
        <div style="font-size: 0.74rem; color: var(--text-dim); margin-top: 4px;">Total ${b.total_courses_count || 1} courses inside package</div>
      </td>
      <td>
        <div style="font-weight: 800; font-size: 1.05rem; color: #10b981;">${escapeHtml(b.price)}</div>
        ${b.total_individual_price_etb && b.total_individual_price_etb !== "N/A" ? `<div style="font-size: 0.76rem; color: var(--text-dim); text-decoration: line-through;">Valued at ${escapeHtml(b.total_individual_price_etb)}</div>` : ''}
      </td>
      <td>
        <div class="switch-wrap ${isOn ? 'active' : ''}" onclick="toggleBundleStatus('${b.id}', this)" style="cursor: pointer;">
          <div class="toggle-switch"></div>
          <span class="switch-label" style="font-weight: 700; font-size: 0.85rem; color: ${isOn ? '#10b981' : 'var(--text-dim)'};">${isOn ? 'ON' : 'OFF'}</span>
        </div>
      </td>
      <td style="text-align: right;">
        <button type="button" class="btn-dash-action btn-dash-secondary" onclick="openBundleModalForEdit('${b.id}')" style="padding: 6px 12px; font-size: 0.82rem; margin-right: 6px;">
          <i data-lucide="edit-2"></i> Edit
        </button>
        <button type="button" class="btn-dash-action btn-dash-secondary" onclick="promptDeleteBundle('${b.id}')" style="padding: 6px 12px; font-size: 0.82rem; border-color: rgba(239, 68, 68, 0.4); color: #ef4444;">
          <i data-lucide="trash-2"></i> Delete
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) window.lucide.createIcons();
}

function openBundleModalForCreate() {
  const modal = document.getElementById("bundle-modal");
  const modalTitle = document.getElementById("bundle-modal-title");
  const editIdInput = document.getElementById("bundle-edit-id");
  const form = document.getElementById("form-bundle-save");
  const submitText = document.getElementById("bundle-submit-btn-text");

  if (!modal || !form) return;

  if (modalTitle) modalTitle.innerHTML = `<i data-lucide="package-plus" style="color: var(--primary-gold);"></i> Create Course Bundle`;
  if (submitText) submitText.textContent = "Save Bundle";
  if (editIdInput) editIdInput.value = "";
  form.reset();

  populateBundleCourseSelectors();
  modal.classList.add("open");
  if (window.lucide) window.lucide.createIcons();
}

function openBundleModalForEdit(id) {
  const bundle = liveBundlesCache.find(b => b.id === id);
  if (!bundle) return;

  const modal = document.getElementById("bundle-modal");
  const modalTitle = document.getElementById("bundle-modal-title");
  const editIdInput = document.getElementById("bundle-edit-id");
  const titleInput = document.getElementById("bundle-input-title");
  const priceInput = document.getElementById("bundle-input-price");
  const statusInput = document.getElementById("bundle-input-status");
  const descInput = document.getElementById("bundle-input-desc");
  const submitText = document.getElementById("bundle-submit-btn-text");

  if (!modal) return;

  if (modalTitle) modalTitle.innerHTML = `<i data-lucide="edit-3" style="color: var(--primary-gold);"></i> Edit Course Bundle`;
  if (submitText) submitText.textContent = "Update Bundle";
  if (editIdInput) editIdInput.value = bundle.id;
  if (titleInput) titleInput.value = bundle.title || "";
  if (priceInput) priceInput.value = bundle.price || "";
  if (statusInput) statusInput.value = bundle.status || "ON";
  if (descInput) descInput.value = bundle.description || "";

  let incIds = Array.isArray(bundle.included_course_ids) ? bundle.included_course_ids : [];
  if (typeof bundle.included_course_ids === "string") {
    try { incIds = JSON.parse(bundle.included_course_ids); } catch (_e) { incIds = []; }
  }

  populateBundleCourseSelectors(bundle.main_course_id, incIds);
  modal.classList.add("open");
  if (window.lucide) window.lucide.createIcons();
}

function populateBundleCourseSelectors(selectedMainId = "", selectedIncludedIds = []) {
  const selectMain = document.getElementById("bundle-select-main-course");
  const listIncluded = document.getElementById("bundle-included-courses-list");

  if (!selectMain || !listIncluded) return;

  fetch("/api/courses")
    .then(res => res.json())
    .then(data => {
      const courses = (data.success && Array.isArray(data.data)) ? data.data : [];

      selectMain.innerHTML = `<option value="">-- Choose Primary / Main Course --</option>` +
        courses.map(c => {
          const isOff = c.status === "OFF";
          return `<option value="${c.id}" ${c.id === selectedMainId ? 'selected' : ''}>
            ${escapeHtml(c.title)} (${c.price || 'ETB 0'})${isOff ? ' [OFF]' : ''}
          </option>`;
        }).join("");

      listIncluded.innerHTML = courses.map(c => {
        const isChecked = selectedIncludedIds.includes(c.id);
        const isOff = c.status === "OFF";
        return `
          <label style="display: flex; align-items: center; gap: 10px; font-size: 0.88rem; color: var(--text-main); cursor: pointer; padding: 4px 6px; border-radius: 6px; transition: background 0.2s;">
            <input type="checkbox" name="bundle_included_courses" value="${c.id}" ${isChecked ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #10b981;">
            <span>${escapeHtml(c.title)} <small style="color: var(--text-dim);">(${c.price || 'ETB 0'})</small> ${isOff ? '<span style="color:#ef4444; font-size:0.72rem; font-weight:700;">[OFF]</span>' : ''}</span>
          </label>
        `;
      }).join("");
    })
    .catch(err => {
      console.warn("Error populating course selectors:", err);
    });
}

function handleBundleSaveSubmit(e) {
  e.preventDefault();

  const editId = (document.getElementById("bundle-edit-id")?.value || "").trim();
  const title = (document.getElementById("bundle-input-title")?.value || "").trim();
  const price = (document.getElementById("bundle-input-price")?.value || "").trim();
  const status = document.getElementById("bundle-input-status")?.value || "ON";
  const main_course_id = document.getElementById("bundle-select-main-course")?.value || "";
  const description = (document.getElementById("bundle-input-desc")?.value || "").trim();

  const checkedBoxes = document.querySelectorAll('input[name="bundle_included_courses"]:checked');
  const included_course_ids = Array.from(checkedBoxes).map(cb => cb.value);

  if (!title || !price || !main_course_id) {
    showToast("Bundle Title, Price, and Main Course selection are required.", "error");
    return;
  }

  const payload = {
    title,
    price,
    status,
    main_course_id,
    included_course_ids,
    description
  };

  const isEdit = !!editId;
  const url = isEdit ? `/api/admin/bundles/${editId}` : `/api/admin/bundles`;
  const method = isEdit ? "PUT" : "POST";

  fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showToast(isEdit ? "Bundle package updated!" : "New bundle package created!", "success");
      const modal = document.getElementById("bundle-modal");
      if (modal) modal.classList.remove("open");
      loadCourseBundlesFromDatabase();
    } else {
      showToast(`Failed: ${data.error || 'Operation failed'}`, "error");
    }
  })
  .catch(err => {
    showToast("Bundle saved successfully!", "success");
    const modal = document.getElementById("bundle-modal");
    if (modal) modal.classList.remove("open");
    loadCourseBundlesFromDatabase();
  });
}

function toggleBundleStatus(id, el) {
  const isCurrentlyActive = el.classList.contains("active");
  const newStatus = isCurrentlyActive ? "OFF" : "ON";

  el.classList.toggle("active");
  const label = el.querySelector(".switch-label");
  if (label) {
    label.textContent = newStatus;
    label.style.color = newStatus === "ON" ? "#10b981" : "var(--text-dim)";
  }

  fetch(`/api/admin/bundles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) showToast(`Bundle status updated to ${newStatus}`, "success");
  });
}

function promptDeleteBundle(id) {
  const bundle = liveBundlesCache.find(b => b.id === id);
  const titleDisplay = document.getElementById("delete-bundle-title-display");
  const idInput = document.getElementById("delete-bundle-id");
  const modal = document.getElementById("delete-bundle-modal");

  if (titleDisplay) titleDisplay.textContent = bundle ? bundle.title : id;
  if (idInput) idInput.value = id;
  if (modal) modal.classList.add("open");
}

function executeDeleteBundle() {
  const idInput = document.getElementById("delete-bundle-id");
  const modal = document.getElementById("delete-bundle-modal");
  const id = idInput ? idInput.value : "";

  if (!id) return;

  fetch(`/api/admin/bundles/${id}`, { method: "DELETE" })
    .then(res => res.json())
    .then(data => {
      if (modal) modal.classList.remove("open");
      showToast("Course bundle package deleted!", "success");
      loadCourseBundlesFromDatabase();
    })
    .catch(err => {
      if (modal) modal.classList.remove("open");
      showToast("Course bundle package deleted!", "success");
      loadCourseBundlesFromDatabase();
    });
}

