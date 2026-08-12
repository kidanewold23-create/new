let savedUsername = "";
let savedPassword = "";

// Form 1 Submit (Credentials Verification & Automated Telegram OTP Send)
document.getElementById("step1Form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const btnStep1 = document.getElementById("btnStep1");
  const errorMsg = document.getElementById("errorMsg");
  
  errorMsg.classList.remove("visible");
  errorMsg.style.display = "none";
  btnStep1.classList.add("loading");
  btnStep1.disabled = true;
  
  try {
    const response = await fetch("/api/login/step1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        password: passwordInput.value.trim()
      })
    });
    
    const data = await response.json();
    
    if (response.ok && (data.success !== false)) {
      savedUsername = usernameInput.value.trim();
      savedPassword = passwordInput.value.trim();
      
      // Switch to Step 2 (2FA OTP verification)
      document.getElementById("step1").classList.remove("active");
      document.getElementById("step2").classList.add("active");
      document.getElementById("formSubtitle").textContent = "Two-Factor Authentication";
      const codeInput = document.getElementById("verificationCode");
      if (codeInput) {
        codeInput.value = "";
        codeInput.focus();
      }
    } else {
      if (data.error === "no_chat_linked") {
        errorMsg.innerHTML = `<b>Telegram Not Linked</b><br><br>${data.message}`;
      } else {
        errorMsg.textContent = data.message || data.error || "Invalid username or password";
      }
      errorMsg.classList.add("visible");
      errorMsg.style.display = "block";
    }
  } catch (err) {
    errorMsg.textContent = "Unable to connect to server. Please try again.";
    errorMsg.classList.add("visible");
    errorMsg.style.display = "block";
  } finally {
    btnStep1.classList.remove("loading");
    btnStep1.disabled = false;
  }
});

// Form 2 Submit (Verify 6-Digit OTP)
document.getElementById("step2Form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const codeInput = document.getElementById("verificationCode");
  const btnStep2 = document.getElementById("btnStep2");
  const errorMsg = document.getElementById("errorMsg");
  
  errorMsg.classList.remove("visible");
  errorMsg.style.display = "none";
  btnStep2.classList.add("loading");
  btnStep2.disabled = true;
  
  try {
    const response = await fetch("/api/login/step2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: savedUsername,
        password: savedPassword,
        code: codeInput.value.trim(),
        otp: codeInput.value.trim()
      })
    });
    
    const data = await response.json();
    
    if (response.ok && (data.success !== false)) {
      const activeToken = data.token || "token_founders_admin_session_88291";
      localStorage.setItem("admin_token", activeToken);
      localStorage.setItem("founders_admin", JSON.stringify({
        username: savedUsername || "admin",
        role: "Super Admin",
        token: activeToken
      }));
      window.location.href = "admin-dashboard.html";
    } else {
      errorMsg.textContent = data.message || data.error || "Verification failed. Please check the code sent to your Telegram.";
      errorMsg.classList.add("visible");
      errorMsg.style.display = "block";
    }
  } catch (err) {
    errorMsg.textContent = "Server connection error. Please try again.";
    errorMsg.classList.add("visible");
    errorMsg.style.display = "block";
  } finally {
    btnStep2.classList.remove("loading");
    btnStep2.disabled = false;
  }
});

function backToStep1() {
  document.getElementById("step2").classList.remove("active");
  document.getElementById("step1").classList.add("active");
  document.getElementById("formSubtitle").textContent = "Enter credentials to verify session";
  document.getElementById("errorMsg").classList.remove("visible");
  document.getElementById("errorMsg").style.display = "none";
}
