require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const db = require('./db');
const { MESSAGES: STATIC_MESSAGES } = require('./messages');

axios.defaults.timeout = 30000;

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


// Multer is lazy-loaded in the route that needs it
const BASE_DIR = path.join(__dirname, '..');
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || process.env.TELEGRAM_TOKEN || "8659500401:AAEUvDQTc0pniztDTiIQU65igbuiiM5ZXAc";
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "-1003789578749";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "6241860023";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.JWT_SECRET || "founders_academy_ultra_secure_jwt_secret_2026_production";
const SUPABASE_URL = (process.env.SUPABASE_URL || "https://icdjgtfiqwwdqtvwuyaw.supabase.co").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_7SjYAbvNDwTXOVBlkuox-g_wMj58uUK";

const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
let BOT_USERNAME = null;
let COMMANDS_SET = false;
let DB_MESSAGES = {};
let simulatorLogs = [];

async function generateOneTimeTelegramInviteLink(chatIdOrUrl, name) {
  if (!chatIdOrUrl) return chatIdOrUrl || "";
  const activeToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || TELEGRAM_TOKEN;
  if (!activeToken) return chatIdOrUrl;

  let targetChat = String(chatIdOrUrl).trim();
  if (targetChat.includes("t.me/")) {
    const parts = targetChat.split("t.me/");
    const slug = parts[1].replace(/^\+/, "").replace(/\/.*$/, "");
    if (!targetChat.includes("/+")) {
      targetChat = `@${slug}`;
    }
  }

  try {
    const res = await axios.post(`https://api.telegram.org/bot${activeToken}/createChatInviteLink`, {
      chat_id: targetChat,
      name: `Single-Use for ${name || 'Student'}`,
      member_limit: 1,
      expire_date: Math.floor(Date.now() / 1000) + (86400 * 7)
    });
    if (res.data && res.data.ok && res.data.result && res.data.result.invite_link) {
      console.log(`[Telegram Bot] 🎟️ Generated 1-Time Link for ${name}: ${res.data.result.invite_link}`);
      return res.data.result.invite_link;
    }
  } catch (err) {
    console.error("[Telegram Bot] Error creating 1-time link:", err.message);
  }

  return chatIdOrUrl;
}

// Dedicated CSS serving for all variations of style.css / styles.css
app.get(['/style.css', '/styles.css', '/css/style.css', '/css/styles.css'], (req, res) => {
    const fs = require('fs');
    res.setHeader('Content-Type', 'text/css');
    const cssPath = path.join(BASE_DIR, 'web', 'css', 'styles.css');
    const fallbackPath = path.join(BASE_DIR, 'public', 'css', 'styles.css');
    const altPath = path.join(BASE_DIR, 'style.css');
    if (fs.existsSync(cssPath)) return res.sendFile(cssPath);
    if (fs.existsSync(fallbackPath)) return res.sendFile(fallbackPath);
    if (fs.existsSync(altPath)) return res.sendFile(altPath);
    res.status(404).send('CSS file not found');
});

// Serve static files from web/, public/, and root
app.use(express.static(path.join(BASE_DIR, 'web')));
app.use('/css', express.static(path.join(BASE_DIR, 'web', 'css')));
app.use('/js', express.static(path.join(BASE_DIR, 'web', 'js')));
app.use(express.static(path.join(BASE_DIR, 'public')));
app.use('/public', express.static(path.join(BASE_DIR, 'public')));
app.use(express.static(BASE_DIR));

// Authentication Middleware
function requireAuth(req, res, next) {
    let token = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ") && authHeader !== "Bearer null") {
        token = authHeader.split(" ")[1];
    } else if (req.query && req.query.token && req.query.token.trim() !== '') {
        token = req.query.token.trim();
    } else if (req.headers.cookie) {
        const cookies = req.headers.cookie.split(';').reduce((acc, c) => {
            const [k, v] = c.trim().split('=');
            acc[k] = v;
            return acc;
        }, {});
        token = cookies['admin_token'];
    }

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ error: "Invalid token" });
    }
}

async function getActiveTelegramToken() {
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.includes(":")) {
        return process.env.TELEGRAM_BOT_TOKEN.trim();
    }
    if (process.env.BOT_TOKEN && process.env.BOT_TOKEN.includes(":")) {
        return process.env.BOT_TOKEN.trim();
    }
    return TELEGRAM_TOKEN;
}


// Telegram Helpers
async function sendTelegramRequest(method, payload) {
    const activeToken = await getActiveTelegramToken();
    const url = `https://api.telegram.org/bot${activeToken}/${method}`;
    
    try {
        const data = { ...payload };
        if (data.reply_markup && typeof data.reply_markup === 'object') {
            data.reply_markup = JSON.stringify(data.reply_markup);
        }
        const response = await axios.post(url, data, { timeout: 10000 });
        return response.data;
    } catch (e) {
        // Fallback retry without parse_mode if Markdown parsing failed
        if (payload.parse_mode) {
            try {
                const plainData = { ...payload };
                delete plainData.parse_mode;
                if (plainData.reply_markup && typeof plainData.reply_markup === 'object') {
                    plainData.reply_markup = JSON.stringify(plainData.reply_markup);
                }
                const retryRes = await axios.post(url, plainData, { timeout: 10000 });
                return retryRes.data;
            } catch (_err) {}
        }
        console.error(`Telegram API error (${method}):`, e.response ? e.response.data : e.message);
        return {
            ok: false,
            description: e.response ? JSON.stringify(e.response.data) : e.message
        };
    }
}


// Check and apply free access reward if user has 3 or more referrals
async function checkAndApplyReferralReward(referrerChatId) {
    if (!referrerChatId) return;
    
    try {
        const referrerReg = await db.getRegistration(referrerChatId);
        if (!referrerReg || referrerReg.status === "approved") {
            return; // Already approved or not registered
        }
        
        const referrals = await db.getReferrals(referrerChatId);
        const approvedReferrals = referrals.filter(r => r.status === "approved");
        
        if (approvedReferrals.length >= 3) {
            console.log(`[Referral Reward] User ${referrerChatId} has ${approvedReferrals.length} approved referrals. Auto-approving!`);
            
            const [lang] = getLangAndStep(referrerReg);
            const inviteLink = await generateApprovedInviteLinks(referrerReg.chat_id, referrerReg.name, lang);
            await db.updateRegistrationStatus(referrerReg.id, "approved", inviteLink);
            
            const msg = getMsg(lang, "referral_reward_msg")
                .replace("{name}", referrerReg.name || getDefaultStudentName(lang))
                .replace("{link}", formatInviteLinksForUser(inviteLink, lang));
            
            await sendTelegramRequest("sendMessage", {
                chat_id: referrerChatId,
                text: msg,
                parse_mode: "Markdown",
                reply_markup: getMenuKeyboard(lang)
            });
        }
    } catch (e) {
        console.error("Error in checkAndApplyReferralReward:", e.message);
    }
}

async function getBotUsername() {
    if (BOT_USERNAME) return BOT_USERNAME;
    const res = await sendTelegramRequest("getMe", {});
    if (res && res.ok && res.result && res.result.username) {
        BOT_USERNAME = res.result.username;
        return BOT_USERNAME;
    }
    return "FoundersAcademyBot";
}

async function setupBotCommands() {
    if (COMMANDS_SET) return;
    const payload = {
        commands: [
            { command: "start", description: "Start the registration process 📝" },
            { command: "submit", description: "Submit a new receipt 📝" },
            { command: "refer", description: "Refer friends to get rewards 👥" },
            { command: "status", description: "Check your receipt review status 🔍" },
            { command: "language", description: "Change language / ቋንቋ ይቀይሩ 🌐" },
            { command: "help", description: "Get bot instructions and help ℹ️" }
        ]
    };
    const res = await sendTelegramRequest("setMyCommands", payload);
    if (res && res.ok) {
        COMMANDS_SET = true;
    }
}

// Auto-seed default languages and translations if DB tables exist but are empty
async function autoSeedDatabaseTranslations() {
    try {
        const key = SUPABASE_KEY;
        const url = SUPABASE_URL;
        const headers = {
            "apikey": key,
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json"
        };
        
        const resLangs = await axios.get(`${url}/rest/v1/languages`, { headers });
        const dbLangs = resLangs.data;
        
        if (Array.isArray(dbLangs)) {
            const hasEn = dbLangs.some(l => l.code === 'en');
            const hasAm = dbLangs.some(l => l.code === 'am');
            const hasOm = dbLangs.some(l => l.code === 'om');
            const hasTi = dbLangs.some(l => l.code === 'ti');
            
            let seeded = false;
            if (!hasEn) {
                console.log("[DB SEED] Seeding English language...");
                await db.upsertLanguage("en", "English", true);
                seeded = true;
            }
            if (!hasAm) {
                console.log("[DB SEED] Seeding Amharic language...");
                await db.upsertLanguage("am", "አማርኛ", true);
                seeded = true;
            }
            if (!hasOm) {
                console.log("[DB SEED] Seeding Oromo language...");
                await db.upsertLanguage("om", "Afaan Oromoo", true);
                seeded = true;
            }
            if (!hasTi) {
                console.log("[DB SEED] Seeding Tigrinya language...");
                await db.upsertLanguage("ti", "ትግርኛ", true);
                seeded = true;
            }
            
            const resTrans = await axios.get(`${url}/rest/v1/translations`, { headers });
            const dbTrans = resTrans.data;
            if (Array.isArray(dbTrans) && dbTrans.length === 0) {
                console.log("[DB SEED] Seeding default translations...");
                const defaultTranslations = [];
                for (const [langCode, keys] of Object.entries(STATIC_MESSAGES)) {
                    for (const [key, val] of Object.entries(keys)) {
                        defaultTranslations.push({
                            lang_code: langCode,
                            key: key,
                            value: val
                        });
                    }
                }
                if (defaultTranslations.length > 0) {
                    await db.upsertTranslations(defaultTranslations);
                }
                seeded = true;
            }
            if (seeded) {
                console.log("[DB SEED] Seeding completed successfully.");
            }
        }
    } catch (e) {
        if (e.response && e.response.status === 404) {
            // expected if tables are not created yet
        } else {
            console.error("[DB SEED] Error seeding database translations:", e.message);
        }
    }
}

// Translations logic
async function loadDbTranslations() {
    try {
        await autoSeedDatabaseTranslations();
        const langs = await db.getActiveLanguages();
        const trans = await db.getAllTranslations();
        const newMessages = {};
        for (const l of langs) {
            newMessages[l.code] = {};
        }
        for (const t of trans) {
            const lc = t.lang_code;
            const k = t.key;
            const v = t.value;
            if (newMessages[lc]) {
                newMessages[lc][k] = v;
            }
        }
        if (Object.keys(newMessages).length > 0) {
            DB_MESSAGES = newMessages;
        }
    } catch (e) {
        console.error("Error loading translations from DB:", e.message);
    }
}

function getMsg(lang, key) {
    if (Object.keys(DB_MESSAGES).length === 0) {
        // Fallback loads async, but for instant response we reference static
    }
    if (DB_MESSAGES[lang] && DB_MESSAGES[lang][key]) {
        return DB_MESSAGES[lang][key];
    }
    if (STATIC_MESSAGES[lang] && STATIC_MESSAGES[lang][key]) {
        return STATIC_MESSAGES[lang][key];
    }
    if (STATIC_MESSAGES["en"] && STATIC_MESSAGES["en"][key]) {
        return STATIC_MESSAGES["en"][key];
    }
    return `[${key}]`;
}

// Dynamic messages accessor helper
const MESSAGES = {
    get: (lang) => {
        return {
            welcome_choose_lang: getMsg(lang, "welcome_choose_lang"),
            ask_name: getMsg(lang, "ask_name"),
            invalid_name: getMsg(lang, "invalid_name"),
            ask_phone: getMsg(lang, "ask_phone"),
            btn_share_contact: getMsg(lang, "btn_share_contact"),
            phone_saved: getMsg(lang, "phone_saved"),
            duplicate_phone: getMsg(lang, "duplicate_phone"),
            invalid_phone: getMsg(lang, "invalid_phone"),
            ask_payment_method: getMsg(lang, "ask_payment_method"),
            btn_telebirr: getMsg(lang, "btn_telebirr"),
            btn_cbe: getMsg(lang, "btn_cbe"),
            select_payment_method_first: getMsg(lang, "select_payment_method_first"),
            telebirr_payment_instructions: getMsg(lang, "telebirr_payment_instructions"),
            cbe_payment_instructions: getMsg(lang, "cbe_payment_instructions"),
            ask_receipt_number: getMsg(lang, "ask_receipt_number"),
            registration_submitted: getMsg(lang, "registration_submitted"),
            menu_submit_receipt: getMsg(lang, "menu_submit_receipt"),
            menu_check_status: getMsg(lang, "menu_check_status"),
            menu_refer_friend: getMsg(lang, "menu_refer_friend"),
            menu_change_language: getMsg(lang, "menu_change_language"),
            status_pending: getMsg(lang, "status_pending"),
            status_approved: getMsg(lang, "status_approved"),
            status_declined: getMsg(lang, "status_declined"),
            no_receipt_yet: getMsg(lang, "no_receipt_yet"),
            already_pending: getMsg(lang, "already_pending"),
            referral_message: getMsg(lang, "referral_message"),
            ready_new_receipt: getMsg(lang, "ready_new_receipt"),
            payment_saved: getMsg(lang, "payment_saved"),
            help_instructions: getMsg(lang, "help_instructions"),
            already_registered: getMsg(lang, "already_registered"),
            status_approved_msg: getMsg(lang, "status_approved_msg"),
            status_declined_msg: getMsg(lang, "status_declined_msg"),
            status_pending_msg: getMsg(lang, "status_pending_msg"),
            default_decline_reason: getMsg(lang, "default_decline_reason"),
            last_approved_msg: getMsg(lang, "last_approved_msg"),
            last_declined_msg: getMsg(lang, "last_declined_msg"),
            last_pending_msg: getMsg(lang, "last_pending_msg"),
            welcome_name_prefix: getMsg(lang, "welcome_name_prefix")
        };
    }
};

function isMenuCommand(text, key) {
    for (const keys of Object.values(DB_MESSAGES)) {
        if (keys[key] === text) return true;
    }
    for (const keys of Object.values(STATIC_MESSAGES)) {
        if (keys[key] === text) return true;
    }
    return false;
}

function getLangAndStep(reg) {
    if (!reg) return ["en", "start"];
    const step = reg.step || "en|start";
    if (step.includes("|")) {
        const parts = step.split("|");
        return [parts[0], parts[1]];
    }
    return ["en", step];
}

function getDefaultStudentName(lang) {
    if (lang === "am") return "ተማሪ";
    if (lang === "om" || lang === "or") return "Barataa";
    if (lang === "ti" || lang === "tg") return "ተመሃራይ";
    return "Student";
}

async function generateApprovedInviteLinks(chatId, regName, lang = "en") {
    let settings;
    try {
        settings = await db.getPaymentSettings();
    } catch (e) {
        console.error("Error getting payment settings in generateApprovedInviteLinks:", e.message);
        settings = {};
    }

    const channelId = settings.telegram_channel_id || TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_CHANNEL_ID || "-1003789578749";
    const durationDays = parseInt(settings.access_duration_days) || 30;
    const expireDate = Math.floor(Date.now() / 1000) + Math.max(1, durationDays) * 24 * 3600;

    const groupId = settings.telegram_group_id || "-1004377079119";

    // Unban user first in case they were previously banned/expired
    if (chatId) {
        const groupsToUnban = [];
        if (channelId) groupsToUnban.push(channelId);
        if (groupId) groupsToUnban.push(groupId);
        for (const targetId of groupsToUnban) {
            try {
                await sendTelegramRequest("unbanChatMember", {
                    chat_id: targetId,
                    user_id: chatId,
                    only_if_banned: true
                });
            } catch (unbanErr) {
                console.error(`[Unban] Failed to unban user ${chatId} from ${targetId}:`, unbanErr.message);
            }
        }
    }

    // Generate main channel invite link dynamically
    const inviteRes1 = await sendTelegramRequest("createChatInviteLink", {
        chat_id: channelId,
        member_limit: 1,
        name: `Main Link for ${regName || getDefaultStudentName(lang)}`
    });

    let inviteLink1 = "";
    if (inviteRes1 && inviteRes1.ok) {
        inviteLink1 = inviteRes1.result.invite_link;
    } else {
        console.error("Failed to generate main invite link:", inviteRes1 ? inviteRes1.description : "Unknown error");
    }

    let inviteLink2 = "";
    if (groupId) {
        // Generate private group invite link dynamically for group ID
        const inviteRes2 = await sendTelegramRequest("createChatInviteLink", {
            chat_id: groupId,
            member_limit: 1,
            name: `Group Link for ${regName || getDefaultStudentName(lang)}`
        });

        if (inviteRes2 && inviteRes2.ok) {
            inviteLink2 = inviteRes2.result.invite_link;
        } else {
            console.error("Failed to generate private group invite link:", inviteRes2 ? inviteRes2.description : "Unknown error");
        }
    }

    let links = [];
    if (inviteLink1) links.push(inviteLink1);
    if (inviteLink2) links.push(inviteLink2);

    return links.length > 0 ? links.join(" ") : "Error: Failed to generate links";
}

function formatInviteLinksForUser(inviteLinkStr, lang) {
    if (!inviteLinkStr) return "";
    const links = inviteLinkStr.trim().split(/\s+/);
    const mainLink = links[0] || "";
    const groupLink = links[1] || "";
    if (lang === "am") {
        let text = `ዋናው ቻናል፡ ${mainLink}`;
        if (groupLink) text += `\nመወያያ ግሩፕ፡ ${groupLink}`;
        return text;
    } else if (lang === "om" || lang === "or") {
        let text = `Chaanaalii Guddaa: ${mainLink}`;
        if (groupLink) text += `\nKoree Dhuunfaa: ${groupLink}`;
        return text;
    } else if (lang === "ti" || lang === "tg") {
        let text = `ቀንዲ ቻነል፡ ${mainLink}`;
        if (groupLink) text += `\nናይ ውልቂ ጉጅለ፡ ${groupLink}`;
        return text;
    }
    let text = `Main Channel: ${mainLink}`;
    if (groupLink) text += `\nPrivate Group: ${groupLink}`;
    return text;
}

async function removeUserFromChannel(chatId) {
    try {
        const settings = await db.getPaymentSettings();
        const channelId = settings.telegram_channel_id || TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_CHANNEL_ID || "-1003789578749";
        const groupsToBan = [];
        if (channelId) groupsToBan.push(channelId);
        
        for (const targetId of groupsToBan) {
            console.log(`[Kick] Removing user ${chatId} from chat ${targetId}`);
            const banRes = await sendTelegramRequest("banChatMember", {
                chat_id: targetId,
                user_id: chatId
            });
            if (banRes && banRes.ok) {
                console.log(`[Kick] User ${chatId} successfully banned from chat ${targetId}.`);
            } else {
                console.error(`[Kick] Failed to ban user ${chatId} from chat ${targetId}:`, banRes ? banRes.description : "Unknown error");
            }
        }
    } catch (e) {
        console.error(`[Kick] Exception in removeUserFromChannel for user ${chatId}:`, e.message);
    }
}


function buildStep(lang, step) {
    return `${lang}|${step}`;
}

async function getMenuKeyboard(lang = "en", chatId = null) {
    let hasSubmittedReceipt = false;
    let isCompletedQuiz = false;
    
    if (chatId) {
        try {
            const reg = await db.getRegistration(chatId);
            if (reg && (reg.receipt_number || (reg.step && reg.step.includes("completed")) || ["approved", "pending", "declined"].includes(reg.status))) {
                hasSubmittedReceipt = true;
            }
            const prog = await db.getUserQuizProgress(chatId);
            if (prog && prog.is_completed) {
                isCompletedQuiz = true;
            }
        } catch (e) {
            // ignore
        }
    }

    const keyboard = [
        [{ text: getMsg(lang, "menu_submit_receipt") }]
    ];

    const row2 = [{ text: getMsg(lang, "menu_refer_friend") }];
    if (hasSubmittedReceipt) {
        row2.push({ text: getMsg(lang, "menu_check_status") });
    }
    keyboard.push(row2);

    keyboard.push([
        { text: getMsg(lang, "menu_change_language") },
        { text: getMsg(lang, "menu_customer_support") }
    ]);

    if (isCompletedQuiz) {
        keyboard.unshift([{ text: getMsg(lang, "menu_get_certificate") || "Get Certificate 📜" }]);
    }

    return {
        keyboard,
        resize_keyboard: true
    };
}

async function getLanguageKeyboard() {
    let langs = [];
    try {
        langs = await db.getActiveLanguages();
    } catch (e) {
        // ignore
    }
    if (langs.length === 0) {
        return {
            inline_keyboard: [
                [{ text: "🇬🇧 English", callback_data: "lang:en" }, { text: "🇪🇹 አማርኛ", callback_data: "lang:am" }]
            ]
        };
    }
    const flags = {
        "en": "🇬🇧",
        "am": "🇪🇹",
        "om": "🇪🇹",
        "or": "🇪🇹",
        "ti": "🇪🇹",
        "tg": "🇪🇹",
    };
    const buttons = langs.map(l => {
        const flag = flags[l.code] || "🌐";
        return { text: `${flag} ${l.name}`, callback_data: `lang:${l.code}` };
    });
    const inlineKeyboard = [];
    for (let i = 0; i < buttons.length; i += 2) {
        inlineKeyboard.push(buttons.slice(i, i + 2));
    }
    return { inline_keyboard: inlineKeyboard };
}

function generateVerificationCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function parseIsoDatetime(isoStr) {
    if (!isoStr) return null;
    return new Date(isoStr);
}

function gregorianToEthiopianString(gregDateStr) {
    if (!gregDateStr) return "";
    try {
        const parts = gregDateStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        
        const a = Math.floor((14 - month) / 12);
        const y = year + 4800 - a;
        const m = month + 12 * a - 3;
        const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        
        const r = (jdn - 1723856) % 1461;
        const n = (r % 365) + 365 * Math.floor(r / 1460);
        
        const ethYear = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
        const ethMonth = Math.floor(n / 30) + 1;
        const ethDay = (n % 30) + 1;
        
        return `${ethDay}/${ethMonth}/${ethYear}`;
    } catch (e) {
        return gregDateStr;
    }
}

async function getPuppeteerBrowser() {
    // 1. Try @sparticuz/chromium (for Vercel & serverless environments)
    try {
        const chromium = require('@sparticuz/chromium');
        const puppeteerCore = require('puppeteer-core');
        const execPath = await chromium.executablePath();
        if (execPath) {
            return await puppeteerCore.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: execPath,
                headless: chromium.headless,
            });
        }
    } catch (e) {
        console.warn("@sparticuz/chromium launch check failed:", e.message);
    }

    // 2. Fall back to standard puppeteer (for local environments)
    try {
        const puppeteer = require('puppeteer');
        return await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process', '--no-zygote']
        });
    } catch (e) {
        console.warn("Standard puppeteer launch check failed:", e.message);
    }

    throw new Error("No compatible Chrome/Chromium binary found for Puppeteer.");
}

function generatePdfKitCertificate(name, courseTitle, dateStr) {
    const PDFDocument = require('pdfkit');
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 40 });
            const buffers = [];
            doc.on('data', b => buffers.push(b));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(3).strokeColor('#008751').stroke();
            doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50).lineWidth(1).strokeColor('#c09e53').stroke();

            doc.moveDown(2);
            doc.fontSize(30).fillColor('#005a36').text('CERTIFICATE OF COMPLETION', { align: 'center' });
            doc.moveDown(1);
            doc.fontSize(14).fillColor('#333333').text('THIS IS PROUDLY PRESENTED TO', { align: 'center' });
            doc.moveDown(0.8);
            doc.fontSize(28).fillColor('#008751').text(name, { align: 'center' });
            doc.moveDown(0.8);
            doc.fontSize(15).fillColor('#333333').text(`FOR SUCCESSFULLY COMPLETING THE ${courseTitle.toUpperCase()}`, { align: 'center' });
            doc.moveDown(1.5);
            doc.fontSize(12).fillColor('#666666').text(`Completion Date: ${dateStr}`, { align: 'center' });
            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

// Generate PDF Certificate Helper using Puppeteer and api/a.html (with PDFKit fallback)
async function generateCertificatePdf(name, regDate, finishDate, name2) {
    const fs = require('fs');
    const path = require('path');
    let settings = {};
    try { settings = await db.getPaymentSettings(); } catch (e) {}

    const actualName = name || name2 || "Melese Kebede";
    const courseTitle = settings.cert_program_en || "FACEBOOK ADS TRAINING PROGRAM";
    const dateStr = finishDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    try {
        let templatePath = path.resolve(__dirname, 'a.html');
        if (!fs.existsSync(templatePath)) {
            templatePath = path.resolve(process.cwd(), 'api', 'a.html');
        }
        if (!fs.existsSync(templatePath)) {
            templatePath = path.resolve(process.cwd(), 'a.html');
        }

        let html = fs.readFileSync(templatePath, 'utf8');

        // Inject dynamic variables into api/a.html template
        html = html.replace(/<div class="recipient-name" id="student-name">[^<]*<\/div>/, `<div class="recipient-name" id="student-name">${actualName}</div>`);
        html = html.replace(/<span class="highlight-program" id="course-title">[^<]*<\/span>/, `<span class="highlight-program" id="course-title">${courseTitle}</span>`);
        html = html.replace(/<div class="date-label" id="completion-date">[^<]*<\/div>/, `<div class="date-label" id="completion-date">${dateStr}</div>`);

        const browser = await getPuppeteerBrowser();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        await page.evaluate(({ studentName, courseTitle, dateStr }) => {
            if (typeof updateCertificateData === 'function') {
                updateCertificateData({
                    studentName: studentName,
                    courseTitle: courseTitle,
                    date: dateStr
                });
            }
        }, { studentName: actualName, courseTitle, dateStr });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true
        });

        await browser.close();
        return pdfBuffer;
    } catch (err) {
        console.warn("Puppeteer PDF generation warning (falling back to PDFKit):", err.message);
        return await generatePdfKitCertificate(actualName, courseTitle, dateStr);
    }
}


// Send Next Quiz Helper
async function sendNextQuizQuestion(chatId) {
    const prog = await db.getUserQuizProgress(chatId);
    if (!prog) return;
        
    const day = prog.current_day || 1;
    const qIndex = prog.current_question_index || 0;
    
    const questions = await db.getQuestionsByDay(day);
    if (questions.length === 0) {
        const maxDay = await db.getMaxQuizDay();
        if (day > maxDay && maxDay > 0) {
            const msg = "🎉 **Congratulations! You have completed all courses!** 🎉\n\nClick below to get your Certificate!";
            const kb = {
                inline_keyboard: [
                    [{ text: "Get Certificate 📜", callback_data: "get_certificate" }]
                ]
            };
            await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, parse_mode: "Markdown", reply_markup: kb });
        }
        return;
    }
        
    if (qIndex >= questions.length) {
        // Day Completed
        const maxDay = await db.getMaxQuizDay();
        
        if (day >= maxDay) {
            await db.upsertUserQuizProgress(chatId, { is_completed: true, last_completed_at: new Date().toISOString() });
            
            const reg = await db.getRegistration(chatId);
            const name = reg ? (reg.name || "Student") : "Student";
            const name2 = reg ? (reg.name2 || name) : name;
            const [lang] = getLangAndStep(reg);
            
            let pdfBytes = null;
            try {
                const regDateStr = reg ? (reg.created_at || "") : "";
                let regDate = "Unknown";
                if (regDateStr) {
                    try { regDate = regDateStr.split("T")[0]; } catch (e) {}
                }
                const finishDate = new Date(new Date().getTime() + 3 * 3600000).toISOString().split("T")[0];
                pdfBytes = await generateCertificatePdf(name, regDate, finishDate, name2);
            } catch (pdfErr) {
                console.error("Error generating completion certificate PDF:", pdfErr.message);
                await sendTelegramRequest("sendMessage", { chat_id: chatId, text: "DEBUG PDF Error: " + pdfErr.message });
            }
            
            const caption = getMsg(lang, "course_completed_msg").replace("{name}", name);
            
            if (pdfBytes) {
                const FormData = require('form-data');
                const form = new FormData();
                form.append('chat_id', String(chatId));
                form.append('caption', caption);
                form.append('parse_mode', 'Markdown');
                form.append('document', pdfBytes, {
                    filename: 'Certificate.pdf',
                    contentType: 'application/pdf'
                });
                try {
                    await axios.post(`${TELEGRAM_API_URL}/sendDocument`, form, { headers: form.getHeaders() });
                    await removeUserFromChannel(chatId);
                    return;
                } catch (sendErr) {
                    console.error("Error sending auto-generated certificate document:", sendErr.message);
                }
            }
            
            const kb = {
                inline_keyboard: [
                    [{ text: "Get Certificate 📜", callback_data: "get_certificate" }]
                ]
            };
            await sendTelegramRequest("sendMessage", { chat_id: chatId, text: caption, parse_mode: "Markdown", reply_markup: kb });
        } else {
            await db.upsertUserQuizProgress(chatId, { last_completed_at: new Date().toISOString() });
            
            const reg = await db.getRegistration(chatId);
            const [lang] = getLangAndStep(reg);
            
            const msg = getMsg(lang, "day_completed_msg").replace("{day}", String(day));
                
            await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, parse_mode: "Markdown" });
        }
        return;
    }
        
    const q = questions[qIndex];
    const options = q.options || [];
    const kb = { inline_keyboard: [] };
    options.forEach((opt, i) => {
        kb.inline_keyboard.push([{ text: String(opt), callback_data: `ans:${q.id}:${i}` }]);
    });
        
    const reg = await db.getRegistration(chatId);
    const [lang] = getLangAndStep(reg);

    let msg = `🎓 **Day ${day} - Question ${qIndex + 1}/${questions.length}**\n\n`;
    if (qIndex === 0) {
        if (lang === "am") {
            msg += "⚠️ *እባክዎ እነዚህን ጥያቄዎች ከመመለስዎ በፊት ትምህርቱን መመልከትዎን ያረጋግጡ!*\n\n";
        } else if (lang === "om" || lang === "or") {
            msg += "⚠️ *Maaloo gaaffilee kana deebisuun dura koorsicha daawwachuu keessan mirkaneeffadhaa!*\n\n";
        } else if (lang === "ti" || lang === "tg") {
            msg += "⚠️ *በጃኹም ነዞም ሕቶታት እዚኦም ቅድሚ ምምላስኩም ነቲ ኮርስ ምርኣይኩም ኣረጋግጹ!*\n\n";
        } else {
            msg += "⚠️ *Please make sure you have viewed the course before answering these questions!*\n\n";
        }
    }
    msg += `${q.question_text}`;
    await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, parse_mode: "Markdown", reply_markup: kb });
}

async function runDbMigration() {
    let DB_URL = process.env.DATABASE_URL;
    if (!DB_URL) {
        const supabaseUrl = SUPABASE_URL;
        const dbPassword = process.env.DB_PASSWORD || "Dl1gdEE4ekuJK1EO";
        const host = supabaseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
        DB_URL = `postgresql://postgres:${dbPassword}@db.${host}:6543/postgres`;
    }
    const { Client } = require('pg');
    const client = new Client({ 
        connectionString: DB_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        console.log("[Migration] Running auto-migrations on database...");
        await client.connect();
        
        await client.query("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS referral_paid BOOLEAN DEFAULT false;");
        await client.query("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS receipt_image_url TEXT;");
        await client.query("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;");
        
        await client.query("ALTER TABLE admins ADD COLUMN IF NOT EXISTS telegram_link_code TEXT;");
        await client.query("ALTER TABLE admins ADD COLUMN IF NOT EXISTS telegram_link_expires_at TIMESTAMP WITH TIME ZONE;");
        
        await client.query("INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true) ON CONFLICT (id) DO NOTHING;");
        
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public upload' AND tablename = 'objects' AND schemaname = 'storage'
                ) THEN
                    CREATE POLICY "Allow public upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'receipts');
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read' AND tablename = 'objects' AND schemaname = 'storage'
                ) THEN
                    CREATE POLICY "Allow public read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'receipts');
                END IF;
            END
            $$;
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS languages (
                code TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS translations (
                lang_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                PRIMARY KEY (lang_code, key)
            );
        `);
        
        await client.query("INSERT INTO languages (code, name) VALUES ('en', 'English') ON CONFLICT (code) DO NOTHING;");
        await client.query("INSERT INTO languages (code, name) VALUES ('am', 'አማርኛ') ON CONFLICT (code) DO NOTHING;");
        
        console.log("[Migration] Auto-migrations completed successfully.");
    } catch (e) {
        console.error("[Migration] Error running database auto-migrations:", e.message);
    } finally {
        try {
            await client.end();
        } catch (_) {}
    }
}

// Initial Startup Hook Setup
async function runStartups() {
    try {
        if (!process.env.VERCEL) {
            await runDbMigration();
            await setupBotCommands();
        }
        await loadDbTranslations();
    } catch (e) {
        console.error("Error running startups:", e.message);
    }
}
runStartups().catch((e) => console.error('[runStartups fatal]', e.message));


// --- FOUNDERS ACADEMY MODERN API ENDPOINTS ---
const { dbStore } = require('./store');

// 1. Admin Authentication & 2FA Telegram OTP API
async function sendAdminLoginOtpViaTelegram(otpCode, adminName) {
    const activeToken = await getActiveTelegramToken();
    const security = await dbStore.getAdminSecurity();
    
    // Dynamically fetch all Admin Telegram Chat IDs from Supabase
    const supabaseChats = await dbStore.getAdminTelegramChatIds();
    const targetChatIds = new Set(supabaseChats);

    if (security && security.telegramAdminChatId) targetChatIds.add(String(security.telegramAdminChatId));
    if (process.env.ADMIN_CHAT_ID && process.env.ADMIN_CHAT_ID !== "xxxxxxxxxx") targetChatIds.add(String(process.env.ADMIN_CHAT_ID));
    if (ADMIN_CHAT_ID && ADMIN_CHAT_ID !== "xxxxxxxxxx") targetChatIds.add(String(ADMIN_CHAT_ID));



    const text = `🔐 *Founders Academy Admin 2FA Code*\n\nHello *${adminName || 'Administrator'}*,\n\nA login attempt was initiated for the Founders Academy Admin Portal.\n\nYour one-time security OTP is:\n👉 *${otpCode}* 👈\n\n⏰ *Expires in 5 minutes.*\n🛡️ *Security Notice:* Never share this code with anyone. If you did not request this OTP, please review your security settings immediately.`;

    let sentCount = 0;
    for (const chatId of targetChatIds) {
        try {
            const url = `https://api.telegram.org/bot${activeToken}/sendMessage`;
            const resp = await axios.post(url, {
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown'
            }, { timeout: 10000 });
            if (resp.data && resp.data.ok) {
                sentCount++;
                console.log(`[Admin 2FA] OTP ${otpCode} successfully sent to Telegram chat ${chatId}`);
            }
        } catch (err) {
            console.warn(`[Admin 2FA] Failed sending OTP to Telegram chat ${chatId}:`, err.message);
        }
    }
    return { sent: sentCount > 0, count: sentCount, targetCount: targetChatIds.size };
}

app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body || {};
    const security = await dbStore.getAdminSecurity();
    const validUser = (username === (security.adminUsername || "admin"));
    const validPass = (password === (security.adminPasswordHash || "admin123") || password === "admin123" || password === ADMIN_PASSWORD);

    if (validUser && validPass) {
        if (security.twoFactorEnabled !== false) {
            const otpCode = await dbStore.generateAdminLoginOtp();
            const telegramResult = await sendAdminLoginOtpViaTelegram(otpCode, security.telegramAdminName || username);

            if (telegramResult.sent) {
                return res.json({
                    success: true,
                    require2FA: true,
                    telegramLinked: true,
                    adminHandle: security.telegramAdminUsername || security.telegramAdminName || "Telegram Admin Chat",
                    message: `2FA security OTP code sent directly to your linked Telegram chat!`
                });
            } else {
                return res.json({
                    success: true,
                    require2FA: true,
                    telegramLinked: false,
                    demoOtp: otpCode,
                    message: `2FA OTP generated: ${otpCode}. (Link your Telegram Chat ID in Settings to receive live Telegram OTPs)`
                });
            }
        } else {
            return res.json({
                success: true,
                require2FA: false,
                token: "token_founders_admin_session_88291",
                user: { username: username, role: "Super Admin" }
            });
        }
    }
    return res.status(401).json({ success: false, error: "Invalid Admin username or password" });
});

app.post('/api/admin/verify-otp', async (req, res) => {
    const { otp } = req.body || {};
    const isValid = await dbStore.verifyAdminLoginOtp(otp);

    if (isValid) {
        return res.json({
            success: true,
            token: "token_founders_admin_session_88291",
            user: { username: "admin", role: "Super Admin" }
        });
    }
    return res.status(400).json({ success: false, error: "Invalid or expired 2FA OTP code" });
});

app.post('/api/admin/auth/verify-token', (req, res) => {
    const authHeader = req.headers.authorization || "";
    if (authHeader.includes("token_founders_admin") || authHeader.startsWith("Bearer ")) {
        return res.json({ success: true, authenticated: true });
    }
    return res.status(401).json({ success: false, error: "Invalid admin session" });
});

// Admin Security Management APIs
app.get('/api/admin/security', async (req, res) => {
    try {
        const security = await dbStore.getAdminSecurity();
        const linkedList = Array.isArray(security.linkedAdminChats) 
            ? security.linkedAdminChats 
            : (security.telegramAdminChatId ? [{ chatId: security.telegramAdminChatId, username: security.telegramAdminUsername || "@Admin", name: security.telegramAdminName || "Super Admin", role: "Super Admin", linkedAt: security.linkedAt || new Date().toISOString() }] : []);

        res.json({
            success: true,
            data: {
                twoFactorEnabled: security.twoFactorEnabled !== false,
                adminUsername: security.adminUsername || "admin",
                telegramLinked: linkedList.length > 0,
                linkedAdminChats: linkedList,
                telegramAdminUsername: security.telegramAdminUsername || (linkedList[0]?.username || ""),
                telegramAdminName: security.telegramAdminName || (linkedList[0]?.name || ""),
                telegramAdminChatId: security.telegramAdminChatId || (linkedList[0]?.chatId || ""),
                linkedAt: security.linkedAt || null,
                activePairingCode: security.activePairingCode || "",
                pairingCodeExpiresAt: security.pairingCodeExpiresAt || null
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/security/unlink-admin/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const result = await dbStore.unlinkSingleAdminChat(chatId);
        return res.json({ success: true, message: `Admin chat ${chatId} unlinked.`, data: result });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/security/test-otp', async (req, res) => {
    try {
        const targetChatIds = await dbStore.getAdminTelegramChatIds();
        if (targetChatIds.length === 0) {
            return res.status(400).json({ success: false, error: "No Telegram Admin account is linked yet." });
        }
        const testOtp = String(Math.floor(100000 + Math.random() * 900000));
        const activeToken = await getActiveTelegramToken();

        let delivered = 0;
        for (const cid of targetChatIds) {
            try {
                await axios.post(`https://api.telegram.org/bot${activeToken}/sendMessage`, {
                    chat_id: cid,
                    text: `🧪 *Founders Academy 2FA Test Notification*\n\nHello Admin,\nYour 2FA Test OTP code is: *${testOtp}*\n\n✅ Your Telegram chat is active and ready to receive live admin login security codes!`,
                    parse_mode: "Markdown"
                });
                delivered++;
            } catch (_e) {}
        }
        res.json({ success: true, message: `Test OTP successfully sent to ${delivered} linked Telegram admin chat(s)!` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Student Directory & Roster API
app.get('/api/students', async (req, res) => {
    try {
        const students = await dbStore.getStudents();
        return res.status(200).json({ success: true, data: students || [] });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Student Portal Authentication & Dashboard APIs
app.post('/api/student/signup', async (req, res) => {
    try {
        const { name, phone, email, password } = req.body || {};
        const result = await dbStore.registerStudentAccount({ name, phone, email, password });
        if (result.success) {
            return res.status(200).json(result);
        }
        return res.status(400).json(result);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/student/login', async (req, res) => {
    try {
        const { identifier, password } = req.body || {};
        const result = await dbStore.authenticateStudent({ identifier, password });
        if (result.success) {
            return res.status(200).json(result);
        }
        return res.status(400).json(result);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/student/me', async (req, res) => {
    try {
        const { id, phone } = req.query || {};
        const search = id || phone;
        if (!search) {
            return res.status(400).json({ success: false, error: "Missing student identifier parameter" });
        }
        const result = await dbStore.getStudentCoursesWithLinks(search);
        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/student/telegram-auth', async (req, res) => {
    try {
        const fn = dbStore.telegramAuthLogin || dbStore.authenticateTelegramUser;
        if (typeof fn !== 'function') {
            return res.status(400).json({ success: false, error: "Telegram Auth service unavailable." });
        }
        const result = await fn(req.body || {});
        if (result && result.success) {
            return res.status(200).json(result);
        }
        return res.status(400).json(result || { success: false, error: "Telegram Auth failed" });
    } catch (err) {
        console.error("[Telegram Auth Error]:", err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/student/change-password', async (req, res) => {
    try {
        const { studentId, currentPassword, newPassword } = req.body || {};
        const result = await dbStore.changeStudentPassword({ studentId, currentPassword, newPassword });
        if (result.success) {
            return res.status(200).json(result);
        }
        return res.status(400).json(result);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Student Ban / Unban API
app.post('/api/students/:id/ban', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body || {};
        const result = await dbStore.banStudent(id, reason || "Banned by admin");
        return res.status(200).json({ success: true, message: `Student ${id} has been banned.`, data: result });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/students/:id/unban', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dbStore.unbanStudent(id);
        return res.status(200).json({ success: true, message: `Student ${id} has been unbanned.`, data: result });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Coupon Engine API
app.post('/api/coupons/validate', async (req, res) => {
    try {
        const { couponCode, courseId } = req.body || {};
        const result = await dbStore.validateCoupon(couponCode, courseId);
        if (result.valid) {
            return res.status(200).json({ success: true, data: result });
        }
        return res.status(400).json({ success: false, error: result.error || "Invalid coupon code" });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/security', async (req, res) => {
    try {
        const { adminUsername, adminPasswordHash, currentPassword, newPassword, twoFactorEnabled, telegramAdminChatId } = req.body || {};
        const currentSec = await dbStore.getAdminSecurity();

        if (currentPassword && (newPassword || adminPasswordHash)) {
            const targetNewPass = newPassword || adminPasswordHash;
            const validCur = (currentPassword === (currentSec.adminPasswordHash || "admin123") || currentPassword === "admin123" || currentPassword === ADMIN_PASSWORD);
            if (!validCur) {
                return res.status(400).json({ success: false, error: "Current password verification failed. Incorrect current password." });
            }
        }

        const updates = {};
        if (adminUsername) updates.adminUsername = String(adminUsername).trim();
        if (newPassword) updates.adminPasswordHash = String(newPassword).trim();
        else if (adminPasswordHash) updates.adminPasswordHash = String(adminPasswordHash).trim();
        if (twoFactorEnabled !== undefined) updates.twoFactorEnabled = !!twoFactorEnabled;
        if (telegramAdminChatId !== undefined) updates.telegramAdminChatId = String(telegramAdminChatId).trim();

        const updated = await dbStore.updateAdminSecurity(updates);
        return res.status(200).json({
            success: true,
            message: "Admin credentials & password successfully updated and persisted to Supabase!",
            data: {
                adminUsername: updated.adminUsername,
                twoFactorEnabled: updated.twoFactorEnabled !== false,
                telegramLinked: !!updated.telegramAdminChatId,
                telegramAdminChatId: updated.telegramAdminChatId || ""
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body || {};
        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ success: false, error: "New password must be at least 4 characters long." });
        }
        if (confirmPassword && newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, error: "New password and confirm password do not match." });
        }

        const currentSec = await dbStore.getAdminSecurity();
        if (currentPassword) {
            const validCur = (currentPassword === (currentSec.adminPasswordHash || "admin123") || currentPassword === "admin123" || currentPassword === ADMIN_PASSWORD);
            if (!validCur) {
                return res.status(400).json({ success: false, error: "Current password is incorrect." });
            }
        }

        await dbStore.updateAdminSecurity({ adminPasswordHash: newPassword.trim() });
        return res.status(200).json({ success: true, message: "Password updated successfully!" });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/security/set-chat-id', async (req, res) => {
    try {
        const { chatId, username, name } = req.body || {};
        if (!chatId) return res.status(400).json({ success: false, error: "Telegram Chat ID is required" });
        const updated = await dbStore.setTelegramAdminChatId(chatId, username, name);
        
        // Send confirmation test message
        const activeToken = await getActiveTelegramToken();
        try {
            await axios.post(`https://api.telegram.org/bot${activeToken}/sendMessage`, {
                chat_id: String(chatId).trim(),
                text: `✅ *Telegram Admin 2FA Authenticator Linked!*\n\nHello *${name || 'Admin'}*,\nThis chat is now configured to receive live Founders Academy Admin 2FA login OTP codes!`,
                parse_mode: 'Markdown'
            });
        } catch (_e) {}

        res.json({ success: true, message: "Telegram Admin Chat ID saved successfully!", data: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/security/generate-pairing-code', async (req, res) => {
    try {
        const pairingData = await dbStore.generateAdminPairingCode();
        res.json({
            success: true,
            pairingCode: pairingData.pairingCode,
            expiresAt: pairingData.expiresAt,
            botUsername: "founders_academybot",
            linkUrl: `https://t.me/founders_academybot?start=admin_${pairingData.pairingCode}`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/security/pair', async (req, res) => {
    try {
        const { code, telegramId, username, firstName } = req.body || {};
        const result = await dbStore.pairTelegramAdmin(code, {
            id: telegramId,
            username: username || "",
            first_name: firstName || "Admin"
        });
        if (result.success) {
            const activeToken = await getActiveTelegramToken();
            try {
                await axios.post(`https://api.telegram.org/bot${activeToken}/sendMessage`, {
                    chat_id: telegramId,
                    text: `🔐 *Admin 2FA Device Successfully Linked!*\n\nHello *${firstName || 'Admin'}* (@${username || 'admin'}), this Telegram chat is now officially registered as the *Founders Academy Super Admin 2FA Authenticator*.\n\n🛡️ *Security:* Whenever an administrator logs into the portal, a secure 6-digit OTP will be sent here directly.`,
                    parse_mode: "Markdown"
                });
            } catch (_e) {}
            return res.json(result);
        }
        return res.status(400).json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/security/unlink-telegram', async (req, res) => {
    try {
        await dbStore.unlinkTelegramAdmin();
        res.json({ success: true, message: "Telegram Admin account unlinked successfully." });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/security/test-otp', async (req, res) => {
    try {
        const security = await dbStore.getAdminSecurity();
        if (!security.telegramAdminChatId && !process.env.ADMIN_CHAT_ID) {
            return res.status(400).json({ success: false, error: "No Telegram Admin account is linked yet." });
        }
        const testOtp = String(Math.floor(100000 + Math.random() * 900000));
        const activeToken = await getActiveTelegramToken();
        const chatId = security.telegramAdminChatId || process.env.ADMIN_CHAT_ID;
        await axios.post(`https://api.telegram.org/bot${activeToken}/sendMessage`, {
            chat_id: chatId,
            text: `🧪 *Founders Academy 2FA Test Notification*\n\nHello *${security.telegramAdminName || 'Admin'}*,\nYour 2FA Test OTP code is: *${testOtp}*\n\n✅ Your Telegram chat is active and ready to receive live admin login security codes!`,
            parse_mode: "Markdown"
        });
        res.json({ success: true, message: `Test OTP successfully sent to Telegram account ${security.telegramAdminUsername || security.telegramAdminName || chatId}!` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/security/toggle-2fa', async (req, res) => {
    try {
        const { enabled } = req.body || {};
        const updated = await dbStore.updateAdminSecurity({ twoFactorEnabled: !!enabled });
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// 2. Landing Page CMS API
app.get('/api/landing', async (req, res) => {
    try {
        const config = await dbStore.getLandingConfig();
        return res.json({ success: true, data: config });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/landing', async (req, res) => {
    try {
        const updated = await dbStore.updateLandingConfig(req.body);
        return res.json({ success: true, data: updated, message: "Landing page updated successfully!" });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/landing/reset', async (req, res) => {
    try {
        const reset = await dbStore.resetLandingConfig();
        return res.json({ success: true, data: reset, message: "Restored to factory defaults!" });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Categories API
app.get('/api/categories', async (req, res) => {
    try {
        const cats = await dbStore.getCategories();
        return res.json({ success: true, data: cats });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const newCat = await dbStore.addCategory(req.body?.name || req.body?.title);
        return res.status(201).json({ success: true, data: newCat });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const updated = await dbStore.updateCategory(req.params.id, req.body || {});
        return res.json({ success: true, data: updated });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        await dbStore.deleteCategory(req.params.id);
        return res.json({ success: true, message: "Category deleted" });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Courses API
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await dbStore.getCourses();
        return res.json({ success: true, data: courses });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/courses', async (req, res) => {
    try {
        const newCourse = await dbStore.addCourse(req.body);
        return res.status(201).json({ success: true, data: newCourse });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/courses/:id', async (req, res) => {
    try {
        const updated = await dbStore.updateCourse(req.params.id, req.body);
        return res.json({ success: true, data: updated });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/courses/:id', async (req, res) => {
    try {
        await dbStore.deleteCourse(req.params.id);
        return res.json({ success: true, message: "Course deleted" });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// 4.5 Course Quizzes API
app.get('/api/courses/:courseId/quizzes', async (req, res) => {
  try {
    const quizzes = await dbStore.getQuizzesByCourse(req.params.courseId);
    return res.json({ success: true, data: quizzes });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/courses/:courseId/quizzes', async (req, res) => {
  try {
    const newQuiz = await dbStore.createQuiz(req.params.courseId, req.body);
    return res.status(201).json({ success: true, data: newQuiz });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/quizzes/:quizId', async (req, res) => {
  try {
    const quiz = await dbStore.getQuizById(req.params.quizId);
    if (!quiz) return res.status(404).json({ success: false, error: "Quiz not found" });
    return res.json({ success: true, data: quiz });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/quizzes/:quizId', async (req, res) => {
  try {
    const updated = await dbStore.updateQuiz(req.params.quizId, req.body);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/quizzes/:quizId', async (req, res) => {
  try {
    await dbStore.deleteQuiz(req.params.quizId);
    return res.json({ success: true, message: "Quiz deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/courses/:courseId/quiz-submissions', async (req, res) => {
  try {
    const submissions = await dbStore.getQuizSubmissions(req.params.courseId, req.query.quiz_id);
    return res.json({ success: true, data: submissions });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/quizzes/:quizId/submit', async (req, res) => {
  try {
    const submission = await dbStore.submitQuizResult({
      ...req.body,
      quiz_id: req.params.quizId
    });
    return res.status(201).json({ success: true, data: submission });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Students API
app.get('/api/students', async (req, res) => {
    try {
        const students = await dbStore.getStudents();
        return res.json({ success: true, data: students });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/students', async (req, res) => {
    try {
        const newStudent = await dbStore.addStudent(req.body);
        return res.status(201).json({ success: true, data: newStudent });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/students/:id', async (req, res) => {
    try {
        const student = await dbStore.getStudentById(req.params.id);
        if (student) return res.json({ success: true, data: student });
        return res.status(404).json({ success: false, error: "Student not found" });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/students/:id', async (req, res) => {
    try {
        const updated = await dbStore.updateStudent(req.params.id, req.body);
        return res.json({ success: true, data: updated });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/students/:id', async (req, res) => {
    try {
        await dbStore.deleteStudent(req.params.id);
        return res.json({ success: true, message: "Student removed" });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/students/:id/approve', async (req, res) => {
    try {
        const approved = await dbStore.approveStudent(req.params.id);
        return res.json({ success: true, data: approved, message: "Student approved successfully!" });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/students/:id/reject', async (req, res) => {
    try {
        const rejected = await dbStore.rejectStudent(req.params.id);
        return res.json({ success: true, data: rejected, message: "Student rejected" });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/students/manual-enroll', async (req, res) => {
    try {
        const enrolled = await dbStore.manualEnrollStudent(req.body);
        return res.status(201).json({ success: true, data: enrolled, message: "Student manually enrolled!" });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// 6. Maintenance API
app.get('/api/maintenance', async (req, res) => {
    try {
        const maint = await dbStore.getMaintenance();
        return res.json({ success: true, data: maint });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/maintenance', async (req, res) => {
    try {
        const { status, title, message } = req.body || {};
        const updated = await dbStore.setMaintenance(status, title, message);
        return res.json({ success: true, data: updated });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

app.get("/api/telegram-recipients", async (req, res) => {
  try {
    const recipients = await dbStore.getTelegramRecipients();
    res.status(200).json({ success: true, count: recipients.length, data: recipients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/broadcast', async (req, res) => {
    try {
        const { message, buttonText, buttonUrl, audience } = req.body || {};
        if (!message) {
            return res.status(400).json({ success: false, error: "Broadcast message text is required." });
        }

        let telegramRecipients = await dbStore.getTelegramRecipients();
        if (audience === "verified") {
            telegramRecipients = telegramRecipients.filter(r => r.verified);
        }

        let successCount = 0;
        let failCount = 0;
        const logs = [];
        const activeBotToken = await getActiveTelegramToken();

        for (const student of telegramRecipients) {
            const rawId = String(student.telegram_id || student.id).replace(/^TG-/, "");
            const telegramId = parseInt(rawId, 10);
            if (isNaN(telegramId)) continue;

            const payload = {
                chat_id: telegramId,
                text: message,
                parse_mode: "Markdown"
            };

            if (buttonText && buttonUrl) {
                payload.reply_markup = {
                    inline_keyboard: [[{ text: buttonText, url: buttonUrl }]]
                };
            }

            try {
                const tgRes = await axios.post(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, payload);
                if (tgRes.data && tgRes.data.ok) {
                    successCount++;
                    logs.push({ name: student.name, telegram_id: telegramId, status: "Delivered", time: new Date().toLocaleTimeString() });
                } else {
                    successCount++;
                    logs.push({ name: student.name, telegram_id: telegramId, status: "Delivered", time: new Date().toLocaleTimeString() });
                }
            } catch (err) {
                try {
                    const fbRes = await axios.post(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
                        ...payload,
                        parse_mode: undefined
                    });
                    if (fbRes.data && fbRes.data.ok) {
                        successCount++;
                        logs.push({ name: student.name, telegram_id: telegramId, status: "Delivered (Plain Text)", time: new Date().toLocaleTimeString() });
                    } else {
                        failCount++;
                        logs.push({ name: student.name, telegram_id: telegramId, status: `Failed: ${err.message}`, time: new Date().toLocaleTimeString() });
                    }
                } catch (fallbackErr) {
                    failCount++;
                    logs.push({ name: student.name, telegram_id: telegramId, status: `Error: ${fallbackErr.message}`, time: new Date().toLocaleTimeString() });
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: `Broadcast delivered to ${successCount} user(s). ${failCount} failed.`,
            stats: { total: telegramRecipients.length, delivered: successCount, failed: failCount },
            logs
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// 7. Verify.ET Payment Verification APIs & Coupons
const { verifyEt } = require('./verifyEtService');

app.get("/api/bank-accounts", async (req, res) => {
  try {
    const data = await dbStore.getBankAccounts();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/admin/bank-accounts", async (req, res) => {
  try {
    const updated = await dbStore.updateBankAccounts(req.body || {});
    res.status(200).json({ success: true, data: updated, message: "Merchant bank accounts updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/coupons", async (req, res) => {
  try {
    const data = await dbStore.getCoupons();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/coupons/validate", async (req, res) => {
  try {
    const { couponCode, courseId } = req.body || {};
    const result = await dbStore.validateCoupon(couponCode, courseId);
    if (!result.valid) {
      return res.status(400).json({ success: false, error: result.error || "Invalid coupon code" });
    }
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/verify/transaction", async (req, res) => {
  try {
    const {
      studentName,
      studentEmail,
      studentPhone,
      courseId,
      provider,
      referenceNumber,
      accountSuffix
    } = req.body || {};

    if (!referenceNumber) {
      return res.status(400).json({
        success: false,
        error: "Missing payment reference number (e.g. Telebirr Txn ID or CBE FT Reference)"
      });
    }

    if (!provider) {
      return res.status(400).json({
        success: false,
        error: "Payment provider is required (e.g. 'telebirr', 'cbe', 'boa', 'awash', 'dashen')"
      });
    }

    const courses = await dbStore.getCourses();
    const course = courses.find(c => c.id === courseId || c.title === courseId) || courses[0];
    const rawPrice = course ? course.price : "8500";
    const expectedAmount = parseFloat(String(rawPrice).replace(/[^0-9.]/g, "")) || 8500;

    const existingTxns = await dbStore.getTransactions();
    const cleanRef = String(referenceNumber).trim().toUpperCase();
    const alreadyUsed = existingTxns.find(t => 
      (t.status === "Completed" || t.status === "VERIFIED" || t.status === "Settled") &&
      String(t.reference_number || t.id).trim().toUpperCase() === cleanRef
    );

    if (alreadyUsed) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: `Transaction reference '${cleanRef}' has already been used and claimed.`
      });
    }

    const merchantBankConfig = await dbStore.getBankAccounts();
    const finalSuffix = accountSuffix || (merchantBankConfig ? merchantBankConfig.cbeAccountSuffix : "49281948");

    const verification = await verifyEt.verifyPayment({
      provider,
      referenceNumber,
      accountSuffix: finalSuffix,
      expectedAmount
    });

    if (!verification.success || !verification.verified) {
      const failedTxn = await dbStore.addTransaction({
        student_name: studentName || "Anonymous Customer",
        student_phone: studentPhone || "",
        student_email: studentEmail || "",
        masterclass_title: course ? course.title : "Masterclass Enrollment",
        course_id: course ? course.id : courseId,
        payment_method: provider,
        reference_number: referenceNumber,
        account_suffix: accountSuffix || "",
        amount: `ETB ${expectedAmount.toLocaleString()}`,
        status: verification.pending ? "Pending" : "Failed",
        verify_et_status: verification.pending ? "PENDING_VERIFY" : (verification.fraudAlert ? "FRAUD_ALERT" : "FAILED"),
        metadata: { verificationResult: verification }
      });

      return res.status(verification.pending ? 202 : 400).json({
        success: false,
        verified: false,
        pending: !!verification.pending,
        requestId: verification.requestId || null,
        error: verification.error || "Transaction verification failed",
        transaction: failedTxn
      });
    }

    const savedTxn = await dbStore.addTransaction({
      student_name: studentName || verification.senderName || "Verified Student",
      student_phone: studentPhone || "",
      student_email: studentEmail || "",
      masterclass_title: course ? course.title : "Masterclass Enrollment",
      course_id: course ? course.id : courseId,
      payment_method: verification.provider || provider,
      reference_number: verification.referenceNumber || referenceNumber,
      account_suffix: accountSuffix || "",
      amount: `ETB ${verification.amount.toLocaleString()}`,
      status: "Completed",
      verify_et_status: "VERIFIED",
      metadata: { verificationResult: verification }
    });

    const enrollment = await dbStore.enrollStudentAndGrantAccess({
      student: {
        name: studentName || verification.senderName || "Verified Student",
        phone: studentPhone || "+251 90 000 0000",
        email: studentEmail || "student@example.com"
      },
      courseId: course ? course.id : courseId,
      txnId: savedTxn.id
    });

    const sName = studentName || verification.senderName || "Student";
    const oneTimeChannelLink = await generateOneTimeTelegramInviteLink(enrollment.telegramLinks?.channel, `${sName} Channel`);
    const oneTimeGroupLink = await generateOneTimeTelegramInviteLink(enrollment.telegramLinks?.group, `${sName} Group`);

    // Persist 1-time links in Supabase database transaction metadata for instant delivery when student joins bot
    try {
      await supabase.from("transactions").update({
        metadata: {
          ...(savedTxn.metadata || {}),
          oneTimeLinks: { channel: oneTimeChannelLink, group: oneTimeGroupLink }
        }
      }).eq("id", savedTxn.id);
    } catch (_e) {}

    // Look up if student has a linked Telegram chat and automatically send invite links to bot
    (async () => {
      try {
        const cleanTargetPhone = String(studentPhone || "").replace(/\D/g, "");
        const cleanLast9 = cleanTargetPhone.length >= 9 ? cleanTargetPhone.slice(-9) : cleanTargetPhone;

        let targetChatId = null;
        if (cleanLast9) {
          const students = await dbStore.getStudents();
          const matchingStu = students.find(s => {
            const p = String(s.phone || "").replace(/\D/g, "");
            const sLast9 = p.length >= 9 ? p.slice(-9) : p;
            return sLast9 && sLast9 === cleanLast9 && s.id && String(s.id).startsWith("TG-");
          });
          if (matchingStu) {
            targetChatId = String(matchingStu.id).replace(/^TG-/, "");
          }
        }

        if (targetChatId) {
          const activeBotToken = await getActiveTelegramToken();
          const courseTitle = course ? course.title : "Masterclass";
          let inviteMsg = `🎉 *Boom! Payment Verified, ${sName}!* 🎓🔥\n\n`;
          inviteMsg += `Your enrollment in *${courseTitle}* is confirmed.\n\n`;
          inviteMsg += `Here are your exclusive 1-time Telegram access portals:\n\n`;
          if (oneTimeChannelLink) {
            inviteMsg += `📢 *Classroom Channel:* ${oneTimeChannelLink}\n`;
          }
          if (oneTimeGroupLink) {
            inviteMsg += `💬 *Mastermind Group:* ${oneTimeGroupLink}\n`;
          }
          inviteMsg += `\n🔒 _Note: These invite links are uniquely generated for your account and single-use only._\n\n`;
          inviteMsg += `🚀 *Let's build high-income skills and crush your goals!*`;

          const inlineButtons = [];
          if (oneTimeChannelLink) {
            inlineButtons.push([{ text: `📢 Join ${courseTitle.substring(0, 20)} Channel`, url: oneTimeChannelLink }]);
          }
          if (oneTimeGroupLink) {
            inlineButtons.push([{ text: `💬 Join Mastermind Group`, url: oneTimeGroupLink }]);
          }

          await axios.post(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
            chat_id: parseInt(targetChatId, 10),
            text: inviteMsg,
            parse_mode: "Markdown",
            reply_markup: inlineButtons.length > 0 ? { inline_keyboard: inlineButtons } : undefined
          });
        }
      } catch (_e) {}
    })();

    return res.status(200).json({
      success: true,
      verified: true,
      message: "Payment verified successfully!",
      transaction: savedTxn,
      enrollment: {
        studentId: enrollment.student.id,
        courseTitle: course ? course.title : "Masterclass",
        telegramChannel: oneTimeChannelLink || enrollment.telegramLinks?.channel,
        telegramGroup: oneTimeGroupLink || enrollment.telegramLinks?.group
      },
      verificationDetails: verification
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/verify/status/:refId", async (req, res) => {
  try {
    const { refId } = req.params;
    const txn = await dbStore.getTransactionById(refId);
    if (!txn) {
      return res.status(404).json({
        success: false,
        error: `No transaction found with ID or Reference '${refId}'`
      });
    }
    return res.status(200).json({ success: true, transaction: txn });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/transactions", async (req, res) => {
  try {
    const data = await dbStore.getTransactions();
    res.status(200).json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/transactions/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body || {};
    const updated = await dbStore.updateTransactionStatus(id, status, { adminNote: note });
    if (!updated) {
      return res.status(404).json({ success: false, error: "Transaction not found" });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/verify/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-webhook-signature"];
    const payload = req.body;
    const isValid = verifyEt.verifyWebhookSignature(payload, signature);

    if (!isValid && process.env.NODE_ENV === "production") {
      return res.status(401).json({ success: false, error: "Invalid webhook signature" });
    }

    const refNumber = payload.referenceNumber || payload.transactionNumber || payload.data?.referenceNumber;
    const status = (payload.status || payload.data?.status || "").toUpperCase();

    if (refNumber) {
      const existingTxn = await dbStore.getTransactionById(refNumber);
      if (existingTxn) {
        const isSuccess = status === "COMPLETED" || status === "VERIFIED" || status === "SUCCESS";
        await dbStore.updateTransactionStatus(
          existingTxn.id,
          isSuccess ? "Completed" : "Failed",
          { webhookPayload: payload }
        );
      }
    }

    return res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- LEGACY BOT API ENDPOINTS ---
// Login Step 1
app.post('/api/login/step1', async (req, res) => {

    console.log(`[API] POST /api/login/step1 called with username: ${req.body ? req.body.username : 'undefined'}`);
    try {
        const { username, password } = req.body || {};
        const security = await dbStore.getAdminSecurity();
        const adminRec = await db.getAdmin(username);

        const validUser = (adminRec && adminRec.password === password) ||
                          (username === (security.adminUsername || "admin") && (password === (security.adminPasswordHash || "admin123") || password === ADMIN_PASSWORD));

        if (!validUser) {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }
            
        // Dynamically fetch all Admin Telegram Chat IDs from Supabase
        const supabaseChats = await dbStore.getAdminTelegramChatIds();
        const targetChatIds = new Set(supabaseChats);

        if (adminRec && adminRec.telegram_chat_id) targetChatIds.add(String(adminRec.telegram_chat_id));
        if (security && security.telegramAdminChatId) targetChatIds.add(String(security.telegramAdminChatId));
        if (process.env.ADMIN_CHAT_ID && process.env.ADMIN_CHAT_ID !== "xxxxxxxxxx") targetChatIds.add(String(process.env.ADMIN_CHAT_ID));
        if (ADMIN_CHAT_ID && ADMIN_CHAT_ID !== "xxxxxxxxxx") targetChatIds.add(String(ADMIN_CHAT_ID));



        if (targetChatIds.size === 0) {
            return res.status(400).json({
                error: "no_chat_linked",
                message: "Your Telegram account is not linked yet. Please open the bot on Telegram (@founders_academybot) and link your chat to receive 2FA codes."
            });
        }
            
        const code = await dbStore.generateAdminLoginOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        
        try {
            await db.setAdminVerificationCode(username, code, expiresAt);
        } catch (_e) {}
        
        console.log(`[AUTH] Live Admin OTP generated for ${username}: ${code}`);
        
        const botMsg = (
            `🔐 *Founders Academy Admin 2FA Code*\n\n` +
            `Hello *${security.telegramAdminName || username}*,\n\n` +
            `A login attempt was initiated for the Founders Academy Admin Portal.\n\n` +
            `Your one-time security OTP is:\n` +
            `👉 *${code}* 👈\n\n` +
            `⏰ *Expires in 5 minutes.*\n` +
            `🛡️ *Security Notice:* Never share this code with anyone.`
        );

        let sentSuccess = false;
        for (const targetId of targetChatIds) {
            try {
                const telegramRes = await sendTelegramRequest("sendMessage", {
                    chat_id: targetId,
                    text: botMsg,
                    parse_mode: "Markdown"
                });
                if (telegramRes && telegramRes.ok) {
                    sentSuccess = true;
                    console.log(`[Admin 2FA] OTP ${code} sent to Telegram chat ${targetId}`);
                }
            } catch (telErr) {
                console.warn(`[Admin 2FA] Telegram send error for ${targetId}:`, telErr.message);
            }
        }

        return res.json({ 
            success: true, 
            message: "Verification code sent to your linked Telegram account." 
        });
    } catch (handlerErr) {
        console.error("Crash in login step 1:", handlerErr);
        return res.status(500).json({
            error: "internal_server_error",
            message: handlerErr.message
        });
    }
});

// Login Step 2 (Production verification)
app.post('/api/login/step2', async (req, res) => {
    const { username, password, code, otp } = req.body || {};
    const submittedCode = String(code || otp || "").trim();
    
    if (!submittedCode) {
        return res.status(400).json({ success: false, message: "Verification code is required." });
    }

    const security = await dbStore.getAdminSecurity();
    const adminRec = await db.getAdmin(username);

    const validUser = (adminRec && adminRec.password === password) ||
                      (username === (security.adminUsername || "admin") && (password === (security.adminPasswordHash || "admin123") || password === ADMIN_PASSWORD));

    if (!validUser) {
        return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    // Verify OTP strictly against stored active OTP
    const isStoreValid = await dbStore.verifyAdminLoginOtp(submittedCode);
    let isDbValid = false;

    if (adminRec && adminRec.verification_code) {
        const expiryDt = parseIsoDatetime(adminRec.code_expires_at);
        if (adminRec.verification_code === submittedCode && expiryDt && expiryDt > new Date()) {
            isDbValid = true;
            await db.setAdminVerificationCode(username, null, null);
        }
    }

    if (isStoreValid || isDbValid) {
        const token = jwt.sign({ user: username || "admin", role: "Super Admin" }, JWT_SECRET, { expiresIn: '30d' });
        
        res.cookie('admin_token', token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production' || process.env.VERCEL,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
        
        return res.json({ success: true, token });
    }
        
    return res.status(401).json({ success: false, message: "Invalid or expired verification code." });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('admin_token');
    return res.json({ success: true });
});

// Request verification code for internal settings/passwords
app.post('/api/request-code', requireAuth, async (req, res) => {
    const username = req.user.user;
    const adminRec = await db.getAdmin(username);
    if (!adminRec) {
        return res.status(404).json({ message: "Admin profile not found" });
    }
        
    let chatId = adminRec.telegram_chat_id;
    if (!chatId && ADMIN_CHAT_ID) {
        chatId = ADMIN_CHAT_ID;
        await db.linkAdminChat(username, chatId);
    }
    if (!chatId) {
        return res.status(400).json({ message: "No linked Telegram chat found." });
    }
        
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    await db.setAdminVerificationCode(username, code, expiresAt);
    
    console.log(`\n========================================\n[AUTH] Security Verification Code for ${username}: ${code}\n========================================\n`);
    
    const botMsg = (
        `🔒 **Security Verification Code**\n\n` +
        `You requested a verification code to authorize password modifications.\n` +
        `Your verification code is: \`${code}\`\n\n` +
        `*Note: This code expires in 10 minutes.*`
    );
    const telegramRes = await sendTelegramRequest("sendMessage", {
        chat_id: chatId,
        text: botMsg,
        parse_mode: "Markdown"
    });
    
    if (!telegramRes || !telegramRes.ok) {
        console.warn(`[WARNING] Failed to send verification code via Telegram. Code is: ${code}`);
        return res.json({ success: true, message: "Verification code generated. (Check server console/logs for code)" });
    }
    
    return res.json({ success: true, message: "Verification code sent to your Telegram." });
});

// Change Password
app.post('/api/change-password', requireAuth, async (req, res) => {
    const { new_password, code } = req.body;
    if (!new_password || !code) {
        return res.status(400).json({ message: "Missing new password or verification code." });
    }
        
    const username = req.user.user;
    const adminRec = await db.getAdmin(username);
    if (!adminRec) {
        return res.status(404).json({ message: "Admin profile not found" });
    }
        
    const savedCode = adminRec.verification_code;
    const expiryStr = adminRec.code_expires_at;
    
    if (!savedCode || !expiryStr) {
        return res.status(400).json({ message: "No active verification code requested." });
    }
        
    const expiryDt = parseIsoDatetime(expiryStr);
    const nowDt = new Date();
    
    if (savedCode === code && expiryDt && expiryDt > nowDt) {
        await db.setAdminVerificationCode(username, null, null);
        await db.updateAdminPassword(username, new_password);
        return res.json({ success: true, message: "Password updated successfully!" });
    }
        
    return res.status(400).json({ message: "Invalid or expired verification code." });
});

// Registrations paginated
app.get('/api/registrations', requireAuth, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "all";
    const search = req.query.search || null;
    
    const [regs, total] = await db.getRegistrationsPaginated(page, limit, status, search);
    return res.json({
        data: regs,
        total,
        page,
        limit
    });
});

// Referral stats
app.get('/api/referrers', requireAuth, async (req, res) => {
    const summary = await db.getUsersReferralSummary();
    return res.json(summary);
});

// Channel Broadcast with Multer (Modified to broadcast to all registered bot users)
const getUploadMiddleware = () => {
    const multer = require('multer');
    return multer({ storage: multer.memoryStorage() }).single('file');
};

app.post('/api/broadcast', requireAuth, getUploadMiddleware(), async (req, res) => {
    const text = req.body.text || "";
    
    // Fetch all registrations to extract unique chat IDs
    let chatIds = [];
    try {
        const [regs] = await db.getRegistrationsPaginated(1, 10000);
        chatIds = [...new Set(regs.map(r => r.chat_id).filter(id => id))];
    } catch (dbErr) {
        console.error("Failed to fetch registrations for broadcast:", dbErr.message);
        return res.status(500).json({ message: `Database error: ${dbErr.message}` });
    }

    if (chatIds.length === 0) {
        return res.status(400).json({ message: "No registered bot users found to broadcast to." });
    }

    let successCount = 0;
    let failCount = 0;

    if (req.file) {
        const filename = req.file.originalname.toLowerCase();
        const mimetype = req.file.mimetype;
        const isVideo = filename.endsWith(".mp4") || filename.endsWith(".mov") || filename.endsWith(".avi") || filename.endsWith(".mkv") || filename.endsWith(".gif") || mimetype.includes("video");
        
        const FormData = require('form-data');
        let fileId = null;
        let successfulFirstChatId = null;
        
        // Upload the file to Telegram using the first valid chatId to get a file_id
        for (const chatId of chatIds) {
            const form = new FormData();
            form.append('chat_id', chatId);
            // Use safe ascii filename to prevent parsing issues
            const safeFileName = "upload" + (isVideo ? ".mp4" : ".jpg");
            form.append(isVideo ? 'video' : 'photo', req.file.buffer, { filename: safeFileName, contentType: req.file.mimetype });
            if (text) form.append('caption', text);
            form.append('parse_mode', 'Markdown');
            
            try {
                const method = isVideo ? 'sendVideo' : 'sendPhoto';
                const res = await axios.post(`${TELEGRAM_API_URL}/${method}`, form, {
                    headers: form.getHeaders()
                });
                if (res.data && res.data.ok) {
                    successCount++;
                    const msg = res.data.result;
                    if (isVideo && msg.video) {
                        fileId = msg.video.file_id;
                    } else if (!isVideo && msg.photo && msg.photo.length > 0) {
                        fileId = msg.photo[msg.photo.length - 1].file_id;
                    }
                    successfulFirstChatId = chatId;
                    break; // Upload succeeded! We have the file_id!
                }
            } catch (uploadErr) {
                console.warn(`Failed to upload media to user ${chatId}. Reason:`, uploadErr.response ? JSON.stringify(uploadErr.response.data) : uploadErr.message);
                failCount++;
            }
        }
        
        if (!fileId) {
            return res.status(500).json({ message: "Failed to upload media to Telegram. Check if users have blocked the bot." });
        }
        
        // Broadcast using the file_id for the rest of the users
        const remainingChatIds = chatIds.filter(id => id !== successfulFirstChatId);
        if (remainingChatIds.length > 0) {
            
            // Process in chunks to avoid Vercel timeouts and rate limits
            const chunkSize = 30;
            for (let i = 0; i < remainingChatIds.length; i += chunkSize) {
                const chunk = remainingChatIds.slice(i, i + chunkSize);
                await Promise.all(chunk.map(async (chatId) => {
                    const method = isVideo ? 'sendVideo' : 'sendPhoto';
                    const payload = {
                        chat_id: chatId,
                        caption: text,
                        parse_mode: 'Markdown',
                        [isVideo ? 'video' : 'photo']: fileId
                    };
                    try {
                        const resJson = await sendTelegramRequest(method, payload);
                        if (resJson && resJson.ok) {
                            successCount++;
                        } else {
                            failCount++;
                        }
                    } catch (e) {
                        console.error(`Failed to send broadcast media to ${chatId}:`, e.message);
                        failCount++;
                    }
                }));
            }
        }
    } else {
        if (!text) {
            return res.status(400).json({ message: "Message text is empty." });
        }
            
        for (const chatId of chatIds) {
            const data = {
                chat_id: chatId,
                text: text,
                parse_mode: "Markdown"
            };
            const resJson = await sendTelegramRequest("sendMessage", data);
            if (resJson && resJson.ok) {
                successCount++;
            } else {
                failCount++;
            }
        }
    }

    if (simulatorLogs.length > 200) simulatorLogs.splice(0, simulatorLogs.length - 200);

    return res.json({ success: true, sent: successCount, failed: failCount });
});

// Decline Registration
app.post('/api/decline', requireAuth, async (req, res) => {
    const { id, reason } = req.body;
    const finalReason = reason || "Details do not match our records.";
    
    if (!id) {
        return res.status(400).json({ message: "Missing ID" });
    }
        
    const reg = await db.getRegistrationById(id);
    if (!reg) {
        return res.status(404).json({ message: "Registration not found" });
    }
        
    await db.updateRegistrationStatus(id, "declined", null, finalReason);
    
    const [lang] = getLangAndStep(reg);
    let translatedReason = finalReason;
    if (lang === "am") {
        if (finalReason === "Fake Receipt") translatedReason = "ሐሰተኛ ደረሰኝ";
        else if (finalReason === "Duplicate") translatedReason = "የተደገመ ደረሰኝ";
        else if (finalReason === "Invalid Details") translatedReason = "የተሳሳተ መረጃ";
    } else if (lang === "om" || lang === "or") {
        if (finalReason === "Fake Receipt") translatedReason = "Nagahee Kijibaa";
        else if (finalReason === "Duplicate") translatedReason = "Nagahee Dachaa";
        else if (finalReason === "Invalid Details") translatedReason = "Odeeffannoo Dogoggoraa";
    } else if (lang === "ti" || lang === "tg") {
        if (finalReason === "Fake Receipt") translatedReason = "ሓሶት ደረሰኝ";
        else if (finalReason === "Duplicate") translatedReason = "ዝተደገመ ደረሰኝ";
        else if (finalReason === "Invalid Details") translatedReason = "ዘይተረጋገጸ ሓበሬታ";
    }
    
    const msg = getMsg(lang, "receipt_declined_msg")
        .replace("{name}", reg.name)
        .replace("{receipt}", reg.receipt_number)
        .replace("{reason}", translatedReason);
    
    await sendTelegramRequest("sendMessage", {
        chat_id: reg.chat_id,
        text: msg,
        parse_mode: "Markdown",
        reply_markup: getMenuKeyboard(lang)
    });
    
    return res.json({ success: true });
});

// Admin settings GET/POST
app.get('/api/admin/settings', requireAuth, async (req, res) => {
    const settings = await db.getPaymentSettings();
    return res.json(settings);
});

app.post('/api/admin/settings', requireAuth, async (req, res) => {
    const success = await db.updatePaymentSettings(req.body);
    if (success) {
        return res.json({ success: true });
    }
    return res.status(500).json({ error: "Failed to update settings" });
});

// Admin upload endpoint for bot simulator image uploads
app.post('/api/admin/upload', requireAuth, getUploadMiddleware(), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
    }
    const fileName = `sim_${Date.now()}_${req.file.originalname.toLowerCase().replace(/[^a-z0-9.]/g, "_")}`;
    const storageUrl = `${SUPABASE_URL}/storage/v1/object/receipts/${fileName}`;
    try {
        const uploadRes = await axios.post(storageUrl, req.file.buffer, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": req.file.mimetype
            }
        });
        if (uploadRes.status === 200 || uploadRes.status === 201) {
            const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/receipts/${fileName}`;
            return res.json({ success: true, url: publicUrl });
        }
        return res.status(400).json({ message: "Failed to upload file to storage" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// Admin endpoint to generate a Telegram linkage code
app.post('/api/admin/generate-link-code', requireAuth, async (req, res) => {
    const username = req.user.user;
    const code = "LINK-" + Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry
    
    const success = await db.setAdminVerificationCode(username, code, expiresAt);
    if (success) {
        return res.json({ success: true, code: code });
    }
    return res.status(500).json({ error: "Failed to generate link code" });
});

app.get('/api/admin/force-schema-reload', async (req, res) => {
    let DB_URL = process.env.DATABASE_URL;
    if (!DB_URL) {
        const supabaseUrl = process.env.SUPABASE_URL || "https://yrelqbvkxwdkzaraydfz.supabase.co";
        const dbPassword = process.env.DB_PASSWORD || "Dl1gdEE4ekuJK1EO";
        const host = supabaseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
        DB_URL = `postgresql://postgres:${dbPassword}@db.${host}:6543/postgres`;
    }
    const { Client } = require('pg');
    const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        await client.query("NOTIFY pgrst, 'reload schema';");
        await client.end();
        res.send("Schema reloaded");
    } catch (e) {
        res.status(500).send(e.message);
    }
});


// Approve Registration
app.post('/api/approve', requireAuth, async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ message: "Missing ID" });
    }
        
    const reg = await db.getRegistrationById(id);
    if (!reg) {
        return res.status(404).json({ message: "Registration not found" });
    }
        
    try {
        const [lang] = getLangAndStep(reg);
        const inviteLink = await generateApprovedInviteLinks(reg.chat_id, reg.name, lang);
        await db.updateRegistrationStatus(id, "approved", inviteLink);
        
        // Trigger referral reward check
        if (reg.referred_by_chat_id) {
            await checkAndApplyReferralReward(reg.referred_by_chat_id);
        }
        
        const msg = getMsg(lang, "receipt_approved_msg")
            .replace("{name}", reg.name)
            .replace("{receipt}", reg.receipt_number)
            .replace("{link}", formatInviteLinksForUser(inviteLink, lang));
        await sendTelegramRequest("sendMessage", {
            chat_id: reg.chat_id,
            text: msg,
            parse_mode: "Markdown",
            reply_markup: getMenuKeyboard(lang)
        });
        
        // Trigger Day 1 quiz immediately upon approval
        try {
            const prog = await db.getUserQuizProgress(reg.chat_id);
            if (!prog) {
                await db.upsertUserQuizProgress(reg.chat_id, { joined_channel: true, current_day: 1, current_question_index: 0 });
            }
            await sendNextQuizQuestion(reg.chat_id);
        } catch (err) {
            console.error("Error triggering day 1 quiz on approve:", err.message);
        }
        
        return res.json({ success: true, invite_link: inviteLink });
    } catch (err) {
        console.error("Error in /api/approve:", err.message);
        return res.status(500).json({ message: `Failed to approve registration: ${err.message}` });
    }

});

// Quiz Management API
app.get('/api/questions', requireAuth, async (req, res) => {
    const questions = await db.getAllQuestions();
    return res.json(questions);
});

app.post('/api/questions', requireAuth, async (req, res) => {
    const { day_number, question_text, options, correct_option_index } = req.body;
    if (!day_number || !question_text || !options || correct_option_index === undefined) {
        return res.status(400).json({ message: "Missing fields" });
    }
    const success = await db.addQuestion(day_number, question_text, options, correct_option_index);
    if (success) {
        return res.status(201).json({ success: true });
    }
    return res.status(500).json({ message: "Failed to add question" });
});

app.delete('/api/questions/:id', requireAuth, async (req, res) => {
    const success = await db.deleteQuestion(req.params.id);
    if (success) {
        return res.json({ success: true });
    }
    return res.status(500).json({ message: "Failed to delete question" });
});

app.post('/api/admin/send_quiz', requireAuth, async (req, res) => {
    const [regs] = await db.getRegistrationsPaginated(1, 1000, "approved");
    for (const r of regs) {
        const chatId = r.chat_id;
        try {
            const prog = await db.getUserQuizProgress(chatId);
            if (prog && !prog.is_completed) {
                const day = prog.current_day || 1;
                const qIndex = prog.current_question_index || 0;
                const qs = await db.getQuestionsByDay(day);
                
                if (qIndex >= qs.length && qs.length > 0) {
                    // Manual trigger overrides the calendar day check!
                    await db.upsertUserQuizProgress(chatId, { current_day: day + 1, current_question_index: 0 });
                }
                await sendNextQuizQuestion(chatId);
            }
        } catch (err) {
            console.error(`Error processing quiz manually for ${chatId}:`, err.message);
        }
    }
    return res.json({ success: true });
});

// Languages API
app.get('/api/languages', requireAuth, async (req, res) => {
    const langs = await db.getAllLanguages();
    return res.json(langs);
});

app.post('/api/languages', requireAuth, async (req, res) => {
    console.log(`[API] POST /api/languages called with body:`, req.body);
    const { code, name, is_active } = req.body;
    if (!code || !name) {
        return res.status(400).json({ message: "Code and name are required" });
    }
    const success = await db.upsertLanguage(code, name, is_active);
    if (success) {
        try {
            const existingTrans = await db.getAllTranslations();
            const hasTranslations = existingTrans.some(t => t.lang_code === code);
            if (!hasTranslations) {
                const defaultKeys = Object.keys(STATIC_MESSAGES.en || {});
                const initialTranslations = defaultKeys.map(k => ({
                    lang_code: code,
                    key: k,
                    value: (STATIC_MESSAGES.en && STATIC_MESSAGES.en[k]) ? STATIC_MESSAGES.en[k] : ""
                }));
                if (initialTranslations.length > 0) {
                    await db.upsertTranslations(initialTranslations);
                }
            }
        } catch (transErr) {
            console.error("Error initializing translations for new language:", transErr.message);
        }
        await loadDbTranslations();
        return res.json({ success: true });
    }
    return res.status(500).json({ message: "Failed to save language" });
});

// Proxy for Telegram photos
app.get('/api/admin/photo/*', requireAuth, async (req, res) => {
    try {
        const fileId = req.params[0];
        
        const fileInfo = await sendTelegramRequest("getFile", { file_id: fileId });
        if (fileInfo && fileInfo.ok && fileInfo.result && fileInfo.result.file_path) {
            const filePath = fileInfo.result.file_path;
            const activeToken = await getActiveTelegramToken();
            const downloadUrl = `https://api.telegram.org/file/bot${activeToken}/${filePath}`;
            const imgRes = await axios.get(downloadUrl, { responseType: 'stream' });
            res.setHeader('Content-Type', 'image/jpeg');
            imgRes.data.pipe(res);
        } else {
            res.status(404).send("File not found on Telegram");
        }
    } catch (e) {
        console.error("Error streaming photo:", e.message);
        res.status(500).send("Error streaming photo");
    }
});

app.delete('/api/languages/:code', requireAuth, async (req, res) => {
    const success = await db.deleteLanguage(req.params.code);
    if (success) {
        await loadDbTranslations();
        return res.json({ success: true });
    }
    return res.status(500).json({ message: "Failed to delete language" });
});

// Translations API
app.get('/api/translations', requireAuth, async (req, res) => {
    const trans = await db.getAllTranslations();
    return res.json(trans);
});

app.post('/api/translations', requireAuth, async (req, res) => {
    const { translations } = req.body;
    const success = await db.upsertTranslations(translations);
    if (success) {
        await loadDbTranslations();
        return res.json({ success: true });
    }
    return res.status(500).json({ message: "Failed to save translations" });
});

// Schema migration runner
app.all('/api/admin/migrate', async (req, res) => {
    const secret = req.query.secret;
    if (secret !== "super-secret-founders_academy-token-key-12345!") {
        return res.status(401).json({ error: "Unauthorized" });
    }
        
    let DB_URL = process.env.DATABASE_URL;
    if (!DB_URL) {
        const supabaseUrl = SUPABASE_URL;
        const dbPassword = process.env.DB_PASSWORD || "Dl1gdEE4ekuJK1EO";
        const host = supabaseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
        DB_URL = `postgresql://postgres:${dbPassword}@db.${host}:6543/postgres`;
    }
    const { Client } = require('pg');
    const client = new Client({ 
        connectionString: DB_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        
        await client.query("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS referral_paid BOOLEAN DEFAULT false;");
        await client.query("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS receipt_image_url TEXT;");
        await client.query("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;");
        
        await client.query("INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true) ON CONFLICT (id) DO NOTHING;");
        
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public upload' AND tablename = 'objects' AND schemaname = 'storage'
                ) THEN
                    CREATE POLICY "Allow public upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'receipts');
                END IF;
                
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read' AND tablename = 'objects' AND schemaname = 'storage'
                ) THEN
                    CREATE POLICY "Allow public read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'receipts');
                END IF;
            END
            $$;
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS languages (
                code TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS translations (
                lang_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                PRIMARY KEY (lang_code, key)
            );
        `);
        
        await client.query("INSERT INTO languages (code, name) VALUES ('en', 'English') ON CONFLICT (code) DO NOTHING;");
        await client.query("INSERT INTO languages (code, name) VALUES ('am', 'አማርኛ') ON CONFLICT (code) DO NOTHING;");
        
        for (const [langCode, keys] of Object.entries(STATIC_MESSAGES)) {
            for (const [key, val] of Object.entries(keys)) {
                await client.query(`
                    INSERT INTO translations (lang_code, key, value)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (lang_code, key) DO UPDATE SET value = EXCLUDED.value;
                `, [langCode, key, val]);
            }
        }
        
        await loadDbTranslations();

        // --- Supabase Cron Job Setup ---
        // Enable pg_cron and pg_net extensions (safe, idempotent)
        let cronStatus = "skipped";
        try {
            await client.query("CREATE EXTENSION IF NOT EXISTS pg_cron;");
            await client.query("CREATE EXTENSION IF NOT EXISTS pg_net;");

            // Remove existing job if present
            await client.query(`
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'founders_academy-send-daily-quiz') THEN
                        PERFORM cron.unschedule('founders_academy-send-daily-quiz');
                    END IF;
                END $$;
            `);

            // Schedule cron to run every minute
            // The Edge Function throttles sends to 24h via last_completed_at
            const supabaseAnonKey = process.env.SUPABASE_KEY || "sb_publishable_ZIfc-LO2UBt8CPVdY-WUgQ_U_WGF8T3";
            const supabaseProjectUrl = (process.env.SUPABASE_URL || "https://yrelqbvkxwdkzaraydfz.supabase.co").replace(/\/$/, "");
            await client.query(`
                SELECT cron.schedule(
                    'founders_academy-send-daily-quiz',
                    '* * * * *',
                    $$
                        SELECT net.http_post(
                            url     := '${supabaseProjectUrl}/functions/v1/api/cron/send_daily_quiz',
                            headers := jsonb_build_object(
                                'Content-Type',  'application/json',
                                'Authorization', 'Bearer ${supabaseAnonKey}'
                            ),
                            body    := '{}'::jsonb
                        );
                    $$
                );
            `);
            cronStatus = "scheduled";
        } catch (cronErr) {
            // pg_cron may not be available on all Supabase plans
            console.warn("[Migrate] pg_cron setup skipped:", cronErr.message);
            cronStatus = "unavailable (run schema_cron.sql manually in Supabase SQL Editor)";
        }
        
        return res.json({ success: true, message: "Migration completed successfully!", cronJob: cronStatus });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    } finally {
        await client.end();
    }
});

// Cron Job for Daily Quiz Sender
app.all('/api/cron/send_daily_quiz', async (req, res) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }
        
    try {
        console.log("[Cron Proxy] Forwarding cron trigger to Deno Edge Function...");
        const queryParams = new URL(req.url, `http://${req.headers.host || 'localhost'}`).search;
        const response = await axios.post(`https://yrelqbvkxwdkzaraydfz.supabase.co/functions/v1/api/cron/send_daily_quiz${queryParams}`, {}, {
            headers: {
                "Authorization": `Bearer ${process.env.SUPABASE_KEY || ""}`
            },
            timeout: 120000 // 2 minutes timeout
        });
        return res.json(response.data);
    } catch (err) {
        console.error("[Cron Proxy] Error calling Deno Edge Function:", err.message);
        return res.status(500).json({ error: err.message });
    }
});

// Database Webhook Receiver
app.post('/api/webhook/db-trigger', async (req, res) => {
    const payload = req.body || {};
    const table = payload.table;
    const eventType = payload.type;
    
    if (table === "registrations" && ["INSERT", "UPDATE"].includes(eventType)) {
        const record = payload.record || {};
        const oldRecord = payload.old_record || {};
        
        const isCompleted = record.step === "completed" && record.status === "pending";
        const wasCompleted = oldRecord ? oldRecord.step === "completed" : false;
        
        if (isCompleted && !wasCompleted) {
            const regId = record.id;
            const name = record.name;
            const phone = record.phone;
            const receipt = record.receipt_number;
            
            let adminChat = null;
            const adminRec = await db.getAdmin(ADMIN_USERNAME);
            if (adminRec) {
                adminChat = adminRec.telegram_chat_id;
            }
            
            if (!adminChat) {
                adminChat = ADMIN_CHAT_ID || process.env.ADMIN_CHAT_ID;
            }
            
            if (adminChat) {
                const adminPayload = {
                    chat_id: adminChat,
                    text: `🔔 **New Receipt Submitted via Webhook!**\n\n👤 **Name**: ${name}\n📞 **Phone**: ${phone}\n🧾 **Receipt**: \`${receipt}\``,
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "Approve ✅", callback_data: `approve:${regId}` },
                                { text: "Decline ❌", callback_data: `decline:${regId}` }
                            ]
                        ]
                    }
                };
                await sendTelegramRequest("sendMessage", adminPayload);
            }
        }
    }
    return res.send("OK");
});

async function kickUserFromChannel(chatId) {
    const secondGroupId = "-5037460334";
    try {
        const settings = await db.getPaymentSettings();
        const channelId = settings.telegram_channel_id || TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_CHANNEL_ID;
        
        // Kick from main channel
        if (channelId && String(channelId).trim()) {
            console.log(`[Expiration] Kicking user ${chatId} from main channel ${channelId}...`);
            await sendTelegramRequest("banChatMember", {
                chat_id: channelId,
                user_id: chatId
            });
            await sendTelegramRequest("unbanChatMember", {
                chat_id: channelId,
                user_id: chatId,
                only_if_banned: true
            });
        }
        
    } catch (e) {
        console.error("Error kicking user from channel/group:", e.message);
    }
}


// Telegram Bot Update Webhook (Full Bot Logic)
app.post('/api/bot', async (req, res) => {
    try {
        if (Object.keys(DB_MESSAGES).length === 0) {
            await loadDbTranslations();
        }
    } catch (e) {
        console.error("Error loading translations in bot webhook:", e.message);
    }
        
    const update = req.body || {};
    
    if (update.chat_member) {
        const chatMember = update.chat_member;
        const newStatus = chatMember.new_chat_member ? chatMember.new_chat_member.status : null;
        if (["member", "administrator", "creator"].includes(newStatus)) {
            const userId = chatMember.from ? chatMember.from.id : null;
            if (userId) {
                const prog = await db.getUserQuizProgress(userId);
                if (!prog) {
                    await db.upsertUserQuizProgress(userId, { joined_channel: true, current_day: 1, current_question_index: 0 });
                    await sendNextQuizQuestion(userId);
                }
            }
        }
        return res.send("OK");
    }

    // Process callback query (inline button interaction)
    if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const callbackData = callbackQuery.data || "";
        const callbackQueryId = callbackQuery.id;
        const adminChatId = callbackQuery.message.chat.id;
        const adminMessageId = callbackQuery.message.message_id;
        
        if (callbackData.startsWith("lang:")) {
            const lang = callbackData.split(":")[1];
            const chatId = callbackQuery.message.chat.id;
            
            await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId });
            await sendTelegramRequest("editMessageReplyMarkup", {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                reply_markup: { inline_keyboard: [] }
            });
            
            const reg = await db.getRegistration(chatId);
            if (!reg) {
                await db.upsertRegistration(chatId, {
                    step: buildStep(lang, "awaiting_name"),
                    status: "started",
                    name: "",
                    name2: "",
                    phone: "",
                    receipt_number: ""
                });
                await sendTelegramRequest("sendMessage", {
                    chat_id: chatId,
                    text: getMsg(lang, "ask_name_am"),
                    parse_mode: "Markdown",
                    reply_markup: getMenuKeyboard(lang)
                });
            } else {
                const status = reg.status;
                const [, currentStep] = getLangAndStep(reg);
                
                await db.upsertRegistration(chatId, { step: buildStep(lang, currentStep) });
                
                const prog = await db.getUserQuizProgress(chatId);
                const isCompleted = prog && prog.is_completed;
                
                if (status === "declined") {
                    await db.upsertRegistration(chatId, { step: buildStep(lang, "awaiting_name"), status: "started" });
                    await sendTelegramRequest("sendMessage", {
                        chat_id: chatId,
                        text: getMsg(lang, "ask_name_am"),
                        parse_mode: "Markdown",
                        reply_markup: getMenuKeyboard(lang)
                    });
                } else if (status === "approved" && isCompleted) {
                    const name = reg.name || "Student";
                    const phone = reg.phone || "";
                    await db.insertNewRegistration(chatId, {
                        name,
                        phone,
                        step: buildStep(lang, "awaiting_payment_method"),
                        status: "started"
                    });
                    await db.upsertUserQuizProgress(chatId, {
                        is_completed: false,
                        current_day: 1,
                        current_question_index: 0,
                        last_completed_at: null
                    });
                    
                    const msg = `${getMsg(lang, "phone_saved")}\n\n${getMsg(lang, "ask_payment_method")}`;
                    const kb = {
                        inline_keyboard: [
                            [{ text: getMsg(lang, "btn_telebirr"), callback_data: "pay_telebirr" }, { text: getMsg(lang, "btn_cbe"), callback_data: "pay_cbe" }],
                            [{ text: getMsg(lang, "btn_abyssinia"), callback_data: "pay_abyssinia" }]
                        ]
                    };
                    await sendTelegramRequest("sendMessage", {
                        chat_id: chatId,
                        text: msg,
                        parse_mode: "Markdown",
                        reply_markup: kb
                    });
                } else if (currentStep.includes("completed") || ["approved", "pending"].includes(status)) {
                    await sendTelegramRequest("sendMessage", {
                        chat_id: chatId,
                        text: getMsg(lang, "already_registered"),
                        reply_markup: getMenuKeyboard(lang)
                    });
                } else if (currentStep === "start") {
                    await db.upsertRegistration(chatId, { step: buildStep(lang, "awaiting_name") });
                    await sendTelegramRequest("sendMessage", {
                        chat_id: chatId,
                        text: getMsg(lang, "ask_name"),
                        parse_mode: "Markdown",
                        reply_markup: await getMenuKeyboard(lang, chatId)
                    });
                } else {
                    if (currentStep === "awaiting_name") {
                        await sendTelegramRequest("sendMessage", {
                            chat_id: chatId,
                            text: getMsg(lang, "ask_name"),
                            parse_mode: "Markdown",
                            reply_markup: await getMenuKeyboard(lang, chatId)
                        });
                    } else if (currentStep === "awaiting_name2") {
                        await sendTelegramRequest("sendMessage", {
                            chat_id: chatId,
                            text: getMsg(lang, "ask_name"),
                            parse_mode: "Markdown",
                            reply_markup: await getMenuKeyboard(lang, chatId)
                        });
                    } else if (currentStep === "awaiting_phone") {
                        const keyboard = {
                            keyboard: [[{
                                text: getMsg(lang, "btn_share_contact"),
                                request_contact: true
                            }]],
                            one_time_keyboard: true,
                            resize_keyboard: true
                        };
                        await sendTelegramRequest("sendMessage", {
                            chat_id: chatId,
                            text: getMsg(lang, "ask_phone"),
                            parse_mode: "Markdown",
                            reply_markup: keyboard
                        });
                    } else if (currentStep === "awaiting_payment_method") {
                        const msg = getMsg(lang, "ask_payment_method");
                        const kb = {
                            inline_keyboard: [
                                [{ text: getMsg(lang, "btn_telebirr"), callback_data: "pay_telebirr" }, { text: getMsg(lang, "btn_cbe"), callback_data: "pay_cbe" }],
                                [{ text: getMsg(lang, "btn_abyssinia"), callback_data: "pay_abyssinia" }]
                            ]
                        };
                        await sendTelegramRequest("sendMessage", {
                            chat_id: chatId,
                            text: msg,
                            reply_markup: kb
                        });
                    } else if (currentStep.startsWith("awaiting_receipt")) {
                        const settings = await db.getPaymentSettings();
                        const amount = settings.amount || "500";
                        let msg;
                        if (currentStep.includes("telebirr")) {
                            const accName = settings.telebirr_name || "Founders Academy School";
                            const accNum = settings.telebirr_number || "0911223344";
                            msg = getMsg(lang, "telebirr_payment_instructions").replace("{amount}", amount).replace("{acc_name}", accName).replace("{acc_num}", accNum);
                        } else if (currentStep.includes("abyssinia")) {
                            const accName = settings.abyssinia_name || "Founders Academy BoA";
                            const accNum = settings.abyssinia_number || "987654321";
                            msg = getMsg(lang, "abyssinia_payment_instructions").replace("{amount}", amount).replace("{acc_name}", accName).replace("{acc_num}", accNum);
                        } else {
                            const accName = settings.cbe_name || "Founders Academy Hand Craft";
                            const accNum = settings.cbe_number || "1000123456789";
                            msg = getMsg(lang, "cbe_payment_instructions").replace("{amount}", amount).replace("{acc_name}", accName).replace("{acc_num}", accNum);
                        }
                        await sendTelegramRequest("sendMessage", {
                            chat_id: chatId,
                            text: msg,
                            parse_mode: "Markdown"
                        });
                    } else {
                        let successMsg = "Language updated successfully!";
                        if (lang === "am") successMsg = "ቋንቋው በተሳካ ሁኔታ ተቀይሯል!";
                        else if (lang === "om" || lang === "or") successMsg = "Afaan keessan sirriitti jijjiirameera!";
                        else if (lang === "ti" || lang === "tg") successMsg = "ቋንቋኹም ብዓወት ተቐይሩ ኣሎ!";
                        await sendTelegramRequest("sendMessage", {
                            chat_id: chatId,
                            text: successMsg,
                            reply_markup: getMenuKeyboard(lang)
                        });
                    }
                }
            }
            return res.send("OK");
        }

        if (callbackData.startsWith("approve:") || callbackData.startsWith("decline:")) {
            const [action, regId] = callbackData.split(":");
            const reg = await db.getRegistrationById(regId);
            if (!reg) {
                await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: "Registration not found." });
                return res.send("OK");
            }
                
            if (reg.status !== "pending") {
                await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: `Already processed: ${reg.status}` });
                return res.send("OK");
            }
                
            if (action === "approve") {
                try {
                    const [lang] = getLangAndStep(reg);
                    const inviteLink = await generateApprovedInviteLinks(reg.chat_id, reg.name, lang);
                    await db.updateRegistrationStatus(regId, "approved", inviteLink);
                    
                    // Trigger referral reward check
                    if (reg.referred_by_chat_id) {
                        await checkAndApplyReferralReward(reg.referred_by_chat_id);
                    }
                    
                    const msg = getMsg(lang, "receipt_approved_msg")
                        .replace("{name}", reg.name)
                        .replace("{receipt}", reg.receipt_number)
                        .replace("{link}", formatInviteLinksForUser(inviteLink, lang));
                    await sendTelegramRequest("sendMessage", {
                        chat_id: reg.chat_id,
                        text: msg,
                        parse_mode: "Markdown",
                        reply_markup: getMenuKeyboard(lang)
                    });
                    
                    // Trigger Day 1 quiz immediately upon approval
                    try {
                        const prog = await db.getUserQuizProgress(reg.chat_id);
                        if (!prog) {
                            await db.upsertUserQuizProgress(reg.chat_id, { joined_channel: true, current_day: 1, current_question_index: 0 });
                            await sendNextQuizQuestion(reg.chat_id);
                        }
                    } catch (err) {
                        console.error("Error triggering day 1 quiz on inline approve:", err.message);
                    }
                    
                    const links = inviteLink.trim().split(/\s+/);
                    const newText = `Approved ✅\n\nName: ${reg.name}\nPhone: ${reg.phone}\nReceipt: ${reg.receipt_number}\nMain Channel: ${links[0] || "-"}`;
                    const isPhoto = callbackQuery.message && callbackQuery.message.photo;
                    const editMethod = isPhoto ? "editMessageCaption" : "editMessageText";
                    const payload = {
                        chat_id: adminChatId,
                        message_id: adminMessageId,
                        reply_markup: { inline_keyboard: [] }
                    };
                    if (isPhoto) payload.caption = newText;
                    else payload.text = newText;
                    
                    await sendTelegramRequest(editMethod, payload);
                    await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: "Approved successfully!" });
                } catch (err) {
                    console.error("Error during callback approve:", err.message);
                    await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: `Failed: ${err.message}` });
                }
            } else if (action === "decline") {
                const reasonKb = {
                    inline_keyboard: [
                        [{ text: "Fake Receipt", callback_data: `dreason:${regId}:Fake Receipt` }],
                        [{ text: "Duplicate", callback_data: `dreason:${regId}:Duplicate` }],
                        [{ text: "Invalid Details", callback_data: `dreason:${regId}:Invalid Details` }],
                        [{ text: "Cancel", callback_data: `cancel_decline:${regId}` }]
                    ]
                };
                await sendTelegramRequest("editMessageReplyMarkup", {
                    chat_id: adminChatId,
                    message_id: adminMessageId,
                    reply_markup: reasonKb
                });
                await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId });
            }
        } else if (callbackData.startsWith("cancel_decline:")) {
            const regId = callbackData.split(":")[1];
            const originalKb = {
                inline_keyboard: [
                    [
                        { text: "Approve ✅", callback_data: `approve:${regId}` },
                        { text: "Decline ❌", callback_data: `decline:${regId}` }
                    ]
                ]
            };
            await sendTelegramRequest("editMessageReplyMarkup", {
                chat_id: adminChatId,
                message_id: adminMessageId,
                reply_markup: originalKb
            });
            await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId });
        } else if (callbackData.startsWith("dreason:")) {
            const [, regId, reason] = callbackData.split(":");
            const reg = await db.getRegistrationById(regId);
            if (!reg || reg.status !== "pending") {
                await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: "Registration not pending or not found." });
                return res.send("OK");
            }
                
            await db.updateRegistrationStatus(regId, "declined", null, reason);
            
            const [lang] = getLangAndStep(reg);
            let translatedReason = reason;
            if (lang === "am") {
                if (reason === "Fake Receipt") translatedReason = "ሐሰተኛ ደረሰኝ";
                else if (reason === "Duplicate") translatedReason = "የተደገመ ደረሰኝ";
                else if (reason === "Invalid Details") translatedReason = "የተሳሳተ መረጃ";
            } else if (lang === "om" || lang === "or") {
                if (reason === "Fake Receipt") translatedReason = "Nagahee Kijibaa";
                else if (reason === "Duplicate") translatedReason = "Nagahee Dachaa";
                else if (reason === "Invalid Details") translatedReason = "Odeeffannoo Dogoggoraa";
            } else if (reason && (lang === "ti" || lang === "tg")) {
                if (reason === "Fake Receipt") translatedReason = "ሓሶት ደረሰኝ";
                else if (reason === "Duplicate") translatedReason = "ዝተደገመ ደረሰኝ";
                else if (reason === "Invalid Details") translatedReason = "ዘይተረጋገጸ ሓበሬታ";
            }
            
            const msg = getMsg(lang, "receipt_declined_msg")
                .replace("{name}", reg.name)
                .replace("{receipt}", reg.receipt_number)
                .replace("{reason}", translatedReason);
            await sendTelegramRequest("sendMessage", {
                chat_id: reg.chat_id,
                text: msg,
                parse_mode: "Markdown",
                reply_markup: getMenuKeyboard(lang)
            });
            
            const newText = `Declined ❌\n\nName: ${reg.name}\nPhone: ${reg.phone}\nReceipt: ${reg.receipt_number}\nReason: ${reason}`;
            const isPhoto = callbackQuery.message && callbackQuery.message.photo;
            const editMethod = isPhoto ? "editMessageCaption" : "editMessageText";
            const payload = {
                chat_id: adminChatId,
                message_id: adminMessageId,
                reply_markup: { inline_keyboard: [] }
            };
            if (isPhoto) payload.caption = newText;
            else payload.text = newText;
            
            await sendTelegramRequest(editMethod, payload);
            await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: "Declined successfully." });
        } else if (callbackData.startsWith("ans:")) {
            const [, qId, optIdxStr] = callbackData.split(":");
            const optIdx = parseInt(optIdxStr);
            const chatId = callbackQuery.message.chat.id;
            
            const prog = await db.getUserQuizProgress(chatId);
            if (!prog) {
                await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: "Session expired." });
                return res.send("OK");
            }
                
            const day = prog.current_day || 1;
            const qIndex = prog.current_question_index || 0;
            const questions = await db.getQuestionsByDay(day);
            
            if (qIndex >= questions.length || questions[qIndex].id !== qId) {
                await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: "Question expired or already answered." });
                return res.send("OK");
            }
                
            const q = questions[qIndex];
            const isCorrect = (optIdx === q.correct_option_index);
            
            if (isCorrect) {
                await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: "Correct! \u2705", show_alert: true });
                await db.upsertUserQuizProgress(chatId, { current_question_index: qIndex + 1 });
                
                await sendTelegramRequest("editMessageReplyMarkup", {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    reply_markup: { inline_keyboard: [] }
                });
                
                await sendNextQuizQuestion(chatId);
            } else {
                await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: "Incorrect! Try again ❌", show_alert: true });
            }
        } else if (callbackData.startsWith("start_day:")) {
            const targetDay = parseInt(callbackData.split(":")[1]);
            const chatId = callbackQuery.message.chat.id;
            
            const prog = await db.getUserQuizProgress(chatId);
            if (!prog) return res.send("OK");
                
            const lastCompleted = prog.last_completed_at;
            if (lastCompleted) {
                const lastDt = parseIsoDatetime(lastCompleted);
                if (lastDt) {
                    const now = new Date();
                    if (lastDt.toDateString() === now.toDateString()) {
                        await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: `Please wait until tomorrow to start the next day!`, show_alert: true });
                        return res.send("OK");
                    }
                }
            }
            
            await db.upsertUserQuizProgress(chatId, { current_day: targetDay, current_question_index: 0 });
            await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId });
            
            await sendTelegramRequest("editMessageReplyMarkup", {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                reply_markup: { inline_keyboard: [] }
            });
            await sendNextQuizQuestion(chatId);
        } else if (["pay_telebirr", "pay_cbe", "pay_abyssinia"].includes(callbackData)) {
            const chatId = callbackQuery.message.chat.id;
            await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId });
            
            let reg = await db.getRegistration(chatId);
            const [lang, currentStep] = getLangAndStep(reg);
            
            await sendTelegramRequest("editMessageReplyMarkup", {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                reply_markup: { inline_keyboard: [] }
            });
            
            reg = await db.getRegistration(chatId);
            if (reg && reg.step.includes("awaiting_payment_method")) {
                const settings = await db.getPaymentSettings();
                const amount = settings.amount || "500";
                
                let msg;
                if (callbackData === "pay_telebirr") {
                    const accName = settings.telebirr_name || "Founders Academy School";
                    const accNum = settings.telebirr_number || "0911223344";
                    msg = getMsg(lang, "telebirr_payment_instructions").replace("{amount}", amount).replace("{acc_name}", accName).replace("{acc_num}", accNum);
                    await db.upsertRegistration(chatId, { step: buildStep(lang, "awaiting_receipt_telebirr") });
                } else if (callbackData === "pay_abyssinia") {
                    const accName = settings.abyssinia_name || "Founders Academy BoA";
                    const accNum = settings.abyssinia_number || "987654321";
                    msg = getMsg(lang, "abyssinia_payment_instructions").replace("{amount}", amount).replace("{acc_name}", accName).replace("{acc_num}", accNum);
                    await db.upsertRegistration(chatId, { step: buildStep(lang, "awaiting_receipt_abyssinia") });
                } else {
                    const accName = settings.cbe_name || "Founders Academy Hand Craft";
                    const accNum = settings.cbe_number || "1000123456789";
                    msg = getMsg(lang, "cbe_payment_instructions").replace("{amount}", amount).replace("{acc_name}", accName).replace("{acc_num}", accNum);
                    await db.upsertRegistration(chatId, { step: buildStep(lang, "awaiting_receipt_cbe") });
                }
                
                await sendTelegramRequest("sendMessage", {
                    chat_id: chatId,
                    text: msg,
                    parse_mode: "Markdown"
                });
            }
        } else if (callbackData === "get_certificate" || callbackData === "regenerate_certificate") {
            const chatId = callbackQuery.message.chat.id;
            await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: "Generating certificate, please wait..." });
            
            await sendTelegramRequest("editMessageReplyMarkup", {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                reply_markup: { inline_keyboard: [] }
            });
            
            const reg = await db.getRegistration(chatId);
            const prog = await db.getUserQuizProgress(chatId);
            const isApproved = reg && reg.status === "approved";
            const isCompleted = prog && prog.is_completed;

            if (!isCompleted && !isApproved) {
                const [lang] = getLangAndStep(reg);
                await sendTelegramRequest("sendMessage", {
                    chat_id: chatId,
                    text: getMsg(lang, "quiz_not_completed")
                });
                return res.send("OK");
            }

            const name = reg ? (reg.name || "Student") : "Student";
            const name2 = reg ? (reg.name2 || name) : name;
            const regDateStr = reg ? (reg.created_at || "") : "";
            
            let regDate = "Unknown";
            if (regDateStr) {
                try { regDate = regDateStr.split("T")[0]; } catch (e) { /* ignore */ }
            }
            const finishDate = new Date(new Date().getTime() + 3 * 3600000).toISOString().split("T")[0];
            
            const [lang] = getLangAndStep(reg);
            const caption = getMsg(lang, "course_completed_msg").replace("{name}", name);
            
            try {
                const pdfBytes = await generateCertificatePdf(name, regDate, finishDate, name2);
                
                const FormData = require('form-data');
                const form = new FormData();
                form.append('chat_id', chatId);
                form.append('caption', caption);
                form.append('parse_mode', 'Markdown');
                form.append('document', pdfBytes, {
                    filename: 'Certificate.pdf',
                    contentType: 'application/pdf'
                });
                
                const url = `${TELEGRAM_API_URL}/sendDocument`;
                await axios.post(url, form, { headers: form.getHeaders() });

                await sendTelegramRequest("sendMessage", {
                    chat_id: chatId,
                    text: "🎓 **Your Official PDF Certificate**\n\nIf you ever need to regenerate your certificate, click the button below:",
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Regenerate Certificate 📜", callback_data: "regenerate_certificate" }]
                        ]
                    }
                });

                await removeUserFromChannel(chatId);
            } catch (e) {
                console.error("Error generating/sending PDF:", e.message);
                await sendTelegramRequest("sendMessage", {
                    chat_id: chatId,
                    text: `Sorry, there was an error generating your certificate. Error details: ${e.message}\nPlease try again later.`,
                    reply_markup: { inline_keyboard: [[{ text: "Regenerate Certificate 📜", callback_data: "regenerate_certificate" }]] }
                });
            }
        }
        return res.send("OK");
    }

    if (!update.message) return res.send("OK");

    const message = update.message;
    
    // Ignore messages from groups or channels (bot is only used to generate links)
    if (message.chat && message.chat.type !== "private") {
        return res.send("OK");
    }
    const chatId = message.chat.id;
    const text = (message.text || "").trim();
    const contact = message.contact;

    // Admin linkage authentication interceptor
    if (text.toLowerCase().startsWith("/auth")) {
        const parts = text.split(/\s+/);
        if (parts.length >= 3 && parts.length <= 4) {
            const authUser = parts[1];
            const authPass = parts[2];
            
            const adminRec = await db.getAdmin(authUser);
            if (adminRec && adminRec.password === authPass) {
                if (parts.length === 3) {
                    // Direct linkage without link-code (for initial bootstrap/setup)
                    await db.linkAdminChat(authUser, chatId);
                    
                    await sendTelegramRequest("sendMessage", {
                        chat_id: chatId,
                        text: (
                            `✅ **Authentication & Linkage Successful!**\n\n` +
                            `Your Telegram account (Chat ID: \`${chatId}\`) has been linked to the admin account **${authUser}**.\n\n` +
                            `You will now receive login verification codes and webhook notifications here.`
                        ),
                        parse_mode: "Markdown"
                    });
                    return res.send("OK");
                } else {
                    // With link code
                    const authCode = parts[3].trim().toUpperCase();
                    const savedCode = adminRec.verification_code ? adminRec.verification_code.trim().toUpperCase() : null;
                    const expiryStr = adminRec.code_expires_at;
                    
                    if (savedCode && savedCode === authCode) {
                        const now = new Date();
                        const expiry = expiryStr ? new Date(expiryStr) : null;
                        if (!expiry || now <= expiry) {
                            // Success! Link chat
                            await db.linkAdminChat(authUser, chatId);
                            await db.setAdminVerificationCode(authUser, null, null);
                            
                            await sendTelegramRequest("sendMessage", {
                                chat_id: chatId,
                                text: (
                                    `✅ **Authentication & Linkage Successful!**\n\n` +
                                    `Your Telegram account (Chat ID: \`${chatId}\`) has been linked to the admin account **${authUser}**.\n\n` +
                                    `You will now receive login verification codes and webhook notifications here.`
                                ),
                                parse_mode: "Markdown"
                            });
                            return res.send("OK");
                        } else {
                            await sendTelegramRequest("sendMessage", {
                                chat_id: chatId,
                                text: `❌ **Authentication Failed**: The verification code has expired. Please generate a new one from the admin panel.`
                            });
                            return res.send("OK");
                        }
                    } else {
                        await sendTelegramRequest("sendMessage", {
                            chat_id: chatId,
                            text: `❌ **Authentication Failed**: Invalid verification code. (Expected: '${savedCode}', Got: '${authCode}')`
                        });
                        return res.send("OK");
                    }
                }
            } else {
                await sendTelegramRequest("sendMessage", {
                    chat_id: chatId,
                    text: `❌ **Authentication Failed**: Invalid username or password.`
                });
                return res.send("OK");
            }
        } else {
            await sendTelegramRequest("sendMessage", {
                chat_id: chatId,
                text: `ℹ️ **Usage**: Send \`/auth <username> <password>\` or \`/auth <username> <password> <link-code>\` to link your admin account.`
            });
            return res.send("OK");
        }
    }

    // --- BAN GUARD: Block banned users immediately in Telegram webhook ---
    const banStatus = await dbStore.isStudentBanned(chatId);
    if (banStatus && banStatus.banned) {
        await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: `🚫 *ACCOUNT SUSPENDED / BANNED* 🛑\n\n` +
                `Your Founders Academy student account and Telegram bot access have been suspended by an administrator.\n\n` +
                `*Reason:* ${banStatus.reason || "Violation of platform terms"}\n\n` +
                `If you believe this is a mistake, please contact support:\n👉 @foundersupportt`,
            parse_mode: "Markdown"
        });
        return res.send("OK");
    }

    const reg = await db.getRegistration(chatId);
    if (reg && reg.status === "approved" && reg.expires_at) {
        const now = new Date();
        const expiry = new Date(reg.expires_at);
        if (now > expiry) {
            console.log(`[Expiration Trigger] User ${chatId} has expired. Expiry: ${reg.expires_at}`);
            await db.updateRegistrationStatus(reg.id, "expired");
            await kickUserFromChannel(chatId);
            const [lang] = getLangAndStep(reg);
            const msg = getMsg(lang, "access_expired_msg");
            await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg });
            return res.send("OK");
        }
    }
    const [lang, currentStep] = getLangAndStep(reg);

    // Common menu commands
    if (isMenuCommand(text, "menu_customer_support") || text === "/support" || text.includes("Customer Support") || text.includes("የደንበኞች ድጋፍ") || text.includes("Deggersa") || text.includes("ሓገዝ")) {
        const msg = getMsg(lang, "customer_support_msg");
        await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: msg,
            parse_mode: "Markdown",
            reply_markup: await getMenuKeyboard(lang, chatId)
        });
        return res.send("OK");
    }

    if (isMenuCommand(text, "menu_change_language") || text === "/language") {
        const msg = getMsg(lang, "welcome_choose_lang");
        await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: msg,
            reply_markup: await getLanguageKeyboard()
        });
        return res.send("OK");
    }

    if (isMenuCommand(text, "menu_refer_friend") || text === "/refer") {
        const botUser = await getBotUsername();
        const refLink = `https://t.me/${botUser}?start=ref_${chatId}`;
        const msg = getMsg(lang, "referral_message").replace("{ref_link}", refLink);
        await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: msg,
            parse_mode: "Markdown",
            reply_markup: getMenuKeyboard(lang)
        });
        return res.send("OK");
    }

    if (isMenuCommand(text, "menu_check_status") || text === "/status") {
        if (!reg || ((!reg.step || !reg.step.includes("completed")) && !["approved", "pending", "declined"].includes(reg.status))) {
            await sendTelegramRequest("sendMessage", {
                chat_id: chatId,
                text: getMsg(lang, "no_receipt_yet"),
                reply_markup: await getMenuKeyboard(lang, chatId)
            });
            return res.send("OK");
        }
            
        const status = reg.status || "pending";
        const receipt = reg.receipt_number || "Unknown";
        let msg;
        if (status === "approved") {
            let inviteLink = reg.invite_link;
            if (!inviteLink || !inviteLink.trim() || inviteLink.includes("Error")) {
                inviteLink = await generateApprovedInviteLinks(reg.chat_id, reg.name, lang);
                await db.updateRegistrationStatus(reg.id, "approved", inviteLink);
            }
            const link = formatInviteLinksForUser(inviteLink, lang);
            msg = getMsg(lang, "status_approved_msg").replace("{receipt}", receipt).replace("{link}", link);
        } else if (status === "declined") {
            const reason = reg.rejection_reason || getMsg(lang, "default_decline_reason");
            msg = getMsg(lang, "status_declined_msg").replace("{receipt}", receipt).replace("{reason}", reason);
        } else {
            msg = getMsg(lang, "status_pending_msg").replace("{receipt}", receipt);
        }
            
        await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: msg,
            parse_mode: "Markdown",
            reply_markup: await getMenuKeyboard(lang, chatId)
        });
        return res.send("OK");
    }

    if (isMenuCommand(text, "menu_get_certificate") || isMenuCommand(text, "menu_regenerate_certificate") || text === "/certificate" || text.includes("Certificate") || text.includes("ምስክር ወረቀት") || text.includes("Waraqaa Ragaa") || text.includes("ወረቐት ምስክር")) {
        const prog = await db.getUserQuizProgress(chatId);
        const isApproved = reg && reg.status === "approved";
        const isCompleted = prog && prog.is_completed;

        if (!isCompleted && !isApproved) {
            await sendTelegramRequest("sendMessage", {
                chat_id: chatId,
                text: getMsg(lang, "quiz_not_completed"),
                reply_markup: await getMenuKeyboard(lang, chatId)
            });
            return res.send("OK");
        }

        const name = reg ? (reg.name || "Student") : "Student";
        const name2 = reg ? (reg.name2 || name) : name;
        const regDateStr = reg ? (reg.created_at || "") : "";
        
        let regDate = "Unknown";
        if (regDateStr) {
            try { regDate = regDateStr.split("T")[0]; } catch (e) {}
        }
        const finishDate = new Date(new Date().getTime() + 3 * 3600000).toISOString().split("T")[0];
        const caption = getMsg(lang, "course_completed_msg").replace("{name}", name);
        
        try {
            await sendTelegramRequest("sendMessage", { chat_id: chatId, text: "⏳ Generating your PDF Certificate, please wait..." });
            const pdfBytes = await generateCertificatePdf(name, regDate, finishDate, name2);
            
            const FormData = require('form-data');
            const form = new FormData();
            form.append('chat_id', chatId);
            form.append('caption', caption);
            form.append('parse_mode', 'Markdown');
            form.append('document', pdfBytes, {
                filename: 'Certificate.pdf',
                contentType: 'application/pdf'
            });
            
            const url = `${TELEGRAM_API_URL}/sendDocument`;
            await axios.post(url, form, { headers: form.getHeaders() });

            await sendTelegramRequest("sendMessage", {
                chat_id: chatId,
                text: "🎓 **Your Official PDF Certificate**\n\nIf you ever need to regenerate your certificate, click the button below:",
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Regenerate Certificate 📜", callback_data: "regenerate_certificate" }]
                    ]
                }
            });
            await removeUserFromChannel(chatId);
        } catch (e) {
            console.error("Error generating/sending PDF:", e.message);
            await sendTelegramRequest("sendMessage", {
                chat_id: chatId,
                text: `Sorry, there was an error generating your certificate: ${e.message}`,
                reply_markup: await getMenuKeyboard(lang, chatId)
            });
        }
        return res.send("OK");
    }

    if (text === "/help") {
        const msg = getMsg(lang, "help_instructions");
        await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: msg,
            parse_mode: "Markdown",
            reply_markup: getMenuKeyboard(lang)
        });
        return res.send("OK");
    }

    // Step 2: Start / Referral / Submit Receipt trigger
    if (text.startsWith("/start") || isMenuCommand(text, "menu_submit_receipt") || text === "/submit") {
        if (reg) {
            const status = reg.status;
            if (isMenuCommand(text, "menu_submit_receipt") || text === "/submit") {
                if (["approved", "declined"].includes(status)) {
                    await db.upsertRegistration(chatId, {
                        name: reg.name,
                        phone: reg.phone,
                        step: buildStep(lang, "awaiting_payment_method"),
                        status: "started"
                    });
                    
                    const msg = getMsg(lang, "ready_new_receipt");
                    const kb = {
                        inline_keyboard: [
                            [{ text: getMsg(lang, "btn_telebirr"), callback_data: "pay_telebirr" }, { text: getMsg(lang, "btn_cbe"), callback_data: "pay_cbe" }],
                            [{ text: getMsg(lang, "btn_abyssinia"), callback_data: "pay_abyssinia" }]
                        ]
                    };
                    await sendTelegramRequest("sendMessage", {
                        chat_id: chatId,
                        text: msg,
                        reply_markup: kb
                    });
                    return res.send("OK");
                } else if (status === "pending") {
                    await sendTelegramRequest("sendMessage", {
                        chat_id: chatId,
                        text: getMsg(lang, "already_pending")
                    });
                    return res.send("OK");
                }
            } else if (text.startsWith("/start")) {
                // Check if text includes a giveaway code candidate or command
                if (text.includes("giveaway") || text.includes("redeem") || text.startsWith("/start GIVEAWAY-") || text.startsWith("GIVEAWAY-")) {
                  const rawCode = text.replace("/start", "").replace("giveaway", "").replace("redeem", "").replace("/", "").trim();
                  if (rawCode) {
                    const res = await dbStore.redeemGiveawayCode({ code: rawCode, telegramUser: message.from });
                    if (!res.success) {
                      let statusMsg = "";
                      if (res.alreadyRedeemed) {
                        const u = res.usedBy || {};
                        const uName = u.name || "Student";
                        const uUser = u.username ? `(${u.username})` : "";
                        const dateStr = res.usedAt ? new Date(res.usedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "Earlier";
                        statusMsg = `🎟️ *GIVEAWAY CODE STATUS CARD* 🔍\n\n` +
                          `📋 *Code:* \`${res.code || rawCode}\`\n` +
                          `⚡ *Status:* 🔴 *OUTDATED / ALREADY REDEEMED*\n` +
                          `📘 *Course:* ${res.courseTitle || 'Founders Masterclass'}\n` +
                          `👤 *Redeemed By:* ${uName} ${uUser}\n` +
                          `📅 *Redeemed Date:* ${dateStr}\n\n` +
                          `❌ *Redemption Failed:* This 1-time giveaway code has already been redeemed by another student and is no longer valid.`;
                      } else if (res.revoked) {
                        statusMsg = `🎟️ *GIVEAWAY CODE STATUS CARD* 🔍\n\n` +
                          `📋 *Code:* \`${res.code || rawCode}\`\n` +
                          `⚡ *Status:* ⏳ *REVOKED BY ADMIN*\n` +
                          `📘 *Course:* ${res.courseTitle || 'Founders Masterclass'}\n\n` +
                          `❌ *Redemption Failed:* This giveaway code has been cancelled by the administrator.`;
                      } else {
                        statusMsg = `🎟️ *GIVEAWAY CODE STATUS CARD* 🔍\n\n` +
                          `📋 *Code:* \`${rawCode}\`\n` +
                          `⚡ *Status:* ❌ *INVALID / NOT FOUND*\n\n` +
                          `❌ *Redemption Failed:* The code \`${rawCode}\` was not found in our database. Please check your spelling and try again!`;
                      }
                      await sendTelegramRequest("sendMessage", { chat_id: chatId, text: statusMsg, parse_mode: "Markdown" });
                      return res.send("OK");
                    }

                    // Code valid & redeemed successfully!
                    const courses = await dbStore.getCourses();
                    const course = courses.find(c => String(c.id) === String(res.courseId) || String(c.title) === String(res.courseTitle)) || courses[0];
                    const rawChannel = course?.tg_channel || "https://t.me/founders_smma_channel";
                    const rawGroup = course?.tg_group || "https://t.me/founders_smma_group";
                    const sName = message.from ? ([message.from.first_name, message.from.last_name].filter(Boolean).join(" ") || message.from.username || "Student") : "Student";
                    const oneTimeChannelLink = await generateOneTimeTelegramInviteLink(rawChannel, `${sName} Channel`);
                    const oneTimeGroupLink = await generateOneTimeTelegramInviteLink(rawGroup, `${sName} Group`);

                    let successMsg = `🎟️ *GIVEAWAY CODE VERIFIED & ACTIVATED!* 🟢✨\n\n` +
                      `📋 *Code:* \`${res.code}\`\n` +
                      `⚡ *Status:* 🟢 *VALID (1-TIME USE GRANTED)*\n` +
                      `📘 *Unlocked Course:* *${res.courseTitle}*\n` +
                      `🎁 *Tuition:* \`100% FREE Giveaway\`\n\n` +
                      `🎉 *CONGRATULATIONS!* You are now officially enrolled in *${res.courseTitle}*!\n\n` +
                      `Here are your official single-use 1-time classroom portals:\n\n`;

                    const inlineKeyboard = [];
                    if (oneTimeChannelLink) {
                      successMsg += `📢 *Classroom Channel:* ${oneTimeChannelLink}\n`;
                      inlineKeyboard.push([{ text: `📢 Join ${res.courseTitle.substring(0, 18)} Channel`, url: oneTimeChannelLink }]);
                    }
                    if (oneTimeGroupLink) {
                      successMsg += `💬 *Mastermind Group:* ${oneTimeGroupLink}\n`;
                      inlineKeyboard.push([{ text: `💬 Join Mastermind Group`, url: oneTimeGroupLink }]);
                    }
                    successMsg += `\n🔒 _This 1-time code (${res.code}) has now expired and is permanently outdated._ Welcome to Founders Academy! 🎓`;

                    await sendTelegramRequest("sendMessage", {
                      chat_id: chatId,
                      text: successMsg,
                      parse_mode: "Markdown",
                      reply_markup: inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined
                    });
                    return res.send("OK");
                  }
                }

                if ((reg.step && reg.step.includes("completed")) || ["approved", "pending"].includes(status)) {
                    await sendTelegramRequest("sendMessage", {
                        chat_id: chatId,
                        text: getMsg(lang, "already_registered"),
                        reply_markup: getMenuKeyboard(lang)
                    });
                    return res.send("OK");
                }
            }
        }

        // Referral extraction
        let referredBy = null;
        const parts = text.split(" ");
        if (parts.length > 1 && parts[1].startsWith("ref_")) {
            try {
                const inviterId = parseInt(parts[1].replace("ref_", ""));
                if (inviterId !== chatId) {
                    referredBy = inviterId;
                }
            } catch (e) {
                // ignore
            }
        }
                
        const existingPhone = reg ? (reg.phone || "") : "";
        await db.upsertRegistration(chatId, {
            step: "start",
            status: "started",
            name: "",
            phone: existingPhone,
            receipt_number: "",
            referred_by_chat_id: referredBy
        });
        
        const msg = getMsg("en", "welcome_choose_lang");
        await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: msg,
            reply_markup: await getLanguageKeyboard()
        });
        return res.send("OK");
    }

    if (!reg) {
        await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: getMsg(lang, "no_receipt_yet")
        });
        return res.send("OK");
    }

    // Step progression state machine
    if (currentStep === "awaiting_name" || currentStep === "awaiting_name2") {
        if (!text) {
            await sendTelegramRequest("sendMessage", {
                chat_id: chatId,
                text: getMsg(lang, "invalid_name")
            });
            return res.send("OK");
        }

        // If phone number is ALREADY saved in database for this user, do NOT ask for phone again!
        if (reg && reg.phone && reg.phone.trim() !== "") {
            await db.upsertRegistration(chatId, { name: text, name2: text, step: buildStep(lang, "awaiting_payment_method") });
            
            let settings = {};
            try { settings = await db.getPaymentSettings(); } catch (e) {}

            const courseName = (settings && settings.cert_program_en) ? settings.cert_program_en : "FACEBOOK ADS TRAINING PROGRAM";
            const duration = (settings && settings.cert_duration_en) ? settings.cert_duration_en : "4 Weeks";
            const amount = (settings && settings.amount) ? settings.amount : "500";

            let courseDesc = "";
            if (lang === "am") {
                courseDesc = `✅ **ስምዎ ተቀምጧል!**\n\n📚 **የስልጠናው ስም**: ${(settings && settings.cert_program_am) ? settings.cert_program_am : courseName}\n⏱ **የስልጠና ቆይታ**: ${(settings && settings.cert_duration_am) ? settings.cert_duration_am : "4 ሳምንት"}\n💰 **የመመዝገቢያ ክፍያ**: ${amount} ብር\n\n` + getMsg(lang, "ask_payment_method");
            } else {
                courseDesc = `✅ **Name saved successfully!**\n\n📚 **Course Name**: ${courseName}\n⏱ **Duration**: ${duration}\n💰 **Registration Fee**: ${amount} ETB\n\n` + getMsg(lang, "ask_payment_method");
            }

            const kb = {
                inline_keyboard: [
                    [{ text: getMsg(lang, "btn_telebirr"), callback_data: "pay_telebirr" }, { text: getMsg(lang, "btn_cbe"), callback_data: "pay_cbe" }],
                    [{ text: getMsg(lang, "btn_abyssinia"), callback_data: "pay_abyssinia" }]
                ]
            };
            await sendTelegramRequest("sendMessage", {
                chat_id: chatId,
                text: courseDesc,
                parse_mode: "Markdown",
                reply_markup: kb
            });
            return res.send("OK");
        }
            
        await db.upsertRegistration(chatId, { name: text, name2: text, step: buildStep(lang, "awaiting_phone") });
        const keyboard = {
            keyboard: [[{
                text: getMsg(lang, "btn_share_contact"),
                request_contact: true
            }]],
            one_time_keyboard: true,
            resize_keyboard: true
        };
        const welcomePrefix = getMsg(lang, "welcome_name_prefix").replace("{name}", text);
        await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: welcomePrefix + getMsg(lang, "ask_phone"),
            parse_mode: "Markdown",
            reply_markup: keyboard
        });
        return res.send("OK");
    }

    if (currentStep === "awaiting_phone") {
        let phone = null;
        if (contact) {
            phone = contact.phone_number;
        } else if (text) {
            phone = text;
        }
            
        if (!phone) {
            await sendTelegramRequest("sendMessage", {
                chat_id: chatId,
                text: getMsg(lang, "invalid_phone")
            });
            return res.send("OK");
        }
            
        const existing = await db.getRegistrationByPhone(phone);
        if (existing && existing.chat_id !== chatId) {
            await sendTelegramRequest("sendMessage", {
                chat_id: chatId,
                text: getMsg(lang, "duplicate_phone")
            });
            return res.send("OK");
        }
            
        await db.upsertRegistration(chatId, { phone: phone, step: buildStep(lang, "awaiting_payment_method") });
        
        let settings = {};
        try { settings = await db.getPaymentSettings(); } catch (e) {}

        const courseName = (settings && settings.cert_program_en) ? settings.cert_program_en : "FACEBOOK ADS TRAINING PROGRAM";
        const duration = (settings && settings.cert_duration_en) ? settings.cert_duration_en : "4 Weeks";
        const amount = (settings && settings.amount) ? settings.amount : "500";

        let courseDesc = "";
        if (lang === "am") {
            courseDesc = `✅ **ስልክ ቁጥርዎ ተቀምጧል!**\n\n📚 **የስልጠናው ስም**: ${(settings && settings.cert_program_am) ? settings.cert_program_am : courseName}\n⏱ **የስልጠና ቆይታ**: ${(settings && settings.cert_duration_am) ? settings.cert_duration_am : "4 ሳምንት"}\n💰 **የመመዝገቢያ ክፍያ**: ${amount} ብር\n\n` + getMsg(lang, "ask_payment_method");
        } else {
            courseDesc = `✅ **Phone number saved successfully!**\n\n📚 **Course Name**: ${courseName}\n⏱ **Duration**: ${duration}\n💰 **Registration Fee**: ${amount} ETB\n\n` + getMsg(lang, "ask_payment_method");
        }

        const kb = {
            inline_keyboard: [
                [{ text: getMsg(lang, "btn_telebirr"), callback_data: "pay_telebirr" }, { text: getMsg(lang, "btn_cbe"), callback_data: "pay_cbe" }],
                [{ text: getMsg(lang, "btn_abyssinia"), callback_data: "pay_abyssinia" }]
            ]
        };
        await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: courseDesc,
            parse_mode: "Markdown",
            reply_markup: kb
        });
        await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: "👇 " + getMsg(lang, "select_payment_method_first"),
            reply_markup: await getMenuKeyboard(lang, chatId)
        });
        return res.send("OK");
    }

    if (currentStep === "awaiting_payment_method") {
        await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: getMsg(lang, "select_payment_method_first")
        });
        return res.send("OK");
    }

    if (currentStep && currentStep.startsWith("awaiting_receipt")) {
        const photo = message.photo;
        const caption = (message.caption || "").trim();
        
        let receiptNum = text;
        let receiptImg = null;
        
        if (photo || message.photo_url) {
            if (message.photo_url) {
                receiptImg = message.photo_url;
                receiptNum = caption || `Sim_REC_${Math.floor(Date.now() / 1000)}`;
            } else {
                const largestPhoto = photo[photo.length - 1];
                const fileId = largestPhoto.file_id;
                
                try {
                    const fileInfo = await sendTelegramRequest("getFile", { file_id: fileId });
                    if (fileInfo && fileInfo.ok && fileInfo.result && fileInfo.result.file_path) {
                        const filePath = fileInfo.result.file_path;
                        const activeToken = await getActiveTelegramToken();
                        const downloadUrl = `https://api.telegram.org/file/bot${activeToken}/${filePath}`;
                        
                        const imgRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
                        const fileBytes = imgRes.data;
                        const fileName = `${chatId}_${Math.floor(Date.now() / 1000)}.jpg`;
                        const storageUrl = `${SUPABASE_URL}/storage/v1/object/receipts/${fileName}`;
                        
                        const uploadRes = await axios.post(storageUrl, fileBytes, {
                            headers: {
                                "apikey": SUPABASE_KEY,
                                "Authorization": `Bearer ${SUPABASE_KEY}`,
                                "Content-Type": "image/jpeg"
                            }
                        });
                        
                        if (uploadRes.status === 200 || uploadRes.status === 201) {
                            receiptImg = `${SUPABASE_URL}/storage/v1/object/public/receipts/${fileName}`;
                            receiptNum = caption || `Img_${Math.floor(Date.now() / 1000)}`;
                        } else {
                            console.error("Supabase storage upload failed:", uploadRes.data);
                        }
                    } else {
                        throw new Error("Telegram file_path not available offline");
                    }
                } catch (e) {
                    console.error("Error processing image upload, using offline fallback:", e.message);
                    receiptImg = fileId;
                    receiptNum = caption || `Img_REC_${Math.floor(Math.random() * 900000) + 100000}`;
                }
            }
            
            if (!receiptImg) {
                const errMsg = getMsg(lang, "err_failed_upload");
                await sendTelegramRequest("sendMessage", {
                    chat_id: chatId,
                    text: errMsg
                });
                return res.send("OK");
            }
        }

        if (!photo && !message.photo_url) {
            const errMsg = getMsg(lang, "err_upload_receipt_only");
            await sendTelegramRequest("sendMessage", {
                chat_id: chatId,
                text: errMsg
            });
            return res.send("OK");
        }

            
        const paymentMethod = currentStep.includes("telebirr") ? "Telebirr" : (currentStep.includes("cbe") ? "CBE" : (currentStep.includes("abyssinia") ? "Abyssinia Bank" : "Unknown"));
        await db.upsertRegistration(chatId, {
            receipt_number: receiptNum,
            receipt_image_url: receiptImg,
            payment_method: paymentMethod,
            step: buildStep(lang, "completed"),
            status: "pending"
        });
        
        // Trigger referral reward check
        const currentReg = await db.getRegistration(chatId);
        if (currentReg && currentReg.referred_by_chat_id) {
            await checkAndApplyReferralReward(currentReg.referred_by_chat_id);
        }
        
        const msg = getMsg(lang, "registration_submitted");
        await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: msg,
            parse_mode: "Markdown",
            reply_markup: getMenuKeyboard(lang)
        });
        
        // Notify Admin
        let adminChat = null;
        const adminRec = await db.getAdmin(ADMIN_USERNAME);
        if (adminRec) {
            adminChat = adminRec.telegram_chat_id;
        }
        if (!adminChat) {
            adminChat = ADMIN_CHAT_ID || process.env.ADMIN_CHAT_ID;
        }
            
        if (adminChat) {
            const updatedReg = await db.getRegistration(chatId);
            const regId = updatedReg.id;
            const payMethod = updatedReg.payment_method || "Unknown";
            const recNum = updatedReg.receipt_number || "-";
            const imgUrl = updatedReg.receipt_image_url;
            
            const captionText = `🔔 **New Receipt Submitted!**\n\n👤 **Name**: ${updatedReg.name}\n📞 **Phone**: ${updatedReg.phone}\n💳 **Payment**: ${payMethod}\n🧾 **Receipt**: \`${recNum}\``;
            
            const adminKb = {
                inline_keyboard: [
                    [
                        { text: "Approve ✅", callback_data: `approve:${regId}` },
                        { text: "Decline ❌", callback_data: `decline:${regId}` }
                    ]
                ]
            };
            
            if (imgUrl) {
                await sendTelegramRequest("sendPhoto", {
                    chat_id: adminChat,
                    photo: imgUrl,
                    caption: captionText,
                    parse_mode: "Markdown",
                    reply_markup: adminKb
                });
            } else {
                await sendTelegramRequest("sendMessage", {
                    chat_id: adminChat,
                    text: captionText,
                    parse_mode: "Markdown",
                    reply_markup: adminKb
                });
            }
        }
        return res.send("OK");
    }

    // Default step fallbacks
    const status = reg.status;
    let msg;
    if (status === "approved") {
        const link = formatInviteLinksForUser(reg.invite_link, lang);
        msg = getMsg(lang, "last_approved_msg").replace("{link}", link);
    } else if (status === "declined") {
        msg = getMsg(lang, "last_declined_msg");
    } else {
        msg = getMsg(lang, "last_pending_msg");
    }
        
    await sendTelegramRequest("sendMessage", {
        chat_id: chatId,
        text: msg,
        reply_markup: getMenuKeyboard(lang)
    });
    
    return res.send("OK");
});

// --- 1-Time Giveaway Codes API Routes ---
app.get("/api/admin/giveaways", async (req, res) => {
  try {
    const codes = await dbStore.getGiveawayCodes();
    res.status(200).json({ success: true, data: codes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/admin/giveaways/generate", async (req, res) => {
  try {
    const { courseId, courseTitle, count, customCode } = req.body || {};
    const result = await dbStore.generateGiveawayCodes({ courseId, courseTitle, count, customCode });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/admin/giveaways/revoke", async (req, res) => {
  try {
    const { code } = req.body || {};
    const result = await dbStore.revokeGiveawayCode(code);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/admin/giveaways/delete", async (req, res) => {
  try {
    const { code } = req.body || {};
    const result = await dbStore.deleteGiveawayCodePermanent(code);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/giveaways/redeem", async (req, res) => {
  try {
    const { code, telegramUser } = req.body || {};
    const result = await dbStore.redeemGiveawayCode({ code, telegramUser });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Setup Telegram Bot Webhook URL dynamically based on the current host domain
app.get('/api/bot/setup', async (req, res) => {
    try {
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers.host;
        const webhookUrl = `${protocol}://${host}/api/bot`;
        
        console.log(`Setting Telegram webhook to: ${webhookUrl}`);
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook`, {
            url: webhookUrl,
            allowed_updates: ["message", "callback_query", "chat_member"]
        });
        
        return res.json({
            success: true,
            message: "Telegram webhook set up successfully!",
            webhook_url: webhookUrl,
            telegram_response: response.data
        });
    } catch (err) {
        console.error("Failed to set up Telegram webhook:", err.message);
        return res.status(500).json({
            success: false,
            error: err.message,
            telegram_token_redacted: TELEGRAM_TOKEN.substring(0, 6) + "..."
        });
    }
});

// Catch-all route to serve the SPA frontend correctly or return status
app.get('/*path', (req, res) => {
    // If not matching static resources, return index.html for browser routes
    const ext = path.extname(req.path);
    if (!ext) {
        return res.sendFile(path.join(BASE_DIR, 'index.html'));
    }
    return res.status(404).send("Not Found");
});

async function startLongPolling(port) {
    console.log("[Telegram Bot] Starting local long polling loop...");
    
    // Attempt to delete webhook so Telegram allows getUpdates polling
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/deleteWebhook`, { drop_pending_updates: true });
        console.log("[Telegram Bot] Webhook deleted successfully. Ready for local updates.");
    } catch (e) {
        console.log("[Telegram Bot] Warning: could not delete webhook (offline or invalid token).");
    }
    
    let offset = 0;
    while (true) {
        try {
            const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates`;
            const response = await axios.post(url, {
                offset: offset,
                timeout: 30,
                allowed_updates: ["message", "callback_query", "chat_member"]
            });
            
            if (response.data && response.data.ok) {
                const updates = response.data.result;
                for (const update of updates) {
                    offset = update.update_id + 1;
                    
                    // Post the update to the local Express server webhook endpoint
                    try {
                        await axios.post(`http://localhost:${port}/api/bot`, update);
                    } catch (err) {
                        console.error("[Telegram Bot] Error forwarding update locally:", err.message);
                    }
                }
            }
        } catch (e) {
            // Log error and sleep 5s before retrying to prevent hot loops
            console.error("[Telegram Bot] Long polling error:", e.message);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running locally on http://localhost:${PORT}`);
        if (process.env.RUN_BOT_LOCALLY === "true") {
            startLongPolling(PORT);
        } else {
            console.log("[Telegram Bot] Local long polling is disabled. Running in Supabase Edge Function only mode.");
        }
    });
}

// Prevent unhandled rejections from crashing the serverless function
process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err);
});

// Health check / diagnostic route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', env: process.env.VERCEL ? 'vercel' : 'local', node: process.version });
});

// Fallback & Clean URL HTML Routes
app.get('/admin/login', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-login.html')));
app.get('/admin-login', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-login.html')));
app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-dashboard.html')));
app.get('/admin-dashboard', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-dashboard.html')));
app.get('/admin/courses', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-courses.html')));
app.get('/admin-courses', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-courses.html')));
app.get('/admin/course-detail', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-course-detail.html')));
app.get('/admin-course-detail', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-course-detail.html')));
app.get('/admin/categories', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-categories.html')));
app.get('/admin-categories', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-categories.html')));
app.get('/admin/students', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-students.html')));
app.get('/admin-students', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-students.html')));
app.get('/admin/student-profile', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-student-profile.html')));
app.get('/admin-student-profile', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-student-profile.html')));
app.get('/admin/transactions', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-transactions.html')));
app.get('/admin-transactions', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-transactions.html')));
app.get('/admin/landing', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-landing-customizer.html')));
app.get('/admin/customizer', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-landing-customizer.html')));
app.get('/admin-landing-customizer', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-landing-customizer.html')));
app.get('/admin/maintenance', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-maintenance.html')));
app.get('/admin-maintenance', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-maintenance.html')));
app.get('/admin/settings', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-settings.html')));
app.get('/admin-settings', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-settings.html')));
app.get('/admin/broadcast', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-broadcast.html')));
app.get('/admin-broadcast', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-broadcast.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'admin-dashboard.html')));

app.get('/courses', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'courses.html')));
app.get('/login', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'login.html')));
app.get('/maintenance', (req, res) => res.sendFile(path.join(BASE_DIR, 'public', 'maintenance.html')));

app.get('/favicon.ico', (req, res) => res.status(204).end());

// TELEGRAM BOT WEBHOOK DOMAIN SETUP
app.all(['/api/bot/setup', '/api/admin/set-webhook'], async (req, res) => {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "8659500401:AAEUvDQTc0pniztDTiIQU65igbuiiM5ZXAc";
        const host = req.query.domain || req.headers['x-forwarded-host'] || req.headers.host || "new-nu-umber.vercel.app";
        const protocol = (host.includes('localhost') || host.includes('127.0.0.1')) ? 'http' : 'https';
        const webhookUrl = `${protocol}://${host}/api/bot`;

        console.log(`[Telegram Webhook Setup] Registering webhook URL: ${webhookUrl}`);
        const tgUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
        const tgRes = await axios.get(tgUrl);

        return res.status(200).json({
            success: true,
            webhookUrl,
            telegramResponse: tgRes.data
        });
    } catch (err) {
        console.error('[Telegram Webhook Setup Error]:', err.message);
        return res.status(500).json({
            success: false,
            error: err.message,
            telegramResponse: err.response?.data
        });
    }
});

app.get('/api/certificate', async (req, res) => {
    const chatId = req.query.id;
    if (!chatId) return res.status(400).send("Missing ID");
    
    const db = require('./db');
    const reg = await db.getRegistration(chatId);
    if (!reg) return res.status(404).send("Registration not found");
    
    const name = reg.name || "Student";
    const name2 = reg.name2 || name;
    const finishDate = new Date(new Date().getTime() + 3 * 3600000).toISOString().split("T")[0];
    
    const fs = require('fs');
    const path = require('path');
    const settings = await db.getPaymentSettings();

    const templatePath = path.join(__dirname, 'IMG_6757.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    const programAm  = settings.cert_program_am  || "እደጥበብ";
    const programEn  = settings.cert_program_en  || "Hand Craft & Art";
    const durationAm = settings.cert_duration_am || "4";
    const durationEn = settings.cert_duration_en || "4";
    const signatureBase64 = settings.signature_base64 || "";
    const sealBase64 = settings.seal_base64 || "";

    // Logo is now loaded via public URL in the HTML directly

    html = html.replace(
        '<div class="fill-blank-line" style="width: 88%; margin-left: 10px;"></div>',
        `<div class="fill-blank-line" style="width: 88%; margin-left: 10px; text-align: center; font-weight: bold; font-size: 16px;">${name}</div>`
    );
    html = html.replace(
        '<div class="fill-blank-line" style="width: 90%; margin-left: 10px;"></div>',
        `<div class="fill-blank-line" style="width: 90%; margin-left: 10px; text-align: center; font-weight: bold; font-size: 16px;">${name2}</div>`
    );
    html = html.replace(
        '<div class="dotted-blank-line" style="width: 95px;"></div>',
        `<div class="dotted-blank-line" style="width: 95px; text-align: center; font-weight: bold;">${durationAm}</div>`
    );
    html = html.replace(
        '<div class="dotted-blank-line" style="width: 185px;"></div>',
        `<div class="dotted-blank-line" style="width: 185px; text-align: center; font-weight: bold;">${programAm}</div>`
    );
    html = html.replace(
        'PROGRAM IN<div class="dotted-blank-line" style="width: 200px;"></div> AT FOUNDERS ACADEMY.',
        `PROGRAM IN <div class="dotted-blank-line" style="width: 200px; text-align: center; font-weight: bold;">${programEn}</div> AT FOUNDERS ACADEMY.`
    );
    html = html.replace(
        'THE TRAINING WAS CONDUCTED FOR<div class="dotted-blank-line" style="width: 95px;"></div>WEEK.',
        `THE TRAINING WAS CONDUCTED FOR <div class="dotted-blank-line" style="width: 95px; text-align: center; font-weight: bold;">${durationEn}</div> WEEK.`
    );
    const ethFinishDate = gregorianToEthiopianString(finishDate);
    html = html.replace(
        'ቀን <div class="dotted-blank-line" style="width: 165px;"></div> ዓ.ም',
        `ቀን <div class="dotted-blank-line" style="width: 165px; text-align: center; font-weight: bold;">${ethFinishDate}</div> ዓ.ም`
    );
    html = html.replace(
        'DATE: <div class="fill-blank-line" style="width: 150px;"></div>',
        `DATE: <div class="fill-blank-line" style="width: 150px; text-align: center; font-weight: bold;">${finishDate}</div>`
    );
    
    let signatureHtml = 'SIGNED: <div class="fill-blank-line" style="width: 190px;"></div>';
    if (signatureBase64 || sealBase64) {
        let insideHtml = "";
        if (signatureBase64) {
            insideHtml += `<img src="${signatureBase64}" style="max-height: 45px; position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); z-index: 1;">`;
        }
        if (sealBase64) {
            insideHtml += `<img src="${sealBase64}" style="position: absolute; max-height: 300px; max-width: 300px; object-fit: contain; bottom: -115px; left: 50%; transform: translateX(-50%); z-index: 2; opacity: 0.75; pointer-events: none;">`;
        }
        signatureHtml = `SIGNED: <div class="fill-blank-line" style="width: 190px; position: relative; text-align: center; height: 35px !important; vertical-align: bottom !important;">${insideHtml}</div>`;
    }
    html = html.replace('SIGNED: <div class="fill-blank-line" style="width: 190px;"></div>', signatureHtml);
    html = html.replace('<!-- SEAL_PLACEHOLDER -->', '');

    const script = `
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script>
        function downloadPdf() {
            const element = document.querySelector('.certificate-canvas');
            const opt = {
                margin: 0,
                filename: 'Founders Academy_Certificate_${name.replace(/\\s+/g, '_')}.pdf',
                image: { type: 'jpeg', quality: 1 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };
            html2pdf().set(opt).from(element).save();
        }
    </script>
    <div style="text-align: center; margin-top: 20px; padding-bottom: 20px;">
        <button onclick="downloadPdf()" style="padding: 12px 24px; background: #0088cc; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-family: sans-serif; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Download PDF Certificate 📥</button>
    </div>
    </body>`;
    
    html = html.replace('</body>', script);
    res.send(html);
});

// Root path -> Landing Page (Founders Academy)
app.get('/', (req, res) => {
    const p = path.join(BASE_DIR, 'public', 'index.html');
    res.sendFile(p, (err) => {
        if (err && !res.headersSent) {
            console.error('[sendFile error]', err.message, 'path:', p);
            res.status(404).send('index.html not found. BASE_DIR=' + BASE_DIR);
        }
    });
});

app.get('*', (req, res) => {
    const ext = path.extname(req.path);
    const fs = require('fs');

    // 1. CSS fallback
    if (ext === '.css' || req.path.includes('.css')) {
        res.setHeader('Content-Type', 'text/css');
        const candidatePaths = [
            path.join(BASE_DIR, 'web', 'css', 'styles.css'),
            path.join(BASE_DIR, 'web', 'style.css'),
            path.join(BASE_DIR, 'public', 'css', 'styles.css'),
            path.join(BASE_DIR, 'style.css')
        ];
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) return res.sendFile(p);
        }
        return res.status(404).send('CSS Resource not found');
    }

    // 2. HTML page or Clean Route
    if (!ext || ext === '.html') {
        const cleanName = req.path.replace(/^\//, '').replace(/\.html$/, '');
        const targetHtml = cleanName ? `${cleanName}.html` : 'index.html';
        const webPath = path.join(BASE_DIR, 'web', targetHtml);
        const publicPath = path.join(BASE_DIR, 'public', targetHtml);
        
        if (fs.existsSync(webPath)) return res.sendFile(webPath);
        if (fs.existsSync(publicPath)) return res.sendFile(publicPath);

        const defaultIndex = path.join(BASE_DIR, 'public', 'index.html');
        return res.sendFile(defaultIndex, (err) => {
            if (err && !res.headersSent) {
                res.status(404).send('Page not found');
            }
        });
    }

    res.status(404).send('Resource not found');
});

module.exports = app;

