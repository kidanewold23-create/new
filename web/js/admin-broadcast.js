/* ==========================================================================
   FOUNDERS ACADEMY - TELEGRAM BOT BROADCAST ADMIN SCRIPT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Lucide Icons Initialization
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const broadcastForm = document.getElementById("form-broadcast");
  const messageInput = document.getElementById("broadcast-message");
  const btnTextInput = document.getElementById("broadcast-btn-text");
  const btnUrlInput = document.getElementById("broadcast-btn-url");
  const previewTextContent = document.getElementById("preview-text-content");
  const previewTime = document.getElementById("preview-time");
  const previewButtonContainer = document.getElementById("preview-button-container");
  const previewBtnElement = document.getElementById("preview-btn-element");
  const metricRecipientsCount = document.getElementById("metric-recipients-count");
  const btnSubmit = document.getElementById("btn-submit-broadcast");
  const btnReset = document.getElementById("btn-reset-broadcast");
  const logsTableBody = document.getElementById("table-broadcast-logs");
  const summaryBox = document.getElementById("broadcast-result-summary");

  // Set current time in Telegram preview
  const now = new Date();
  previewTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Fetch Students & Registered Telegram Users Count for Recipients Metric
  async function loadRecipientsMetric() {
    try {
      const res = await fetch("/api/telegram-recipients");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        metricRecipientsCount.textContent = json.data.length;
      } else {
        metricRecipientsCount.textContent = "0";
      }
    } catch (_e) {
      metricRecipientsCount.textContent = "1";
    }
  }

  loadRecipientsMetric();

  // 2. Real-time Live Preview Handler
  function updateLivePreview() {
    const rawText = messageInput.value.trim();

    if (!rawText) {
      previewTextContent.innerHTML = "<span style='color: #8293a4;'>Type your message on the left to see live preview...</span>";
    } else {
      // Basic Markdown parser for preview
      let formatted = rawText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*(.*?)\*/g, "<b>$1</b>")
        .replace(/_(.*?)_/g, "<i>$1</i>")
        .replace(/`(.*?)`/g, "<code>$1</code>")
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #64b5f6; text-decoration: underline;" target="_blank">$1</a>');

      previewTextContent.innerHTML = formatted;
    }

    // Action button preview
    const buttonLabel = btnTextInput.value.trim();
    const buttonUrl = btnUrlInput.value.trim();

    if (buttonLabel && buttonUrl) {
      previewBtnElement.textContent = buttonLabel;
      previewBtnElement.href = buttonUrl;
      previewButtonContainer.style.display = "block";
    } else {
      previewButtonContainer.style.display = "none";
    }
  }

  messageInput.addEventListener("input", updateLivePreview);
  btnTextInput.addEventListener("input", updateLivePreview);
  btnUrlInput.addEventListener("input", updateLivePreview);

  // Initial preview sync
  updateLivePreview();

  // 3. Toolbar Formatting Helpers
  window.insertFormatting = function(prefix, suffix) {
    const start = messageInput.selectionStart;
    const end = messageInput.selectionEnd;
    const text = messageInput.value;
    const selected = text.substring(start, end) || "text";
    const replacement = prefix + selected + suffix;

    messageInput.value = text.substring(0, start) + replacement + text.substring(end);
    messageInput.focus();
    messageInput.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    updateLivePreview();
  };

  // 4. Form Submit Handler (Send Broadcast)
  broadcastForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = messageInput.value.trim();
    const buttonText = btnTextInput.value.trim();
    const buttonUrl = btnUrlInput.value.trim();
    const audienceSelect = document.getElementById("broadcast-audience");
    const audience = audienceSelect ? audienceSelect.value : "all";

    if (!message) {
      showToast("Please enter a broadcast message before sending.", "error");
      return;
    }

    if (buttonText && !buttonUrl) {
      showToast("Please enter a valid URL for the action button.", "error");
      return;
    }

    if (!confirm("🚀 Are you sure you want to broadcast this message to registered Telegram users in Supabase?")) {
      return;
    }

    // Disable button & show sending status
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i data-lucide="loader" class="spin"></i> Broadcasting...`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          buttonText: buttonText || undefined,
          buttonUrl: buttonUrl || undefined,
          audience
        })
      });

      const json = await res.json();

      if (json.success) {
        showToast(`🎉 ${json.message}`, "success");

        summaryBox.style.display = "block";
        summaryBox.innerHTML = `✅ <b>Broadcast Delivery Complete!</b><br>${json.message}`;

        const deliveredCount = json.stats?.delivered !== undefined ? json.stats.delivered : (json.logs ? json.logs.filter(l => String(l.status).includes("Delivered")).length : 0);
        const failedCount = json.stats?.failed !== undefined ? json.stats.failed : (json.logs ? json.logs.filter(l => !String(l.status).includes("Delivered")).length : 0);
        const totalRecipients = json.stats?.total !== undefined ? json.stats.total : (deliveredCount + failedCount);
        const audienceLabel = audience === "verified" ? "📱 Verified Phone Users" : "📢 All Registered Telegram Users";
        const timeSent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Remove placeholder if present
        const placeholderRow = logsTableBody.querySelector("td[colspan]");
        if (placeholderRow) {
          logsTableBody.innerHTML = "";
        }

        // Prepend aggregate summary row
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>
            <strong style="color: var(--text-main); font-size: 0.95rem;">${audienceLabel}</strong>
          </td>
          <td><strong style="font-size: 0.95rem;">${totalRecipients} Users</strong></td>
          <td>
            <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 10px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.3);">
              <i data-lucide="check-circle-2" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${deliveredCount} Delivered
            </span>
          </td>
          <td>
            <span class="badge" style="${failedCount > 0 ? 'background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);' : 'background: rgba(255,255,255,0.05); color: var(--color-text-muted);'} padding: 4px 10px; font-weight: 600;">
              ${failedCount > 0 ? `❌ ${failedCount} Failed` : '0 Failed'}
            </span>
          </td>
          <td><span style="color: var(--color-text-muted); font-size: 0.88rem;"><i data-lucide="clock" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${timeSent}</span></td>
        `;
        logsTableBody.prepend(tr);
        if (window.lucide) window.lucide.createIcons();
      } else {
        showToast(`❌ Broadcast Failed: ${json.error || "Unknown error"}`, "error");
      }
    } catch (err) {
      console.error("Broadcast Error:", err);
      showToast(`❌ Network Error: Could not send broadcast.`, "error");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<i data-lucide="send"></i> Send Broadcast Now`;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // 5. Reset Button Handler
  btnReset.addEventListener("click", () => {
    messageInput.value = "";
    btnTextInput.value = "";
    btnUrlInput.value = "";
    updateLivePreview();
    summaryBox.style.display = "none";
    showToast("Broadcast form reset.", "info");
  });

  // Helper Toast Function
  function showToast(msg, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = msg;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});
