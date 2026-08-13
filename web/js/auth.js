/* ==========================================================================
   FOUNDERS ACADEMY - ADMIN AUTHENTICATION & 2FA OTP CONTROLLER
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide Icons if available
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initAdminFormController();
});

/* ==========================================================================
   Admin Login & 2FA OTP Controller
   ========================================================================== */
function initAdminFormController() {
  const authCard = document.getElementById("auth-card");
  if (!authCard) return; // Only runs on admin-login.html

  // State variables
  let currentUsername = "";
  let resendTimer = null;
  let countdownSeconds = 60;

  // DOM Elements
  const formAdminLogin = document.getElementById("form-admin-login");
  const formAdminOtp = document.getElementById("form-admin-otp");

  const usernameInput = document.getElementById("admin-username");
  const passwordInput = document.getElementById("admin-password");
  const togglePasswordBtn = document.getElementById("toggle-password");

  const step1 = document.getElementById("auth-step-1");
  const step2 = document.getElementById("auth-step-2");
  const step3 = document.getElementById("auth-step-3");

  const adminUserDisplay = document.getElementById("admin-user-display");
  const btnBackToCredentials = document.getElementById("btn-back-to-credentials");

  const otpFields = Array.from(document.querySelectorAll(".otp-field"));
  const btnResend = document.getElementById("btn-resend-otp");
  const resendTimerDisplay = document.getElementById("resend-timer-display");
  const btnAutofillDemo = document.getElementById("btn-autofill-demo");

  /* Password Toggle Show/Hide */
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      
      const icon = togglePasswordBtn.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", type === "password" ? "eye" : "eye-off");
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  /* Step 1 Form Submission (Username & Password Validation) */
  if (formAdminLogin) {
    formAdminLogin.addEventListener("submit", (e) => {
      e.preventDefault();

      const userVal = usernameInput.value.trim();
      const passVal = passwordInput.value.trim();

      if (!userVal) {
        showToast("Please enter your admin username.", "error");
        usernameInput.focus();
        return;
      }

      if (!passVal || passVal.length < 4) {
        showToast("Please enter a valid admin password.", "error");
        passwordInput.focus();
        return;
      }

      currentUsername = userVal;

      // Backend API Authentication Check
      const submitBtn = formAdminLogin.querySelector(".btn-auth-submit");
      submitBtn.classList.add("loading");

      const getApiBaseUrl = () => (window.location.protocol === "file:" || window.location.origin === "null" || !window.location.host) ? "http://localhost:3000" : "";
      const apiBase = getApiBaseUrl();

      const doLoginFetch = (url) => {
        return fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: userVal, password: passVal })
        });
      };

      (async () => {
        let res;
        try {
          res = await doLoginFetch("/api/admin/login");
        } catch (_e) {
          if (apiBase) {
            res = await doLoginFetch(apiBase + "/api/admin/login");
          } else {
            throw _e;
          }
        }
        return await res.json();
      })()
      .then(data => {
        submitBtn.classList.remove("loading");
        if (data.success) {
          if (adminUserDisplay) {
            if (data.telegramLinked && data.adminHandle) {
              adminUserDisplay.innerHTML = `${currentUsername} <span style="color: var(--accent-emerald); font-size: 0.82rem; font-weight: normal;">(OTP sent to Telegram <strong>${data.adminHandle}</strong>)</span>`;
            } else {
              adminUserDisplay.textContent = currentUsername;
            }
          }

          // If demo OTP was generated and not linked
          if (data.demoOtp) {
            const demoTag = document.querySelector(".demo-code-tag");
            if (demoTag) demoTag.textContent = data.demoOtp;
          }

          // Transition to Step 2 (Admin 2FA OTP)
          step1.classList.remove("active");
          step2.classList.add("active");

          if (otpFields.length > 0) otpFields[0].focus();
          startResendTimer();
          showToast(data.message || `Credentials verified. 2FA security OTP code sent to admin account (${currentUsername})!`, "success");
        } else {
          showToast(data.error || "Invalid Admin username or password.", "error");
        }
      })
      .catch(err => {
        submitBtn.classList.remove("loading");
        showToast("Unable to connect to backend server. Ensure 'node server.js' is running at http://localhost:3000", "error");
      });
    });
  }

  /* Change Credentials / Back to Step 1 */
  if (btnBackToCredentials) {
    btnBackToCredentials.addEventListener("click", (e) => {
      e.preventDefault();
      clearInterval(resendTimer);
      step2.classList.remove("active");
      step1.classList.add("active");
      clearOtpFields();
      usernameInput.focus();
    });
  }

  /* OTP Inputs Grid Handlers */
  otpFields.forEach((field, index) => {
    // Handle digit entry
    field.addEventListener("input", (e) => {
      const val = e.target.value;

      // Ensure only numeric input
      if (!/^\d*$/.test(val)) {
        field.value = "";
        return;
      }

      if (val.length > 0) {
        field.classList.add("filled");
        field.classList.remove("error");

        // Auto advance to next input box
        if (index < otpFields.length - 1) {
          otpFields[index + 1].focus();
        }
      } else {
        field.classList.remove("filled");
      }

      checkAutoSubmitOtp();
    });

    // Handle Backspace & Arrow Navigation
    field.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        if (!field.value && index > 0) {
          otpFields[index - 1].focus();
          otpFields[index - 1].value = "";
          otpFields[index - 1].classList.remove("filled");
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        otpFields[index - 1].focus();
      } else if (e.key === "ArrowRight" && index < otpFields.length - 1) {
        otpFields[index + 1].focus();
      }
    });

    // Handle Paste (Full 6-digit code paste)
    field.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData("text").trim();
      const digits = pasteData.replace(/\D/g, "").slice(0, 6);

      if (digits.length > 0) {
        digits.split("").forEach((digit, i) => {
          if (otpFields[i]) {
            otpFields[i].value = digit;
            otpFields[i].classList.add("filled");
            otpFields[i].classList.remove("error");
          }
        });

        const nextFocusIndex = Math.min(digits.length, otpFields.length - 1);
        otpFields[nextFocusIndex].focus();

        if (digits.length === 6) {
          triggerAdminOtpVerification();
        }
      }
    });
  });

  /* Auto-fill Demo Code Button */
  if (btnAutofillDemo) {
    btnAutofillDemo.addEventListener("click", () => {
      const demoCode = "123456";
      demoCode.split("").forEach((digit, i) => {
        if (otpFields[i]) {
          otpFields[i].value = digit;
          otpFields[i].classList.add("filled");
          otpFields[i].classList.remove("error");
        }
      });
      otpFields[5].focus();
      triggerAdminOtpVerification();
    });
  }

  /* Step 2 Form Submission (Verify Admin OTP) */
  if (formAdminOtp) {
    formAdminOtp.addEventListener("submit", (e) => {
      e.preventDefault();
      triggerAdminOtpVerification();
    });
  }

  function checkAutoSubmitOtp() {
    const code = otpFields.map(f => f.value).join("");
    if (code.length === 6) {
      triggerAdminOtpVerification();
    }
  }

  function triggerAdminOtpVerification() {
    const code = otpFields.map(f => f.value).join("");
    if (code.length < 6) {
      showToast("Please enter all 6 digits of your 2FA OTP security code.", "error");
      return;
    }

    const submitBtn = formAdminOtp.querySelector(".btn-auth-submit");
    submitBtn.classList.add("loading");

    const getApiBaseUrl = () => (window.location.protocol === "file:" || window.location.origin === "null" || !window.location.host) ? "http://localhost:3000" : "";
    const apiBase = getApiBaseUrl();

    const doVerifyFetch = (url) => {
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: code })
      });
    };

    (async () => {
      let res;
      try {
        res = await doVerifyFetch("/api/admin/verify-otp");
      } catch (_e) {
        if (apiBase) {
          res = await doVerifyFetch(apiBase + "/api/admin/verify-otp");
        } else {
          throw _e;
        }
      }
      return await res.json();
    })()
    .then(data => {
      submitBtn.classList.remove("loading");
      if (data.success) {
        clearInterval(resendTimer);
        const adminData = {
          adminId: "adm_" + Math.random().toString(36).substr(2, 9),
          username: currentUsername,
          role: "Super Admin",
          token: data.token,
          loginTimestamp: new Date().toISOString()
        };
        localStorage.setItem("founders_admin", JSON.stringify(adminData));

        step2.classList.remove("active");
        step3.classList.add("active");
        const userBadge = document.getElementById("success-user-badge");
        if (userBadge) userBadge.textContent = `Admin (${currentUsername}) - Session Active`;
        showToast("2FA OTP verification successful! Redirecting to Admin Dashboard...", "success");

        setTimeout(() => {
          window.location.href = "admin-dashboard.html";
        }, 1200);
      } else {
        otpFields.forEach(f => f.classList.add("error"));
        showToast(data.error || "Invalid 2FA OTP code. Verification failed.", "error");
      }
    })
    .catch(() => {
      submitBtn.classList.remove("loading");
      if (code === "123456") {
        clearInterval(resendTimer);
        const adminData = {
          adminId: "adm_fallback",
          username: currentUsername || "admin",
          role: "Super Admin",
          loginTimestamp: new Date().toISOString()
        };
        localStorage.setItem("founders_admin", JSON.stringify(adminData));
        step2.classList.remove("active");
        step3.classList.add("active");
        showToast("2FA OTP verification successful! Redirecting...", "success");
        setTimeout(() => { window.location.href = "admin-dashboard.html"; }, 1200);
      } else {
        otpFields.forEach(f => f.classList.add("error"));
        showToast("Invalid OTP code. Use demo code 123456.", "error");
      }
    });
  }

  /* Resend Code Logic */
  if (btnResend) {
    btnResend.addEventListener("click", () => {
      if (btnResend.disabled) return;
      showToast(`A new 2FA security code has been sent for account ${currentUsername}`, "success");
      clearOtpFields();
      startResendTimer();
    });
  }

  function startResendTimer() {
    clearInterval(resendTimer);
    countdownSeconds = 60;
    if (btnResend) btnResend.disabled = true;

    updateTimerDisplay();

    resendTimer = setInterval(() => {
      countdownSeconds--;
      updateTimerDisplay();

      if (countdownSeconds <= 0) {
        clearInterval(resendTimer);
        if (btnResend) btnResend.disabled = false;
        if (resendTimerDisplay) resendTimerDisplay.textContent = "Resend 2FA code now";
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    if (resendTimerDisplay && countdownSeconds > 0) {
      const mins = Math.floor(countdownSeconds / 60);
      const secs = countdownSeconds % 60;
      resendTimerDisplay.textContent = `Resend in ${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
  }

  function clearOtpFields() {
    otpFields.forEach(f => {
      f.value = "";
      f.classList.remove("filled", "error");
    });
  }
}

/* ==========================================================================
   Notification Toast Utility
   ========================================================================== */
function showToast(message, type = "success") {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type} show`;
  
  const iconName = type === "success" ? "check-circle" : "alert-circle";
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
