/* ==========================================================================
   FOUNDERS ACADEMY - PLAYFUL & EDUCATIONAL TELEGRAM BOT ENGINE (JS)
   ========================================================================== */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { dbStore } from "./db/store.js";

// Resolve current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. Environment Variable Loader (.env)
function loadEnv() {
  const envPath = resolve(__dirname, ".env");
  if (existsSync(envPath)) {
    try {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const firstEqual = trimmed.indexOf("=");
          const key = trimmed.slice(0, firstEqual).trim();
          const val = trimmed.slice(firstEqual + 1).trim().replace(/^['"]|['"]$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } catch (err) {
      console.warn("[Bot] Warning: Could not read .env file:", err);
    }
  }
}

loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL || "https://icdjgtfiqwwdqtvwuyaw.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_7SjYAbvNDwTXOVBlkuox-g_wMj58uUK";

if (!BOT_TOKEN) {
  console.error("❌ ERROR: TELEGRAM_BOT_TOKEN or BOT_TOKEN is missing in your .env file!");
  console.error("Please add TELEGRAM_BOT_TOKEN=your_token_here to .env");
}

const TELEGRAM_API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// 2. Supabase Database Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const userCache = new Map();
let coursesCache = [];
let lastCoursesFetchTime = 0;
const CACHE_TTL = 30000;

export function cleanPhoneDigits(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

export async function generateOneTimeTelegramInviteLink(chatIdOrUrl, name) {
  if (!chatIdOrUrl || !BOT_TOKEN) return chatIdOrUrl || "";

  let targetChat = chatIdOrUrl.trim();
  if (targetChat.includes("t.me/")) {
    const parts = targetChat.split("t.me/");
    const slug = parts[1].replace(/^\+/, "").replace(/\/.*$/, "");
    if (!targetChat.includes("/+")) {
      targetChat = `@${slug}`;
    }
  }

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/createChatInviteLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChat,
        name: `Single-Use for ${name || 'Student'}`,
        member_limit: 1,
        expire_date: Math.floor(Date.now() / 1000) + (86400 * 7)
      })
    });
    const json = await res.json();
    if (json.ok && json.result?.invite_link) {
      console.log(`[Bot API] 🎟️ Generated 1-Time Unique Link for ${name}: ${json.result.invite_link}`);
      return json.result.invite_link;
    } else {
      console.warn(`[Bot API Warning] Could not create 1-time link for ${targetChat}:`, json.description || json);
    }
  } catch (err) {
    console.error("[Bot API Error] createChatInviteLink error:", err);
  }

  return chatIdOrUrl;
}

if (typeof globalThis !== "undefined") {
  globalThis.generateOneTimeTelegramInviteLink = generateOneTimeTelegramInviteLink;
}

export async function getActiveCoursesFast() {
  const now = Date.now();
  if (coursesCache.length > 0 && (now - lastCoursesFetchTime) < CACHE_TTL) {
    return coursesCache;
  }

  try {
    const { data: courses, error } = await supabase.from("courses").select("*");
    if (!error && courses) {
      coursesCache = courses.filter((c) => c.status === "ON" || c.status === "active");
      lastCoursesFetchTime = now;
    }
  } catch (err) {
    console.error("[Bot Supabase Fast-Cache Warning]:", err);
  }

  return coursesCache;
}

export async function getMaintenanceStatus() {
  try {
    const data = await dbStore.getMaintenance();
    if (data) return data;
  } catch (_e) {}
  try {
    const { data } = await supabase.from("students").select("*").eq("id", "CONFIG_MAINTENANCE").maybeSingle();
    if (data && data.email) {
      return JSON.parse(data.email);
    }
  } catch (_e) {}
  return { status: "OFF" };
}

export async function isUserRegistered(telegramId) {
  if (!telegramId) return false;

  const numericId = Number(telegramId);
  const stringId = String(telegramId);

  // 1. Check in-memory RAM cache
  if (userCache.has(numericId)) {
    const cached = userCache.get(numericId);
    if (cached?.phone_number && cached.phone_number.trim() !== "") return true;
  }
  if (userCache.has(stringId)) {
    const cached = userCache.get(stringId);
    if (cached?.phone_number && cached.phone_number.trim() !== "") return true;
  }

  const tgIdStr = `TG-${stringId}`;

  // 2. Check Supabase students table
  try {
    const { data: student } = await supabase
      .from("students")
      .select("id, name, phone, email")
      .eq("id", tgIdStr)
      .maybeSingle();

    if (student && student.phone && student.phone.trim() !== "") {
      const userObj = {
        telegram_id: numericId,
        first_name: student.name ? student.name.split(" ")[0] : "Student",
        phone_number: student.phone
      };
      userCache.set(numericId, userObj);
      userCache.set(stringId, userObj);
      return true;
    }

    // 3. Check Supabase telegram_users table by telegram_id
    const { data: tgUser } = await supabase
      .from("telegram_users")
      .select("*")
      .or(`telegram_id.eq.${numericId},telegram_id.eq.${stringId}`)
      .maybeSingle();

    if (tgUser && tgUser.phone_number && tgUser.phone_number.trim() !== "") {
      const userObj = {
        telegram_id: numericId,
        first_name: tgUser.first_name || "Student",
        last_name: tgUser.last_name || "",
        username: tgUser.username,
        phone_number: tgUser.phone_number
      };
      userCache.set(numericId, userObj);
      userCache.set(stringId, userObj);
      return true;
    }

    // 4. Check dbStore.getStudents() for matching student ID or phone
    const allStudents = await dbStore.getStudents();
    const match = allStudents.find(s => {
      if (!s.phone || s.phone.trim() === "") return false;
      const sId = String(s.id || "");
      return sId === tgIdStr || sId === stringId || sId.includes(stringId);
    });

    if (match) {
      const userObj = {
        telegram_id: numericId,
        first_name: match.name ? match.name.split(" ")[0] : "Student",
        phone_number: match.phone
      };
      userCache.set(numericId, userObj);
      userCache.set(stringId, userObj);
      return true;
    }
  } catch (err) {
    console.error("[Bot DB Check Error]:", err);
  }

  return false;
}

export async function registerBotUser(user) {
  const numericId = Number(user.telegram_id);
  const stringId = String(user.telegram_id);

  userCache.set(numericId, user);
  userCache.set(stringId, user);

  const cleanUsername = user.username ? user.username.replace(/^@/, "").trim() : "";
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || (cleanUsername ? `@${cleanUsername}` : `User_${user.telegram_id}`);
  const userEmail = cleanUsername ? `@${cleanUsername}` : `user_${user.telegram_id}@foundersacademy.et`;
  const formattedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

  const studentPayload = {
    id: `TG-${user.telegram_id}`,
    name: fullName,
    phone: user.phone_number,
    email: userEmail,
    telegram_username: cleanUsername,
    joined_date: formattedDate
  };

  (async () => {
    try {
      await supabase.from("students").upsert([studentPayload], { onConflict: "id" });
      try {
        await supabase.from("telegram_users").upsert([{
          telegram_id: user.telegram_id,
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          username: cleanUsername,
          phone_number: user.phone_number,
          is_verified: true,
          registered_at: new Date().toISOString()
        }], { onConflict: "telegram_id" });
      } catch (_e) { /* fallback */ }
      console.log(`[Bot Supabase] ⚡ Fast Synced Registered Student: ${fullName} (${studentPayload.id})`);
    } catch (err) {
      console.error("[Bot Supabase Sync Error]:", err);
    }
  })();

  return true;
}

export async function findEnrollmentInvitesByPhone(phoneNumber, studentName = "Student") {
  const targetClean = cleanPhoneDigits(phoneNumber);
  if (!targetClean) return [];

  const foundInvites = [];

  try {
    const { data: txns } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
    const { data: courses } = await supabase.from("courses").select("*");
    const allCourses = courses && courses.length > 0 ? courses : await getActiveCoursesFast();

    if (txns && txns.length > 0) {
      const userTxns = txns.filter((txn) => {
        const txnPhoneClean = cleanPhoneDigits(txn.student_phone);
        return txnPhoneClean && (
          txnPhoneClean === targetClean || 
          targetClean.endsWith(txnPhoneClean) || 
          txnPhoneClean.endsWith(targetClean)
        );
      });

      const processedCourses = new Set();

      for (const txn of userTxns) {
        if (txn.status === "Completed" || txn.status === "VERIFIED" || txn.status === "Settled") {
          const courseKey = txn.course_id || txn.masterclass_title || "unknown";
          
          if (processedCourses.has(courseKey)) continue;
          processedCourses.add(courseKey);

          const course = allCourses.find((c) => c.id === txn.course_id || c.title === txn.masterclass_title) || allCourses[0];

          // Reuse existing 1-time links stored in DB if available
          let channelInvite = txn.metadata?.oneTimeLinks?.channel || "";
          let groupInvite = txn.metadata?.oneTimeLinks?.group || "";

          const dbChannel = course?.tg_channel || "";
          const dbGroup = course?.tg_group || "";

          try {
            let fn = typeof generateOneTimeTelegramInviteLink === "function" ? generateOneTimeTelegramInviteLink : globalThis.generateOneTimeTelegramInviteLink;
            if (typeof fn === "function") {
              if (!channelInvite && dbChannel) {
                channelInvite = await fn(dbChannel, `${studentName} Channel`);
              }
              if (!groupInvite && dbGroup) {
                groupInvite = await fn(dbGroup, `${studentName} Group`);
              }
            }
          } catch (_genErr) {
            if (!channelInvite) channelInvite = dbChannel;
            if (!groupInvite) groupInvite = dbGroup;
          }

          // Persist the generated 1-time links and claimed status in Supabase database
          try {
            const updatedMeta = {
              ...(txn.metadata || {}),
              invite_claimed: true,
              claimed_at: txn.metadata?.claimed_at || new Date().toISOString(),
              claimed_by_phone: targetClean,
              oneTimeLinks: { channel: channelInvite || dbChannel, group: groupInvite || dbGroup }
            };
            await supabase.from("transactions").update({ metadata: updatedMeta }).eq("id", txn.id);
          } catch (_e) {}

          foundInvites.push({
            title: course?.title || txn.masterclass_title || "Masterclass",
            channelLink: channelInvite || dbChannel,
            groupLink: groupInvite || dbGroup,
            txnId: txn.id,
            alreadyClaimed: false
          });
        }
      }
    }
  } catch (err) {
    console.error("[Bot Invite Search Error]:", err);
  }

  return foundInvites;
}

// 3. Telegram API Helper
export async function telegramApi(method, payload = {}) {
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.ok) {
      console.error(`[Bot API Error] ${method}:`, json.description || json);
    }
    return json;
  } catch (err) {
    console.error(`[Bot Network Error] ${method}:`, err);
    return { ok: false, error: err };
  }
}

// 4. UI Keyboards & Menus (Playful & Clear)

export function getPhoneRequestKeyboard() {
  return {
    keyboard: [
      [
        {
          text: "📱 Share Phone Number & Get Started 🚀",
          request_contact: true
        }
      ]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  };
}

export function getMainMenuReplyKeyboard() {
  return {
    keyboard: [
      [
        { text: "🔗 Links" },
        { text: "💬 Support" }
      ],
      [
        { text: "📚 Courses" },
        { text: "🎟️ Redeem Giveaway" }
      ],
      [
        { text: "📜 Certificate" },
        { text: "💳 Payment Channels" }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true
  };
}

// 5. Message & Button Action Handlers (Playful & Educational)

export async function handleMessage(msg) {
  if (!msg || !msg.from) return;

  const chatId = msg.chat.id;
  const from = msg.from;
  const telegramId = from.id;
  const firstName = from.first_name || "Student";
  const text = (msg.text || "").trim();

  // --- BAN GUARD: Block banned users immediately from ALL bot interactions ---
  try {
    const banStatus = await dbStore.isStudentBanned(telegramId);
    if (banStatus && banStatus.banned) {
      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `🚫 *ACCOUNT SUSPENDED / BANNED* 🛑\n\n` +
          `Your Founders Academy student account and Telegram bot access have been suspended by an administrator.\n\n` +
          `*Reason:* ${banStatus.reason || "Violation of platform terms"}\n\n` +
          `If you believe this is a mistake, please contact support:\n👉 @foundersupportt`,
        parse_mode: "Markdown"
      });
      console.log(`[Bot] 🚫 Blocked message from BANNED student ${firstName} (${telegramId})`);
      return;
    }
  } catch (_e) {}

  // 0. Admin 2FA Pairing Code Handler (e.g. /link_admin FA-89241 or FA-89241 or /start admin_FA-89241)
  const upperText = text.trim().toUpperCase();
  if (
    upperText.startsWith("/LINK_ADMIN") || 
    upperText.startsWith("/START ADMIN_") || 
    upperText.startsWith("FA-") || 
    upperText.startsWith("/ADMIN")
  ) {
    let pairingCode = upperText
      .replace("/LINK_ADMIN", "")
      .replace("/START ADMIN_", "")
      .replace("/ADMIN", "")
      .trim();

    if (!pairingCode.startsWith("FA-") && upperText.startsWith("FA-")) {
      pairingCode = upperText;
    }

    let pairResult = await dbStore.pairTelegramAdmin(pairingCode, {
      id: telegramId,
      username: from.username || "",
      first_name: firstName
    });

    if (!pairResult.success) {
      try {
        const res = await fetch("http://localhost:3000/api/admin/security/pair-telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: pairingCode,
            telegramId,
            username: from.username || "",
            firstName
          })
        });
        const json = await res.json();
        if (json.success) pairResult = json;
      } catch (_e) {}
    }

    if (pairResult.success) {
      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `🔐 *Admin 2FA Device Successfully Linked!*\n\nHello *${firstName}* (@${from.username || 'admin'}), this Telegram chat is now officially registered as the *Founders Academy Super Admin 2FA Authenticator*.\n\n🛡️ *Security:* Whenever an administrator logs into the portal, a secure 6-digit one-time password (OTP) will be sent here directly.`,
        parse_mode: "Markdown"
      });
      return;
    } else {
      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `❌ *Invalid or Expired Pairing Code*\n\nThe code \`${pairingCode || text}\` was not recognized or has expired.\n\nPlease generate a fresh pairing code from **Admin Portal > Settings > Security & 2FA Preferences** and try again.`,
        parse_mode: "Markdown"
      });
      return;
    }
  }

  // Check if sender is the registered Admin
  const adminSec = await dbStore.getAdminSecurity();
  const isLinkedAdmin = adminSec?.telegramAdminChatId && String(adminSec.telegramAdminChatId) === String(telegramId);

  // Admin Quick Management Commands via Telegram (Available even during Maintenance Mode)
  if (isLinkedAdmin) {
    if (upperText === "/STATUS" || upperText === "/ADMIN_STATUS") {
      const maintStatus = await getMaintenanceStatus();
      const students = await dbStore.getStudents();
      const txns = await dbStore.getTransactions();
      const completedTxns = txns.filter(t => t.status === "Completed" || t.status === "VERIFIED");
      let rev = 0;
      completedTxns.forEach(t => rev += (parseFloat(String(t.amount || 0).replace(/[^0-9.]/g, "")) || 0));

      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `👑 *Founders Academy Admin Command Center*\n\n📊 *System Health:* Operational\n🚧 *Maintenance Mode:* *${maintStatus?.status === 'ON' ? '🔴 ACTIVE (ON)' : '🟢 LIVE (OFF)'}*\n👥 *Total Students:* ${students.length}\n💰 *Verified Revenue:* ETB ${rev.toLocaleString()}\n\n🛠️ *Admin Quick Controls:*\n• /maintenance_on - Turn Maintenance ON\n• /maintenance_off - Turn Maintenance OFF`,
        parse_mode: "Markdown"
      });
      return;
    }

    if (upperText === "/MAINTENANCE_ON" || upperText === "/MAINTENANCE ON") {
      await dbStore.updateMaintenance({ status: "ON" });
      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `🚨 *Maintenance Mode Turned ON*\n\nPublic visitor access and student bot interactions are now locked. Admin dashboard and admin bot commands remain fully accessible.`,
        parse_mode: "Markdown"
      });
      return;
    }

    if (upperText === "/MAINTENANCE_OFF" || upperText === "/MAINTENANCE OFF") {
      await dbStore.updateMaintenance({ status: "OFF" });
      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `✅ *Maintenance Mode Turned OFF*\n\nPublic portal and student Telegram bot interactions are now fully LIVE!`,
        parse_mode: "Markdown"
      });
      return;
    }
  }

  // Check Global Maintenance Status for Regular Public Users
  const maint = await getMaintenanceStatus();
  if (maint && maint.status === "ON" && !isLinkedAdmin) {
    const maintTitle = maint.title || "Quick Pit Stop for Brain Upgrades! 🧠⚙️";
    const maintMsg = maint.message || "We are tuning up the Founders Academy engine with fresh improvements. Bot commands and course enrollments will resume shortly.";

    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `🚧 *${maintTitle}*\n\n${maintMsg}\n\n_Grab some water, review your notes, and we'll be right back with more learning power! 🚀_`,
      parse_mode: "Markdown"
    });
    return;
  }

  // 1. Check Contact Sharing (Phone Number)
  if (msg.contact) {
    const rawPhone = msg.contact.phone_number || "";
    const phoneNumber = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;

    await registerBotUser({
      telegram_id: telegramId,
      first_name: from.first_name || "",
      last_name: from.last_name || "",
      username: from.username || "",
      phone_number: phoneNumber,
      registered_at: new Date().toISOString()
    });

    console.log(`[Bot] Checking course enrollments for phone: ${phoneNumber}...`);
    const invites = await findEnrollmentInvitesByPhone(phoneNumber, firstName);

    if (invites.length > 0) {
      let inviteMsg = `🎉 *Boom! You're in, ${firstName}! Course Access Unlocked!* 🎓🔥\n\n`;
      inviteMsg += `We found your verified masterclass enrollment in the Founders roster:\n\n`;

      const inlineKeyboardButtons = [];

      invites.forEach((item, idx) => {
        inviteMsg += `*${idx + 1}. 🚀 ${item.title}*\n`;
        if (item.channelLink) {
          inviteMsg += `📢 *Classroom Channel:* ${item.channelLink}\n`;
          inlineKeyboardButtons.push([{ text: `📢 Join ${item.title.substring(0, 18)} Channel`, url: item.channelLink }]);
        }
        if (item.groupLink) {
          inviteMsg += `💬 *Mastermind Group:* ${item.groupLink}\n`;
          inlineKeyboardButtons.push([{ text: `💬 Join ${item.title.substring(0, 18)} Group`, url: item.groupLink }]);
        }
        inviteMsg += `\n`;
      });

      inviteMsg += `🔒 _Pro Tip: These invite links are uniquely forged for you and single-use only._`;

      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: inviteMsg,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: inlineKeyboardButtons
        }
      });
    } else {
      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `🎉 *Awesome, ${firstName}! Your student profile is officially active!* 🌟\n\nYour verified phone number (\`${phoneNumber}\`) has been linked to your Founders Academy account.\n\nReady to master high-income digital skills? Explore our masterclasses below! 🚀`,
        parse_mode: "Markdown"
      });
    }

    await sendMainMenu(chatId, firstName);
    return;
  }

  // 2. Check User Registration
  const registered = await isUserRegistered(telegramId);

  if (!registered) {
    console.log(`[Bot] New student detected: ${firstName} (${telegramId}). Requesting phone number...`);
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `👋 *Welcome to the Founders Academy universe, ${firstName}!* 🎓✨\n\nYou're just one tap away from unlocking masterclasses, high-income digital skills, and our private student mastermind!\n\n👇 *Tap the button below to share your phone number and let's get you set up:*`,
      parse_mode: "Markdown",
      reply_markup: getPhoneRequestKeyboard()
    });
    return;
  }

  // 2b. Check if the user is banned
  try {
    const banStatus = await dbStore.isStudentBanned(telegramId);
    if (banStatus && banStatus.banned) {
      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `🚫 *Your Account Has Been Suspended*\n\n` +
          `Your Founders Academy Bot access has been restricted by an administrator.\n\n` +
          `*Reason:* ${banStatus.reason || "Violation of platform terms"}\n\n` +
          `If you believe this is a mistake, please contact support:\n👉 @foundersupportt`,
        parse_mode: "Markdown"
      });
      console.log(`[Bot] 🚫 Banned user blocked: ${firstName} (${telegramId}). Reason: ${banStatus.reason}`);
      return;
    }
  } catch (_e) {}

  // 3. Menu Button & Giveaway Handlers
  if (text.startsWith("/redeem") || text.startsWith("/giveaway") || text.startsWith("/code") || text.includes("Giveaway") || text.includes("Redeem")) {
    const codePart = text.replace(/^\/(redeem|giveaway|code)\s*/i, "").replace(/🎟️\s*Redeem\s*Giveaway/i, "").trim();
    await handleGiveawayRedemption(chatId, from, codePart);
    return;
  }

  // Check if user typed a raw giveaway code (e.g. GIVEAWAY-XXXXX)
  try {
    const giveawayCodes = await dbStore.getGiveawayCodes();
    const matched = giveawayCodes.find(g => g.code === text.trim().toUpperCase());
    if (matched) {
      await handleGiveawayRedemption(chatId, from, matched.code);
      return;
    }
  } catch (_e) {}

  if (text.includes("Links") || text === "/links") {
    await onLinksClicked(chatId, from, msg);
    return;
  }

  if (text.includes("Support") || text === "/support") {
    await onSupportClicked(chatId, from, msg);
    return;
  }

  if (text.includes("Courses") || text === "/courses") {
    await onCoursesClicked(chatId, from, msg);
    return;
  }

  if (text.includes("Certificate") || text === "/certificate") {
    await onCertificateClicked(chatId, from, msg);
    return;
  }

  if (text === "/pay" || text === "/bank" || text === "/payment" || text.includes("Payment")) {
    await onBankPaymentClicked(chatId, from, msg);
    return;
  }

  console.log(`[Bot] Greeting existing learner: ${firstName} (${telegramId})`);
  await sendMainMenu(chatId, firstName);
}

async function handleGiveawayRedemption(chatId, from, rawCode) {
  const codeClean = String(rawCode || "").replace(/^\/(redeem|giveaway|code)\s*/i, "").trim().toUpperCase();

  if (!codeClean || codeClean.length < 3) {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `🎟️ *Redeem 1-Time Course Giveaway Code*\n\nPlease reply with your unique 1-time giveaway code (e.g. \`GIVEAWAY-X9F2A\`):\n\n_Note: Giveaway codes are strictly single-use only. Once redeemed by a student, the code becomes outdated and cannot be used again._`,
      parse_mode: "Markdown"
    });
    return;
  }

  const res = await dbStore.redeemGiveawayCode({
    code: codeClean,
    telegramUser: from
  });

  if (!res.success) {
    if (res.alreadyRedeemed) {
      const u = res.usedBy || {};
      const uName = u.name || "Student";
      const uUser = u.username ? `(${u.username})` : "";
      const dateStr = res.usedAt ? new Date(res.usedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "Earlier";

      const statusMsg = `🎟️ *GIVEAWAY CODE STATUS CARD* 🔍\n\n` +
        `📋 *Code:* \`${res.code || codeClean}\`\n` +
        `⚡ *Status:* 🔴 *OUTDATED / ALREADY REDEEMED*\n` +
        `📘 *Course:* ${res.courseTitle || 'Founders Masterclass'}\n` +
        `👤 *Redeemed By:* ${uName} ${uUser}\n` +
        `📅 *Redeemed Date:* ${dateStr}\n\n` +
        `❌ *Redemption Failed:* This 1-time giveaway code has already been redeemed by another student and is no longer valid.`;

      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: statusMsg,
        parse_mode: "Markdown"
      });
    } else if (res.revoked) {
      const statusMsg = `🎟️ *GIVEAWAY CODE STATUS CARD* 🔍\n\n` +
        `📋 *Code:* \`${res.code || codeClean}\`\n` +
        `⚡ *Status:* ⏳ *REVOKED BY ADMIN*\n` +
        `📘 *Course:* ${res.courseTitle || 'Founders Masterclass'}\n\n` +
        `❌ *Redemption Failed:* This giveaway code has been cancelled by the administrator.`;

      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: statusMsg,
        parse_mode: "Markdown"
      });
    } else {
      const statusMsg = `🎟️ *GIVEAWAY CODE STATUS CARD* 🔍\n\n` +
        `📋 *Code:* \`${codeClean}\`\n` +
        `⚡ *Status:* ❌ *INVALID / NOT FOUND*\n\n` +
        `❌ *Redemption Failed:* The code \`${codeClean}\` was not found in our database. Please check your spelling and try again!`;

      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: statusMsg,
        parse_mode: "Markdown"
      });
    }
    return;
  }

  // Code redeemed successfully! Fetch course details & generate 1-time invite links!
  let channelLink = "";
  let groupLink = "";
  try {
    const courses = await getActiveCoursesFast();
    const course = courses.find(c => String(c.id) === String(res.courseId) || String(c.title) === String(res.courseTitle)) || courses[0];

    const rawChannel = course?.tg_channel || "https://t.me/founders_smma_channel";
    const rawGroup = course?.tg_group || "https://t.me/founders_smma_group";

    const sName = from ? ([from.first_name, from.last_name].filter(Boolean).join(" ") || from.username || "Student") : "Student";

    try {
      let fn = typeof generateOneTimeTelegramInviteLink === "function" ? generateOneTimeTelegramInviteLink : globalThis.generateOneTimeTelegramInviteLink;
      if (typeof fn === "function") {
        channelLink = await fn(rawChannel, `${sName} Channel`);
        groupLink = await fn(rawGroup, `${sName} Group`);
      } else {
        channelLink = rawChannel;
        groupLink = rawGroup;
      }
    } catch (_e) {
      channelLink = rawChannel;
      groupLink = rawGroup;
    }
  } catch (_e) {}

  let successMsg = `🎟️ *GIVEAWAY CODE VERIFIED & ACTIVATED!* 🟢✨\n\n` +
    `📋 *Code:* \`${res.code}\`\n` +
    `⚡ *Status:* 🟢 *VALID (1-TIME USE GRANTED)*\n` +
    `📘 *Unlocked Course:* *${res.courseTitle}*\n` +
    `🎁 *Tuition:* \`100% FREE Giveaway\`\n\n` +
    `🎉 *CONGRATULATIONS!* You are now officially enrolled in *${res.courseTitle}*!\n\n` +
    `Here are your official single-use 1-time classroom portals:\n\n`;

  const inlineKeyboard = [];

  if (channelLink) {
    successMsg += `📢 *Classroom Channel:* ${channelLink}\n`;
    inlineKeyboard.push([{ text: `📢 Join ${res.courseTitle.substring(0, 18)} Channel`, url: channelLink }]);
  }

  if (groupLink) {
    successMsg += `💬 *Mastermind Group:* ${groupLink}\n`;
    inlineKeyboard.push([{ text: `💬 Join Mastermind Group`, url: groupLink }]);
  }

  successMsg += `\n🔒 _This 1-time code (${codeClean}) has now expired and is permanently outdated._ Welcome to Founders Academy! 🎓`;

  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: successMsg,
    parse_mode: "Markdown",
    reply_markup: inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined
  });

  // Broadcast notification to linked Admin Telegram chats
  try {
    const adminChatIds = await dbStore.getAdminTelegramChatIds();
    const adminMsg = `🎉 *1-TIME GIVEAWAY CODE REDEEMED!*\n\n` +
      `🎟️ *Code:* \`${res.code}\`\n` +
      `📘 *Course:* ${res.courseTitle}\n` +
      `👤 *Student:* ${res.usedBy.name} (${res.usedBy.username || 'No Username'})\n` +
      `📱 *Chat ID:* \`${res.usedBy.chatId}\``;

    for (const cid of adminChatIds) {
      await telegramApi("sendMessage", { chat_id: cid, text: adminMsg, parse_mode: "Markdown" });
    }
  } catch (_e) {}
}

async function onBankPaymentClicked(chatId, user, msg) {
  try {
    const bankConfig = await dbStore.getBankAccounts();
    let sections = [];

    if (bankConfig.telebirrEnabled !== false) {
      let teleLines = "📱 *1. Telebirr Merchant Channel*\n";
      if (Array.isArray(bankConfig.telebirrNumbers) && bankConfig.telebirrNumbers.length > 0) {
        bankConfig.telebirrNumbers.forEach(t => {
          teleLines += `   • Phone / Merchant ID: \`${t.merchantPhone}\` (${t.merchantName || 'Merchant'})\n`;
        });
      } else {
        teleLines += `   • Phone / Merchant ID: \`${bankConfig.telebirrMerchantPhone || "+251 906 769 999"}\`\n`;
      }
      sections.push(teleLines);
    }

    if (bankConfig.cbeEnabled !== false) {
      let cbeLines = "🏛️ *2. Commercial Bank of Ethiopia (CBE)*\n";
      if (Array.isArray(bankConfig.cbeAccounts) && bankConfig.cbeAccounts.length > 0) {
        bankConfig.cbeAccounts.forEach((c, idx) => {
          cbeLines += `   • Account ${idx + 1}: \`${c.accountName}\`\n     Account Number: \`${c.accountNumber}\`\n`;
        });
      } else {
        cbeLines += `   • Account Name: \`${bankConfig.cbeAccountName || "Founders Academy LLC"}\`\n     Account Number: \`${bankConfig.cbeAccountNumber || "1000492819482"}\`\n`;
      }
      sections.push(cbeLines);
    }

    const payMsg = `💳 *Founders Academy Official Merchant Accounts* 🏦\n\n` +
      `You can complete your course tuition transfer through any of our authorized payment channels:\n\n` +
      sections.join("\n") +
      `\n⚡ *After sending your payment:* Submit your transaction reference code at https://foundersacademy.et to receive your instant 1-time classroom access link!`;

    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: payMsg,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🌐 Open Checkout & Verify Receipt", url: "https://foundersacademy.et" }],
          [{ text: "💬 Contact Support", url: "https://t.me/foundersupportt" }]
        ]
      }
    });
  } catch (err) {
    console.error("[Bot Handler Error] Bank payment click:", err);
  }
}

export async function sendMainMenu(chatId, firstName) {
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: `✨ *Hey champion, ${firstName}!* Ready to level up today? 🚀📚\n\nChoose where you'd like to explore next:`,
    parse_mode: "Markdown",
    reply_markup: getMainMenuReplyKeyboard()
  });
}

// Action Handlers (Playful & Educational)

async function onLinksClicked(chatId, user, msg) {
  console.log(`[Bot Handler] 'Links' selected by ${user?.first_name || user?.id}`);

  let phone = userCache.get(user.id)?.phone_number || "";
  if (!phone) {
    const tgIdStr = `TG-${user.id}`;
    const { data: student } = await supabase.from("students").select("phone").eq("id", tgIdStr).maybeSingle();
    if (student?.phone) phone = student.phone;
  }
  if (!phone) {
    const { data: tgUser } = await supabase.from("telegram_users").select("phone_number").eq("telegram_id", user.id).maybeSingle();
    if (tgUser?.phone_number) phone = tgUser.phone_number;
  }

  let inviteButtons = [];
  let linksMsg = `🔗 *Founders Academy Learning Portals* 🎓\n\n`;

  let invites = [];
  if (phone) {
    invites = await findEnrollmentInvitesByPhone(phone, user.first_name || "Student");
  }

  if (invites.length > 0) {
    linksMsg += `🌟 *Your Masterclass Access Status:*\n\n`;
    invites.forEach((item, idx) => {
      linksMsg += `*${idx + 1}. 🎯 ${item.title}*\n`;
      if (item.alreadyClaimed) {
        linksMsg += `   • ⚠️ *Status:* Single-use join link already redeemed.\n`;
        linksMsg += `   • 💡 *Note:* Each ticket allows 1 entry. To join the next cohort, enroll at foundersacademy.et\n`;
        inviteButtons.push([{ text: `🎓 Re-Buy / Enroll ${item.title.substring(0, 18)}`, url: "https://foundersacademy.et" }]);
      } else {
        if (item.channelLink) {
          linksMsg += `   • 📢 *Classroom Channel:* ${item.channelLink}\n`;
          inviteButtons.push([{ text: `📢 Join ${item.title.substring(0, 18)} Channel`, url: item.channelLink }]);
        }
        if (item.groupLink) {
          linksMsg += `   • 💬 *Mastermind Group:* ${item.groupLink}\n`;
          inviteButtons.push([{ text: `💬 Join ${item.title.substring(0, 18)} Group`, url: item.groupLink }]);
        }
      }
      linksMsg += `\n`;
    });
    linksMsg += `🔒 _Note: Invite links are 1-time single-use only per enrolled ticket._\n\n`;
  } else {
    linksMsg += `💡 *You haven't unlocked any masterclasses yet!*\n\n`;
    linksMsg += `Don't miss out on acquiring high-income skills in SMMA, Video Editing, and Viral Content.\n`;
    linksMsg += `Head over to our portal, enroll in a course, and your private mastermind links will appear right here!\n\n`;
    inviteButtons.push([{ text: "🎓 Browse Masterclasses & Enroll", url: "https://foundersacademy.et" }]);
  }

  linksMsg += `🌐 Website: https://foundersacademy.et\n💬 Mentor Support: @foundersupportt`;
  inviteButtons.push([{ text: "💬 Talk to Mentor Support", url: "https://t.me/foundersupportt" }]);

  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: linksMsg,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: inviteButtons
    }
  });
}

async function onSupportClicked(chatId, user, msg) {
  console.log(`[Bot Handler] 'Support' selected by ${user?.first_name || user?.id}`);
  try {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `💬 *Founders Academy Helpdesk & Mentorship Team* 🤝✨\n\nGot a question about a course, need guidance on curriculum, or having trouble with enrollment?\n\nOur friendly mentor team is always on standby:\n👉 @foundersupportt\n\nDrop us a message and let's help you crush your learning goals! 🚀`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📩 Chat with Mentor Support", url: "https://t.me/foundersupportt" }
          ]
        ]
      }
    });
  } catch (err) {
    console.error("[Bot Handler Error] Support click:", err);
  }
}

async function onCoursesClicked(chatId, user, msg) {
  console.log(`[Bot Handler] 'Courses' selected by ${user?.first_name || user?.id}`);
  
  try {
    const activeCourses = await getActiveCoursesFast();

    if (activeCourses.length === 0) {
      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `📚 *Founders Academy Masterclasses* 💡\n\nNew cohort courses are currently being finalized! Check back in a few moments or ask @foundersupportt for the upcoming cohort schedule.`,
        parse_mode: "Markdown"
      });
      return;
    }

    let messageText = `📚 *Founders Academy Masterclass Catalog* 🚀💡\n\nHere are our active industry-leading masterclasses engineered to build real-world skills and income:\n\n`;

    activeCourses.forEach((course, index) => {
      const title = course.title || "Untitled Course";
      const price = course.price || "Contact for Price";
      const category = course.category || "General";
      const shortDesc = course.description ? course.description.split("\n")[0] : "";

      messageText += `*${index + 1}. 🎯 ${title}*\n`;
      messageText += `   • 🏷️ *Category:* ${category}\n`;
      messageText += `   • 💰 *Tuition:* \`${price}\`\n`;
      if (shortDesc) {
        messageText += `   • 💡 _${shortDesc}_\n`;
      }
      messageText += `\n`;
    });

    messageText += `🌐 Website: https://foundersacademy.et\n💡 To secure your seat, visit our portal or chat with mentors: @foundersupportt`;

    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: messageText,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🎓 Enroll Now", url: "https://foundersacademy.et" }
          ],
          [
            { text: "💬 Contact Support", url: "https://t.me/foundersupportt" }
          ]
        ]
      }
    });
  } catch (err) {
    console.error("[Bot Handler Error] Courses click:", err);
  }
}

async function onCertificateClicked(chatId, user, msg) {
  console.log(`[Bot Handler] 'Certificate' selected by ${user?.first_name || user?.id}`);
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: `📜 *Founders Academy Verified Credentials* 🎓🏅\n\nEvery Founders Academy certificate is earned through hands-on project execution, practical assignments, and final cohort completion.\n\n🌟 *Completed your course?*\nReach out to @foundersupportt with your final project submission to request or verify your official digital certificate & badge!`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🏅 Request Certificate Verification", url: "https://t.me/foundersupportt" }
        ]
      ]
    }
  });
}

// 6. Long Polling Engine
let isRunning = false;
let lastUpdateId = 0;

export async function startBot() {
  if (!BOT_TOKEN) {
    console.error("❌ Cannot start bot: Missing BOT_TOKEN.");
    return;
  }

  let me = null;
  while (!me || !me.ok) {
    me = await telegramApi("getMe");
    if (!me.ok) {
      console.warn("⚠️ [Bot Connection] Waiting to reach Telegram API... retrying in 3s");
      await new Promise(res => setTimeout(res, 3000));
    }
  }

  console.log("⚡ Pre-warming Supabase database cache & 1-time invite link engine...");
  await getActiveCoursesFast();

  console.log("==================================================");
  console.log(`🤖 Telegram Bot Active: @${me.result.username} (${me.result.first_name})`);
  console.log(`🎟️ One-Time Invite Link Engine: Enabled`);
  console.log(`📡 Listening for messages and phone numbers...`);
  console.log("==================================================");

  isRunning = true;

  let conflictLogged = false;

  while (isRunning) {
    try {
      const updatesRes = await telegramApi("getUpdates", {
        offset: lastUpdateId + 1,
        timeout: 25
      });

      if (updatesRes.ok && Array.isArray(updatesRes.result)) {
        conflictLogged = false;
        for (const update of updatesRes.result) {
          lastUpdateId = update.update_id;

          if (update.callback_query) {
            const maint = await getMaintenanceStatus();
            if (maint && maint.status === "ON") {
              const adminSec = await dbStore.getAdminSecurity();
              const isFromAdmin = adminSec?.telegramAdminChatId && String(adminSec.telegramAdminChatId) === String(update.callback_query.from?.id);
              if (!isFromAdmin) {
                await telegramApi("answerCallbackQuery", {
                  callback_query_id: update.callback_query.id,
                  text: "🚧 Founders Academy Bot is currently paused in maintenance mode.",
                  show_alert: true
                });
                continue;
              }
            }
          }

          if (update.message) {
            try {
              await handleMessage(update.message);
            } catch (msgErr) {
              console.error(`[Bot Error] Exception handling message:`, msgErr);
            }
          }
        }
      } else {
        if (!conflictLogged && updatesRes.description?.includes("Conflict")) {
          conflictLogged = true;
          console.log("[Bot Info] Telegram bot polling is shared with another instance. Backing off...");
        }
        await new Promise(res => setTimeout(res, 15000));
      }
    } catch (err) {
      console.error("[Bot] Polling loop error:", err);
      await new Promise(res => setTimeout(res, 10000));
    }
  }
}

export function stopBot() {
  isRunning = false;
  console.log("[Bot] Stopping polling...");
}

// If executed directly
if (import.meta.main || process.argv[1]?.endsWith("bot.js") || process.argv[1]?.endsWith("bot.ts")) {
  startBot();
}
