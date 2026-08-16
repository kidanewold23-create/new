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

  // Image Attachment Elements
  const imageUrlInput = document.getElementById("broadcast-image-url");
  const imageFileInput = document.getElementById("broadcast-image-file");
  const btnClearImage = document.getElementById("btn-clear-image");
  const composerImagePreview = document.getElementById("composer-image-preview");
  const composerPreviewImg = document.getElementById("composer-preview-img");
  const previewImageContainer = document.getElementById("preview-image-container");
  const previewImageElement = document.getElementById("preview-image-element");
  const charCounter = document.getElementById("char-counter");

  let currentPhotoData = "";

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

  // Client-side image optimization helper (resizes max dimension to 1600px)
  function optimizeImageForUpload(dataUrl, callback) {
    const img = new Image();
    img.onload = function() {
      const maxDim = 1600;
      let width = img.width;
      let height = img.height;
      if (width <= maxDim && height <= maxDim) {
        callback(dataUrl);
        return;
      }
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const mime = dataUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg";
      const resized = canvas.toDataURL(mime, 0.88);
      callback(resized);
    };
    img.onerror = function() {
      callback(dataUrl);
    };
    img.src = dataUrl;
  }

  // Handle Image File Selection (Convert to Data URL Base64)
  if (imageFileInput) {
    imageFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (file.size > 20 * 1024 * 1024) {
          showToast("⚠️ Image file is too large. Please select an image under 20MB.", "error");
          imageFileInput.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = function(evt) {
          const rawData = evt.target.result;
          optimizeImageForUpload(rawData, (optimizedData) => {
            currentPhotoData = optimizedData;
            if (imageUrlInput) imageUrlInput.value = "";
            updateLivePreview();
            showToast("📷 Image attached successfully!", "info");
          });
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Handle Image URL input typing/pasting
  if (imageUrlInput) {
    imageUrlInput.addEventListener("input", () => {
      const val = imageUrlInput.value.trim();
      currentPhotoData = val;
      if (imageFileInput) imageFileInput.value = "";
      updateLivePreview();
    });
  }

  // Clear Image handler
  if (btnClearImage) {
    btnClearImage.addEventListener("click", () => {
      currentPhotoData = "";
      if (imageUrlInput) imageUrlInput.value = "";
      if (imageFileInput) imageFileInput.value = "";
      updateLivePreview();
      showToast("Image removed.", "info");
    });
  }

  // 2. Real-time Live Preview Handler
  function updateLivePreview() {
    const rawText = messageInput.value.trim();

    // Image preview state
    if (currentPhotoData) {
      if (composerImagePreview && composerPreviewImg) {
        composerPreviewImg.src = currentPhotoData;
        composerImagePreview.style.display = "block";
      }
      if (previewImageContainer && previewImageElement) {
        previewImageElement.src = currentPhotoData;
        previewImageContainer.style.display = "block";
      }
      if (btnClearImage) btnClearImage.style.display = "inline-flex";
    } else {
      if (composerImagePreview) composerImagePreview.style.display = "none";
      if (previewImageContainer) previewImageContainer.style.display = "none";
      if (btnClearImage) btnClearImage.style.display = "none";
    }

    // Character Counter & Caption Limits
    const charCount = messageInput.value.length;
    const maxChars = currentPhotoData ? 1024 : 4096;
    if (charCounter) {
      charCounter.textContent = `${charCount} / ${maxChars}${currentPhotoData ? ' (Caption)' : ''}`;
      if (charCount > maxChars) {
        charCounter.style.color = "#ef4444";
        charCounter.style.fontWeight = "bold";
      } else {
        charCounter.style.color = "var(--color-text-muted, #94a3b8)";
        charCounter.style.fontWeight = "normal";
      }
    }

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

    if (window.lucide) window.lucide.createIcons();
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

    if (!message && !currentPhotoData) {
      showToast("Please enter a broadcast message or attach an image before sending.", "error");
      return;
    }

    if (buttonText && !buttonUrl) {
      showToast("Please enter a valid URL for the action button.", "error");
      return;
    }

    const confirmPrompt = currentPhotoData 
      ? "🖼️ Are you sure you want to broadcast this photo message to registered Telegram users?" 
      : "🚀 Are you sure you want to broadcast this message to registered Telegram users in Supabase?";

    if (!confirm(confirmPrompt)) {
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
          imageUrl: currentPhotoData || undefined,
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
        const audienceLabel = "📢 All Registered Telegram Users";
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
            <strong style="color: var(--text-main); font-size: 0.95rem;">${audienceLabel} ${currentPhotoData ? '📷 (Photo)' : ''}</strong>
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
    currentPhotoData = "";
    if (imageUrlInput) imageUrlInput.value = "";
    if (imageFileInput) imageFileInput.value = "";
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
