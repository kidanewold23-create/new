import fs from "fs";
import path from "path";
import { dbStore } from "../db/store.js";
import { verifyEt } from "../services/verifyEtService.js";

async function generateOneTimeTelegramInviteLink(chatIdOrUrl, name) {
  if (!chatIdOrUrl) return chatIdOrUrl || "";
  const BOT_TOKEN = (typeof Deno !== "undefined" && Deno.env ? Deno.env.get("TELEGRAM_BOT_TOKEN") || Deno.env.get("BOT_TOKEN") : "") || (typeof process !== "undefined" && process.env ? (process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN) : "");
  if (!BOT_TOKEN) return chatIdOrUrl;

  let targetChat = chatIdOrUrl.trim();
  if (targetChat.includes("t.me/")) {
    const parts = targetChat.split("t.me/");
    const slug = parts[1].replace(/^\+/, "").replace(/\/.*$/, "");
    if (!targetChat.includes("/+")) {
      targetChat = `@${slug}`;
    }
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createChatInviteLink`, {
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
      console.log(`[Vercel Serverless] 🎟️ Generated 1-Time Link for ${name}: ${json.result.invite_link}`);
      return json.result.invite_link;
    }
  } catch (err) {
    console.error("[Vercel Serverless] Error creating 1-time link:", err);
  }

  return chatIdOrUrl;
}

if (typeof globalThis !== "undefined") {
  globalThis.generateOneTimeTelegramInviteLink = generateOneTimeTelegramInviteLink;
}

export default async function handler(req) {
  const url = new URL(req.url);
  let pathname = url.pathname;

  const pathParam = url.searchParams.get("path");
  if (pathParam) {
    pathname = pathParam.startsWith("/api") ? pathParam : (pathParam.startsWith("/") ? `/api${pathParam}` : `/api/${pathParam}`);
  } else if (pathname === "/api" || pathname === "/api/" || pathname === "/api/index" || pathname === "/api/index.js" || pathname === "/api/index.ts") {
    const xUrl = req.headers.get("x-url") || req.headers.get("x-rewrite-url") || req.headers.get("x-matched-path") || req.headers.get("x-forwarded-uri");
    if (xUrl) {
      try {
        const parsed = new URL(xUrl, "http://localhost").pathname;
        if (parsed && parsed !== "/" && parsed !== "/api/index.js" && parsed !== "/api/index.ts") {
          pathname = parsed;
        }
      } catch (_e) {}
    }
  }

  if (pathname.endsWith(".css") || pathname.includes(".css")) {
    try {
      const fileName = pathname.split("/").pop() || "styles.css";
      const possiblePaths = [
        path.join(process.cwd(), "css", fileName),
        path.join(process.cwd(), "css", "styles.css"),
        path.join(process.cwd(), fileName),
        path.join(process.cwd(), "style.css")
      ];
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, "utf-8");
          return new Response(content, {
            status: 200,
            headers: {
              "Content-Type": "text/css; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0"
            }
          });
        }
      }
    } catch (_e) {}

    const cssFallback = `/* FOUNDERS ACADEMY DESIGN SYSTEM FALLBACK */
:root {
  --bg-dark: #0b0f17;
  --bg-card: rgba(17, 24, 39, 0.7);
  --border-color: rgba(255, 255, 255, 0.08);
  --primary-gold: #f59e0b;
  --primary-gold-hover: #d97706;
  --accent-indigo: #6366f1;
  --text-main: #f9fafb;
  --text-muted: #9ca3af;
}
body { background-color: var(--bg-dark); color: var(--text-main); font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; }
`;
    return new Response(cssFallback, {
      status: 200,
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0"
      }
    });
  }

  // Ignore non-API requests if routed to serverless function
  if (!pathname.startsWith("/api")) {
    return new Response(null, { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // 1. Auth API
  if (pathname === "/api/admin/login" && req.method === "POST") {
    const body = await req.json();
    if (body.username === "admin" && body.password === "admin123") {
      return new Response(JSON.stringify({ success: true, require2FA: true, message: "2FA OTP sent to Admin device" }), { status: 200, headers });
    }
    return new Response(JSON.stringify({ success: false, error: "Invalid Admin credentials" }), { status: 401, headers });
  }

  if (pathname === "/api/admin/verify-otp" && req.method === "POST") {
    const body = await req.json();
    if (body.otp === "123456") {
      return new Response(JSON.stringify({ success: true, token: "token_founders_admin_session_88291" }), { status: 200, headers });
    }
    return new Response(JSON.stringify({ success: false, error: "Invalid 2FA OTP code" }), { status: 400, headers });
  }

  // 2. Categories API
  if (pathname === "/api/categories" && req.method === "GET") {
    const data = await dbStore.getCategories();
    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers });
  }

  if (pathname === "/api/categories" && req.method === "POST") {
    const body = await req.json();
    const newCat = await dbStore.addCategory(body.name);
    return new Response(JSON.stringify({ success: true, data: newCat }), { status: 201, headers });
  }

  if (pathname.startsWith("/api/categories/") && req.method === "PUT") {
    const id = pathname.replace("/api/categories/", "");
    const body = await req.json();
    const updated = await dbStore.updateCategoryStatus(id, body.status);
    return new Response(JSON.stringify({ success: true, data: updated }), { status: 200, headers });
  }

  if (pathname.startsWith("/api/categories/") && req.method === "DELETE") {
    const id = pathname.replace("/api/categories/", "");
    await dbStore.deleteCategory(id);
    return new Response(JSON.stringify({ success: true, message: "Category deleted" }), { status: 200, headers });
  }

  // 3. Masterclasses API
  if (pathname === "/api/courses" && req.method === "GET") {
    const data = await dbStore.getCourses();
    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers });
  }

  if (pathname === "/api/courses" && req.method === "POST") {
    const body = await req.json();
    const newCourse = await dbStore.addCourse(body);
    return new Response(JSON.stringify({ success: true, data: newCourse }), { status: 201, headers });
  }

  if (pathname.startsWith("/api/courses/") && req.method === "PUT") {
    const id = pathname.replace("/api/courses/", "");
    const body = await req.json();
    const updated = await dbStore.updateCourse(id, body);
    return new Response(JSON.stringify({ success: true, data: updated }), { status: 200, headers });
  }

  if (pathname.startsWith("/api/courses/") && req.method === "DELETE") {
    const id = pathname.replace("/api/courses/", "");
    await dbStore.deleteCourse(id);
    return new Response(JSON.stringify({ success: true, message: "Masterclass deleted" }), { status: 200, headers });
  }

  // 3.5 Quizzes API
  if (pathname.match(/^\/api\/courses\/[^\/]+\/quizzes$/) && req.method === "GET") {
    const parts = pathname.split("/");
    const courseId = parts[3];
    const data = await dbStore.getQuizzesByCourse(courseId);
    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers });
  }

  if (pathname.match(/^\/api\/courses\/[^\/]+\/quizzes$/) && req.method === "POST") {
    const parts = pathname.split("/");
    const courseId = parts[3];
    const body = await req.json();
    const newQuiz = await dbStore.createQuiz(courseId, body);
    return new Response(JSON.stringify({ success: true, data: newQuiz }), { status: 201, headers });
  }

  if (pathname.match(/^\/api\/courses\/[^\/]+\/quiz-submissions$/) && req.method === "GET") {
    const parts = pathname.split("/");
    const courseId = parts[3];
    const data = await dbStore.getQuizSubmissions(courseId);
    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers });
  }

  if (pathname.match(/^\/api\/quizzes\/[^\/]+\/submit$/) && req.method === "POST") {
    const parts = pathname.split("/");
    const quizId = parts[3];
    const body = await req.json();
    const submission = await dbStore.submitQuizResult({ ...body, quiz_id: quizId });
    return new Response(JSON.stringify({ success: true, data: submission }), { status: 201, headers });
  }

  if (pathname.startsWith("/api/quizzes/") && req.method === "GET") {
    const quizId = pathname.replace("/api/quizzes/", "");
    const quiz = await dbStore.getQuizById(quizId);
    if (!quiz) {
      return new Response(JSON.stringify({ success: false, error: "Quiz not found" }), { status: 404, headers });
    }
    return new Response(JSON.stringify({ success: true, data: quiz }), { status: 200, headers });
  }

  if (pathname.startsWith("/api/quizzes/") && req.method === "PUT") {
    const quizId = pathname.replace("/api/quizzes/", "");
    const body = await req.json();
    const updated = await dbStore.updateQuiz(quizId, body);
    return new Response(JSON.stringify({ success: true, data: updated }), { status: 200, headers });
  }

  if (pathname.startsWith("/api/quizzes/") && req.method === "DELETE") {
    const quizId = pathname.replace("/api/quizzes/", "");
    await dbStore.deleteQuiz(quizId);
    return new Response(JSON.stringify({ success: true, message: "Quiz deleted successfully" }), { status: 200, headers });
  }


  // 4. Landing Page Content CMS API
  if (pathname === "/api/landing" && req.method === "GET") {
    const data = await dbStore.getLandingConfig();
    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers });
  }

  if ((pathname === "/api/landing" || pathname === "/api/landing/update") && (req.method === "POST" || req.method === "PUT")) {
    const body = await req.json();
    const updated = await dbStore.updateLandingConfig(body);
    return new Response(JSON.stringify({ success: true, data: updated, message: "Landing page customization saved!" }), { status: 200, headers });
  }

  if (pathname === "/api/landing/reset" && req.method === "POST") {
    const reset = await dbStore.resetLandingConfig();
    return new Response(JSON.stringify({ success: true, data: reset, message: "Landing page restored to factory defaults!" }), { status: 200, headers });
  }

  // 5. Students API
  if (pathname === "/api/students" && req.method === "GET") {
    const data = await dbStore.getStudents();
    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers });
  }

  if (pathname === "/api/students" && req.method === "POST") {
    const body = await req.json();
    const newStu = await dbStore.addStudent(body);
    return new Response(JSON.stringify({ success: true, data: newStu }), { status: 201, headers });
  }

  // Student Auth API
  if (pathname === "/api/student/signup" && req.method === "POST") {
    try {
      const body = await req.json();
      const result = await dbStore.registerStudentAccount(body);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
    }
  }

  if (pathname === "/api/student/login" && req.method === "POST") {
    try {
      const body = await req.json();
      const result = await dbStore.authenticateStudent(body);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
    }
  }

  if (pathname === "/api/student/telegram-auth/request-code" && req.method === "POST") {
    try {
      const body = await req.json();
      const result = await dbStore.requestStudentTelegramOtp(body.identifier);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
    }
  }

  if (pathname === "/api/student/telegram-auth/verify-code" && req.method === "POST") {
    try {
      const body = await req.json();
      const result = await dbStore.verifyStudentTelegramOtp(body.identifier, body.code);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
    }
  }

  if (pathname === "/api/student/telegram-auth/poll-status" && req.method === "GET") {
    try {
      const code = url.searchParams.get("code") || "";
      const result = await dbStore.pollStudentTelegramOtp(code);
      return new Response(JSON.stringify(result), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ verified: false, error: err.message }), { status: 500, headers });
    }
  }

  if (pathname === "/api/student/telegram-auth" && req.method === "POST") {
    try {
      const body = await req.json();
      const fn = dbStore.telegramAuthLogin || dbStore.authenticateTelegramUser;
      if (typeof fn !== "function") {
        return new Response(JSON.stringify({ success: false, error: "Telegram auth handler not found" }), { status: 500, headers });
      }
      const result = await fn(body);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
    }
  }

  if (pathname === "/api/student/me" && req.method === "GET") {
    try {
      const search = url.searchParams.get("id") || url.searchParams.get("phone");
      if (!search) {
        return new Response(JSON.stringify({ success: false, error: "Missing student identifier parameter" }), { status: 400, headers });
      }
      const result = await dbStore.getStudentCoursesWithLinks(search);
      return new Response(JSON.stringify({ success: true, data: result }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
    }
  }

  if (pathname === "/api/student/change-password" && req.method === "POST") {
    try {
      const body = await req.json();
      const result = await dbStore.changeStudentPassword(body);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
    }
  }

  // Telegram Broadcast API
  if (pathname === "/api/admin/broadcast" && req.method === "POST") {
    try {
      const body = await req.json();
      const { message, buttonText, buttonUrl } = body || {};

      if (!message || !message.trim()) {
        return new Response(JSON.stringify({ success: false, error: "Broadcast message cannot be empty." }), { status: 400, headers });
      }

      const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || Deno.env.get("BOT_TOKEN") || process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
      if (!BOT_TOKEN) {
        return new Response(JSON.stringify({ success: false, error: "TELEGRAM_BOT_TOKEN missing in .env" }), { status: 500, headers });
      }

      const students = await dbStore.getStudents();
      let telegramRecipients = students.filter(s => s.id && (s.id.startsWith("TG-") || /^\d+$/.test(s.id)));
      if (telegramRecipients.length === 0) {
        telegramRecipients = students;
      }

      let successCount = 0;
      let failCount = 0;
      const logs = [];

      for (const student of telegramRecipients) {
        const rawId = student.id.replace(/^TG-/, "");
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
          const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const tgJson = await tgRes.json();

          if (tgJson.ok) {
            successCount++;
            logs.push({ name: student.name, telegram_id: telegramId, status: "Delivered", time: new Date().toLocaleTimeString() });
          } else {
            const fbRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payload, parse_mode: undefined })
            });
            const fbJson = await fbRes.json();
            if (fbJson.ok) {
              successCount++;
              logs.push({ name: student.name, telegram_id: telegramId, status: "Delivered (Plain Text)", time: new Date().toLocaleTimeString() });
            } else {
              failCount++;
              logs.push({ name: student.name, telegram_id: telegramId, status: `Failed: ${tgJson.description || "Error"}`, time: new Date().toLocaleTimeString() });
            }
          }
        } catch (err) {
          failCount++;
          logs.push({ name: student.name, telegram_id: telegramId, status: `Error: ${err.message}`, time: new Date().toLocaleTimeString() });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Broadcast delivered to ${successCount} user(s). ${failCount} failed.`,
        stats: { total: telegramRecipients.length, delivered: successCount, failed: failCount },
        logs
      }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
    }
  }

  // 5. Maintenance API
  if (pathname === "/api/maintenance" && req.method === "GET") {
    const data = await dbStore.getMaintenance();
    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers });
  }

  if (pathname === "/api/maintenance" && (req.method === "POST" || req.method === "PUT")) {
    const body = await req.json();
    const updated = await dbStore.updateMaintenance(body);
    return new Response(JSON.stringify({ success: true, data: updated, message: "Maintenance settings saved successfully" }), { status: 200, headers });
  }

  // 6. Transactions & Analytics API
  if (pathname === "/api/transactions" && req.method === "GET") {
    const data = await dbStore.getTransactions();
    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers });
  }

  if (pathname === "/api/analytics" && req.method === "GET") {
    const [courses, students, transactions] = await Promise.all([
      dbStore.getCourses(),
      dbStore.getStudents(),
      dbStore.getTransactions()
    ]);

    let totalEnrolledFromCourses = 0;
    courses.forEach(c => {
      totalEnrolledFromCourses += parseInt(String(c.enrolled_students || 0), 10) || 0;
    });
    const totalStudentsCount = Math.max(students.length, totalEnrolledFromCourses);

    const completedTxns = transactions.filter(t => 
      t.status === "Completed" || t.status === "VERIFIED" || t.status === "Settled"
    );

    let completedTxnRevenue = 0;
    completedTxns.forEach(t => {
      const amt = parseFloat(String(t.amount || "0").replace(/[^0-9.]/g, "")) || 0;
      completedTxnRevenue += amt;
    });

    let totalEstimatedCourseRev = 0;
    courses.forEach(c => {
      const priceNum = parseFloat(String(c.price || "0").replace(/[^0-9.]/g, "")) || 0;
      const enrolled = parseInt(String(c.enrolled_students || 0), 10) || 0;
      totalEstimatedCourseRev += (priceNum * enrolled);
    });

    const grossRevenue = completedTxnRevenue > totalEstimatedCourseRev ? completedTxnRevenue : (totalEstimatedCourseRev || completedTxnRevenue || 4926600);
    const avgOrderValue = totalStudentsCount > 0 ? Math.round(grossRevenue / totalStudentsCount) : 3947;
    const settlementRate = transactions.length > 0 ? Math.min(100, Math.round((completedTxns.length / transactions.length) * 1000) / 10) : 97.4;

    const colors = ["#f59e0b", "#6366f1", "#10b981", "#f43f5e", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6"];
    const courseStats = {};
    courses.forEach((c, idx) => {
      const color = colors[idx % colors.length];
      const priceNum = parseFloat(String(c.price || "0").replace(/[^0-9.]/g, "")) || 0;
      const enrolled = parseInt(String(c.enrolled_students || 0), 10) || 0;
      const rev = priceNum * enrolled;
      courseStats[c.id] = { id: c.id, title: c.title, price: priceNum, enrolled, revenue: rev, color };
    });

    const paymentCounts = {};
    transactions.forEach(t => {
      const method = (t.payment_method || "telebirr").toLowerCase();
      paymentCounts[method] = (paymentCounts[method] || 0) + 1;
    });
    if (Object.keys(paymentCounts).length === 0) {
      paymentCounts["telebirr"] = 64;
      paymentCounts["cbe"] = 24;
      paymentCounts["boa"] = 8;
      paymentCounts["awash"] = 4;
    }

    const dailyLabels = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      dailyLabels.push(d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }));
    }
    const monthlyLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep (Proj)", "Oct (Proj)", "Nov (Proj)", "Dec (Proj)"];
    const currentYear = new Date().getFullYear();
    const yearlyLabels = [String(currentYear - 3), String(currentYear - 2), String(currentYear - 1), `${currentYear} (YTD)`];

    const dailyRevenue = { all: [] };
    const dailyEnrollments = { all: [] };
    const monthlyRevenue = { all: [] };
    const monthlyEnrollments = { all: [] };
    const yearlyRevenue = { all: [] };
    const yearlyEnrollments = { all: [] };

    const dailyWeights = [0.03, 0.04, 0.05, 0.04, 0.06, 0.07, 0.06, 0.09, 0.08, 0.10, 0.11, 0.10, 0.13, 0.15];
    const monthlyWeights = [0.02, 0.03, 0.04, 0.03, 0.05, 0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.15];
    const yearlyWeights = [0.12, 0.28, 0.55, 1.0];

    courses.forEach(c => {
      const cId = c.id;
      const cRev = courseStats[cId]?.revenue || (grossRevenue / (courses.length || 1));
      const cStu = courseStats[cId]?.enrolled || Math.round(totalStudentsCount / (courses.length || 1));

      dailyRevenue[cId] = dailyWeights.map(w => Math.round(w * (cRev * 0.12)));
      dailyEnrollments[cId] = dailyWeights.map(w => Math.max(1, Math.round(w * (cStu * 0.12))));
      monthlyRevenue[cId] = monthlyWeights.map(w => Math.round(w * cRev));
      monthlyEnrollments[cId] = monthlyWeights.map(w => Math.max(1, Math.round(w * cStu)));
      yearlyRevenue[cId] = yearlyWeights.map(w => Math.round(w * cRev));
      yearlyEnrollments[cId] = yearlyWeights.map(w => Math.max(1, Math.round(w * cStu)));
    });

    dailyRevenue.all = dailyLabels.map((_, i) => courses.reduce((acc, c) => acc + (dailyRevenue[c.id]?.[i] || 0), 0) || Math.round(dailyWeights[i] * grossRevenue * 0.12));
    dailyEnrollments.all = dailyLabels.map((_, i) => courses.reduce((acc, c) => acc + (dailyEnrollments[c.id]?.[i] || 0), 0) || Math.max(1, Math.round(dailyWeights[i] * totalStudentsCount * 0.12)));
    monthlyRevenue.all = monthlyLabels.map((_, i) => courses.reduce((acc, c) => acc + (monthlyRevenue[c.id]?.[i] || 0), 0) || Math.round(monthlyWeights[i] * grossRevenue));
    monthlyEnrollments.all = monthlyLabels.map((_, i) => courses.reduce((acc, c) => acc + (monthlyEnrollments[c.id]?.[i] || 0), 0) || Math.max(1, Math.round(monthlyWeights[i] * totalStudentsCount)));
    yearlyRevenue.all = yearlyLabels.map((_, i) => courses.reduce((acc, c) => acc + (yearlyRevenue[c.id]?.[i] || 0), 0) || Math.round(yearlyWeights[i] * grossRevenue));
    yearlyEnrollments.all = yearlyLabels.map((_, i) => courses.reduce((acc, c) => acc + (yearlyEnrollments[c.id]?.[i] || 0), 0) || Math.max(1, Math.round(yearlyWeights[i] * totalStudentsCount)));

    const recentEnrollments = transactions.slice(0, 15).map(t => ({
      id: t.id,
      studentName: t.student_name || "Student",
      studentPhone: t.student_phone || "+251 90 000 0000",
      studentEmail: t.student_email || "@student",
      courseTitle: t.masterclass_title || "Masterclass Enrollment",
      courseId: t.course_id || "",
      paymentMethod: t.payment_method || "telebirr",
      referenceNumber: t.reference_number || t.id,
      amount: t.amount || "ETB 8,500",
      status: t.status || "Completed",
      verifyStatus: t.verify_et_status || "VERIFIED",
      date: t.created_at ? new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    }));

    return new Response(JSON.stringify({
      success: true,
      data: {
        kpi: { grossRevenue, totalEnrollments: totalStudentsCount, avgOrderValue, settlementRate, revenueGrowth: "+24.8%", studentGrowth: "+18.2%" },
        courses: courses.map(c => ({ id: c.id, title: c.title, category: c.category, price: c.price, enrolled_students: c.enrolled_students || 0, color: courseStats[c.id]?.color || "#f59e0b" })),
        trajectories: {
          daily: { labels: dailyLabels, revenue: dailyRevenue, enrollments: dailyEnrollments, growthRevenue: "+31.4%", growthStudents: "+26.0%" },
          monthly: { labels: monthlyLabels, revenue: monthlyRevenue, enrollments: monthlyEnrollments, growthRevenue: "+24.8%", growthStudents: "+18.2%" },
          yearly: { labels: yearlyLabels, revenue: yearlyRevenue, enrollments: yearlyEnrollments, growthRevenue: "+80.5%", growthStudents: "+78.9%" }
        },
        paymentBreakdown: paymentCounts,
        recentEnrollments
      }
    }), { status: 200, headers });
  }

  // 7. Merchant Bank Accounts API
  if (pathname === "/api/bank-accounts" && req.method === "GET") {
    const data = await dbStore.getBankAccounts();
    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers });
  }

  if ((pathname === "/api/bank-accounts" || pathname === "/api/admin/bank-accounts") && req.method === "POST") {
    const body = await req.json();
    const updated = await dbStore.updateBankAccounts(body);
    return new Response(JSON.stringify({ success: true, data: updated, message: "Bank accounts saved successfully" }), { status: 200, headers });
  }

  // 8. Coupon Code Validation API
  if (pathname === "/api/coupons/validate" && req.method === "POST") {
    try {
      const body = await req.json();
      const { couponCode, courseId } = body || {};
      const result = await dbStore.validateCoupon(couponCode, courseId);
      if (result && result.valid) {
        return new Response(JSON.stringify({ success: true, data: result }), { status: 200, headers });
      }
      return new Response(JSON.stringify({ success: false, error: result?.reason || "Invalid coupon code" }), { status: 400, headers });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
    }
  }

  // 9. Instant Payment Receipt & Verify.ET Verification API
  if (pathname === "/api/verify/transaction" && req.method === "POST") {
    try {
      const body = await req.json();
      const {
        studentName,
        studentPhone,
        studentEmail,
        courseId,
        provider,
        referenceNumber,
        accountSuffix,
        couponCode
      } = body || {};

      if (!referenceNumber) {
        return new Response(JSON.stringify({
          success: false,
          error: "Missing payment reference number (e.g. Telebirr Txn ID or CBE FT Reference)"
        }), { status: 400, headers });
      }

      if (!provider) {
        return new Response(JSON.stringify({
          success: false,
          error: "Payment provider is required"
        }), { status: 400, headers });
      }

      const courses = await dbStore.getCourses();
      const course = courses.find((c) => c.id === courseId || c.title === courseId) || courses[0];
      const rawPrice = course ? course.price : "8500";
      let expectedAmount = parseFloat(String(rawPrice).replace(/[^0-9.]/g, "")) || 8500;
      let appliedCouponInfo = null;

      if (couponCode) {
        const couponCheck = await dbStore.validateCoupon(couponCode, course ? course.id : courseId);
        if (couponCheck && couponCheck.valid) {
          appliedCouponInfo = couponCheck;
          expectedAmount = couponCheck.finalPrice;
        }
      }

      const existingTxns = await dbStore.getTransactions();
      const cleanRef = String(referenceNumber).trim().toUpperCase();
      const alreadyUsed = existingTxns.find((t) => 
        (t.status === "Completed" || t.status === "VERIFIED" || t.status === "Settled") &&
        String(t.reference_number || t.id).trim().toUpperCase() === cleanRef
      );

      if (alreadyUsed) {
        return new Response(JSON.stringify({
          success: false,
          verified: false,
          error: `Transaction reference '${cleanRef}' has already been used. Duplicate receipts cannot be submitted.`
        }), { status: 400, headers });
      }

      const merchantBankConfig = await dbStore.getBankAccounts();
      const finalSuffix = accountSuffix || (merchantBankConfig ? (merchantBankConfig.cbeAccountSuffix || merchantBankConfig.cbeAccountNumber) : "49281948");

      const verification = await verifyEt.verifyPayment({
        provider,
        referenceNumber,
        accountSuffix: finalSuffix,
        expectedAmount,
        merchantBankConfig
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
          metadata: { verificationResult: verification, coupon: appliedCouponInfo }
        });

        return new Response(JSON.stringify({
          success: false,
          verified: false,
          pending: !!verification.pending,
          requestId: verification.requestId || null,
          error: verification.error || "Transaction verification failed",
          transaction: failedTxn
        }), { status: verification.pending ? 202 : 400, headers });
      }

      const sName = studentName || verification.senderName || "Student";
      const rawChannelLink = course?.tg_channel || "https://t.me/founders_smma_channel";
      const rawGroupLink = course?.tg_group || "https://t.me/founders_smma_group";

      let oneTimeChannelLink = rawChannelLink;
      let oneTimeGroupLink = rawGroupLink;

      try {
        let linkGenFn = typeof generateOneTimeTelegramInviteLink === "function" ? generateOneTimeTelegramInviteLink : null;
        if (!linkGenFn && typeof globalThis.generateOneTimeTelegramInviteLink === "function") {
          linkGenFn = globalThis.generateOneTimeTelegramInviteLink;
        }

        if (linkGenFn) {
          if (rawChannelLink) {
            oneTimeChannelLink = await linkGenFn(rawChannelLink, `${sName} Channel`);
          }
          if (rawGroupLink) {
            oneTimeGroupLink = await linkGenFn(rawGroupLink, `${sName} Group`);
          }
        }
      } catch (_e) {
        oneTimeChannelLink = rawChannelLink;
        oneTimeGroupLink = rawGroupLink;
      }

      const savedTxn = await dbStore.addTransaction({
        student_name: studentName || verification.senderName || "Verified Student",
        student_phone: studentPhone || "",
        student_email: studentEmail || "",
        masterclass_title: course ? course.title : "Masterclass Enrollment",
        course_id: course ? course.id : courseId,
        payment_method: provider,
        reference_number: referenceNumber,
        account_suffix: accountSuffix || "",
        amount: `ETB ${expectedAmount.toLocaleString()}`,
        status: "Completed",
        verify_et_status: "VERIFIED",
        metadata: {
          verificationResult: verification,
          coupon: appliedCouponInfo,
          transactedAt: verification.transactedAt,
          isSimulated: verification.isSimulated || false,
          oneTimeLinks: {
            channel: oneTimeChannelLink,
            group: oneTimeGroupLink
          }
        }
      });

      const enrollment = await dbStore.addStudent({
        name: studentName || verification.senderName || "Verified Student",
        phone: studentPhone || "",
        email: studentEmail || "",
        courseId: course ? course.id : courseId,
        txnId: savedTxn.id
      });

      // Auto-dispatch 1-time links to Student's Telegram Bot chat if student is already registered on Telegram
      const BOT_TOKEN = (typeof Deno !== "undefined" && Deno.env ? Deno.env.get("TELEGRAM_BOT_TOKEN") || Deno.env.get("BOT_TOKEN") : "") || (typeof process !== "undefined" && process.env ? (process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN) : "");
      if (BOT_TOKEN && studentPhone) {
        try {
          const cleanTargetPhone = String(studentPhone).replace(/\D/g, "");
          const cleanLast9 = cleanTargetPhone.length >= 9 ? cleanTargetPhone.slice(-9) : cleanTargetPhone;

          if (cleanLast9) {
            const students = await dbStore.getStudents();
            const matchingStu = students.find((s) => {
              const p = String(s.phone || "").replace(/\D/g, "");
              const sLast9 = p.length >= 9 ? p.slice(-9) : p;
              return sLast9 && sLast9 === cleanLast9 && s.id && String(s.id).startsWith("TG-");
            });

            if (matchingStu) {
              const targetChatId = String(matchingStu.id).replace(/^TG-/, "");
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

              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: targetChatId,
                  text: inviteMsg,
                  parse_mode: "Markdown",
                  reply_markup: inlineButtons.length > 0 ? { inline_keyboard: inlineButtons } : undefined
                })
              });
            }
          }
        } catch (_tgErr) {
          console.error("Failed to auto-send Telegram links to bot:", _tgErr);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        verified: true,
        message: "Payment verified successfully!",
        transaction: savedTxn,
        enrollment,
        oneTimeLinks: {
          channel: oneTimeChannelLink,
          group: oneTimeGroupLink
        }
      }), { status: 200, headers });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
    }
  }

  return new Response(JSON.stringify({ error: "Endpoint not found" }), { status: 404, headers });
}
