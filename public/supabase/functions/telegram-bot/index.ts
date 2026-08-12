/* ==========================================================================
   SUPABASE EDGE FUNCTION: TELEGRAM BOT WEBHOOK
   Endpoint: https://icdjgtfiqwwdqtvwuyaw.supabase.co/functions/v1/telegram-bot
   ========================================================================== */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || Deno.env.get("BOT_TOKEN") || "8659500401:AAEUvDQTc0pniztDTiIQU65igbuiiM5ZXAc";
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
          text: "📱 Share Phone Number",
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
        { text: "📜 Certificate" }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true
  };
}

// Check user registration in Supabase
async function isUserRegistered(telegramId: number): Promise<boolean> {
  const tgIdStr = `TG-${telegramId}`;
  try {
    const { data: student } = await supabase
      .from("students")
      .select("id, phone")
      .eq("id", tgIdStr)
      .maybeSingle();

    if (student && student.phone && student.phone.trim() !== "") {
      return true;
    }

    const { data: tgUser } = await supabase
      .from("telegram_users")
      .select("telegram_id, phone_number")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (tgUser && tgUser.phone_number) {
      return true;
    }
  } catch (err) {
    console.error("[Supabase Check Error]:", err);
  }
  return false;
}

// Register user in Supabase
async function registerBotUser(user: { telegram_id: number; first_name: string; last_name?: string; username?: string; phone_number: string; }) {
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

  if (!registered) {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `👋 *Welcome to Founders Academy, ${firstName}!*\n\nTo get started and access courses, links, certificates, and student services, please *share your phone number* using the button below.`,
      parse_mode: "Markdown",
      reply_markup: getPhoneRequestKeyboard()
    });
    return;
  }

  // 3. Menu Button Handlers
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

  if (text.includes("Certificate") || text === "/certificate") {
    await telegramApi("sendMessage", {
      chat_id: chatId,
      text: `📜 *Founders Academy Certificate Verification*\n\nCertificates are awarded upon successful completion of your masterclass cohort and final project submission.\n\nTo request or verify your certificate status, please contact support: @foundersupportt`,
      parse_mode: "Markdown"
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
