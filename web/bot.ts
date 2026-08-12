/* ==========================================================================
   FOUNDERS ACADEMY - PLAYFUL & EDUCATIONAL TELEGRAM BOT ENGINE
   ========================================================================== */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

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

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "8659500401:AAGD5Kr9kgWgDnO4TCebJ1sY9i4o1h7Dth8";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://icdjgtfiqwwdqtvwuyaw.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_7SjYAbvNDwTXOVBlkuox-g_wMj58uUK";

if (!BOT_TOKEN) {
  console.error("❌ ERROR: TELEGRAM_BOT_TOKEN or BOT_TOKEN is missing in your .env file!");
  console.error("Please add TELEGRAM_BOT_TOKEN=your_token_here to .env");
}

const TELEGRAM_API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// 2. Supabase Database Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface BotUser {
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  phone_number: string;
  registered_at?: string;
}

// In-memory cache for ultra-low latency bot lookups
const userCache = new Map<number, BotUser>();
let coursesCache: any[] = [];
let lastCoursesFetchTime = 0;
const CACHE_TTL = 30000;

// Helper: Normalize phone numbers to last 9 digits for accurate matching
export function cleanPhoneDigits(phone?: string): string {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

/**
 * Generate a One-Time Unique Telegram Chat Invite Link (member_limit = 1)
 */
export async function generateOneTimeTelegramInviteLink(chatIdOrUrl: string, name: string): Promise<string> {
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
        expire_date: Math.floor(Date.now() / 1000) + (86400 * 7) // 7 days expiry
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

/**
 * Pre-warm and fetch active courses from Supabase with instant cache fallback
 */
export async function getActiveCoursesFast(): Promise<any[]> {
  const now = Date.now();
  if (coursesCache.length > 0 && (now - lastCoursesFetchTime) < CACHE_TTL) {
    return coursesCache;
  }

  try {
    const { data: courses, error } = await supabase.from("courses").select("*");
    if (!error && courses) {
      coursesCache = courses.filter((c: any) => c.status === "ON" || c.status === "active");
      lastCoursesFetchTime = now;
    }
  } catch (err) {
    console.error("[Bot Supabase Fast-Cache Warning]:", err);
  }

  return coursesCache;
}

/**
 * Get current Maintenance Mode status from Supabase / API
 */
export async function getMaintenanceStatus(): Promise<{ status: "ON" | "OFF"; title?: string; message?: string }> {
  try {
    const res = await fetch("http://localhost:3000/api/maintenance", { signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(1500) : undefined });
    const json = await res.json();
    if (json?.data) return json.data;
  } catch (_e) { /* fallback */ }
  try {
    const { data, error } = await supabase.from("maintenance").select("*").eq("id", 1).maybeSingle();
    if (!error && data) return data as any;
  } catch (_e) { /* fallback */ }
  return { status: "OFF" };
}

/**
 * Check if user is registered in Supabase database
 */
export async function isUserRegistered(telegramId: number): Promise<boolean> {
  if (userCache.has(telegramId)) {
    const cached = userCache.get(telegramId);
    if (cached?.phone_number) return true;
  }

  const tgIdStr = `TG-${telegramId}`;

  try {
    const { data: student, error: stuErr } = await supabase
      .from("students")
      .select("id, name, phone, email")
      .eq("id", tgIdStr)
      .maybeSingle();

    if (!stuErr && student && student.phone && student.phone.trim() !== "") {
      const userObj: BotUser = {
        telegram_id: telegramId,
        first_name: student.name.split(" ")[0] || "Student",
        phone_number: student.phone
      };
      userCache.set(telegramId, userObj);
      return true;
    }

    const { data: tgUser, error: tgErr } = await supabase
      .from("telegram_users")
      .select("*")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (!tgErr && tgUser && tgUser.phone_number) {
      const userObj: BotUser = {
        telegram_id: telegramId,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        username: tgUser.username,
        phone_number: tgUser.phone_number
      };
      userCache.set(telegramId, userObj);
      return true;
    }
  } catch (err) {
    console.error("[Bot DB Check Error]:", err);
  }

  return false;
}

/**
 * Register user in memory and sync to Supabase
 */
export async function registerBotUser(user: BotUser): Promise<boolean> {
  userCache.set(user.telegram_id, user);

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || `User_${user.telegram_id}`;
  const userEmail = user.username ? `${user.username}@t.me` : `user_${user.telegram_id}@foundersacademy.et`;
  const formattedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

  const studentPayload = {
    id: `TG-${user.telegram_id}`,
    name: fullName,
    phone: user.phone_number,
    email: userEmail,
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
          username: user.username || "",
          phone_number: user.phone_number,
          is_verified: true,
          registered_at: new Date().toISOString()
        }], { onConflict: "telegram_id" });
      } catch (_e) { /* fallback */ }
      console.log(`[Bot Supabase] ⚡ Fast Synced: ${fullName} (${studentPayload.id})`);
    } catch (err) {
      console.error("[Bot Supabase Sync Error]:", err);
    }
  })();

  return true;
}

/**
 * Search Supabase for verified course enrollments by phone number and generate unique invite links
 */
export async function findEnrollmentInvitesByPhone(phoneNumber: string, studentName: string = "Student") {
  const targetClean = cleanPhoneDigits(phoneNumber);
  if (!targetClean) return [];

  const foundInvites: Array<{
    title: string;
    channelLink?: string;
    groupLink?: string;
    txnId?: string;
    alreadyClaimed?: boolean;
  }> = [];

  try {
    // 1. Fetch transactions and fresh course data directly from Supabase DB
    const { data: txns } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
    const { data: courses } = await supabase.from("courses").select("*");
    const allCourses = courses && courses.length > 0 ? courses : await getActiveCoursesFast();

    if (txns && txns.length > 0) {
      // Find all transactions matching this phone
      const userTxns = txns.filter((txn: any) => {
        const txnPhoneClean = cleanPhoneDigits(txn.student_phone);
        return txnPhoneClean && (txnPhoneClean === targetClean || targetClean.endsWith(txnPhoneClean) || txnPhoneClean.endsWith(targetClean));
      });

      const processedCourses = new Set<string>();

      for (const txn of userTxns) {
        if (txn.status === "Completed" || txn.status === "VERIFIED") {
          const courseKey = txn.course_id || txn.masterclass_title || "unknown";
          
          // Process latest transaction per course
          if (processedCourses.has(courseKey)) continue;
          processedCourses.add(courseKey);

          const course = allCourses.find((c: any) => c.id === txn.course_id || c.title === txn.masterclass_title) || allCourses[0];
          const isClaimed = txn.metadata?.invite_claimed === true;

          if (isClaimed) {
            // Already claimed 1-time invite for this purchase
            foundInvites.push({
              title: course?.title || txn.masterclass_title || "Masterclass",
              txnId: txn.id,
              alreadyClaimed: true
            });
          } else {
            // Fresh purchase: generate 1-time single-use link and mark claimed in database
            const dbChannel = course?.tg_channel || "";
            const dbGroup = course?.tg_group || "";

            let channelInvite = dbChannel;
            let groupInvite = dbGroup;

            if (dbChannel) {
              channelInvite = await generateOneTimeTelegramInviteLink(dbChannel, `${studentName} Channel`);
            }
            if (dbGroup) {
              groupInvite = await generateOneTimeTelegramInviteLink(dbGroup, `${studentName} Group`);
            }

            // Mark this purchase transaction as claimed in Supabase DB
            try {
              const updatedMeta = {
                ...(txn.metadata || {}),
                invite_claimed: true,
                claimed_at: new Date().toISOString(),
                claimed_by_phone: targetClean,
                oneTimeLinks: { channel: channelInvite, group: groupInvite }
              };
              await supabase.from("transactions").update({ metadata: updatedMeta }).eq("id", txn.id);
            } catch (_e) {}

            foundInvites.push({
              title: course?.title || txn.masterclass_title || "Masterclass",
              channelLink: channelInvite,
              groupLink: groupInvite,
              txnId: txn.id,
              alreadyClaimed: false
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("[Bot Invite Search Error]:", err);
  }

  return foundInvites;
}

// 3. Telegram API Helper
export async function telegramApi(method: string, payload: Record<string, any> = {}) {
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
        { text: "📜 Certificate" }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true
  };
}

// 5. Message & Button Action Handlers (Playful & Educational)

export async function handleMessage(msg: any) {
  if (!msg || !msg.from) return;

  const chatId = msg.chat.id;
  const from = msg.from;
  const telegramId = from.id;
  const firstName = from.first_name || "Student";
  const text = (msg.text || "").trim();

  // Check Global Maintenance Status
  const maint = await getMaintenanceStatus();
  if (maint && maint.status === "ON") {
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

    // Fast Register User into Supabase
    await registerBotUser({
      telegram_id: telegramId,
      first_name: from.first_name || "",
      last_name: from.last_name || "",
      username: from.username || "",
      phone_number: phoneNumber,
      registered_at: new Date().toISOString()
    });

    // 2. Check Database for verified course enrollments & generate unique 1-time invite links
    console.log(`[Bot] Checking course enrollments for phone: ${phoneNumber}...`);
    const invites = await findEnrollmentInvitesByPhone(phoneNumber, firstName);

    if (invites.length > 0) {
      let inviteMsg = `🎉 *Boom! You're in, ${firstName}! Course Access Unlocked!* 🎓🔥\n\n`;
      inviteMsg += `We found your verified masterclass enrollment in the Founders roster:\n\n`;

      const inlineKeyboardButtons: any[] = [];

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

    // Always send the main menu to the bottom text area
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

  // 3. Menu Button Handlers
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

  // Default menu refresh
  console.log(`[Bot] Greeting existing learner: ${firstName} (${telegramId})`);
  await sendMainMenu(chatId, firstName);
}

export async function sendMainMenu(chatId: number | string, firstName: string) {
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: `✨ *Hey champion, ${firstName}!* Ready to level up today? 🚀📚\n\nChoose where you'd like to explore next:`,
    parse_mode: "Markdown",
    reply_markup: getMainMenuReplyKeyboard()
  });
}

// Action Handlers (Playful & Educational)

async function onLinksClicked(chatId: number, user: any, msg: any) {
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

  let inviteButtons: any[] = [];
  let linksMsg = `🔗 *Founders Academy Learning Portals* 🎓\n\n`;

  let invites: any[] = [];
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

async function onSupportClicked(chatId: number, user: any, msg: any) {
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

async function onCoursesClicked(chatId: number, user: any, msg: any) {
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

    activeCourses.forEach((course: any, index: number) => {
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

async function onCertificateClicked(chatId: number, user: any, msg: any) {
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

  let me: any = null;
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

  while (isRunning) {
    try {
      const updatesRes = await telegramApi("getUpdates", {
        offset: lastUpdateId + 1,
        timeout: 25
      });

      if (updatesRes.ok && Array.isArray(updatesRes.result)) {
        for (const update of updatesRes.result) {
          lastUpdateId = update.update_id;

          if (update.callback_query) {
            const maint = await getMaintenanceStatus();
            if (maint && maint.status === "ON") {
              await telegramApi("answerCallbackQuery", {
                callback_query_id: update.callback_query.id,
                text: "🚧 Founders Academy Bot is currently paused in maintenance mode.",
                show_alert: true
              });
              continue;
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
      }
    } catch (err) {
      console.error("[Bot] Polling loop error:", err);
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

export function stopBot() {
  isRunning = false;
  console.log("[Bot] Stopping polling...");
}

// If executed directly
if (import.meta.main || process.argv[1]?.endsWith("bot.ts") || process.argv[1]?.endsWith("bot.js")) {
  startBot();
}
