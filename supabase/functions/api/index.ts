import PDFDocument from "npm:pdfkit@0.13.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { borderBase64 } from "./assets.ts";
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "8906068445:AAGc5L08H9a1Lc0oYIDL9o4ZqjJbLVMII4Y";
const TELEGRAM_CHANNEL_ID = Deno.env.get("TELEGRAM_CHANNEL_ID") || "";
const ADMIN_CHAT_ID = Deno.env.get("ADMIN_CHAT_ID") || "";
const ADMIN_USERNAME = Deno.env.get("ADMIN_USERNAME") || "admin";
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") || "admin123";
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "super-secret-founders_academy-token-key-12345!";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

// Static Messages fallback
const STATIC_MESSAGES = {
  "en": {
    "welcome_choose_lang": "🇬🇧 Welcome to Founders Academy Hand Craft School Registration Bot!\nPlease select your preferred language below:",
    "ask_name": "📝 Please enter your full name:",
    "ask_name_am": "📝 Please enter your **Full Name in Amharic** (e.g. አበበ በሶ):",
    "ask_name_en": "📝 Please enter your **Full Name in English** (e.g. Abebe Beso):",
    "invalid_name": "❌ Name cannot be empty. Please enter your name:",
    "ask_phone": "📞 Please share your phone number using the button below or type it:",
    "btn_share_contact": "Share Contact 📞",
    "phone_saved": "✅ Phone number saved successfully!",
    "duplicate_phone": "❌ This phone number is already registered. Please use another phone number.",
    "invalid_phone": "❌ Invalid phone number. Please enter a valid number:",
    "ask_payment_method": "💳 Please select your preferred payment method:",
    "btn_telebirr": "Telebirr 📱",
    "btn_cbe": "CBE 🏦",
    "select_payment_method_first": "❌ Please select a payment method from the buttons above.",
    "telebirr_payment_instructions": "📱 **Telebirr Payment Instructions**\n\n1. Pay **{amount} Birr** to:\n   - **Merchant Name**: {acc_name}\n   - **Merchant Number**: `{acc_num}`\n\n2. Once paid, please upload your receipt photo or type the Transaction ID below.",
    "cbe_payment_instructions": "🏦 **CBE Bank Transfer Instructions**\n\n1. Transfer **{amount} Birr** to:\n   - **Account Name**: {acc_name}\n   - **Account Number**: `{acc_num}`\n\n2. Once transferred, please upload your receipt photo or type the Transaction ID below.",
    "ask_receipt_number": "🧾 Please upload a photo of the receipt or type the receipt number:",
    "registration_submitted": "🎉 **Registration Submitted Successfully!**\n\nWe are verifying your receipt. You will receive a notification here once approved. Thank you! 🙏",
    "menu_submit_receipt": "Submit Receipt 🧾",
    "menu_check_status": "Check Status 🔍",
    "menu_refer_friend": "Refer Friends 👥",
    "menu_change_language": "Change Language 🌐",
    "status_pending": "Pending Verification ⏳",
    "status_approved": "Approved ✅",
    "status_declined": "Declined ❌",
    "no_receipt_yet": "You haven't submitted any receipts yet. Type /start to begin.",
    "already_pending": "⚠️ You already have a pending registration. Please wait for approval.",
    "referral_message": "👥 **Refer and Earn!**\n\nShare your link with friends. When they register and get approved, you get credit!\n\n🔗 **Your referral link**:\n{ref_link}",
    "ready_new_receipt": "Ready to submit a new receipt? Please select payment method below:",
    "payment_saved": "✅ Payment method saved!",
    "help_instructions": "ℹ️ **Founders Academy Bot Help**\n\n- Use /start to begin registration.\n- Use the menu buttons to submit receipts, refer friends, check status, or change language.",
    "already_registered": "You have already registered. Please use the menu below to check your status or refer friends.",
    "status_approved_msg": "🎉 **Your registration is approved!**\nReceipt: `{receipt}`\n\n🔗 Join our Private Channel here:\n{link}",
    "status_declined_msg": "❌ **Your registration was declined.**\nReceipt: `{receipt}`\n\n⚠️ **Reason**: {reason}",
    "status_pending_msg": "⏳ **Your registration is pending review.**\nReceipt: `{receipt}`\n\nWe will notify you once approved.",
    "default_decline_reason": "Details do not match our records.",
    "last_approved_msg": "Your last registration is approved ✅\nHere is your link: {link}\n\nYou can use the menu buttons below to submit another receipt or refer friends!",
    "last_declined_msg": "Your last registration was declined. You can submit another receipt using the menu below.",
    "last_pending_msg": "Your registration is currently pending review. We will notify you once approved.",
    "welcome_name_prefix": "Hello {name}! ",
    "receipt_approved_msg": "🎉 **Receipt Verification Approved!**\n\nHello **{name}**, your receipt `{receipt}` has been verified successfully. You are now approved to join our premium private channel!\n\n🔗 **Your One-time Invite Link**:\n{link}\n\n*Note: This link is unique and can only be used by one person.*",
    "receipt_declined_msg": "❌ **Receipt Verification Declined**\n\nHello **{name}**, we are sorry, but your receipt `{receipt}` has been declined.\n\n⚠️ **Reason**: {reason}",
    "referral_reward_msg": "🎁 **Congratulations! You referred 3 friends successfully!**\n\nHello **{name}**, because you have referred 3 friends, you got the Founders Academy course for free! You are now approved to join our premium private channel!\n\n🔗 **Your One-time Invite Link**:\n{link}\n\n*Note: This link is unique and can only be used by one person.*",
    "quiz_not_completed": "⚠️ **Quiz Not Completed**\n\nYou must complete all daily quizzes to get a certificate of completion.",
    "menu_get_certificate": "Get Certificate 📜",
    "certificate_caption": "🎓 **CERTIFICATE OF COMPLETION** 🎓\n\nThis certifies that **{name}** has successfully completed the Founders Academy Daily Sequence.\n\nWe are incredibly proud of your dedication. Well done!",
    "menu_customer_support": "Customer Support 🎧",
    "customer_support_msg": "📞 **Customer Support**\n\nIf you need any help, please contact our support team at @foundersupportt"
  },
  "am": {
    "welcome_choose_lang": "🇪🇹 ወደ ክራፍቶፒያ የእጅ ጥበብ ትምህርት ቤት የእጅ ሥራ ምዝገባ ቦት እንኳን ደህና መጡ!\nእባክዎ ተመራጭ ቋንቋዎን ከታች ይምረጡ:",
    "ask_name": "📝 እባክዎን ሙሉ ስምዎን ያስገቡ:",
    "ask_name_am": "📝 እባክዎ **ሙሉ ስምዎን በአማርኛ** ያስገቡ (ምሳሌ፡ አበበ በሶ):",
    "ask_name_en": "📝 እባክዎ **ሙሉ ስምዎን በእንግሊዝኛ** ያስገቡ (ምሳሌ፡ Abebe Beso):",
    "invalid_name": "❌ ስም ባዶ መሆን አይችልም። እባክዎን ስምዎን ያስገቡ:",
    "ask_phone": "📞 እባክዎን ከታች ያለውን ቁልፍ በመጫን ስልክ ቁጥርዎን ያጋሩ ወይም ይፃፉ:",
    "btn_share_contact": "ስልክ ቁጥር አጋራ 📞",
    "phone_saved": "✅ ስልክ ቁጥርዎ በተሳካ ሁኔታ ተቀምጧል!",
    "duplicate_phone": "❌ ይህ ስልክ ቁጥር ቀድሞ ተመዝግቧል። እባክዎ ሌላ ስልክ ቁጥር ይጠቀሙ።",
    "invalid_phone": "❌ የተሳሳተ ስልክ ቁጥር። እባክዎ ትክክለኛ ቁጥር ያስገቡ:",
    "ask_payment_method": "💳 እባክዎ ተመራጭ የክፍያ ዘዴዎን ይምረጡ:",
    "btn_telebirr": "ቴሌብር 📱",
    "btn_cbe": "የኢትዮጵያ ንግድ ባንክ 🏦",
    "select_payment_method_first": "❌ እባክዎ ክፍያ ለመፈጸም ከላይ ካሉት አማራጮች አንዱን ይምረጡ።",
    "telebirr_payment_instructions": "📱 **የቴሌብር ክፍያ መመሪያ**\n\n1. **{amount} ብር** ወደዚህ ይክፈሉ:\n   - **የነጋዴ ስም**: {acc_name}\n   - **የነጋዴ ቁጥር**: `{acc_num}`\n\nክፍያውን ከፈጸሙ በኋላ፣ እባክዎ የደረሰኝዎን ፎቶ ወይም ስክሪንሾት ከታች ይላኩ:",
    "cbe_payment_instructions": "🏦 **የኢትዮጵያ ንግድ ባንክ የክፍያ መመሪያ**\n\n1. **{amount} ብር** ወደዚህ ያስተላልፉ:\n   - **የአካውንት ስም**: {acc_name}\n   - **የአካውንት ቁጥር**: `{acc_num}`\n\nክፍያውን ከፈጸሙ በኋላ፣ እባክዎ የደረሰኝዎን ፎቶ ወይም ስክሪንሾት ከታች ይላኩ:",
    "ask_receipt_number": "🧾 እባክዎን የደረሰኝ ፎቶ ይጫኑ ወይም የደረሰኝ ቁጥሩን ይፃፉ:",
    "registration_submitted": "🎉 **ምዝገባዎ በተሳካ ሁኔታ ቀርቧል!**\n\nደረሰኝዎን እያረጋገጥን ነው። አንዴ ሲፈቀድ እዚህ ማሳወቂያ ይደርስዎታል። እናመሰግናለን! 🙏",
    "menu_submit_receipt": "ደረሰኝ አስገባ 🧾",
    "menu_check_status": "ሁኔታ ማረጋገጫ 🔍",
    "menu_refer_friend": "ጓደኛ ጋብዝ 👥",
    "menu_change_language": "ቋንቋ ቀይር 🌐",
    "status_pending": "በመጠባበቅ ላይ ⏳",
    "status_approved": "ጸድቋል ✅",
    "status_declined": "ውድቅ ተደርጓል ❌",
    "no_receipt_yet": "እስካሁን ምንም ደረሰኝ አላስገቡም። ለመጀመር /start ብለው ይፃፉ።",
    "already_pending": "⚠️ ቀድሞውኑ በመጠባበቅ ላይ ያለ ምዝገባ አለዎት። እባክዎ እስኪፈቀድ ይጠብቁ።",
    "referral_message": "👥 **ይጋብዙ እና ያግኙ!**\n\nየመጋበዣ ሊንክዎን ለጓደኞችዎ ያጋሩ። እነሱ ሲመዘገቡ እና ሲፈቀድላቸው እርስዎ ክሬዲት ያገኛሉ!\n\n🔗 **የእርስዎ መጋበዣ ሊንክ**:\n{ref_link}",
    "ready_new_receipt": "አዲስ ደረሰኝ ለማስገባት ዝግጁ ነዎት? እባክዎ ከታች የክፍያ ዘዴ ይምረጡ:",
    "payment_saved": "✅ የክፍያ ዘዴ ተቀምጧል!",
    "help_instructions": "ℹ️ **የክራፍቶፒያ ቦት እርዳታ**\n\n- ለመመዝገብ /start ይጠቀሙ።\n- ደረሰኝ ለማስገባት፣ ጓደኞችን ለመጋበዝ፣ ሁኔታን ለማረጋገጥ ወይም ቋንቋ ለመቀየር የማውጫ ቁልፎችን ይጠቀሙ።",
    "already_registered": "ቀድሞውኑ ተመዝግበዋል። እባክዎ ሁኔታዎን ለማረጋገጥ ወይም ጓደኞችን ለመጋበዝ ከታች ያለውን ማውጫ ይጠቀሙ።",
    "status_approved_msg": "🎉 **ምዝገባዎ ጸድቋል!**\nደረሰኝ: `{receipt}`\n\n🔗 የእኛን ፕሪሚየም ቻናል ለመቀላቀል ይህንን ሊንክ ይጫኑ:\n{link}",
    "status_declined_msg": "❌ **ምዝገባዎ ውድቅ ተደርጓል።**\nደረሰኝ: `{receipt}`\n\n⚠️ **ምክንያት**: {reason}",
    "status_pending_msg": "⏳ **ምዝገባዎ በመጠባበቅ ላይ ነው።**\nደረሰኝ: `{receipt}`\n\nሲፈቀድ እናሳውቆታለን።",
    "default_decline_reason": "ያስገቡት መረጃ ከእኛ መዝገብ ጋር አይዛመድም።",
    "last_approved_msg": "የመጨረሻ ምዝገባዎ ጸድቋል ✅\nሊንክዎ ይኸውና: {link}\n\nሌላ ደረሰኝ ለማስገባት ወይም ጓደኞችን ለመጋበዝ ከታች ያሉትን የማውጫ አዝራሮች መጠቀም ይችላሉ!",
    "last_declined_msg": "የመጨረሻ ምዝገባዎ ተቀባይነት አላገኘም። ከታች ያለውን ማውጫ በመጠቀም ሌላ ደረሰኝ ማስገባት ይችላሉ።",
    "last_pending_msg": "ምዝገባዎ በአሁኑ ጊዜ በመጠባበቅ ላይ ነው። ሲፈቀድ እናሳውቆታለን።",
    "welcome_name_prefix": "ሰላም {name}! ",
    "receipt_approved_msg": "🎉 **የደረሰኝ ማረጋገጫ ጸድቋል!**\n\nሰላም **{name}**፣ የደረሰኝ ቁጥርዎ `{receipt}` በተሳካ ሁኔታ ተረጋግጧል። አሁን የእኛን ፕሪሚየም የግል ቻናል ለመቀላቀል ፈቃድ አግኝተዋል!\n\n🔗 **የአንድ ጊዜ መጋበዣ ሊንክዎ**:\n{link}\n\n*ማስታወሻ: ይህ ሊንክ ልዩ ነው እና በአንድ ሰው ብቻ ነው ጥቅም ላይ ሊውል የሚችለው።*",
    "receipt_declined_msg": "❌ **የደረሰኝ ማረጋገጫ ተቀባይነት አላገኘም**\n\nሰላም **{name}**፣ የደረሰኝ ቁጥርዎ `{receipt}` ውድቅ ተደርጓል።\n\n⚠️ **ምክንያት**: {reason}",
    "referral_reward_msg": "🎁 **እንኳን ደስ አሰኞት! 3 ጓደኞችን በተሳካ ሁኔታ ጋብዘዋል!**\n\nሰላም **{name}**፣ 3 ሰዎችን ስለጋበዙ የFounders Academy ኮርሱን በነጻ አግኝተዋል! አሁን የእኛን ፕሪሚየም የግል ቻናል ለመቀላቀል ፈቃድ አግኝተዋል!\n\n🔗 **የአንድ ጊዜ መጋበዣ ሊንክዎ**:\n{link}\n\n*ማስታወሻ: ይህ ሊንክ ልዩ ነው እና በአንድ ሰው ብቻ ነው ጥቅም ላይ ሊውል የሚችለው።*",
    "quiz_not_completed": "⚠️ **ጥያቄዎች አልተጠናቀቁም**\n\nየማጠናቀቂያ ሰርተፊኬት ለማግኘት ሁሉንም ዕለታዊ ጥያቄዎች ማጠናቀቅ አለብዎት።",
    "menu_get_certificate": "የምስክር ወረቀት ያግኙ 📜",
    "certificate_caption": "🎓 **የማጠናቀቂያ ምስክር ወረቀት** 🎓\n\nይህ **{name}** የፋውንደርስ አካዳሚ የዕለት ተዕለት ትምህርቶችን በተሳካ ሁኔታ ማጠናቀቃቸውን የሚያረጋግጥ ነው።\n\nበትጋትዎ በጣም እንኮራለን። እንኳን ደስ አሎት!",
    "menu_customer_support": "የደንበኞች ድጋፍ 🎧",
    "customer_support_msg": "📞 **የደንበኞች ድጋፍ**\n\nማንኛውም እርዳታ ከፈለጉ እባክዎ የድጋፍ ቡድናችንን በ @foundersupportt ያግኙ።"
  }
};

let DB_MESSAGES: any = {};

async function loadDbTranslations() {
  try {
    const { data: langs } = await supabase.from("languages").select("*").eq("is_active", true);
    const { data: trans } = await supabase.from("translations").select("*");
    
    if (langs && trans) {
      const newMessages: any = {};
      langs.forEach((l: any) => {
        newMessages[l.code] = {};
      });
      trans.forEach((t: any) => {
        if (newMessages[t.lang_code]) {
          newMessages[t.lang_code][t.key] = t.value;
        }
      });
      DB_MESSAGES = newMessages;
    }
  } catch (_e) {
    // ignore
  }
}

function getMsg(lang: string, key: string): string {
  if (DB_MESSAGES[lang] && DB_MESSAGES[lang][key]) {
    return DB_MESSAGES[lang][key];
  }
  const staticMsgs = (STATIC_MESSAGES as any);
  if (staticMsgs[lang] && staticMsgs[lang][key]) {
    return staticMsgs[lang][key];
  }
  if (staticMsgs["en"] && staticMsgs["en"][key]) {
    return staticMsgs["en"][key];
  }
  return `[${key}]`;
}

function isMenuCommand(text: string, key: string): boolean {
  for (const keys of Object.values(DB_MESSAGES)) {
    if ((keys as any)[key] === text) return true;
  }
  for (const keys of Object.values(STATIC_MESSAGES)) {
    if ((keys as any)[key] === text) return true;
  }
  return false;
}

function getLangAndStep(reg: any) {
  if (!reg) return ["en", "start"];
  const step = reg.step || "en|start";
  if (step.includes("|")) {
    const parts = step.split("|");
    return [parts[0], parts[1]];
  }
  return ["en", step];
}

function buildStep(lang: string, step: string) {
  return `${lang}|${step}`;
}

function formatInviteLinksForUser(inviteLinkStr: string, lang: string): string {
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

async function removeUserFromChannel(chatId: number) {
  try {
    const { data: settings } = await supabase.from("admins").select("verification_code").eq("username", "payment_settings").maybeSingle();
    const sDict = settings && settings.verification_code ? JSON.parse(settings.verification_code) : {};
    const channelId = sDict.telegram_channel_id || TELEGRAM_CHANNEL_ID || "-1003789578749";
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
  } catch (e: any) {
    console.error(`[Kick] Exception in removeUserFromChannel for user ${chatId}:`, e.message);
  }
}

async function getMenuKeyboard(lang = "en", chatId?: number) {
  let hasSubmittedReceipt = false;
  let isCompletedQuiz = false;

  if (chatId) {
    try {
      const { data: reg } = await supabase.from("registrations").select("receipt_number, step, status").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (reg && (reg.receipt_number || (reg.step && reg.step.includes("completed")) || ["approved", "pending", "declined"].includes(reg.status))) {
        hasSubmittedReceipt = true;
      }
      const { data: prog } = await supabase.from("user_quiz_progress").select("is_completed").eq("chat_id", chatId).maybeSingle();
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
    keyboard.unshift([{ text: "Get Certificate 📜" }]);
  }

  return {
    keyboard,
    resize_keyboard: true
  };
}

async function getLanguageKeyboard() {
  try {
    const { data: langs } = await supabase.from("languages").select("*").eq("is_active", true);
    if (langs && langs.length > 0) {
      const flags: any = { "en": "🇬🇧", "am": "🇪🇹", "or": "🇪🇹", "tg": "🇪🇹" };
      const buttons = langs.map((l: any) => ({
        text: `${flags[l.code] || "🌐"} ${l.name}`,
        callback_data: `lang:${l.code}`
      }));
      const inlineKeyboard = [];
      for (let i = 0; i < buttons.length; i += 2) {
        inlineKeyboard.push(buttons.slice(i, i + 2));
      }
      return { inline_keyboard: inlineKeyboard };
    }
  } catch (_e) {
    // ignore
  }
  return {
    inline_keyboard: [
      [{ text: "🇬🇧 English", callback_data: "lang:en" }, { text: "🇪🇹 አማርኛ", callback_data: "lang:am" }]
    ]
  };
}

async function sendTelegramRequest(method: string, payload: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`;
  const data = { ...payload };
  if (data.reply_markup && typeof data.reply_markup === "object") {
    data.reply_markup = JSON.stringify(data.reply_markup);
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (_e) {
    return null;
  }
}

async function sendNextQuizQuestion(chatId: number, isTest1Min = false) {
  const { data: prog } = await supabase.from("user_quiz_progress").select("*").eq("chat_id", chatId).maybeSingle();
  if (!prog) return;

  const day = prog.current_day || 1;
  const qIndex = prog.current_question_index || 0;

  const { data: reg } = await supabase.from("registrations").select("*").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const [lang] = getLangAndStep(reg);

  const { data: questions } = await supabase.from("questions").select("*").eq("day_number", day).order("created_at", { ascending: true });
  if (!questions || questions.length === 0) {
    const { data: maxQ } = await supabase.from("questions").select("day_number").order("day_number", { ascending: false }).limit(1).maybeSingle();
    const maxDay = maxQ ? maxQ.day_number : 0;
    if (day > maxDay && maxDay > 0) {
      const msg = "🎉 **Congratulations! You have completed all courses!** 🎉\n\nClick below to get your Certificate!";
      const kb = {
        inline_keyboard: [[{ text: getMsg(lang, "menu_get_certificate"), callback_data: "get_certificate" }]]
      };
      await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, parse_mode: "Markdown", reply_markup: kb });
    }
    return;
  }

  if (qIndex >= questions.length) {
    const { data: maxQ } = await supabase.from("questions").select("day_number").order("day_number", { ascending: false }).limit(1).maybeSingle();
    const maxDay = maxQ ? maxQ.day_number : 0;
    
    if (day >= maxDay) {
      await supabase.from("user_quiz_progress").update({ is_completed: true, last_completed_at: new Date().toISOString() }).eq("chat_id", chatId);
      
      const name = reg ? (reg.name || "Student") : "Student";
      const name2 = reg ? (reg.name2 || name) : name;
      const regDateStr = reg ? (reg.created_at || "") : "";
      
      let regDate = "Unknown";
      if (regDateStr) {
        try { regDate = regDateStr.split("T")[0]; } catch (_e) {}
      }
      const finishDate = new Date(new Date().getTime() + 3 * 3600000).toISOString().split("T")[0];
      
      let pdfBytes = null;
      try {
        pdfBytes = await generateCertificatePdf(name, regDate, finishDate, name2);
      } catch (pdfErr: any) {
        console.error("Error generating completion certificate PDF:", pdfErr.message);
      }
      
      if (pdfBytes) {
        const form = new FormData();
        form.append('chat_id', String(chatId));
        const caption = getMsg(lang, "certificate_caption").replace("{name}", name);
        form.append('caption', caption);
        form.append('parse_mode', 'Markdown');

        const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
        form.append("document", blob, "Certificate.pdf");

        try {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
            method: "POST",
            body: form
          });
          await removeUserFromChannel(chatId);
          return;
        } catch (sendErr: any) {
          console.error("Error sending auto-generated certificate document:", sendErr.message);
        }
      }

      const msg = getMsg(lang, "course_completed_msg").replace("{name}", name);
      const kb = {
        inline_keyboard: [
          [{ text: getMsg(lang, "menu_get_certificate"), callback_data: "get_certificate" }]
        ]
      };
      await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, parse_mode: "Markdown", reply_markup: kb });
    } else {
      const { data: regB } = await supabase.from("registrations").select("*").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      const msDiff = reg ? (Date.now() - new Date(regB.created_at).getTime()) : 0;
      const daysSinceReg = reg ? (isTest1Min ? Math.floor(msDiff / (60 * 1000)) + 1 : Math.floor(msDiff / (24 * 3600 * 1000)) + 1) : 1;
      const maxAllowedDay = Math.min(maxDay, daysSinceReg);

      if (day < maxAllowedDay) {
        // Auto-advance to the next day immediately to allow catching up in a single day
        await supabase.from("user_quiz_progress").update({
          current_day: day + 1,
          current_question_index: 0,
          last_completed_at: new Date().toISOString()
        }).eq("chat_id", chatId);
        
        await sendNextQuizQuestion(chatId, isTest1Min);
      } else {
        await supabase.from("user_quiz_progress").update({ last_completed_at: new Date().toISOString() }).eq("chat_id", chatId);
        const [langB] = getLangAndStep(regB);
        const msg = getMsg(langB, "day_completed_msg").replace("{day}", String(day));
        await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, parse_mode: "Markdown" });
      }
    }
    return;
  }

  const q = questions[qIndex];
  const options = q.options || [];
  const kb: any = { inline_keyboard: [] };
  options.forEach((opt: any, i: number) => {
    kb.inline_keyboard.push([{ text: String(opt), callback_data: `ans:${q.id}:${i}` }]);
  });

  const { data: regC } = await supabase.from("registrations").select("*").eq("chat_id", chatId).maybeSingle();
  const [langC] = getLangAndStep(regC);

  let msg = `🎓 **Day ${day} - Question ${qIndex + 1}/${questions.length}**\n\n`;
  if (qIndex === 0) {
    if (langC === "am") {
      msg += "⚠️ *እባክዎ እነዚህን ጥያቄዎች ከመመለስዎ በፊት ትምህርቱን መመልከትዎን ያረጋግጡ!*\n\n";
    } else {
      msg += "⚠️ *Please make sure you have viewed the course before answering these questions!*\n\n";
    }
  }
  msg += `${q.question_text}`;
  await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, parse_mode: "Markdown", reply_markup: kb });
}

let cachedFontRegular: Uint8Array | null = null;
let cachedFontBold: Uint8Array | null = null;

async function getFontRegular(): Promise<Uint8Array> {
  if (cachedFontRegular) return cachedFontRegular;
  const res = await fetch("https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansEthiopic/NotoSansEthiopic-Regular.ttf");
  cachedFontRegular = new Uint8Array(await res.arrayBuffer());
  return cachedFontRegular;
}

async function getFontBold(): Promise<Uint8Array> {
  if (cachedFontBold) return cachedFontBold;
  const res = await fetch("https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansEthiopic/NotoSansEthiopic-Bold.ttf");
  cachedFontBold = new Uint8Array(await res.arrayBuffer());
  return cachedFontBold;
}

function gregorianToEthiopianString(gregDateStr: string): string {
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
  } catch (_e) {
    return gregDateStr;
  }
}





async function generateCertificatePdf(name: string, regDate: string, finishDate: string, name2?: string): Promise<Uint8Array> {
  const actualName2 = name2 || name;
  let settings: any = {};
  try {
    const { data: adminRec } = await supabase
      .from("admins")
      .select("verification_code")
      .eq("username", "payment_settings")
      .maybeSingle();
    if (adminRec && adminRec.verification_code) {
      settings = JSON.parse(adminRec.verification_code);
    }
  } catch (err: any) {
    console.error("Deno cert fetch settings failed:", err.message);
  }

  const programAm  = settings.cert_program_am  || "የእጅ ሥራና ጥበብ";
  const programEn  = settings.cert_program_en  || "Hand Craft & Art";
  const durationAm = settings.cert_duration_am || "4";
  const durationEn = settings.cert_duration_en || "4";

  const fontRegularBytes = await getFontRegular();
  const fontBoldBytes = await getFontBold();
  const { logoBase64 } = await import('./assets.ts');

  return new Promise((resolve) => {
    // Standard A4 Landscape: 841.89 x 595.28 points
    const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 0 });
    const chunks: any[] = [];
    doc.on("data", (chunk: any) => chunks.push(chunk));
    doc.on("end", () => {
      const result = new Uint8Array(Buffer.concat(chunks));
      resolve(result);
    });

    const forestGreen = "#008751";
    const darkGreen = "#005a36";

    const ethFont  = (bold: boolean) => bold ? "Ethiopic-Bold" : "Ethiopic";
    const latFont  = (bold: boolean) => bold ? "Helvetica-Bold" : "Helvetica";

    doc.registerFont("Ethiopic",      fontRegularBytes);
    doc.registerFont("Ethiopic-Bold", fontBoldBytes);

    const pdfWidth = 841.89;
    const pdfHeight = 595.28;
    const centerX = pdfWidth / 2;

    // Logo centered at top
    try {
      if (logoBase64) {
        const logoB64Data = logoBase64.split(",")[1] || logoBase64;
        const logoBuf = Buffer.from(logoB64Data, "base64");
        doc.image(logoBuf, centerX - 45, 25, { fit: [90, 90], align: "center" });
      }
    } catch (e) { console.error("Error drawing logo:", e); }

    // Titles
    let cy = 120;
    doc.fillColor(forestGreen).font(ethFont(true)).fontSize(26).text("ፋውንደርስ አካዳሚ", 0, cy, { align: "center", width: pdfWidth });
    cy += 34;
    doc.fillColor(darkGreen).font(latFont(true)).fontSize(18).text("FOUNDERS ACADEMY", 0, cy, { align: "center", width: pdfWidth });
    cy += 28;
    doc.fillColor(forestGreen).font(ethFont(true)).fontSize(22).text("የአጭር ጊዜ ስልጠና የምስክር ወረቀት", 0, cy, { align: "center", width: pdfWidth });
    cy += 30;
    doc.fillColor(darkGreen).font(latFont(true)).fontSize(16).text("CERTIFICATE OF SHORT TERM TRAINING", 0, cy, { align: "center", width: pdfWidth });

    cy += 45; // ~257

    // Triple Pillar Divider
    doc.lineWidth(1).strokeColor(darkGreen);
    doc.moveTo(centerX - 3, cy).lineTo(centerX - 3, cy + 150).stroke();
    doc.moveTo(centerX, cy - 8).lineTo(centerX, cy + 158).stroke();
    doc.moveTo(centerX + 3, cy).lineTo(centerX + 3, cy + 150).stroke();

    // LEFT COLUMN (Amharic)
    const leftX = 60;
    const leftW = 320;
    
    // ለ _____
    doc.fillColor(darkGreen).font(ethFont(true)).fontSize(16).text("ለ", leftX, cy);
    const nameWidth = doc.font(ethFont(true)).fontSize(14).widthOfString(name);
    doc.text(name, leftX + 25 + (295/2) - (nameWidth/2), cy + 2);
    doc.lineWidth(1).moveTo(leftX + 25, cy + 18).lineTo(leftX + leftW, cy + 18).stroke();

    let lcy = cy + 32;
    const amhLine = (txt: string) => {
      doc.fillColor(darkGreen).font(ethFont(true)).fontSize(11.5).text(txt, leftX, lcy, { width: leftW, align: "center" });
      lcy += 24;
    };
    amhLine("በፋውንደርስ አካዳሚ");
    amhLine(`በአጭር ጊዜ ስልጠና ፕሮግራም ለ ${durationAm} ሳምንት`);
    amhLine(`የተሰጠውን የ ${programAm} ሙያ ስልጠና`);
    amhLine("ተከታትለው ስላጠናቀቁ ይህ የምስክር ወረቀት");
    amhLine("ተሰጥቷቸዋል::");

    // RIGHT COLUMN (English)
    const rightX = 460;
    const rightW = 320;
    
    // To _____
    doc.fillColor(darkGreen).font(latFont(true)).fontSize(16).text("To", rightX, cy);
    const name2Width = doc.font(latFont(true)).fontSize(14).widthOfString(actualName2);
    doc.text(actualName2, rightX + 30 + (290/2) - (name2Width/2), cy + 2);
    doc.lineWidth(1).moveTo(rightX + 30, cy + 18).lineTo(rightX + rightW, cy + 18).stroke();

    let rcy = cy + 32;
    const engLine = (txt: string) => {
      doc.fillColor(darkGreen).font(latFont(true)).fontSize(9.5).text(txt, rightX, rcy, { width: rightW, align: "center" });
      rcy += 24;
    };
    engLine("THIS CERTIFICATE IS PROUDLY PRESENTED FOR");
    engLine("SUCCESSFULLY COMPLETING A SHORT-TERM TRAINING");
    engLine(`PROGRAM IN ${programEn.toUpperCase()} AT FOUNDERS ACADEMY.`);
    engLine(`THE TRAINING WAS CONDUCTED FOR ${durationEn} WEEK.`);

    // FOOTER
    let fy = 485;
    
    // Date Left (Use Helvetica-Bold for Latin ASCII digits/slashes in Ethiopian date string so numbers display clearly!)
    doc.fillColor(darkGreen).font(ethFont(true)).fontSize(11).text("ቀን", leftX, fy);
    const ethDate = gregorianToEthiopianString(finishDate);
    const ethDateW = doc.font(latFont(true)).fontSize(11).widthOfString(ethDate);
    doc.fillColor(darkGreen).font(latFont(true)).fontSize(11).text(ethDate, leftX + 28 + (115/2) - (ethDateW/2), fy + 1);
    doc.lineWidth(1).moveTo(leftX + 28, fy + 14).lineTo(leftX + 143, fy + 14).stroke();
    doc.fillColor(darkGreen).font(ethFont(true)).fontSize(11).text("ዓ.ም", leftX + 148, fy);

    // Date Right
    doc.fillColor(darkGreen).font(latFont(true)).fontSize(9.5).text("DATE:", rightX + 130, fy + 1);
    const fDateW = doc.font(latFont(true)).fontSize(10).widthOfString(finishDate);
    doc.font(latFont(true)).text(finishDate, rightX + 170 + (140/2) - (fDateW/2), fy + 1);
    doc.lineWidth(1).moveTo(rightX + 170, fy + 14).lineTo(rightX + 310, fy + 14).stroke();

    // Signature Center
    doc.font(latFont(true)).fontSize(10).text("SIGNED:", centerX - 80, fy);
    doc.lineWidth(1).moveTo(centerX - 30, fy + 13).lineTo(centerX + 80, fy + 13).stroke();

    // Signature and Seal Images
    if (settings.signature_base64) {
      try {
        const b64 = settings.signature_base64.split(",")[1] || settings.signature_base64;
        const sigBuf = Buffer.from(b64, "base64");
        doc.image(sigBuf, centerX - 25, fy - 22, { fit: [90, 35] });
      } catch (e: any) { console.error("Failed to embed sig:", e.message); }
    }

    if (settings.seal_base64) {
      try {
        const b64 = settings.seal_base64.split(",")[1] || settings.seal_base64;
        const sealBuf = Buffer.from(b64, "base64");
        doc.image(sealBuf, centerX - 90, fy - 110, { fit: [180, 180] });
      } catch (e: any) { console.error("Failed to embed seal:", e.message); }
    }

    doc.end();
  });
}


async function checkAndApplyReferralReward(referrerChatId: number) {
  if (!referrerChatId) return;

  try {
    const { data: referrerReg } = await supabase
      .from("registrations")
      .select("*")
      .eq("chat_id", referrerChatId)
      .maybeSingle();

    if (!referrerReg || referrerReg.status === "approved") {
      return;
    }

    const { data: referrals } = await supabase
      .from("registrations")
      .select("*")
      .eq("referred_by_chat_id", referrerChatId);

    if (!referrals) return;

    const approvedReferrals = referrals.filter((r: any) => r.status === "approved");

    if (approvedReferrals.length >= 3) {
      console.log(`[Referral Reward] User ${referrerChatId} has ${approvedReferrals.length} approved referrals. Auto-approving!`);

      const { data: settings } = await supabase.from("admins").select("verification_code").eq("username", "payment_settings").maybeSingle();
      const sDict = settings && settings.verification_code ? JSON.parse(settings.verification_code) : {};
      const channelId = sDict.telegram_channel_id || TELEGRAM_CHANNEL_ID || "-1003789578749";
      const groupId = sDict.telegram_group_id || "-1004377079119";

      // Unban user first in case they were previously banned/expired
      const groupsToUnban = [];
      if (channelId) groupsToUnban.push(channelId);
      if (groupId) groupsToUnban.push(groupId);
      for (const targetId of groupsToUnban) {
        try {
          await sendTelegramRequest("unbanChatMember", {
            chat_id: targetId,
            user_id: referrerReg.chat_id,
            only_if_banned: true
          });
        } catch (unbanErr: any) {
          console.error(`[Unban] Failed to unban referrer ${referrerReg.chat_id} from ${targetId}:`, unbanErr.message);
        }
      }

      // Generate main channel invite link dynamically
      const inviteRes1 = await sendTelegramRequest("createChatInviteLink", {
        chat_id: channelId,
        member_limit: 1,
        name: `Free Referral Link for ${referrerReg.name || 'Student'}`
      });

      let inviteLink2 = "";
      if (groupId) {
        // Generate private group invite link dynamically for group ID
        const inviteRes2 = await sendTelegramRequest("createChatInviteLink", {
          chat_id: groupId,
          member_limit: 1,
          name: `Free Group Link for ${referrerReg.name || 'Student'}`
        });
        
        if (inviteRes2 && inviteRes2.ok) {
          inviteLink2 = inviteRes2.result.invite_link;
        }
      }

      let inviteLink1 = "";
      if (inviteRes1 && inviteRes1.ok) {
        inviteLink1 = inviteRes1.result.invite_link;
      }

      const links: string[] = [];
      if (inviteLink1) links.push(inviteLink1);
      if (inviteLink2) links.push(inviteLink2);

      if (links.length > 0) {
        const combinedInviteLink = links.join(" ");
        const durationDays = parseInt(sDict.access_duration_days) || 30;
        const expiresAt = new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString();

        await supabase
          .from("registrations")
          .update({ status: "approved", invite_link: combinedInviteLink, expires_at: expiresAt })
          .eq("id", referrerReg.id);

        const [lang] = getLangAndStep(referrerReg);
        const formattedLinks = formatInviteLinksForUser(combinedInviteLink, lang);
        const msg = getMsg(lang, "referral_reward_msg")
          .replace("{name}", referrerReg.name || (lang === "am" ? "ተማሪ" : "Student"))
          .replace("{link}", formattedLinks);

        await sendTelegramRequest("sendMessage", {
          chat_id: referrerChatId,
          text: msg,
          parse_mode: "Markdown",
          reply_markup: await getMenuKeyboard(lang, referrerChatId)
        });
      }
    }
  } catch (e: any) {
    console.error("Error in checkAndApplyReferralReward:", e.message);
  }
}

async function verifyJwt(token: string, secretStr: string): Promise<any> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const sigBytes = base64UrlToBytes(signatureB64);
    
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secretStr),
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["verify"]
    );
    
    const dataBytes = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes as any, dataBytes as any);
    if (!isValid) return null;
    
    const payloadJson = new TextDecoder().decode(base64UrlToBytes(payloadB64));
    const payload = JSON.parse(payloadJson);
    
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    return payload;
  } catch (_err) {
    return null;
  }
}

function base64UrlToBytes(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Oak-like lightweight routing and request processing
async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    await supabase.from("admins").upsert({ username: "telegram_bot_token", password: TELEGRAM_TOKEN });
  } catch (err) {
    console.error("Failed to store bot token in database:", (err as any).message);
  }

  await loadDbTranslations();

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/?/, "").replace(/^\/functions\/v1\/api\/?/, "");

  try {
    // --- CRON JOB FOR DAILY QUIZ & EXPIRATION CLEANUP ---
    if (path === "cron/send_daily_quiz" || path.endsWith("/cron/send_daily_quiz")) {
      console.log("[Cron] Running Deno Edge Function cron job...");
      
      const isTest1Min = url.searchParams.get("interval") === "1m" || Deno.env.get("CRON_INTERVAL") === "1m";
      if (isTest1Min) {
        console.log("[Cron] Running in 1-minute interval testing mode.");
      }
      
      // 1. Process expired registrations
      try {
        const { data: expiredRegs } = await supabase
          .from("registrations")
          .select("*")
          .eq("status", "approved")
          .lt("expires_at", new Date().toISOString());
          
        if (expiredRegs && expiredRegs.length > 0) {
          console.log(`[Cron] Found ${expiredRegs.length} expired registrations.`);
          for (const r of expiredRegs) {
            console.log(`[Cron] Access expired for user ${r.chat_id}. Kicking...`);
            await removeUserFromChannel(r.chat_id);
            await supabase.from("registrations").update({ status: "expired" }).eq("id", r.id);
          }
        }
      } catch (err: any) {
        console.error("[Cron] Error processing expired registrations:", err.message);
      }
      
      // 2. Process daily quiz for approved users
      try {
        const { data: regs } = await supabase
          .from("registrations")
          .select("*")
          .eq("status", "approved");
          
        if (regs && regs.length > 0) {
          const { data: maxQ } = await supabase.from("questions").select("day_number").order("day_number", { ascending: false }).limit(1).maybeSingle();
          const maxQuizDay = maxQ ? maxQ.day_number : 10;
          
          for (const r of regs) {
            const chatId = r.chat_id;
            
            // Get or create quiz progress
            let { data: prog } = await supabase.from("user_quiz_progress").select("*").eq("chat_id", chatId).maybeSingle();
            if (!prog) {
              const { data: newProg } = await supabase.from("user_quiz_progress").insert({
                chat_id: chatId,
                current_day: 1,
                current_question_index: 0,
                joined_channel: true
              }).select().single();
              prog = newProg;
            }
            
            if (prog && !prog.is_completed) {
              // Calculate allowed day since registration
              const msDiff = Date.now() - new Date(r.created_at).getTime();
              const daysSinceReg = isTest1Min 
                ? Math.floor(msDiff / (60 * 1000)) + 1 
                : Math.floor(msDiff / (24 * 3600 * 1000)) + 1;
              const maxAllowedDay = Math.min(maxQuizDay, daysSinceReg);
              
              const day = prog.current_day || 1;
              const qIndex = prog.current_question_index || 0;
              
              // Load questions for the current day
              const { data: questions } = await supabase.from("questions").select("*").eq("day_number", day).order("created_at", { ascending: true });
              const dayQuestions = questions || [];
              
              if (day < maxAllowedDay && qIndex >= dayQuestions.length) {
                // A new day is unlocked! Advance to next day.
                await supabase.from("user_quiz_progress").update({
                  current_day: day + 1,
                  current_question_index: 0,
                  last_completed_at: new Date().toISOString()
                }).eq("chat_id", chatId);
                await sendNextQuizQuestion(chatId, isTest1Min);
              } else if (qIndex < dayQuestions.length) {
                // User hasn't finished the questions of their current day.
                // Send them a reminder (current question) only if it's been >= 24 hours since last_completed_at (or if last_completed_at is null)
                const lastCompletedStr = prog.last_completed_at;
                const limit = isTest1Min ? 60 * 1000 : 24 * 3600 * 1000;
                const shouldSend = !lastCompletedStr || (Date.now() - new Date(lastCompletedStr).getTime() >= limit);
                
                if (shouldSend) {
                  await supabase.from("user_quiz_progress").update({
                    last_completed_at: new Date().toISOString()
                  }).eq("chat_id", chatId);
                  await sendNextQuizQuestion(chatId, isTest1Min);
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.error("[Cron] Error processing daily quiz:", err.message);
      }
      
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- TELEGRAM BOT WEBHOOK ---
    if (path === "bot") {
      if (req.method !== "POST") {
        return new Response("Send a POST request to this endpoint.", { headers: corsHeaders });
      }
      let update;
      try {
        update = await req.json();
      } catch (err) {
        return new Response("Invalid JSON input.", { headers: corsHeaders });
      }

      if (update.chat_member) {
        const chatMember = update.chat_member;
        const newStatus = chatMember.new_chat_member ? chatMember.new_chat_member.status : null;
        if (["member", "administrator", "creator"].includes(newStatus)) {
          const userId = chatMember.from ? chatMember.from.id : null;
          if (userId) {
            const { data: prog } = await supabase.from("user_quiz_progress").select("*").eq("chat_id", userId).maybeSingle();
            if (!prog) {
              await supabase.from("user_quiz_progress").insert({
                chat_id: userId,
                joined_channel: true,
                current_day: 1,
                current_question_index: 0
              });
              await sendNextQuizQuestion(userId);
            }
          }
        }
        return new Response("OK", { headers: corsHeaders });
      }

      if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const callbackData = callbackQuery.data || "";
        const callbackQueryId = callbackQuery.id;
        const adminChatId = callbackQuery.message.chat.id;
        const adminMessageId = callbackQuery.message.message_id;

        if (callbackData.startsWith("approve:") || callbackData.startsWith("decline:")) {
          const isApprove = callbackData.startsWith("approve:");
          const regId = callbackData.split(":")[1];
          
          await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId });
          await sendTelegramRequest("editMessageReplyMarkup", {
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            reply_markup: { inline_keyboard: [] }
          });
          
          const { data: reg } = await supabase.from("registrations").select("*").eq("id", regId).maybeSingle();
          if (!reg) {
            return new Response("OK", { headers: corsHeaders });
          }
          
          const [lang] = getLangAndStep(reg);
          
          if (isApprove) {
            const { data: settings } = await supabase.from("admins").select("verification_code").eq("username", "payment_settings").maybeSingle();
            const sDict = settings && settings.verification_code ? JSON.parse(settings.verification_code) : {};
            const channelId = sDict.telegram_channel_id || TELEGRAM_CHANNEL_ID || "-1003789578749";
            const groupId = sDict.telegram_group_id || "-1004377079119";

            // Unban user first in case they were previously banned/expired
            const groupsToUnban = [];
            if (channelId) groupsToUnban.push(channelId);
            if (groupId) groupsToUnban.push(groupId);
            for (const targetId of groupsToUnban) {
              try {
                await sendTelegramRequest("unbanChatMember", {
                  chat_id: targetId,
                  user_id: reg.chat_id,
                  only_if_banned: true
                });
              } catch (unbanErr: any) {
                console.error(`[Unban] Failed to unban user ${reg.chat_id} from ${targetId}:`, unbanErr.message);
              }
            }

            const inviteRes1 = await sendTelegramRequest("createChatInviteLink", {
              chat_id: channelId,
              member_limit: 1,
              name: `Main Link for ${reg.name || 'Student'}`
            });

            let inviteRes2 = null;
            if (groupId) {
              inviteRes2 = await sendTelegramRequest("createChatInviteLink", {
                chat_id: groupId,
                member_limit: 1,
                name: `Group Link for ${reg.name || 'Student'}`
              });
            }
            
            let inviteLink1 = "";
            if (inviteRes1 && inviteRes1.ok) {
              inviteLink1 = inviteRes1.result.invite_link;
            }
            let inviteLink2 = "";
            if (inviteRes2 && inviteRes2.ok) {
              inviteLink2 = inviteRes2.result.invite_link;
            }

            const links: string[] = [];
            if (inviteLink1) links.push(inviteLink1);
            if (inviteLink2) links.push(inviteLink2);
            
            if (links.length > 0) {
              const combinedInviteLink = links.join(" ");
              const durationDays = parseInt(sDict.access_duration_days) || 30;
              const expiresAt = new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString();
              
              await supabase.from("registrations").update({ 
                status: "approved", 
                invite_link: combinedInviteLink,
                expires_at: expiresAt
              }).eq("id", regId);
              
              if (reg.referred_by_chat_id) {
                await checkAndApplyReferralReward(reg.referred_by_chat_id);
              }
              
              const formattedLinks = formatInviteLinksForUser(combinedInviteLink, lang);
              const msg = getMsg(lang, "receipt_approved_msg")
                .replace("{name}", reg.name)
                .replace("{receipt}", reg.receipt_number)
                .replace("{link}", formattedLinks);
              
              await sendTelegramRequest("sendMessage", {
                chat_id: reg.chat_id,
                text: msg,
                parse_mode: "Markdown",
                reply_markup: await getMenuKeyboard(lang, reg.chat_id)
              });
            }
          } else {
            const reason = "Details do not match our records.";
            await supabase.from("registrations").update({ status: "declined", rejection_reason: reason }).eq("id", regId);
            
            const msg = getMsg(lang, "receipt_declined_msg")
                .replace("{name}", reg.name)
                .replace("{receipt}", reg.receipt_number)
                .replace("{reason}", reason);
            
            await sendTelegramRequest("sendMessage", {
              chat_id: reg.chat_id,
              text: msg,
              parse_mode: "Markdown",
              reply_markup: await getMenuKeyboard(lang, reg.chat_id)
            });
          }
          return new Response("OK", { headers: corsHeaders });
        }

        if (callbackData.startsWith("lang:")) {
          const lang = callbackData.split(":")[1];
          const chatId = callbackQuery.message.chat.id;

          await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId });
          await sendTelegramRequest("editMessageReplyMarkup", {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: { inline_keyboard: [] }
          });

          const { data: reg } = await supabase.from("registrations").select("*").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(1).maybeSingle();
          if (!reg) {
            await supabase.from("registrations").insert({
              chat_id: chatId,
              step: buildStep(lang, "awaiting_name"),
              status: "started",
              name: "",
              name2: "",
              phone: "",
              receipt_number: ""
            });
            await sendTelegramRequest("sendMessage", {
              chat_id: chatId,
              text: getMsg(lang, "ask_name"),
              parse_mode: "Markdown",
              reply_markup: await getMenuKeyboard(lang, chatId)
            });
          } else {
            const status = reg.status;
            const [, currentStep] = getLangAndStep(reg);

            await supabase.from("registrations").update({ step: buildStep(lang, currentStep) }).eq("id", reg.id);

            if (currentStep.includes("completed") || ["approved", "pending"].includes(status)) {
              await sendTelegramRequest("sendMessage", {
                chat_id: chatId,
                text: getMsg(lang, "already_registered"),
                reply_markup: await getMenuKeyboard(lang, chatId)
              });
            } else if (currentStep === "start") {
              await supabase.from("registrations").update({ step: buildStep(lang, "awaiting_name") }).eq("id", reg.id);
              await sendTelegramRequest("sendMessage", {
                chat_id: chatId,
                text: getMsg(lang, "ask_name"),
                parse_mode: "Markdown",
                reply_markup: await getMenuKeyboard(lang, chatId)
              });
            } else {
              // Ask them standard steps
              if (currentStep === "awaiting_name" || currentStep === "awaiting_name2") {
                await sendTelegramRequest("sendMessage", { chat_id: chatId, text: getMsg(lang, "ask_name"), parse_mode: "Markdown", reply_markup: await getMenuKeyboard(lang, chatId) });
              } else if (currentStep === "awaiting_phone") {
                const keyboard = {
                  keyboard: [[{ text: getMsg(lang, "btn_share_contact"), request_contact: true }]],
                  one_time_keyboard: true,
                  resize_keyboard: true
                };
                await sendTelegramRequest("sendMessage", { chat_id: chatId, text: getMsg(lang, "ask_phone"), parse_mode: "Markdown", reply_markup: keyboard });
              } else if (currentStep === "awaiting_payment_method") {
                const msg = getMsg(lang, "ask_payment_method");
                const kb = {
                  inline_keyboard: [
                    [{ text: getMsg(lang, "btn_telebirr"), callback_data: "pay_telebirr" }, { text: getMsg(lang, "btn_cbe"), callback_data: "pay_cbe" }],
                    [{ text: getMsg(lang, "btn_abyssinia"), callback_data: "pay_abyssinia" }]
                  ]
                };
                await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, reply_markup: kb });
              } else if (currentStep.startsWith("awaiting_receipt")) {
                const { data: settings } = await supabase.from("admins").select("verification_code").eq("username", "payment_settings").maybeSingle();
                const sDict = settings && settings.verification_code ? JSON.parse(settings.verification_code) : {};
                const amount = sDict.amount || "500";
                let msg;
                if (currentStep.includes("telebirr")) {
                  msg = getMsg(lang, "telebirr_payment_instructions").replace("{amount}", amount).replace("{acc_name}", sDict.telebirr_name || "").replace("{acc_num}", sDict.telebirr_number || "");
                } else if (currentStep.includes("abyssinia")) {
                  msg = getMsg(lang, "abyssinia_payment_instructions").replace("{amount}", amount).replace("{acc_name}", sDict.abyssinia_name || "").replace("{acc_num}", sDict.abyssinia_number || "");
                } else {
                  msg = getMsg(lang, "cbe_payment_instructions").replace("{amount}", amount).replace("{acc_name}", sDict.cbe_name || "").replace("{acc_num}", sDict.cbe_number || "");
                }
                await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, parse_mode: "Markdown" });
              }
            }
          }
          return new Response("OK", { headers: corsHeaders });
        }

        if (callbackData.startsWith("ans:")) {
          const [, qId, optIdxStr] = callbackData.split(":");
          const optIdx = parseInt(optIdxStr);
          const chatId = callbackQuery.message.chat.id;

          const { data: prog } = await supabase.from("user_quiz_progress").select("*").eq("chat_id", chatId).maybeSingle();
          if (!prog) {
            await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: "Session expired." });
            return new Response("OK", { headers: corsHeaders });
          }

          const day = prog.current_day || 1;
          const qIndex = prog.current_question_index || 0;
          const { data: questions } = await supabase.from("questions").select("*").eq("day_number", day).order("created_at", { ascending: true });

          if (!questions || qIndex >= questions.length || questions[qIndex].id !== qId) {
            await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: "Question expired or already answered." });
            return new Response("OK", { headers: corsHeaders });
          }

          const q = questions[qIndex];
          const isCorrect = optIdx === q.correct_option_index;

          if (isCorrect) {
            await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: "Correct! ✅", show_alert: true });
            await supabase.from("user_quiz_progress").update({ current_question_index: qIndex + 1 }).eq("chat_id", chatId);

            await sendTelegramRequest("editMessageReplyMarkup", {
              chat_id: chatId,
              message_id: callbackQuery.message.message_id,
              reply_markup: { inline_keyboard: [] }
            });

            await sendNextQuizQuestion(chatId);
          } else {
            await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: "Incorrect! Try again ❌", show_alert: true });
          }
          return new Response("OK", { headers: corsHeaders });
        }

        if (callbackData.startsWith("start_day:")) {
          const targetDay = parseInt(callbackData.split(":")[1]);
          const chatId = callbackQuery.message.chat.id;

          const { data: prog } = await supabase.from("user_quiz_progress").select("*").eq("chat_id", chatId).maybeSingle();
          if (!prog) return new Response("OK", { headers: corsHeaders });

          const lastCompleted = prog.last_completed_at;
          if (lastCompleted) {
            const lastDt = new Date(lastCompleted);
            const now = new Date();
            if (lastDt.toDateString() === now.toDateString()) {
              await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId, text: `Please wait until tomorrow to start the next day!`, show_alert: true });
              return new Response("OK", { headers: corsHeaders });
            }
          }

          await supabase.from("user_quiz_progress").update({ current_day: targetDay, current_question_index: 0 }).eq("chat_id", chatId);
          await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId });

          await sendTelegramRequest("editMessageReplyMarkup", {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: { inline_keyboard: [] }
          });
          await sendNextQuizQuestion(chatId);
          return new Response("OK", { headers: corsHeaders });
        }

        if (["pay_telebirr", "pay_cbe", "pay_abyssinia"].includes(callbackData)) {
          const chatId = callbackQuery.message.chat.id;
          await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId });

          await sendTelegramRequest("editMessageReplyMarkup", {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: { inline_keyboard: [] }
          });

          const { data: reg } = await supabase.from("registrations").select("*").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(1).maybeSingle();
          if (reg && reg.step.includes("awaiting_payment_method")) {
            const [lang] = getLangAndStep(reg);
            const { data: settings } = await supabase.from("admins").select("verification_code").eq("username", "payment_settings").maybeSingle();
            const sDict = settings && settings.verification_code ? JSON.parse(settings.verification_code) : {};
            const amount = sDict.amount || "500";

            let msg;
            if (callbackData === "pay_telebirr") {
              msg = getMsg(lang, "telebirr_payment_instructions").replace("{amount}", amount).replace("{acc_name}", sDict.telebirr_name || "").replace("{acc_num}", sDict.telebirr_number || "");
              await supabase.from("registrations").update({ step: buildStep(lang, "awaiting_receipt_telebirr") }).eq("id", reg.id);
            } else if (callbackData === "pay_abyssinia") {
              msg = getMsg(lang, "abyssinia_payment_instructions").replace("{amount}", amount).replace("{acc_name}", sDict.abyssinia_name || "").replace("{acc_num}", sDict.abyssinia_number || "");
              await supabase.from("registrations").update({ step: buildStep(lang, "awaiting_receipt_abyssinia") }).eq("id", reg.id);
            } else {
              msg = getMsg(lang, "cbe_payment_instructions").replace("{amount}", amount).replace("{acc_name}", sDict.cbe_name || "").replace("{acc_num}", sDict.cbe_number || "");
              await supabase.from("registrations").update({ step: buildStep(lang, "awaiting_receipt_cbe") }).eq("id", reg.id);
            }

            await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, parse_mode: "Markdown" });
          }
          return new Response("OK", { headers: corsHeaders });
        }

        if (callbackData === "get_certificate") {
          const chatId = callbackQuery.message.chat.id;
          await sendTelegramRequest("answerCallbackQuery", { callback_query_id: callbackQueryId });

          await sendTelegramRequest("editMessageReplyMarkup", {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: { inline_keyboard: [] }
          });

          const { data: reg } = await supabase.from("registrations").select("*").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(1).maybeSingle();
          const { data: prog } = await supabase.from("user_quiz_progress").select("is_completed").eq("chat_id", chatId).maybeSingle();
          
          const isApproved = reg && reg.status === "approved";
          const isCompleted = prog && prog.is_completed;

          if (!isCompleted && !isApproved) {
            const [lang] = getLangAndStep(reg);
            await sendTelegramRequest("sendMessage", {
              chat_id: chatId,
              text: getMsg(lang, "quiz_not_completed")
            });
            return new Response("OK", { headers: corsHeaders });
          }

          const { data: reg } = await supabase.from("registrations").select("*").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(1).maybeSingle();
          const [lang] = getLangAndStep(reg);
          const name = reg ? (reg.name || "Student") : "Student";
          const name2 = reg ? (reg.name2 || name) : name;
          const regDateStr = reg ? (reg.created_at || "") : "";

          let regDate = "Unknown";
          if (regDateStr) {
            regDate = regDateStr.split("T")[0];
          }
          const finishDate = new Date(new Date().getTime() + 3 * 3600000).toISOString().split("T")[0];

          const pdfBytes = await generateCertificatePdf(name, regDate, finishDate, name2);

          const form = new FormData();
          form.append("chat_id", String(chatId));
          form.append("caption", getMsg(lang, "certificate_caption").replace("{name}", name));
          form.append("parse_mode", "Markdown");
          
          const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
          form.append("document", blob, "Certificate.pdf");

          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
            method: "POST",
            body: form
          });
          await removeUserFromChannel(chatId);
          return new Response("OK", { headers: corsHeaders });
        }
      }

      if (!update.message) return new Response("OK", { headers: corsHeaders });

      const message = update.message;
      const chatId = message.chat.id;
      const text = (message.text || "").trim();
      const contact = message.contact;

      // Admin linkage authentication interceptor
      if (text.toLowerCase().startsWith("/auth")) {
        const parts = text.split(/\s+/);
        if (parts.length === 4) {
          const authUser = parts[1];
          const authPass = parts[2];
          const authCode = parts[3].trim().toUpperCase();

          const { data: adminRec } = await supabase.from("admins").select("*").eq("username", authUser).maybeSingle();
          if (adminRec && adminRec.password === authPass) {
            const savedCode = adminRec.verification_code ? adminRec.verification_code.trim().toUpperCase() : null;
            const expiryStr = adminRec.code_expires_at;

            if (savedCode && savedCode === authCode) {
              const now = new Date();
              const expiry = expiryStr ? new Date(expiryStr) : null;
              if (!expiry || now <= expiry) {
                // Success! Link chat
                await supabase.from("admins").update({ 
                  telegram_chat_id: chatId,
                  verification_code: null,
                  code_expires_at: null
                }).eq("username", authUser);

                await sendTelegramRequest("sendMessage", {
                  chat_id: chatId,
                  text: (
                    `✅ **Authentication & Linkage Successful!**\n\n` +
                    `Your Telegram account (Chat ID: \`${chatId}\`) has been linked to the admin account **${authUser}**.\n\n` +
                    `You will now receive login verification codes and webhook notifications here.`
                  ),
                  parse_mode: "Markdown"
                });
                return new Response("OK", { headers: corsHeaders });
              } else {
                await sendTelegramRequest("sendMessage", {
                  chat_id: chatId,
                  text: `❌ **Authentication Failed**: The verification code has expired. Please generate a new one from the admin panel.`
                });
                return new Response("OK", { headers: corsHeaders });
              }
            } else {
              await sendTelegramRequest("sendMessage", {
                chat_id: chatId,
                text: `❌ **Authentication Failed**: Invalid verification code.`
              });
              return new Response("OK", { headers: corsHeaders });
            }
          } else {
            await sendTelegramRequest("sendMessage", {
              chat_id: chatId,
              text: `❌ **Authentication Failed**: Invalid username or password.`
            });
            return new Response("OK", { headers: corsHeaders });
          }
        } else {
          await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: `ℹ️ **Usage**: Send \`/auth <username> <password> <link-code>\` to link your admin account.`
          });
          return new Response("OK", { headers: corsHeaders });
        }
      }

      const { data: reg } = await supabase.from("registrations").select("*").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (reg && reg.status === "approved" && reg.expires_at) {
        const now = new Date();
        const expiry = new Date(reg.expires_at);
        if (now > expiry) {
          console.log(`[Expiration Trigger] User ${chatId} has expired. Expiry: ${reg.expires_at}`);
          await supabase.from("registrations").update({ status: "expired" }).eq("id", reg.id);
          await removeUserFromChannel(chatId);
          const [lang] = getLangAndStep(reg);
          const msg = getMsg(lang, "access_expired_msg");
          await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg });
          return new Response("OK", { headers: corsHeaders });
        }
      }
      const [lang, currentStep] = getLangAndStep(reg);

      if (isMenuCommand(text, "menu_customer_support") || text === "/support" || text.includes("Customer Support") || text.includes("የደንበኞች ድጋፍ") || text.includes("Deggersa") || text.includes("ሓገዝ")) {
        const msg = getMsg(lang, "customer_support_msg");
        await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, parse_mode: "Markdown", reply_markup: await getMenuKeyboard(lang, chatId) });
        return new Response("OK", { headers: corsHeaders });
      }

      if (isMenuCommand(text, "menu_change_language") || text === "/language") {
        const msg = getMsg(lang, "welcome_choose_lang");
        await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, reply_markup: await getLanguageKeyboard() });
        return new Response("OK", { headers: corsHeaders });
      }

      if (isMenuCommand(text, "menu_refer_friend") || text === "/refer") {
        const refLink = `https://t.me/FoundersAcademyBot?start=ref_${chatId}`;
        const msg = getMsg(lang, "referral_message").replace("{ref_link}", refLink);
        await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, parse_mode: "Markdown", reply_markup: await getMenuKeyboard(lang, chatId) });
        return new Response("OK", { headers: corsHeaders });
      }

      if (isMenuCommand(text, "menu_get_certificate")) {
        const { data: prog } = await supabase.from("user_quiz_progress").select("is_completed").eq("chat_id", chatId).maybeSingle();
        if (!prog || !prog.is_completed) {
          await sendTelegramRequest("sendMessage", {
            chat_id: chatId,
            text: getMsg(lang, "quiz_not_completed")
          });
          return new Response("OK", { headers: corsHeaders });
        }

        const name = reg ? (reg.name || "Student") : "Student";
        const name2 = reg ? (reg.name2 || name) : name;
        const regDateStr = reg ? (reg.created_at || "") : "";
        let regDate = "Unknown";
        if (regDateStr) regDate = regDateStr.split("T")[0];
        const finishDate = new Date(new Date().getTime() + 3 * 3600000).toISOString().split("T")[0];

        try {
          const pdfBytes = await generateCertificatePdf(name, regDate, finishDate, name2);
          const form = new FormData();
          form.append("chat_id", String(chatId));
          form.append("caption", getMsg(lang, "certificate_caption").replace("{name}", name));
          form.append("parse_mode", "Markdown");
          const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
          form.append("document", blob, "Certificate.pdf");
          await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
            method: "POST",
            body: form
          });
          await removeUserFromChannel(chatId);
        } catch (err: any) {
          console.error("Error generating menu certificate:", err.message);
        }
        return new Response("OK", { headers: corsHeaders });
      }

      if (isMenuCommand(text, "menu_check_status") || text === "/status") {
        if (!reg || ((!reg.step || !reg.step.includes("completed")) && !["approved", "pending", "declined"].includes(reg.status))) {
          await sendTelegramRequest("sendMessage", { chat_id: chatId, text: getMsg(lang, "no_receipt_yet"), reply_markup: await getMenuKeyboard(lang, chatId) });
          return new Response("OK", { headers: corsHeaders });
        }

        const status = reg.status || "pending";
        const receipt = reg.receipt_number || "Unknown";
        let msg;
        if (status === "approved") {
          msg = getMsg(lang, "status_approved_msg").replace("{receipt}", receipt).replace("{link}", reg.invite_link || "");
        } else if (status === "declined") {
          msg = getMsg(lang, "status_declined_msg").replace("{receipt}", receipt).replace("{reason}", reg.rejection_reason || getMsg(lang, "default_decline_reason"));
        } else {
          msg = getMsg(lang, "status_pending_msg").replace("{receipt}", receipt);
        }

        await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, parse_mode: "Markdown", reply_markup: await getMenuKeyboard(lang, chatId) });
        return new Response("OK", { headers: corsHeaders });
      }

      if (text === "/help") {
        await sendTelegramRequest("sendMessage", { chat_id: chatId, text: getMsg(lang, "help_instructions"), parse_mode: "Markdown", reply_markup: await getMenuKeyboard(lang, chatId) });
        return new Response("OK", { headers: corsHeaders });
      }

      // /start handling
      if (text.startsWith("/start") || isMenuCommand(text, "menu_submit_receipt") || text === "/submit") {
        if (reg) {
          const status = reg.status;
          if (isMenuCommand(text, "menu_submit_receipt") || text === "/submit") {
            const { data: prog } = await supabase.from("user_quiz_progress").select("is_completed").eq("chat_id", chatId).maybeSingle();
            const isCompleted = prog && prog.is_completed;

            if (status === "declined" || (status === "approved" && isCompleted)) {
              await supabase.from("registrations").insert({
                chat_id: chatId,
                name: reg.name,
                phone: reg.phone,
                step: buildStep(lang, "awaiting_payment_method"),
                status: "started"
              });
              await supabase.from("user_quiz_progress").update({
                is_completed: false,
                current_day: 1,
                current_question_index: 0,
                last_completed_at: null
              }).eq("chat_id", chatId);

              const msg = getMsg(lang, "ready_new_receipt");
              const kb = {
                inline_keyboard: [
                  [{ text: getMsg(lang, "btn_telebirr"), callback_data: "pay_telebirr" }, { text: getMsg(lang, "btn_cbe"), callback_data: "pay_cbe" }],
                  [{ text: getMsg(lang, "btn_abyssinia"), callback_data: "pay_abyssinia" }]
                ]
              };
              await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, reply_markup: kb });
              return new Response("OK", { headers: corsHeaders });
            } else if (status === "approved" && !isCompleted) {
              await sendTelegramRequest("sendMessage", { chat_id: chatId, text: getMsg(lang, "already_registered"), reply_markup: await getMenuKeyboard(lang, chatId) });
              return new Response("OK", { headers: corsHeaders });
            } else if (status === "pending") {
              await sendTelegramRequest("sendMessage", { chat_id: chatId, text: getMsg(lang, "already_pending") });
              return new Response("OK", { headers: corsHeaders });
            }
          } else if (text.startsWith("/start")) {
            if (reg.step.includes("completed") || ["approved", "pending"].includes(status)) {
              await sendTelegramRequest("sendMessage", { chat_id: chatId, text: getMsg(lang, "already_registered"), reply_markup: await getMenuKeyboard(lang, chatId) });
              return new Response("OK", { headers: corsHeaders });
            }
          }
        }

        let referredBy: number | null = null;
        const parts = text.split(" ");
        if (parts.length > 1 && parts[1].startsWith("ref_")) {
          try {
            referredBy = parseInt(parts[1].replace("ref_", ""));
          } catch (_e) {
            // ignore
          }
        }

        await supabase.from("registrations").insert({
          chat_id: chatId,
          step: "start",
          status: "started",
          referred_by_chat_id: referredBy
        });

        await sendTelegramRequest("sendMessage", { chat_id: chatId, text: getMsg("en", "welcome_choose_lang"), reply_markup: await getLanguageKeyboard() });
        return new Response("OK", { headers: corsHeaders });
      }

      if (!reg) {
        await sendTelegramRequest("sendMessage", { chat_id: chatId, text: getMsg(lang, "no_receipt_yet") });
        return new Response("OK", { headers: corsHeaders });
      }

      if (currentStep === "awaiting_name" || currentStep === "awaiting_name2") {
        if (!text) {
          await sendTelegramRequest("sendMessage", { chat_id: chatId, text: getMsg(lang, "invalid_name") });
          return new Response("OK", { headers: corsHeaders });
        }

        if (reg && reg.phone && reg.phone.trim() !== "") {
          await supabase.from("registrations").update({ name: text, name2: text, step: buildStep(lang, "awaiting_payment_method") }).eq("id", reg.id);

          let settings: any = {};
          try {
            const { data: adminRec } = await supabase.from("admins").select("verification_code").eq("username", "payment_settings").maybeSingle();
            if (adminRec && adminRec.verification_code) settings = JSON.parse(adminRec.verification_code);
          } catch (_e) {}

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
          await sendTelegramRequest("sendMessage", { chat_id: chatId, text: courseDesc, parse_mode: "Markdown", reply_markup: kb });
          return new Response("OK", { headers: corsHeaders });
        }

        await supabase.from("registrations").update({ name: text, name2: text, step: buildStep(lang, "awaiting_phone") }).eq("id", reg.id);
        const keyboard = {
          keyboard: [[{ text: getMsg(lang, "btn_share_contact"), request_contact: true }]],
          one_time_keyboard: true,
          resize_keyboard: true
        };
        const welcome = getMsg(lang, "welcome_name_prefix").replace("{name}", text);
        await sendTelegramRequest("sendMessage", { chat_id: chatId, text: welcome + getMsg(lang, "ask_phone"), parse_mode: "Markdown", reply_markup: keyboard });
        return new Response("OK", { headers: corsHeaders });
      }

      if (currentStep === "awaiting_phone") {
        let phone = contact ? contact.phone_number : (text ? text : null);
        if (!phone) {
          await sendTelegramRequest("sendMessage", { chat_id: chatId, text: getMsg(lang, "invalid_phone") });
          return new Response("OK", { headers: corsHeaders });
        }

        const { data: existing } = await supabase.from("registrations").select("*").eq("phone", phone).maybeSingle();
        if (existing && existing.chat_id !== chatId) {
          await sendTelegramRequest("sendMessage", { chat_id: chatId, text: getMsg(lang, "duplicate_phone") });
          return new Response("OK", { headers: corsHeaders });
        }

        await supabase.from("registrations").update({ phone: phone, step: buildStep(lang, "awaiting_payment_method") }).eq("id", reg.id);

        let settings: any = {};
        try {
          const { data: adminRec } = await supabase.from("admins").select("verification_code").eq("username", "payment_settings").maybeSingle();
          if (adminRec && adminRec.verification_code) settings = JSON.parse(adminRec.verification_code);
        } catch (_e) {}

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
        await sendTelegramRequest("sendMessage", { chat_id: chatId, text: courseDesc, parse_mode: "Markdown", reply_markup: kb });
        await sendTelegramRequest("sendMessage", { chat_id: chatId, text: "👇 " + getMsg(lang, "select_payment_method_first"), reply_markup: await getMenuKeyboard(lang, chatId) });
        return new Response("OK", { headers: corsHeaders });
      }

      if (currentStep === "awaiting_payment_method") {
        await sendTelegramRequest("sendMessage", { chat_id: chatId, text: getMsg(lang, "select_payment_method_first") });
        return new Response("OK", { headers: corsHeaders });
      }

      if (currentStep && currentStep.startsWith("awaiting_receipt")) {
        const photo = message.photo;
        const caption = (message.caption || "").trim();

        let receiptNum = text;
        let receiptImg = null;
        let telegramFileId = null;

        if (photo || message.photo_url) {
          if (message.photo_url) {
            receiptImg = message.photo_url;
            receiptNum = caption || `Sim_REC_${Math.floor(Date.now() / 1000)}`;
          } else {
            const fileId = photo[photo.length - 1].file_id;
            telegramFileId = fileId;
            const fileInfo = await sendTelegramRequest("getFile", { file_id: fileId });
            if (fileInfo && fileInfo.ok) {
              const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileInfo.result.file_path}`;
              const imgRes = await fetch(downloadUrl);
              if (imgRes.ok) {
                const fileBytes = new Uint8Array(await imgRes.arrayBuffer());
                const fileName = `${chatId}_${Math.floor(Date.now() / 1000)}.jpg`;

                const uploadUrl = `${SUPABASE_URL}/storage/v1/object/receipts/${fileName}`;
                const upRes = await fetch(uploadUrl, {
                  method: "POST",
                  headers: {
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    "Content-Type": "image/jpeg"
                  },
                  body: fileBytes
                });

                if (upRes.ok) {
                  receiptImg = `${SUPABASE_URL}/storage/v1/object/public/receipts/${fileName}`;
                  receiptNum = caption || `Img_${Math.floor(Date.now() / 1000)}`;
                } else {
                  console.error("Supabase Storage upload failed. Ensure 'receipts' bucket exists and is public.");
                  receiptNum = caption || `Img_${Math.floor(Date.now() / 1000)}`;
                }
              }
            }
          }
        }

        if (!photo && !message.photo_url) {
          const errMsg = lang === "en" ? "Please upload a screenshot/image of your receipt instead of typing text." : "እባክዎ ከመፃፍ ይልቅ የደረሰኝዎን ፎቶ/ቅጂ ይላኩ።";
          await sendTelegramRequest("sendMessage", { chat_id: chatId, text: errMsg });
          return new Response("OK", { headers: corsHeaders });
        }

        const paymentMethod = currentStep.includes("telebirr") ? "Telebirr" : (currentStep.includes("cbe") ? "CBE" : (currentStep.includes("abyssinia") ? "Abyssinia Bank" : "Unknown"));
        await supabase.from("registrations").update({
          receipt_number: receiptNum,
          receipt_image_url: receiptImg,
          payment_method: paymentMethod,
          step: buildStep(lang, "completed"),
          status: "pending"
        }).eq("id", reg.id);

        if (reg.referred_by_chat_id) {
          await checkAndApplyReferralReward(reg.referred_by_chat_id);
        }

        await sendTelegramRequest("sendMessage", { chat_id: chatId, text: getMsg(lang, "registration_submitted"), parse_mode: "Markdown", reply_markup: await getMenuKeyboard(lang, chatId) });

        // Notify Admin
        const { data: adminRec } = await supabase.from("admins").select("telegram_chat_id").eq("username", ADMIN_USERNAME).maybeSingle();
        const adminChat = adminRec ? adminRec.telegram_chat_id : (ADMIN_CHAT_ID || null);

        if (adminChat) {
          const captionText = `🔔 **New Receipt Submitted!**\n\n👤 **Name**: ${reg.name}\n📞 **Phone**: ${reg.phone}\n💳 **Payment**: ${paymentMethod}\n🧾 **Receipt**: \`${receiptNum}\``;
          const adminKb = {
            inline_keyboard: [[
              { text: "Approve ✅", callback_data: `approve:${reg.id}` },
              { text: "Decline ❌", callback_data: `decline:${reg.id}` }
            ]]
          };

          const photoToSend = telegramFileId || receiptImg;
          if (photoToSend) {
            await sendTelegramRequest("sendPhoto", { chat_id: adminChat, photo: photoToSend, caption: captionText, parse_mode: "Markdown", reply_markup: adminKb });
          } else {
            await sendTelegramRequest("sendMessage", { chat_id: adminChat, text: captionText, parse_mode: "Markdown", reply_markup: adminKb });
          }
        }
        return new Response("OK", { headers: corsHeaders });
      }

      // Catch-all fallbacks
      const status = reg.status;
      let msg;
      if (status === "approved") {
        msg = getMsg(lang, "last_approved_msg").replace("{link}", reg.invite_link || "");
      } else if (status === "declined") {
        msg = getMsg(lang, "last_declined_msg");
      } else {
        msg = getMsg(lang, "last_pending_msg");
      }
      await sendTelegramRequest("sendMessage", { chat_id: chatId, text: msg, reply_markup: await getMenuKeyboard(lang, chatId) });
      return new Response("OK", { headers: corsHeaders });
    }

    // --- OTHER REST API ROUTING ---
    if (path === "login/step1") {
      const { username, password } = await req.json();
      const { data: admin } = await supabase.from("admins").select("*").eq("username", username).maybeSingle();
      if (!admin || admin.password !== password) {
        return new Response(JSON.stringify({ message: "Invalid credentials" }), { status: 401, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (path === "broadcast") {
      if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
      }

      // Check auth
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }
      const token = authHeader.split(" ")[1];
      const decoded = await verifyJwt(token, JWT_SECRET);
      if (!decoded) {
        return new Response(JSON.stringify({ error: "Unauthorized / Invalid Token" }), { status: 401, headers: corsHeaders });
      }

      // Get form data
      const formData = await req.formData();
      const text = formData.get("text") as string || "";
      const file = formData.get("file") as File | null;

      // Fetch all registrations from database
      const { data: regs, error: dbErr } = await supabase.from("registrations").select("chat_id");
      if (dbErr) {
        return new Response(JSON.stringify({ error: `Database error: ${dbErr.message}` }), { status: 500, headers: corsHeaders });
      }

      const chatIds = [...new Set(regs.map((r: any) => r.chat_id).filter(Boolean))];
      if (chatIds.length === 0) {
        return new Response(JSON.stringify({ message: "No registered bot users found." }), { status: 400, headers: corsHeaders });
      }

      let successCount = 0;
      let failCount = 0;

      if (file) {
        const filename = file.name.toLowerCase();
        const mimetype = file.type;
        const isVideo = filename.endsWith(".mp4") || filename.endsWith(".mov") || filename.endsWith(".avi") || filename.endsWith(".mkv") || filename.endsWith(".gif") || mimetype.includes("video");
        
        // Upload media to Supabase Storage
        const fileBytes = new Uint8Array(await file.arrayBuffer());
        const fileName = `broadcast_${Date.now()}_${file.name.toLowerCase().replace(/[^a-z0-9.]/g, "_")}`;
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/receipts/${fileName}`;
        let publicUrl = "";
        try {
          const upRes = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": file.type
            },
            body: fileBytes
          });
          if (upRes.ok) {
            publicUrl = `${SUPABASE_URL}/storage/v1/object/public/receipts/${fileName}`;
          } else {
            const errText = await upRes.text();
            throw new Error(`Upload failed: ${upRes.status} ${errText}`);
          }
        } catch (uploadErr: any) {
          console.error("Broadcast media upload to Supabase failed:", uploadErr.message);
          return new Response(JSON.stringify({ error: `Supabase storage upload failed: ${uploadErr.message}` }), { status: 500, headers: corsHeaders });
        }

        const method = isVideo ? 'sendVideo' : 'sendPhoto';
        for (const chatId of chatIds) {
          const payload = {
            chat_id: chatId,
            caption: text,
            parse_mode: "Markdown",
            [isVideo ? "video" : "photo"]: publicUrl
          };
          try {
            const resJson = await sendTelegramRequest(method, payload);
            if (resJson && resJson.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (e: any) {
            console.error(`Failed to send broadcast media to ${chatId}:`, e.message);
            failCount++;
          }
        }
      } else {
        if (!text) {
          return new Response(JSON.stringify({ error: "Message text is empty." }), { status: 400, headers: corsHeaders });
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

      return new Response(JSON.stringify({ success: true, sent: successCount, failed: failCount }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Route not found" }), { status: 404, headers: corsHeaders });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}

serve(handleRequest);





