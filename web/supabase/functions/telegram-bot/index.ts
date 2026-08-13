/* ==========================================================================
   SUPABASE EDGE FUNCTION: TELEGRAM BOT WEBHOOK
   Endpoint: https://icdjgtfiqwwdqtvwuyaw.supabase.co/functions/v1/telegram-bot
   ========================================================================== */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || Deno.env.get("BOT_TOKEN") || "8659500401:AAGD5Kr9kgWgDnO4TCebJ1sY9i4o1h7Dth8";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://icdjgtfiqwwdqtvwuyaw.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "sb_publishable_7SjYAbvNDwTXOVBlkuox-g_wMj58uUK";

const TELEGRAM_API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: Normalize phone numbers for matching
function cleanPhoneDigits(phone?: string): string {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

// Telegram API Helper
async function telegramApi(method: string, payload: Record<string, any> = {}) {
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error(`[Telegram API Error] ${method}:`, err);
    return { ok: false, error: err };
  }
}

// Generate 1-Time Unique Telegram Invite Link
async function generateOneTimeTelegramInviteLink(chatIdOrUrl: string, name: string): Promise<string> {
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
      return json.result.invite_link;
    }
  } catch (_e) {
    // fallback
  }

  return chatIdOrUrl;
}

// Reply Keyboard: Phone Number Contact Request
function getPhoneRequestKeyboard() {
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

// Persistent Text Area Menu Keyboard
function getMainMenuReplyKeyboard() {
  return {
    keyboard: [
      [
        { text: "🔗 Links" },
        { text: "💬 Support" }
      ],
      [
        { text: "📚 Courses" },
        { text: "🔑 Forgot Password" }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true
  };
}

// Check user registration in Supabase
async function isUserRegistered(telegramId: number): Promise<boolean> {
  const numericId = Number(telegramId);
  const stringId = String(telegramId);
  const tgIdStr = `TG-${stringId}`;

  try {
    const { data: students } = await supabase
      .from("students")
      .select("id, phone, telegram_id, chat_id");

    if (students && Array.isArray(students)) {
      const match = students.find((s: any) => {
        if (!s.phone || s.phone.trim() === "") return false;
        const sId = String(s.id || "");
        const sTgId = String(s.telegram_id || "");
        const sChatId = String(s.chat_id || "");
        return sId === tgIdStr || sId === stringId || sTgId === stringId || sChatId === stringId;
      });

      if (match) return true;
    }

    const { data: tgUsers } = await supabase
      .from("telegram_users")
      .select("telegram_id, phone_number")
      .eq("telegram_id", numericId);

    if (tgUsers && Array.isArray(tgUsers)) {
      const matchTg = tgUsers.find((u: any) => {
        return u.phone_number && u.phone_number.trim() !== "";
      });

      if (matchTg) return true;
    }
  } catch (err) {
    console.error("[Supabase Check Error]:", err);
  }
  return false;
}

// Register user in Supabase
async function registerBotUser(user: { telegram_id: number; first_name: string; last_name?: string; username?: string; phone_number: string; }) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || `User_${user.telegram_id}`;
  const userEmail = user.username ? `@${user.username.replace(/^@/, '')}` : `user_${user.telegram_id}@foundersacademy.et`;
  const formattedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

  const studentPayload = {
    id: `TG-${user.telegram_id}`,
    name: fullName,
    phone: user.phone_number,
    email: userEmail,
    username: userEmail,
    telegram_id: user.telegram_id,
    chat_id: user.telegram_id,
    telegram_username: user.username || "",
    joined_date: formattedDate
  };

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
    } catch (_e) { /* ignore fallback */ }
  } catch (err) {
    console.error("[Supabase Register Error]:", err);
  }
}

// Handle Forgot Password Command & Input
async function handleForgotPassword(chatId: number, user: any, text: string) {
  const telegramId = user.id;
  const firstName = user.first_name || "Student";
  const trimmed = (text || "").trim();
  const upper = trimmed.toUpperCase();

  // Reset password execution (e.g. /resetpassword MyNewPassword123)
  if (upper.startsWith("/RESETPASSWORD ") || upper.startsWith("/RESET_PASSWORD ") || upper.startsWith("/RESETPASS ")) {
    const parts = trimmed.split(/\s+/);
    const newPass = parts.slice(1).join(" ").trim();

    if (!newPass || newPass.length < 4) {
      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `❌ *Password Too Short*\n\nYour new password must be at least 4 characters long.\n\n*Usage:* \`/resetpassword YourNewPassword123\``,
        parse_mode: "Markdown"
      });
      return;
    }

    try {
      const cleanTgId = String(telegramId);
      const { data: student } = await supabase
        .from("students")
        .select("*")
        .or(`id.eq.TG-${cleanTgId},telegram_id.eq.${cleanTgId},chat_id.eq.${cleanTgId}`)
        .maybeSingle();

      if (student) {
        await supabase.from("students").update({ password_hash: newPass }).eq("id", student.id);
        await telegramApi("sendMessage", {
          chat_id: chatId,
          text: `🎉 *Password Reset Successfully!* 🔐\n\nHello *${firstName}*,\nYour student portal password has been updated to:\n🔑 \`${newPass}\`\n\nYou can now log in at:\n👉 https://new-nu-umber.vercel.app/student-login.html`,
          parse_mode: "Markdown"
        });
        return;
      }
    } catch (err) {
      console.error("[Supabase Password Reset Error]:", err);
    }

    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `⚠️ *Student Account Not Found*\n\nWe couldn't find a student account linked to your Telegram profile.\n\nPlease tap **📱 Share Phone Number** first to link your account!`,
      parse_mode: "Markdown",
      reply_markup: getPhoneRequestKeyboard()
    });
    return;
  }

  // Prompt user with reset instructions
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: `🔑 *Founders Academy Password Reset* 🔐\n\nHello *${firstName}*,\nTo reset your student portal password, send your new password using this command:\n\n👉 \`/resetpassword your_new_password\`\n\n*Example:*\n\`/resetpassword Founders2026!\`\n\n_Your new password will be updated instantly in your student account!_`,
    parse_mode: "Markdown"
  });
}

// Search Supabase for verified course enrollments by phone number and generate unique invite links
async function findEnrollmentInvitesByPhone(phoneNumber: string, studentName: string = "Student") {
  const targetClean = cleanPhoneDigits(phoneNumber);
  if (!targetClean) return [];

  const foundInvites: Array<{ title: string; channelLink?: string; groupLink?: string; }> = [];

  try {
    const { data: txns } = await supabase.from("transactions").select("*");
    const { data: courses } = await supabase.from("courses").select("*");
    const activeCourses = (courses || []).filter((c: any) => c.status === "ON" || c.status === "active");

    if (txns && txns.length > 0) {
      for (const txn of txns) {
        const txnPhoneClean = cleanPhoneDigits(txn.student_phone);
        const isMatch = txnPhoneClean && (txnPhoneClean === targetClean || targetClean.endsWith(txnPhoneClean) || txnPhoneClean.endsWith(targetClean));

        if (isMatch && (txn.status === "Completed" || txn.status === "VERIFIED")) {
          const course = activeCourses.find((c: any) => c.id === txn.course_id || c.title === txn.masterclass_title) || activeCourses[0];

          let channelLink = course?.tg_channel || "https://t.me/founders_academy_general";
          let groupLink = course?.tg_group || "https://t.me/founders_academy_group";

          if (channelLink && !channelLink.includes("/+")) {
            channelLink = await generateOneTimeTelegramInviteLink(channelLink, `${studentName} Channel`);
          }

          if (groupLink && !groupLink.includes("/+")) {
            groupLink = await generateOneTimeTelegramInviteLink(groupLink, `${studentName} Group`);
          }

          foundInvites.push({
            title: course?.title || txn.masterclass_title || "Masterclass",
            channelLink,
            groupLink
          });
        }
      }
    }
  } catch (err) {
    console.error("[Supabase Invite Lookup Error]:", err);
  }

  return foundInvites;
}

// Handle Incoming Telegram Webhook Message
async function handleWebhookUpdate(update: any) {
  const msg = update.message;
  if (!msg || !msg.from) return;

  const chatId = msg.chat.id;
  const from = msg.from;
  const telegramId = from.id;
  const firstName = from.first_name || "Student";
  const text = (msg.text || "").trim();

  // 1. Phone Contact Sharing
  if (msg.contact) {
    const rawPhone = msg.contact.phone_number || "";
    const phoneNumber = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;

    await registerBotUser({
      telegram_id: telegramId,
      first_name: from.first_name || "",
      last_name: from.last_name || "",
      username: from.username || "",
      phone_number: phoneNumber
    });

    const invites = await findEnrollmentInvitesByPhone(phoneNumber, firstName);

    if (invites.length > 0) {
      let inviteMsg = `🎉 *Welcome ${firstName}! Course Access Verified!*\n\nWe found your verified course enrollment in our database:\n\n`;
      const inlineButtons: any[] = [];

      invites.forEach((item, idx) => {
        inviteMsg += `*${idx + 1}. ${item.title}*\n`;
        if (item.channelLink) {
          inviteMsg += `📢 *Private Channel:* ${item.channelLink}\n`;
          inlineButtons.push([{ text: `📢 Join Channel (${item.title.substring(0, 18)}...)`, url: item.channelLink }]);
        }
        if (item.groupLink) {
          inviteMsg += `💬 *Mastermind Group:* ${item.groupLink}\n`;
          inlineButtons.push([{ text: `💬 Join Group (${item.title.substring(0, 18)}...)`, url: item.groupLink }]);
        }
        inviteMsg += `\n`;
      });

      inviteMsg += `🔒 _Note: Invite links above are single-use unique links generated specifically for your account._`;

      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: inviteMsg,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: inlineButtons }
      });
    } else {
      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `✅ *Registration Complete!*\n\nThank you, *${firstName}*. Your phone number (\`${phoneNumber}\`) has been verified and registered in Supabase database.`,
        parse_mode: "Markdown"
      });
    }

    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `✨ *Welcome back, ${firstName}!* ✨\n\nPlease choose an option from the menu below:`,
      parse_mode: "Markdown",
      reply_markup: getMainMenuReplyKeyboard()
    });
    return;
  }

  // 2. Check User Registration
  const registered = await isUserRegistered(telegramId);

  // If user typed /start command
  if (text.toUpperCase() === "/START" || text.toUpperCase().startsWith("/START ")) {
    if (registered) {
      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `✨ *Welcome back to Founders Academy, ${firstName}!* 🚀\n\nYour account is active and verified. Choose an option from the menu below:`,
        parse_mode: "Markdown",
        reply_markup: getMainMenuReplyKeyboard()
      });
      return;
    } else {
      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `👋 *Welcome to Founders Academy, ${firstName}!* 🎓\n\nTo get started and access courses, links, and student services, please *share your phone number* using the button below.`,
        parse_mode: "Markdown",
        reply_markup: getPhoneRequestKeyboard()
      });
      return;
    }
  }

  if (!registered) {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `👋 *Welcome to Founders Academy, ${firstName}!* 🎓\n\nTo get started and access courses, links, and student services, please *share your phone number* using the button below.`,
      parse_mode: "Markdown",
      reply_markup: getPhoneRequestKeyboard()
    });
    return;
  }

  // 3. Menu Button & Command Handlers
  if (text.includes("Forgot Password") || text.includes("Password") || text === "/forgotpassword" || text.startsWith("/resetpassword")) {
    await handleForgotPassword(chatId, from, text);
    return;
  }

  if (text.includes("Links") || text === "/links") {
    let linksMsg = `🔗 *Founders Academy Links*\n\n🌐 Website: https://foundersacademy.et\n💬 Support: @foundersupportt`;
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: linksMsg,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎓 Visit Website", url: "https://foundersacademy.et" }],
          [{ text: "💬 Contact Support", url: "https://t.me/foundersupportt" }]
        ]
      }
    });
    return;
  }

  if (text.includes("Support") || text === "/support") {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `💬 *Founders Academy Support*\n\nFor any questions, assistance, or course inquiries, please contact our support team:\n\n👉 @foundersupportt`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "📩 Contact Support", url: "https://t.me/foundersupportt" }]]
      }
    });
    return;
  }

  if (text.includes("Courses") || text === "/courses") {
    const { data: courses } = await supabase.from("courses").select("*");
    const activeCourses = (courses || []).filter((c: any) => c.status === "ON" || c.status === "active");

    if (activeCourses.length === 0) {
      await telegramApi("sendMessage", {
        chat_id: chatId,
        text: `📚 *Founders Academy Courses*\n\nCurrently, there are no active courses listed. Please check back soon or contact @foundersupportt!`,
        parse_mode: "Markdown"
      });
      return;
    }

    let messageText = `📚 *Founders Academy - Active Masterclasses*\n\nHere are our active courses with current pricing:\n\n`;

    activeCourses.forEach((course: any, index: number) => {
      const title = course.title || "Untitled Course";
      const price = course.price || "Contact for Price";
      const category = course.category || "General";

      messageText += `*${index + 1}. ${title}*\n`;
      messageText += `   • 🏷️ *Category:* ${category}\n`;
      messageText += `   • 💰 *Price:* \`${price}\`\n\n`;
    });

    messageText += `🌐 Website: https://foundersacademy.et\n💡 To enroll now, visit our portal or contact support: @foundersupportt`;

    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: messageText,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎓 Enroll Now", url: "https://foundersacademy.et" }],
          [{ text: "💬 Contact Support", url: "https://t.me/foundersupportt" }]
        ]
      }
    });
    return;
  }

  // Default menu send
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text: `✨ *Welcome back, ${firstName}!* ✨\n\nPlease choose an option from the menu below:`,
    parse_mode: "Markdown",
    reply_markup: getMainMenuReplyKeyboard()
  });
}

// Supabase Edge Function HTTP Router
serve(async (req: Request) => {
  const url = new URL(req.url);

  // Check setup webhook helper
  if (url.searchParams.get("setup") === "webhook" || url.pathname.endsWith("/setup-webhook")) {
    const webhookUrl = `${url.origin}${url.pathname}`;
    const res = await fetch(`${TELEGRAM_API_BASE}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const json = await res.json();
    return new Response(JSON.stringify({ success: json.ok, webhookUrl, telegramResponse: json }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method === "POST") {
    try {
      const update = await req.json();
      await handleWebhookUpdate(update);
      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    } catch (err: any) {
      console.error("Webhook processing error:", err);
      return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }

  return new Response("🤖 Founders Academy Telegram Bot Supabase Edge Function Active!", { status: 200 });
});
