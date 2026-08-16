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

process.on("unhandledRejection", (reason) => {
  console.error("⚠️ [Bot UnhandledRejection Warning]:", reason?.message || reason);
});
process.on("uncaughtException", (err) => {
  console.error("⚠️ [Bot UncaughtException Warning]:", err?.message || err);
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "8659500401:AAESuYgRssThu3J-22ky6FkPOB9aHJf7QRg";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://icdjgtfiqwwdqtvwuyaw.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_7SjYAbvNDwTXOVBlkuox-g_wMj58uUK";

if (!BOT_TOKEN) {
  console.error("❌ ERROR: TELEGRAM_BOT_TOKEN or BOT_TOKEN is missing in your .env file!");
  console.error("Please add TELEGRAM_BOT_TOKEN=your_token_here to .env");
}

const TELEGRAM_API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// 2. Supabase Database Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const registrationStates = new Map();
export function clearBotUserCache() {
  registrationStates.clear();
}
const userLanguages = new Map();

export function getUserLanguage(userId) {
  return userLanguages.get(userId) || "en";
}

export function setUserLanguage(userId, lang) {
  userLanguages.set(userId, lang);
}

export async function getFormattedBotResponse(responseKey, vars = {}) {
  let responses = {};
  try {
    responses = await dbStore.getTelegramResponses();
  } catch (_e) {
    responses = dbStore.DEFAULT_TELEGRAM_RESPONSES || {};
  }

  let text = responses[responseKey] || dbStore.DEFAULT_TELEGRAM_RESPONSES?.[responseKey] || "";

  // Replace placeholders: {first_name}, {phone}, {auth_code}, {bot_handle}, {username}, {name}, etc.
  Object.keys(vars).forEach(k => {
    const regex = new RegExp(`\\{${k}\\}`, "gi");
    text = text.replace(regex, vars[k] || "");
  });

  return text;
}

export function getPhoneRequestKeyboard() {
  return {
    keyboard: [
      [
        {
          text: "📱 Share Phone Number & Complete Registration 🚀",
          request_contact: true
        }
      ]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  };
}

export function getValidWebAppUrl(path = "/student-dashboard.html") {
  const domain = process.env.PUBLIC_DOMAIN || process.env.BASE_URL || "https://foundersacademy.et";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (domain.startsWith("https://")) {
    return `${domain}${cleanPath}`;
  }
  return `https://foundersacademy.et${cleanPath}`;
}

export function getMainMenuReplyKeyboard() {
  return {
    keyboard: [
      [
        { text: "📚 My Courses" },
        { text: "🎓 Browse Courses" }
      ],
      [
        { text: "🎟️ Redeem Giveaway" },
        { text: "💬 Support" }
      ],
      [
        { text: "🔑 Forgot Password" },
        { text: "💳 Payment Channels" }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true
  };
}

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
  try {
    const { data: courses, error } = await supabase.from("courses").select("*");
    if (!error && courses) {
      return courses.filter((c) => c.status === "ON" || c.status === "active");
    }
  } catch (err) {
    console.error("[Bot Supabase Query Warning]:", err);
  }
  return [];
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

export async function findPhoneNumberForTelegramUser(telegramId, username = "") {
  if (!telegramId) return "";
  const stringId = String(telegramId);
  const numericId = Number(telegramId);
  const tgIdStr = `TG-${stringId}`;
  const rawUsername = username ? username.replace(/^@/, "").trim() : "";
  const cleanUsername = rawUsername ? `@${rawUsername}` : "";

  // Helper to extract phone from record regardless of column name
  const extractPhone = (rec) => {
    if (!rec) return "";
    const val = rec.phone || rec.phone_number || rec.phonenumber || rec.student_phone;
    return val && String(val).trim() !== "" ? String(val).trim() : "";
  };

  // 1. Check students table in Supabase
  try {
    const { data: list } = await supabase
      .from("students")
      .select("*")
      .or(`id.eq.${tgIdStr},telegram_id.eq.${stringId},chat_id.eq.${stringId}${cleanUsername ? `,username.eq.${cleanUsername}` : ''}`);

    if (list && Array.isArray(list) && list.length > 0) {
      const matchWithPhone = list.find(s => Boolean(extractPhone(s)));
      if (matchWithPhone) return extractPhone(matchWithPhone);
    }
  } catch (_e) {}

  // 2. Check telegram_users table in Supabase
  try {
    const { data: list } = await supabase
      .from("telegram_users")
      .select("*")
      .or(`telegram_id.eq.${numericId},telegram_id.eq.${stringId}${rawUsername ? `,username.eq.${rawUsername}` : ''}`);

    if (list && Array.isArray(list) && list.length > 0) {
      const matchWithPhone = list.find(u => Boolean(extractPhone(u)));
      if (matchWithPhone) return extractPhone(matchWithPhone);
    }
  } catch (_e) {}

  // 3. Check transactions table in Supabase
  try {
    const { data: txns } = await supabase
      .from("transactions")
      .select("student_phone, student_name, metadata")
      .or(`student_name.eq.${stringId},student_name.eq.${tgIdStr}${cleanUsername ? `,student_name.eq.${cleanUsername}` : ''}`);

    if (txns && Array.isArray(txns) && txns.length > 0) {
      const match = txns.find(t => Boolean(extractPhone(t)));
      if (match) return extractPhone(match);
    }
  } catch (_e) {}

  // 4. Check dbStore.getStudents()
  try {
    const allStudents = await dbStore.getStudents();
    const match = allStudents.find(s => {
      const p = extractPhone(s);
      if (!p) return false;
      const sId = String(s.id || "");
      const sTg = String(s.telegram_id || "");
      const sChat = String(s.chat_id || "");
      const sUser = String(s.username || "");
      return sId === tgIdStr || sId === stringId || sTg === stringId || sChat === stringId || (cleanUsername && sUser === cleanUsername);
    });

    if (match) return extractPhone(match);
  } catch (_e) {}

  return "";
}

export async function isUserRegistered(telegramId) {
  if (!telegramId) return false;
  const phone = await findPhoneNumberForTelegramUser(telegramId);
  return Boolean(phone && phone.trim() !== "");
}

export async function findNameForPhoneNumber(phone) {
  const cleanP = cleanPhoneDigits(phone);
  if (!cleanP) return "";

  try {
    const allStudents = await dbStore.getStudents();
    const match = allStudents.find(s => {
      const sPhoneClean = cleanPhoneDigits(s.phone);
      return sPhoneClean && (sPhoneClean === cleanP || cleanP.endsWith(sPhoneClean) || sPhoneClean.endsWith(cleanP)) && s.name && s.name.trim() !== "";
    });
    if (match) return match.name.trim();
  } catch (_e) {}

  try {
    const { data: txns } = await supabase.from("transactions").select("student_name, student_phone");
    if (txns && Array.isArray(txns)) {
      const match = txns.find(t => {
        const tPhoneClean = cleanPhoneDigits(t.student_phone);
        return tPhoneClean && (tPhoneClean === cleanP || cleanP.endsWith(tPhoneClean) || tPhoneClean.endsWith(cleanP)) && t.student_name && t.student_name.trim() !== "";
      });
      if (match) return match.student_name.trim();
    }
  } catch (_e) {}

  return "";
}

export async function ensureTelegramUserInStudents(from) {
  if (!from || !from.id) return null;

  const telegramId = from.id;
  const stringId = String(telegramId);
  const tgIdStr = `TG-${stringId}`;

  const rawUsername = from.username ? from.username.replace(/^@/, "").trim() : "";
  const cleanUsername = rawUsername ? `@${rawUsername}` : "";
  const fullName = [from.first_name, from.last_name].filter(Boolean).join(" ").trim() || (cleanUsername || `User_${stringId}`);
  const userEmail = cleanUsername || `user_${stringId}@foundersacademy.et`;
  const formattedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

  let studentObj = null;

  // 1. Fetch student list from Supabase
  try {
    const { data: list } = await supabase
      .from("students")
      .select("*")
      .or(`id.eq.${tgIdStr},telegram_id.eq.${stringId},chat_id.eq.${stringId}`);
    if (list && Array.isArray(list) && list.length > 0) {
      studentObj = list.find(s => (s.phone || s.phone_number || s.phonenumber) && String(s.phone || s.phone_number || s.phonenumber).trim() !== "") || list[0];
    }
  } catch (_e) {}

  // 2. Fetch from dbStore if not found in Supabase
  if (!studentObj) {
    try {
      const allStudents = await dbStore.getStudents();
      studentObj = allStudents.find(s => {
        const sId = String(s.id || "");
        return sId === tgIdStr || sId === stringId || String(s.telegram_id) === stringId || String(s.chat_id) === stringId;
      });
    } catch (_e) {}
  }

  // 3. Search for any phone number associated with this chat ID / Telegram user across ALL tables
  const existingPhone = await findPhoneNumberForTelegramUser(telegramId, from.username);

  // If student is missing or phone was empty, attach existingPhone!
  if (!studentObj) {
    const newPayload = {
      id: tgIdStr,
      name: "",
      phone: existingPhone || "",
      email: userEmail,
      username: cleanUsername,
      telegram_id: stringId,
      chat_id: stringId,
      telegram_username: rawUsername,
      joined_date: formattedDate
    };

    try {
      await supabase.from("students").upsert([newPayload], { onConflict: "id" });
      await dbStore.addStudent(newPayload);
      console.log(`[Bot DB] ⚡ Stored new student in students: ${stringId} Phone: ${existingPhone}`);
    } catch (err) {
      console.error("[Bot DB Upsert Error]:", err);
    }

    studentObj = newPayload;
  } else {
    const updates = {};
    if (existingPhone && (!studentObj.phone || String(studentObj.phone).trim() === "")) {
      updates.phone = existingPhone;
      studentObj.phone = existingPhone;
    }
    if (cleanUsername && studentObj.username !== cleanUsername) {
      updates.username = cleanUsername;
      updates.telegram_username = rawUsername;
    }
    if (!studentObj.telegram_id || studentObj.telegram_id !== stringId) {
      updates.telegram_id = stringId;
      updates.chat_id = stringId;
    }

    if (Object.keys(updates).length > 0) {
      try {
        await supabase.from("students").update(updates).eq("id", studentObj.id);
        await dbStore.updateStudent(studentObj.id, updates);
        Object.assign(studentObj, updates);
      } catch (_e) {}
    }
  }

  return studentObj;
}

export async function registerBotUser(user) {
  const numericId = Number(user.telegram_id);
  const stringId = String(user.telegram_id);

  const rawUsername = user.username ? user.username.replace(/^@/, "").trim() : "";
  const cleanUsername = rawUsername ? `@${rawUsername}` : "";
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || (cleanUsername ? `@${cleanUsername}` : `User_${user.telegram_id}`);
  const userEmail = cleanUsername ? `@${cleanUsername}` : `user_${user.telegram_id}@foundersacademy.et`;
  const formattedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

  const studentPayload = {
    id: `TG-${user.telegram_id}`,
    name: "",
    phone: user.phone_number || "",
    email: userEmail,
    username: cleanUsername,
    telegram_id: stringId,
    chat_id: stringId,
    telegram_username: rawUsername,
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
          username: rawUsername,
          phone_number: user.phone_number || "",
          is_verified: true,
          registered_at: new Date().toISOString()
        }], { onConflict: "telegram_id" });
      } catch (_e) { /* fallback */ }

      await dbStore.addStudent(studentPayload);
      console.log(`[Bot Supabase] ⚡ Fast Synced Student: ${fullName} (${studentPayload.id}) Phone: ${user.phone_number} Username: ${cleanUsername}`);
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
          const courseKey = txn.course_id || txn.course_title || "unknown";
          
          if (processedCourses.has(courseKey)) continue;
          processedCourses.add(courseKey);

          const course = allCourses.find((c) => c.id === txn.course_id || c.title === txn.course_title) || allCourses[0];

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
            title: course?.title || txn.course_title || "Course",
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

  const upperText = text.trim().toUpperCase();

  // 0. Student Web 1-Tap Auth Handler (e.g. /start auth_784912)
  if (upperText.startsWith("/START AUTH_")) {
    const authCode = upperText.replace("/START AUTH_", "").trim();
    await registerBotUser({
      telegram_id: telegramId,
      first_name: firstName,
      last_name: from.last_name || "",
      username: from.username || "",
      phone_number: "",
      registered_at: new Date().toISOString()
    });

    if (dbStore && typeof dbStore.authorizeStudentTelegramOtpFromBot === "function") {
      await dbStore.authorizeStudentTelegramOtpFromBot(authCode, from);
    }

    const otpMsgText = await getFormattedBotResponse("otp_auth", { first_name: firstName, auth_code: authCode });
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: otpMsgText,
      parse_mode: "Markdown"
    });
    return;
  }

  // 0. Student Password Reset Telegram Deep Link Handler (e.g. /start resetpassword, /start reset_251912345678)
  if (upperText.startsWith("/START RESETPASSWORD") || upperText.startsWith("/START RESET_") || upperText.startsWith("/START RESET")) {
    await handleForgotPassword(chatId, from, text);
    return;
  }

  // 0. Student Account Telegram Linking Handler (e.g. /start connect_251912345678)
  if (upperText.startsWith("/START CONNECT_") || upperText.startsWith("/START CONNECT")) {
    const connectMsgText = await getFormattedBotResponse("welcome_connect", { first_name: firstName });
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: connectMsgText,
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [
          [{ text: "📱 Share Phone Number & Link Profile", request_contact: true }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
    return;
  }

  // 0. Admin 2FA Pairing Code Handler (e.g. /link_admin FA-89241, /start admin_FA-89241, /start link_FA-89241, or FA-89241)
  const pairingMatch = text.match(/FA-\d{5}/i);
  if (
    pairingMatch ||
    upperText.startsWith("/LINK_ADMIN") || 
    upperText.startsWith("/START ADMIN_") || 
    upperText.startsWith("/START LINK_") || 
    upperText.startsWith("FA-") || 
    upperText.startsWith("/ADMIN")
  ) {
    let pairingCode = pairingMatch ? pairingMatch[0].toUpperCase() : upperText
      .replace("/LINK_ADMIN", "")
      .replace("/START ADMIN_", "")
      .replace("/START LINK_", "")
      .replace("/ADMIN", "")
      .replace("/START", "")
      .trim();

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
        text: `🔐 *Admin 2FA Device Successfully Linked!*\n\nHello *${firstName}* (@${from.username || 'admin'}), this Telegram chat is now officially registered as a *Founders Academy Super Admin 2FA Authenticator*.\n\n🛡️ *Security:* Whenever an administrator logs into the portal, a secure 6-digit one-time password (OTP) will be sent here directly.`,
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

  // Check if sender is a registered Admin (Supports Multi-Admin Team)
  const adminSec = await dbStore.getAdminSecurity();
  const linkedList = Array.isArray(adminSec?.linkedAdminChats) ? adminSec.linkedAdminChats : [];
  const isLinkedAdmin = (adminSec?.telegramAdminChatId && String(adminSec.telegramAdminChatId) === String(telegramId)) ||
    linkedList.some(a => String(a.chatId).trim() === String(telegramId).trim());

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

  // --- REGISTRATION & RECOGNITION GUARD ---
  let currentStudent = await ensureTelegramUserInStudents(from);

  // 1. HIGH-PRIORITY CONTACT & PHONE NUMBER HANDLER
  let sharedPhone = "";
  if (msg.contact && msg.contact.phone_number) {
    const rawP = String(msg.contact.phone_number).trim();
    sharedPhone = rawP.startsWith("+") ? rawP : `+${rawP}`;
  } else if (!currentStudent?.phone || currentStudent.phone.trim() === "") {
    const cleanDigits = cleanPhoneDigits(text);
    if (cleanDigits && cleanDigits.length >= 9 && (text.startsWith("+") || text.startsWith("09") || text.startsWith("07") || text.startsWith("251"))) {
      sharedPhone = text.startsWith("+") ? text.trim() : `+251${cleanDigits.slice(-9)}`;
    }
  }

  if (sharedPhone) {
    let studentName = (currentStudent?.name && currentStudent.name.trim() !== "") ? currentStudent.name.trim() : "";
    if (!studentName) {
      studentName = await findNameForPhoneNumber(sharedPhone);
    }

    // Store shared phone number to students.phone in database and memory immediately!
    await dbStore.saveStudentPhone(telegramId, sharedPhone, studentName);
    if (currentStudent) {
      currentStudent.phone = sharedPhone;
      if (studentName) currentStudent.name = studentName;
    }

    // IF FULL NAME IS NOT FOUND FOR THIS PHONE NUMBER -> ASK FOR FULL NAME (STEP 2 OF 2)
    if (!studentName) {
      registrationStates.set(chatId, { state: "AWAITING_FULL_NAME", pendingPhone: sharedPhone });
      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `✍️ *Account Registration (Step 2 of 2)*\n\nThank you for sharing your phone number! 📱\nNow, please reply to this message with your *Full Name* (First and Last Name) to complete your student profile:`,
        parse_mode: "Markdown"
      });
      return;
    }

    const rawUsername = from.username ? from.username.replace(/^@/, "").trim() : "";
    const cleanUsername = rawUsername ? `@${rawUsername}` : "";
    const generatedPassword = currentStudent?.password_hash || String(Math.floor(100000 + Math.random() * 900000));

    const updatePayload = {
      name: studentName,
      phone: sharedPhone,
      password_hash: generatedPassword,
      username: cleanUsername,
      telegram_id: String(telegramId),
      chat_id: String(telegramId),
      telegram_username: rawUsername
    };

    try {
      await supabase.from("students").upsert([{
        id: `TG-${telegramId}`,
        email: cleanUsername || `user_${telegramId}@foundersacademy.et`,
        ...updatePayload
      }], { onConflict: "id" });

      await supabase.from("students").update(updatePayload).eq("telegram_id", String(telegramId));
      await supabase.from("students").update(updatePayload).eq("chat_id", String(telegramId));
    } catch (err) {
      console.error("[Bot Contact Supabase Update Error]:", err);
    }

    try {
      await supabase.from("telegram_users").upsert([{
        telegram_id: Number(telegramId),
        first_name: from.first_name || "",
        last_name: from.last_name || "",
        username: rawUsername,
        phone_number: sharedPhone,
        is_verified: true,
        registered_at: new Date().toISOString()
      }], { onConflict: "telegram_id" });
    } catch (_e) {}

    await dbStore.updateStudent(`TG-${telegramId}`, updatePayload);

    if (currentStudent) {
      currentStudent.name = studentName;
      currentStudent.phone = sharedPhone;
      currentStudent.password_hash = generatedPassword;
    }

    registrationStates.delete(chatId);

    console.log(`[Bot] ✅ SUCCESSFULLY REGISTERED PHONE FOR ${studentName} (${telegramId}): ${sharedPhone}`);

    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `🎉 *Registration Complete, ${studentName}!* 🌟\n\nYour account is now fully verified:\n👤 *Full Name*: ${studentName}\n📱 *Phone*: \`${sharedPhone}\`\n🔑 *Password*: \`${generatedPassword}\`\n\nChoose an option from the menu below to get started! 🚀`,
      parse_mode: "Markdown"
    });

    await sendMainMenu(chatId, studentName);
    return;
  }

  // 2. REGISTRATION CONTROLLER: STEP 1 (PHONE) -> STEP 2 (FULL NAME)
  const regState = registrationStates.get(chatId)?.state;
  const hasPhone = currentStudent && currentStudent.phone && currentStudent.phone.trim() !== "";

  // Step 2 Response Handler: User replies with Full Name
  if (regState === "AWAITING_FULL_NAME" && text && !text.startsWith("/")) {
    const enteredFullName = text.trim();
    const pendingPhone = registrationStates.get(chatId)?.pendingPhone || currentStudent?.phone || "";

    if (pendingPhone) {
      await dbStore.saveStudentPhone(telegramId, pendingPhone, enteredFullName);
    } else {
      await dbStore.updateStudent(`TG-${telegramId}`, { name: enteredFullName });
    }

    if (currentStudent) {
      currentStudent.name = enteredFullName;
      if (pendingPhone) currentStudent.phone = pendingPhone;
    }

    registrationStates.delete(chatId);

    const generatedPassword = currentStudent?.password_hash || String(Math.floor(100000 + Math.random() * 900000));
    const updatePayload = {
      name: enteredFullName,
      phone: pendingPhone,
      password_hash: generatedPassword
    };
    await dbStore.saveStudentPhone(telegramId, pendingPhone, enteredFullName);
    await dbStore.updateStudent(`TG-${telegramId}`, updatePayload);
    try {
      await supabase.from("students").update(updatePayload).eq("id", `TG-${telegramId}`);
      await supabase.from("students").update(updatePayload).eq("telegram_id", String(telegramId));
      await supabase.from("students").update(updatePayload).eq("chat_id", String(telegramId));
    } catch (_e) {}

    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `🎉 *Registration Complete, ${enteredFullName}!* 🌟\n\nYour account is now fully verified:\n👤 *Full Name*: ${enteredFullName}\n📱 *Phone*: \`${pendingPhone || 'N/A'}\`\n🔑 *Password*: \`${generatedPassword}\`\n\nChoose an option from the menu below to get started! 🚀`,
      parse_mode: "Markdown"
    });

    await sendMainMenu(chatId, enteredFullName);
    return;
  }

  // Step 1 Check: If phone is missing, ASK FOR PHONE NUMBER FIRST (STEP 1 OF 2)
  if (!hasPhone) {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `📱 *Account Registration (Step 1 of 2)*\n\nWelcome to **Founders Academy**! 🎓\nPlease tap the button below to share your *Phone Number* to get started:`,
      parse_mode: "Markdown",
      reply_markup: getPhoneRequestKeyboard()
    });
    return;
  }

  // Step 2 Check: If phone exists but name is missing for that number, ASK FOR FULL NAME (STEP 2 OF 2)
  const hasName = currentStudent && currentStudent.name && currentStudent.name.trim() !== "";
  if (!hasName) {
    registrationStates.set(chatId, { state: "AWAITING_FULL_NAME", pendingPhone: currentStudent.phone });
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `✍️ *Account Registration (Step 2 of 2)*\n\nThank you for verifying your phone! 📱\nPlease reply to this message with your *Full Name* (First and Last Name) to complete your student profile:`,
      parse_mode: "Markdown"
    });
    return;
  }



  // --- REGISTERED USER PATH (Chat ID DOES have phone number in database) ---
  registrationStates.delete(chatId);

  const rawUsername = from.username ? from.username.replace(/^@/, "").trim() : "";
  const cleanUsername = rawUsername ? `@${rawUsername}` : "";
  if (cleanUsername) {
    try {
      await supabase.from("students").update({
        username: cleanUsername,
        telegram_username: rawUsername
      }).or(`id.eq.TG-${telegramId},telegram_id.eq.${telegramId},chat_id.eq.${telegramId}`);
    } catch (_e) {}
  }

  // Handle /start for registered users (Send main menu directly without asking for phone number)
  if (upperText === "/START" || upperText === "/START MAIN" || upperText === "START") {
    await sendMainMenu(chatId, firstName);
    return;
  }

  // If registered user re-shares contact
  if (msg.contact) {
    const rawPhone = msg.contact.phone_number || "";
    const phoneNumber = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `✅ *Profile Already Verified!* 🌟\n\nYour account is linked to \`${phoneNumber}\`. Choose where you'd like to go next below:`,
      parse_mode: "Markdown"
    });
    await sendMainMenu(chatId, firstName);
    return;
  }

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

  if (text.includes("Receipt") || text.includes("ደረሰኝ") || text.includes("Nagahee") || text === "/receipt") {
    await onSubmitReceiptClicked(chatId, from, msg);
    return;
  }

  if (text.includes("Language") || text.includes("ቋንቋ") || text.includes("Afaan") || text === "/language" || text === "/lang") {
    await onLanguageClicked(chatId, from, msg);
    return;
  }

  if (text.includes("Refer") || text.includes("ጋብዝ") || text.includes("Affaari") || text === "/refer") {
    await onReferralClicked(chatId, from, msg);
    return;
  }

  if (
    text.includes("My Courses") ||
    text.includes("my_courses") ||
    text === "/mycourses" ||
    text === "/my_courses" ||
    text.includes("Enrolled") ||
    text.includes("Links") ||
    text === "/links" ||
    text.includes("ሊንክ") ||
    text.includes("ትምህርቶቼ")
  ) {
    await onMyCoursesClicked(chatId, from, msg);
    return;
  }

  if (text.includes("Support") || text === "/support" || text.includes("እገዛ")) {
    await onSupportClicked(chatId, from, msg);
    return;
  }

  if (
    text.includes("Browse Courses") ||
    text.includes("All Courses") ||
    text.includes("Catalog") ||
    text === "/courses" ||
    text.includes("Courses") ||
    text.includes("ኮርሶች")
  ) {
    await onCoursesClicked(chatId, from, msg);
    return;
  }

  if (text.includes("Forgot Password") || text.includes("Password") || text === "/forgotpassword" || text.startsWith("/resetpassword") || upperText.startsWith("/RESETPASSWORD")) {
    await handleForgotPassword(chatId, from, text);
    return;
  }

  if (text === "/pay" || text === "/bank" || text === "/payment" || text.includes("Payment") || text.includes("ክፍያ")) {
    await onBankPaymentClicked(chatId, from, msg);
    return;
  }

  console.log(`[Bot] Greeting registered learner: ${firstName} (${telegramId})`);
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
        `📘 *Course:* ${res.courseTitle || 'Founders Course'}\n` +
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
        `📘 *Course:* ${res.courseTitle || 'Founders Course'}\n\n` +
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

export async function handleForgotPassword(chatId, user, text) {
  const telegramId = user.id;
  const firstName = user.first_name || "Student";
  const trimmed = (text || "").trim();
  const upper = trimmed.toUpperCase();

  // Extract phone number from deep link if present (e.g. /start reset_0912345678 or reset_251912345678)
  let phoneInLink = "";
  const matchPhone = trimmed.match(/reset_(\d+)/i);
  if (matchPhone) {
    phoneInLink = matchPhone[1];
  }

  // Check if user specified a password: /resetpassword MyNewPass123 OR /reset MyNewPass123 OR directly typed password
  let newPass = "";
  if (upper.startsWith("/RESETPASSWORD ") || upper.startsWith("/RESET_PASSWORD ") || upper.startsWith("/RESETPASS ") || upper.startsWith("/RESET ")) {
    const parts = trimmed.split(/\s+/);
    newPass = parts.slice(1).join(" ").trim();
  } else if (!upper.startsWith("/START") && !upper.includes("FORGOT") && !upper.includes("RESET") && trimmed.length >= 4) {
    newPass = trimmed;
  }

  // If no custom password provided yet, generate a random 8-character password automatically
  let isAutoGenerated = false;
  if (!newPass || newPass.length < 4) {
    isAutoGenerated = true;
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let rand = "";
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    newPass = `FA-${rand}`;
  }

  try {
    const cleanTgId = String(telegramId);
    let studentRecord = null;

    // 1. Search by deep link phone number (if present)
    if (phoneInLink) {
      const allStudents = await dbStore.getStudents();
      const cleanLinkPhone = phoneInLink.replace(/\D/g, "");
      studentRecord = allStudents.find(s => {
        const sPhone = (s.phone || "").replace(/\D/g, "");
        return sPhone && cleanLinkPhone && (sPhone === cleanLinkPhone || sPhone.endsWith(cleanLinkPhone.slice(-9)) || cleanLinkPhone.endsWith(sPhone.slice(-9)));
      });
    }

    // 2. Search Supabase by Telegram ID / Chat ID
    if (!studentRecord) {
      const { data: student } = await supabase
        .from("students")
        .select("*")
        .or(`id.eq.TG-${cleanTgId},telegram_id.eq.${cleanTgId},chat_id.eq.${cleanTgId}`)
        .maybeSingle();

      if (student) studentRecord = student;
    }

    // 3. Search by telegram_id / phone in dbStore
    if (!studentRecord) {
      const allStudents = await dbStore.getStudents();
      const found = allStudents.find(s => {
        const sTgId = String(s.telegram_id || s.chat_id || "");
        return sTgId === cleanTgId || String(s.id) === `TG-${cleanTgId}`;
      });
      if (found) studentRecord = found;
    }

    if (studentRecord) {
      // Reset student password in Supabase and dbStore memory!
      await dbStore.resetStudentPassword({ phone: studentRecord.phone, newPassword: newPass });
      await dbStore.updateStudent(studentRecord.id, { password_hash: newPass, telegram_id: cleanTgId, chat_id: String(chatId) });

      const loginUrl = getValidWebAppUrl("/student-auth.html");

      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `🎉 *PASSWORD RESET SUCCESSFUL!* 🔐✨\n\n` +
          `Hello *${firstName}*,\n` +
          `Your Founders Academy student account password has been updated:\n\n` +
          `👤 *Account:* ${studentRecord.name || 'Student'} (${studentRecord.phone})\n` +
          `🔑 *New Password:* \`${newPass}\`\n\n` +
          `👉 *Log in to your student portal:* ${loginUrl}\n\n` +
          `_Tip: Tap the password above to copy it with 1-click and log in immediately!_`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔑 Open Student Login Portal", url: loginUrl }]
          ]
        }
      });
      return;
    }
  } catch (err) {
    console.error("[Bot Password Reset Error]:", err);
  }

  // Fallback: Save state so next contact share or message resets password
  registrationStates.set(chatId, { action: "awaiting_password_reset", phone: phoneInLink });

  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: `⚠️ *Student Account Identification Required*\n\n` +
      `Hello *${firstName}*,\nTo update your password, please tap **📱 Share Phone Number & Reset Password** below so we can find your registered student profile!`,
    parse_mode: "Markdown",
    reply_markup: {
      keyboard: [
        [{ text: "📱 Share Phone Number & Reset Password", request_contact: true }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
}

async function onSubmitReceiptClicked(chatId, user, msg) {
  const lang = getUserLanguage(user.id);
  
  if (lang === "am") {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `📄 *የባንክ ክፍያ ደረሰኝ ማረጋገጫ (Telebirr / CBE / Abyssinia / Awash)* 🏦\n\nእባክዎን የከፈሉበትን **የክፍያ ማረጋገጫ ቁጥር** (ምሳሌ፦ \`FT24010XYZ88\` ወይም \`TLB-77112233\`) ወይም **የደረሰኙን ፎቶ/ስክሪንሾት** እዚህ ይላኩልን።\n\nሲልኩልን በራስ-ሰር ተመርምሮ የመማሪያ ክፍሉ ሊንክ ይላክልዎታል! 🚀`,
      parse_mode: "Markdown"
    });
  } else if (lang === "om") {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `📄 *Nagahee Kaffaltii Mirkaneessuu (Telebirr / CBE / Abyssinia)* 🏦\n\nMaaloo **Lakkoofsa Nagahee Kaffaltii** keessanii (fakkeenya: \`FT24010XYZ88\` ykn \`TLB-77112233\`) ykn **Fakkii Nagahee** asii ergaa.\n\nBattalumatti mirkanaa'ee geessituun kaffaltii isiniif ergama! 🚀`,
      parse_mode: "Markdown"
    });
  } else {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `📄 *Submit Payment Receipt & Reference Code* 🏦\n\nPlease reply with your payment **Transaction Reference Code** (e.g., \`FT24010XYZ88\` or \`TLB-77112233\`) or upload a **Photo/Screenshot** of your payment receipt.\n\nOur system will verify your payment automatically via Verify.ET and unlock your 1-time classroom links instantly! 🚀`,
      parse_mode: "Markdown"
    });
  }
}

async function onLanguageClicked(chatId, user, msg) {
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: `🌐 *Select Your Preferred Language / ቋንቋ ይምረጡ / Afaan Filadhu:*`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🇪🇹 አማርኛ (Amharic)", callback_data: "set_lang_am" },
          { text: "🇪🇹 Afaan Oromoo", callback_data: "set_lang_om" }
        ],
        [
          { text: "🇬🇧 English", callback_data: "set_lang_en" }
        ]
      ]
    }
  });
}

async function onReferralClicked(chatId, user, msg) {
  const refLink = `https://t.me/founders_academybot?start=ref_${user.id}`;
  const lang = getUserLanguage(user.id);

  if (lang === "am") {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `👥 *የFounders Academy የጋብዝ እና ተሸላም ፕሮግራም* 🎁✨\n\nጓደኞችዎን ይጋብዙ! የእርስዎ ልዩ የመጋበዣ ሊንክ፦\n👉 \`${refLink}\`\n\nጓደኛዎ በእርስዎ ሊንክ ሲመዘገብ የነፃ ትምህርት እና ልዩ ቅናሾች ያገኛሉ!`,
      parse_mode: "Markdown"
    });
  } else if (lang === "om") {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `👥 *Badhaasa Affaaraa Founders Academy* 🎁✨\n\nHiriyoota keessan affeeraa! Geessituu affaaraa keessan:\n👉 \`${refLink}\`\n\nYeroo hiriyyaan keessan sarara keessaniin galmaa'u badhaasa speshala argattu!`,
      parse_mode: "Markdown"
    });
  } else {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `👥 *Founders Academy Student Referral Program* 🎁✨\n\nInvite your friends to master high-income skills! Your unique referral link is:\n👉 \`${refLink}\`\n\nEarn bonus discount points and free course vouchers whenever a friend registers using your link!`,
      parse_mode: "Markdown"
    });
  }
}

// Action Handlers (Playful & Educational)

export async function onMyCoursesClicked(chatId, user, msg) {
  const telegramId = user.id;
  const firstName = user.first_name || "Student";
  console.log(`[Bot Handler] 'My Courses' selected by ${firstName} (${telegramId})`);

  let phone = "";
  if (!phone) {
    const cleanTgId = String(telegramId);
    try {
      const { data: student } = await supabase
        .from("students")
        .select("phone")
        .or(`id.eq.TG-${cleanTgId},telegram_id.eq.${cleanTgId},chat_id.eq.${cleanTgId}`)
        .maybeSingle();
      if (student?.phone) phone = student.phone;
    } catch (_e) {}
  }
  if (!phone) {
    try {
      const { data: tgUser } = await supabase.from("telegram_users").select("phone_number").eq("telegram_id", telegramId).maybeSingle();
      if (tgUser?.phone_number) phone = tgUser.phone_number;
    } catch (_e) {}
  }

  // 1. Fetch verified enrolled courses from dbStore student roster
  const searchKey = phone || `TG-${telegramId}` || String(telegramId);
  let enrolledCourses = [];
  try {
    const studentInfo = await dbStore.getStudentCoursesWithLinks(searchKey);
    if (studentInfo && Array.isArray(studentInfo.courses)) {
      enrolledCourses = studentInfo.courses;
    }
  } catch (_e) {}

  // 2. Fetch 1-time classroom invite links if phone is linked
  let invites = [];
  if (phone) {
    try {
      invites = await findEnrollmentInvitesByPhone(phone, firstName);
    } catch (_e) {}
  }

  const webAppUrl = getValidWebAppUrl("/student-dashboard.html");
  let inviteButtons = [
    [{ text: "🚀 Open Student Dashboard (Mini App)", web_app: { url: webAppUrl } }]
  ];

  let msgText = `📚 *My Enrolled Courses & Portals* 🎓\n\n`;
  msgText += `👤 *Student:* ${firstName}\n`;
  if (phone) msgText += `📱 *Linked Phone:* \`${phone}\`\n`;
  msgText += `\n`;

  const addedTitles = new Set();
  let courseCount = 0;

  // Render enrolled courses from database transactions & roster
  enrolledCourses.forEach(c => {
    const title = c.title || "Course";
    if (!addedTitles.has(title)) {
      addedTitles.add(title);
      courseCount++;
      msgText += `*${courseCount}. 🎯 ${title}*\n`;
      msgText += `   • 🏷️ *Category:* ${c.category || "Course"}\n`;
      msgText += `   • ⚡ *Status:* 🟢 *${c.status || "Verified Active"}*\n`;
      if (c.tg_channel) {
        msgText += `   • 📢 *Classroom Channel:* ${c.tg_channel}\n`;
        inviteButtons.push([{ text: `📢 Join ${title.substring(0, 18)} Channel`, url: c.tg_channel }]);
      }
      if (c.tg_group) {
        msgText += `   • 💬 *Mastermind Group:* ${c.tg_group}\n`;
        inviteButtons.push([{ text: `💬 Join ${title.substring(0, 18)} Group`, url: c.tg_group }]);
      }
      msgText += `\n`;
    }
  });

  // Render 1-time single-use classroom invite links if available
  invites.forEach(item => {
    const title = item.title || "Course";
    if (!addedTitles.has(title)) {
      addedTitles.add(title);
      courseCount++;
      msgText += `*${courseCount}. 🎯 ${title}*\n`;
      if (item.alreadyClaimed) {
        msgText += `   • ⚠️ *Status:* Single-use join link already claimed.\n`;
        msgText += `   • 💡 *Note:* Access your full course materials inside the Mini App below!\n`;
      } else {
        msgText += `   • ⚡ *Status:* 🟢 *Active Invites Ready*\n`;
        if (item.channelLink) {
          msgText += `   • 📢 *Classroom Channel:* ${item.channelLink}\n`;
          inviteButtons.push([{ text: `📢 Join ${title.substring(0, 18)} Channel`, url: item.channelLink }]);
        }
        if (item.groupLink) {
          msgText += `   • 💬 *Mastermind Group:* ${item.groupLink}\n`;
          inviteButtons.push([{ text: `💬 Join ${title.substring(0, 18)} Group`, url: item.groupLink }]);
        }
      }
      msgText += `\n`;
    }
  });

  if (courseCount === 0) {
    msgText += `💡 *You haven't enrolled in any courses yet!*\n\n`;
    msgText += `Master high-income skills in SMMA, Video Editing, Content Creation, and AI Automation.\n\n`;
    msgText += `Tap *🎓 Browse Courses* to explore available courses and secure your seat!\n\n`;
  } else {
    msgText += `🔒 _Note: Single-use classroom links expire after initial entry for security._\n\n`;
  }

  msgText += `💬 Mentor Support: @foundersupportt`;
  inviteButtons.push([{ text: "💬 Talk to Mentor Support", url: "https://t.me/foundersupportt" }]);

  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: msgText,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: inviteButtons
    }
  });
}

export const onLinksClicked = onMyCoursesClicked;

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
        text: `📚 *Founders Academy Courses* 💡\n\nNew cohort courses are currently being finalized! Check back in a few moments or ask @foundersupportt for the upcoming cohort schedule.`,
        parse_mode: "Markdown"
      });
      return;
    }

    let messageText = `📚 *Founders Academy Course Catalog* 🚀💡\n\nHere are our active industry-leading courses engineered to build real-world skills and income:\n\n`;

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

// 6. Telegram Bot Engine (Webhook & Long Polling Support)
let isRunning = false;
let lastUpdateId = 0;

export async function processTelegramUpdate(update) {
  if (!update) return;

  if (update.callback_query) {
    try {
      const cb = update.callback_query;
      const maint = await getMaintenanceStatus();
      if (maint && maint.status === "ON") {
        const adminSec = await dbStore.getAdminSecurity();
        const isFromAdmin = adminSec?.telegramAdminChatId && String(adminSec.telegramAdminChatId) === String(cb.from?.id);
        if (!isFromAdmin) {
          await telegramApi("answerCallbackQuery", {
            callback_query_id: cb.id,
            text: "🚧 Founders Academy Bot is currently paused in maintenance mode.",
            show_alert: true
          });
          return;
        }
      }

      await telegramApi("answerCallbackQuery", { callback_query_id: cb.id });

      const cbChatId = cb.message?.chat?.id || cb.from?.id;
      const cbData = cb.data || "";

      if (cbData.startsWith("set_lang_")) {
        const lang = cbData.replace("set_lang_", "");
        setUserLanguage(cb.from.id, lang);
        const langNames = { am: "አማርኛ", om: "Afaan Oromoo", en: "English" };
        await telegramApi("sendMessage", {
          chat_id: cbChatId,
          text: `✅ Language set to *${langNames[lang] || 'English'}*!`,
          parse_mode: "Markdown"
        });
        await sendMainMenu(cbChatId, cb.from?.first_name || "Student");
      } else if (cbData === "cmd_courses" || cbData === "browse_courses") {
        await onCoursesClicked(cbChatId, cb.from, cb.message);
      } else if (cbData === "cmd_mycourses" || cbData === "my_courses") {
        await onMyCoursesClicked(cbChatId, cb.from, cb.message);
      } else if (cbData === "cmd_support" || cbData === "support") {
        await onSupportClicked(cbChatId, cb.from, cb.message);
      } else if (cbData === "cmd_bank" || cbData === "payment_channels") {
        await onBankPaymentClicked(cbChatId, cb.from, cb.message);
      } else if (cbData === "cmd_giveaway" || cbData === "redeem_giveaway") {
        await handleGiveawayRedemption(cbChatId, cb.from, "");
      } else if (cbData === "cmd_forgot") {
        await handleForgotPassword(cbChatId, cb.from, "");
      }
    } catch (cbErr) {
      console.error("[Bot Webhook Error] Exception handling callback_query:", cbErr);
    }
  }

  if (update.message) {
    try {
      await handleMessage(update.message);
    } catch (msgErr) {
      console.error("[Bot Webhook Error] Exception handling message:", msgErr);
    }
  }
}

export async function setupWebhook(domainOrUrl) {
  if (!BOT_TOKEN) return false;

  let webhookUrl = domainOrUrl || process.env.WEBHOOK_URL || "";
  if (!webhookUrl) return false;

  if (!webhookUrl.startsWith("http")) {
    webhookUrl = `https://${webhookUrl}`;
  }

  if (!webhookUrl.startsWith("https://")) {
    console.warn("⚠️ [Bot Webhook Warning] Webhook requires a secure https:// URL.");
    return false;
  }

  const targetEndpoint = `${webhookUrl.replace(/\/$/, "")}/api/telegram/webhook`;

  try {
    const res = await telegramApi("setWebhook", {
      url: targetEndpoint,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true
    });

    if (res.ok) {
      console.log(`🚀 [Bot Webhook] ULTRA FAST WEBHOOK SET: ${targetEndpoint}`);
      return true;
    } else {
      console.warn(`[Bot Webhook Warning] setWebhook:`, res.description || res);
    }
  } catch (err) {
    console.error("[Bot Webhook Error] setWebhook failed:", err);
  }
  return false;
}

// 6. Bot Lifecycle & Polling Engine
export async function startBot(options = {}) {
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

  const webhookDomain = options.webhookUrl || process.env.WEBHOOK_URL || process.env.WEB_APP_URL || "";
  const preferWebhook = options.useWebhook !== false && (process.env.USE_WEBHOOK === "true" || !!webhookDomain);

  if (preferWebhook && webhookDomain) {
    const isWebhookActive = await setupWebhook(webhookDomain);
    if (isWebhookActive) {
      console.log("==================================================");
      console.log(`⚡ Telegram Bot Active: @${me.result.username} (${me.result.first_name})`);
      console.log(`⚡ Mode: WEBHOOK (Ultra-Fast Event Driven)`);
      console.log("==================================================");
      return;
    }
  }

  // Fallback to Polling Mode if no webhook URL set or local fallback needed
  try {
    await telegramApi("deleteWebhook", { drop_pending_updates: true });
    console.log("🧹 [Bot Webhook] Running in Local Long-Polling Mode.");
  } catch (_e) {}

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
          await processTelegramUpdate(update);
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

function stopBot() {
  isRunning = false;
  console.log("[Bot] Stopping polling...");
}

// If executed directly
if (process.argv[1]?.endsWith("bot.js") || process.argv[1]?.endsWith("bot.ts")) {
  startBot();
}
