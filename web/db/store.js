/* ==========================================================================
   FOUNDERS ACADEMY PERSISTENCE & SUPABASE DATABASE ENGINE (NODE.JS)
   ========================================================================== */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://icdjgtfiqwwdqtvwuyaw.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_7SjYAbvNDwTXOVBlkuox-g_wMj58uUK";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function telegramApi(method, params = {}) {
  const BOT_TOKEN = (typeof Deno !== "undefined" && Deno.env ? Deno.env.get("TELEGRAM_BOT_TOKEN") || Deno.env.get("BOT_TOKEN") : "") || (typeof process !== "undefined" && process.env ? (process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN) : "") || "8659500401:AAESuYgRssThu3J-22ky6FkPOB9aHJf7QRg";
  if (!BOT_TOKEN) return { ok: false, description: "BOT_TOKEN missing" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, description: err.message };
  }
}

// Initial Seed Data Fallbacks
const defaultCategories = [
  { id: "cat-1", name: "Digital Marketing / SMMA", status: "ON" },
  { id: "cat-2", name: "Video Editing & VFX", status: "ON" },
  { id: "cat-3", name: "Content Creation", status: "ON" },
  { id: "cat-4", name: "Graphic Design", status: "ON" },
  { id: "cat-5", name: "AI & Automation", status: "ON" }
];

const defaultCourses = [
  {
    id: "course-smma-accelerator",
    title: "SMMA & Agency Growth Accelerator",
    category: "Digital Marketing / SMMA",
    price: "10,000 ETB",
    description: "Master high-ticket client acquisition, outreach scripts, cold email infrastructure, and agency team scaling.",
    tg_channel: "https://t.me/founders_smma_channel",
    tg_group: "https://t.me/founders_smma_group",
    status: "ON",
    enrolled_students: 1840
  },
  {
    id: "course-video-editing",
    title: "Video Editing & Post-Production Course",
    category: "Video Editing & VFX",
    price: "8,500 ETB",
    description: "Professional Adobe Premiere Pro, After Effects, color grading, sound design, and viral short-form editing.",
    tg_channel: "https://t.me/founders_video_channel",
    tg_group: "https://t.me/founders_video_group",
    status: "ON",
    enrolled_students: 1420
  },
  {
    id: "course-content-creation",
    title: "Content Creation & Short Form Viral Blueprint",
    category: "Content Creation",
    price: "6,500 ETB",
    description: "Algorithm secrets, hook mastery, camera gear setups, and monetizing TikTok & Instagram Reels.",
    tg_channel: "https://t.me/founders_content_channel",
    tg_group: "https://t.me/founders_content_group",
    status: "ON",
    enrolled_students: 980
  },
  {
    id: "course-graphic-design",
    title: "Graphic Design & Brand Identity Mastery",
    category: "Graphic Design",
    price: "7,000 ETB",
    description: "Photoshop, Illustrator, logo systems, typography, and premium brand presentation strategy.",
    tg_channel: "https://t.me/founders_design_channel",
    tg_group: "https://t.me/founders_design_group",
    status: "ON",
    enrolled_students: 750
  },
  {
    id: "course-ai-automation",
    title: "AI Automation & Agency Bot Systems",
    category: "AI & Automation",
    price: "9,500 ETB",
    description: "Build custom ChatGPT bots, Make.com automations, CRM integrations, and AI workflow tools.",
    tg_channel: "https://t.me/founders_ai_channel",
    tg_group: "https://t.me/founders_ai_group",
    status: "ON",
    enrolled_students: 520
  }
];

const defaultStudents = [];

const defaultTransactions = [];

const courseStatusOverrides = {};
const courseOverrides = {};
const deletedCourseIds = new Set();
const addedCourses = [];

const categoryStatusOverrides = {};
const categoryNameOverrides = {};
const deletedCategoryIds = new Set();
const addedCategories = [];

let inMemoryTransactions = [...defaultTransactions];
let inMemoryGiveaways = [];
let inMemoryMaintenance = {
  status: "OFF",
  title: "System Under Scheduled Upgrades & Maintenance",
  message: "We are currently upgrading Founders Academy infrastructure and database performance. Access will resume shortly."
};

const defaultQuizzes = [
  {
    id: "quiz-smma-1",
    course_id: "course-smma-accelerator",
    title: "Module 1: High-Ticket Outreach & Client Acquisition",
    description: "Test your knowledge on cold email infrastructure, discovery calls, and agency lead generation.",
    time_limit_mins: 15,
    passing_score: 70,
    status: "active",
    created_at: new Date().toISOString(),
    questions: [
      {
        id: "q-smma-1",
        quiz_id: "quiz-smma-1",
        course_id: "course-smma-accelerator",
        question_text: "What is the primary objective of initial cold outreach in an SMMA model?",
        question_type: "multiple_choice",
        options: [
          "Close the client immediately on the 1st email",
          "Book a qualified discovery / strategy session call",
          "Send a full 20-page pricing proposal right away",
          "Ask for a partner referral code"
        ],
        correct_answer: "Book a qualified discovery / strategy session call",
        explanation: "Cold outreach is designed to generate interest and book a discovery call, not close complex high-ticket deals in text.",
        points: 10,
        sort_order: 1
      },
      {
        id: "q-smma-2",
        quiz_id: "quiz-smma-1",
        course_id: "course-smma-accelerator",
        question_text: "Which email infrastructure practice ensures your cold emails don't go to spam?",
        question_type: "multiple_choice",
        options: [
          "Sending 500 emails per hour from a brand new domain",
          "Setting up SPF, DKIM, and DMARC records with gradual domain warmup",
          "Using standard free Gmail accounts without custom domains",
          "Including large PDF attachments in cold emails"
        ],
        correct_answer: "Setting up SPF, DKIM, and DMARC records with gradual domain warmup",
        explanation: "Authenticating domain DNS records (SPF, DKIM, DMARC) and warming up domains protects deliverability.",
        points: 10,
        sort_order: 2
      },
      {
        id: "q-smma-3",
        quiz_id: "quiz-smma-1",
        course_id: "course-smma-accelerator",
        question_text: "Outreach scripts should always feature a high-friction request at the start.",
        question_type: "true_false",
        options: ["True", "False"],
        correct_answer: "False",
        explanation: "Outreach scripts should feature low-friction calls to action (e.g. 'Mind if I send over a quick video breakdown?').",
        points: 10,
        sort_order: 3
      }
    ]
  },
  {
    id: "quiz-smma-2",
    course_id: "course-smma-accelerator",
    title: "Module 2: Closing High-Ticket Retainers (10,000+ ETB)",
    description: "Assessment on sales call frameworks, handling objections, and contract retainers.",
    time_limit_mins: 20,
    passing_score: 80,
    status: "active",
    created_at: new Date().toISOString(),
    questions: [
      {
        id: "q-smma-201",
        quiz_id: "quiz-smma-2",
        course_id: "course-smma-accelerator",
        question_text: "When a prospect says 'Your service is too expensive', what is the best response strategy?",
        question_type: "multiple_choice",
        options: [
          "Immediately drop your price by 50%",
          "Reframe price against ROI and clarify the cost of inaction",
          "Argue with the prospect about market standard rates",
          "End the call immediately"
        ],
        correct_answer: "Reframe price against ROI and clarify the cost of inaction",
        explanation: "Reframing price into return on investment demonstrates how the retainer pays for itself.",
        points: 10,
        sort_order: 1
      }
    ]
  },
  {
    id: "quiz-video-1",
    course_id: "course-video-editing",
    title: "Module 1: Color Grading & Short-Form Editing Mastery",
    description: "Test your understanding of Lumetri Color, sound design layer stacking, and pacing.",
    time_limit_mins: 15,
    passing_score: 75,
    status: "active",
    created_at: new Date().toISOString(),
    questions: [
      {
        id: "q-vid-1",
        quiz_id: "quiz-video-1",
        course_id: "course-video-editing",
        question_text: "Which color space is standard for web video publishing (YouTube, Reels)?",
        question_type: "multiple_choice",
        options: ["Rec.709", "Adobe RGB", "CMYK", "DCI-P3"],
        correct_answer: "Rec.709",
        explanation: "Rec.709 is the universal standard color space for HDTV and digital web video platforms.",
        points: 10,
        sort_order: 1
      },
      {
        id: "q-vid-2",
        quiz_id: "quiz-video-1",
        course_id: "course-video-editing",
        question_text: "Under the 180-degree shutter rule, what should your shutter speed be if shooting at 24 fps?",
        question_type: "multiple_choice",
        options: ["1/24 sec", "1/50 sec", "1/100 sec", "1/500 sec"],
        correct_answer: "1/50 sec",
        explanation: "Shutter speed should be double the frame rate (1/48 or ~1/50 sec for 24fps) to mimic natural motion blur.",
        points: 10,
        sort_order: 2
      }
    ]
  },
  {
    id: "quiz-ai-1",
    course_id: "course-ai-automation",
    title: "Module 1: Custom ChatGPT Bots & Webhook Workflows",
    description: "Master prompt engineering, API keys, Make.com webhooks, and Telegram bot setup.",
    time_limit_mins: 15,
    passing_score: 75,
    status: "active",
    created_at: new Date().toISOString(),
    questions: [
      {
        id: "q-ai-1",
        quiz_id: "quiz-ai-1",
        course_id: "course-ai-automation",
        question_text: "What defines the personality and functional boundaries of a Custom GPT?",
        question_type: "multiple_choice",
        options: [
          "System Instructions",
          "CSS Layout Styles",
          "Domain Nameservers",
          "User Agent Strings"
        ],
        correct_answer: "System Instructions",
        explanation: "System instructions specify system role, constraints, response tone, and behavior boundaries.",
        points: 10,
        sort_order: 1
      }
    ]
  }
];

const defaultQuizSubmissions = [
  {
    id: "sub-101",
    quiz_id: "quiz-smma-1",
    course_id: "course-smma-accelerator",
    student_id: "#STD-9921",
    student_name: "Abebe Bikila",
    score: 100,
    total_questions: 3,
    passed: true,
    submitted_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "sub-102",
    quiz_id: "quiz-smma-1",
    course_id: "course-smma-accelerator",
    student_id: "#STD-9922",
    student_name: "Tigist Haile",
    score: 66,
    total_questions: 3,
    passed: false,
    submitted_at: new Date(Date.now() - 43200000).toISOString()
  }
];

let inMemoryCategories = [...defaultCategories];
let inMemoryCourses = [...defaultCourses];
let inMemoryStudents = [...defaultStudents];
let inMemoryQuizzes = JSON.parse(JSON.stringify(defaultQuizzes));
let inMemoryQuizSubmissions = JSON.parse(JSON.stringify(defaultQuizSubmissions));

const defaultBundles = [
  {
    id: "bundle-ultimate-agency",
    title: "Ultimate Agency & Content Creation Package",
    description: "Combine SMMA Growth Accelerator, Video Editing Course, and Short-Form Viral Blueprint into one high-impact learning path.",
    price: "18,000 ETB",
    main_course_id: "course-smma-accelerator",
    included_course_ids: ["course-video-editing", "course-content-creation"],
    status: "ON",
    created_at: new Date().toISOString()
  },
  {
    id: "bundle-ai-creator",
    title: "AI Automation & Digital Media Bundle",
    description: "Master AI Bot Workflows along with Graphic Design & Brand Identity to scale your modern agency.",
    price: "13,500 ETB",
    main_course_id: "course-ai-automation",
    included_course_ids: ["course-graphic-design"],
    status: "ON",
    created_at: new Date().toISOString()
  }
];

let inMemoryBundles = JSON.parse(JSON.stringify(defaultBundles));

let maintenanceLoaded = false;



export const dbStore = {
  // --- Categories CRUD with Persistent Overrides ---
  getCategories: async () => {
    let list = [...inMemoryCategories];
    try {
      const { data, error } = await supabase.from("categories").select("*");
      if (!error && data && data.length > 0) {
        list = data.filter(c => !deletedCategoryIds.has(c.id));
      }
    } catch (_e) { /* fallback */ }

    // Merge in-memory additions
    for (const added of addedCategories) {
      if (!list.some(c => c.id === added.id) && !deletedCategoryIds.has(added.id)) {
        list.push(added);
      }
    }

    // Apply name and status overrides, and filter deleted categories
    list = list
      .filter(c => !deletedCategoryIds.has(c.id))
      .map(c => ({
        ...c,
        ...(categoryNameOverrides[c.id] ? { name: categoryNameOverrides[c.id] } : {}),
        ...(categoryStatusOverrides[c.id] ? { status: categoryStatusOverrides[c.id] } : {})
      }));

    inMemoryCategories = list;
    return list;
  },
  addCategory: async (name) => {
    const cleanName = (name || "New Category").trim();
    const newCat = {
      id: `cat-${Date.now()}`,
      name: cleanName,
      status: "ON"
    };
    try {
      await supabase.from("categories").insert([newCat]);
    } catch (_e) { /* fallback */ }
    addedCategories.unshift(newCat);
    inMemoryCategories.unshift(newCat);
    return newCat;
  },
  updateCategory: async (id, data = {}) => {
    if (data.status) {
      categoryStatusOverrides[id] = data.status;
    }
    if (data.name) {
      categoryNameOverrides[id] = data.name.trim();
    }
    try {
      await supabase.from("categories").update(data).eq("id", id);
    } catch (_e) { /* fallback */ }

    const added = addedCategories.find(c => c.id === id);
    if (added) Object.assign(added, data);

    const cat = inMemoryCategories.find(c => c.id === id);
    if (cat) {
      Object.assign(cat, data);
      return cat;
    }
    return { id, ...data };
  },
  updateCategoryStatus: async (id, status) => {
    categoryStatusOverrides[id] = status;
    try {
      await supabase.from("categories").update({ status }).eq("id", id);
    } catch (_e) { /* fallback */ }
    const cat = inMemoryCategories.find(c => c.id === id);
    if (cat) cat.status = status;
    return cat || { id, status };
  },
  deleteCategory: async (id) => {
    deletedCategoryIds.add(id);
    delete categoryStatusOverrides[id];
    delete categoryNameOverrides[id];
    try {
      await supabase.from("categories").delete().eq("id", id);
    } catch (_e) { /* fallback */ }
    inMemoryCategories = inMemoryCategories.filter(c => c.id !== id);
    return true;
  },

  // --- Quizzes CRUD & Submissions ---
  getQuizzesByCourse: async (courseId) => {
    let courseQuizzes = [];
    try {
      const { data: dbQuizzes, error } = await supabase.from("course_quizzes").select("*").eq("course_id", courseId);
      if (!error && dbQuizzes && dbQuizzes.length > 0) {
        courseQuizzes = dbQuizzes;
        for (const quiz of courseQuizzes) {
          const { data: questions } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quiz.id).order("sort_order", { ascending: true });
          quiz.questions = questions || [];
        }
      }
    } catch (_e) {}

    if (courseQuizzes.length === 0) {
      const cleanCourseId = (courseId || "").toLowerCase();
      courseQuizzes = inMemoryQuizzes.filter(q => 
        q.course_id === courseId || 
        q.course_id.toLowerCase() === cleanCourseId ||
        cleanCourseId.includes(q.course_id.toLowerCase()) ||
        q.course_id.toLowerCase().includes(cleanCourseId)
      );
    }
    return courseQuizzes;
  },

  getQuizById: async (quizId) => {
    try {
      const { data: dbQuiz } = await supabase.from("course_quizzes").select("*").eq("id", quizId).single();
      if (dbQuiz) {
        const { data: questions } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("sort_order", { ascending: true });
        return { ...dbQuiz, questions: questions || [] };
      }
    } catch (_e) {}

    const found = inMemoryQuizzes.find(q => q.id === quizId);
    return found || null;
  },

  createQuiz: async (courseId, quizData) => {
    const quizId = `quiz-${Date.now()}`;
    const newQuiz = {
      id: quizId,
      course_id: courseId,
      title: (quizData.title || "New Course Quiz").trim(),
      description: (quizData.description || "").trim(),
      time_limit_mins: parseInt(quizData.time_limit_mins, 10) || 15,
      passing_score: parseInt(quizData.passing_score, 10) || 70,
      status: quizData.status || "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const rawQuestions = Array.isArray(quizData.questions) ? quizData.questions : [];
    const formattedQuestions = rawQuestions.map((q, idx) => ({
      id: q.id || `q-${Date.now()}-${idx}`,
      quiz_id: quizId,
      course_id: courseId,
      question_text: q.question_text || q.text || `Question ${idx + 1}`,
      question_type: q.question_type || "multiple_choice",
      options: Array.isArray(q.options) ? q.options : ["Option A", "Option B", "Option C", "Option D"],
      correct_answer: q.correct_answer || (Array.isArray(q.options) ? q.options[0] : "Option A"),
      explanation: q.explanation || "",
      points: parseInt(q.points, 10) || 10,
      sort_order: idx + 1
    }));

    newQuiz.questions = formattedQuestions;

    try {
      await supabase.from("course_quizzes").insert([{
        id: newQuiz.id,
        course_id: newQuiz.course_id,
        title: newQuiz.title,
        description: newQuiz.description,
        time_limit_mins: newQuiz.time_limit_mins,
        passing_score: newQuiz.passing_score,
        status: newQuiz.status
      }]);

      if (formattedQuestions.length > 0) {
        await supabase.from("quiz_questions").insert(formattedQuestions);
      }
    } catch (_e) {}

    inMemoryQuizzes.unshift(newQuiz);
    return newQuiz;
  },

  updateQuiz: async (quizId, quizData) => {
    const existing = inMemoryQuizzes.find(q => q.id === quizId);
    if (existing) {
      if (quizData.title !== undefined) existing.title = quizData.title.trim();
      if (quizData.description !== undefined) existing.description = quizData.description.trim();
      if (quizData.time_limit_mins !== undefined) existing.time_limit_mins = parseInt(quizData.time_limit_mins, 10) || 15;
      if (quizData.passing_score !== undefined) existing.passing_score = parseInt(quizData.passing_score, 10) || 70;
      if (quizData.status !== undefined) existing.status = quizData.status;
      if (Array.isArray(quizData.questions)) {
        existing.questions = quizData.questions.map((q, idx) => ({
          id: q.id || `q-${Date.now()}-${idx}`,
          quiz_id: quizId,
          course_id: existing.course_id,
          question_text: q.question_text || q.text || `Question ${idx + 1}`,
          question_type: q.question_type || "multiple_choice",
          options: Array.isArray(q.options) ? q.options : ["Option A", "Option B"],
          correct_answer: q.correct_answer || (Array.isArray(q.options) ? q.options[0] : "Option A"),
          explanation: q.explanation || "",
          points: parseInt(q.points, 10) || 10,
          sort_order: idx + 1
        }));
      }
    }

    try {
      await supabase.from("course_quizzes").update({
        title: quizData.title,
        description: quizData.description,
        time_limit_mins: quizData.time_limit_mins,
        passing_score: quizData.passing_score,
        status: quizData.status,
        updated_at: new Date().toISOString()
      }).eq("id", quizId);

      if (Array.isArray(quizData.questions)) {
        await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
        if (existing && existing.questions && existing.questions.length > 0) {
          await supabase.from("quiz_questions").insert(existing.questions);
        }
      }
    } catch (_e) {}

    return existing || { id: quizId, ...quizData };
  },

  deleteQuiz: async (quizId) => {
    inMemoryQuizzes = inMemoryQuizzes.filter(q => q.id !== quizId);
    inMemoryQuizSubmissions = inMemoryQuizSubmissions.filter(s => s.quiz_id !== quizId);
    try {
      await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
      await supabase.from("course_quizzes").delete().eq("id", quizId);
    } catch (_e) {}
    return true;
  },

  getQuizSubmissions: async (courseId, quizId = null) => {
    let results = [];
    try {
      let query = supabase.from("quiz_submissions").select("*");
      if (courseId) query = query.eq("course_id", courseId);
      if (quizId) query = query.eq("quiz_id", quizId);
      const { data } = await query;
      if (data && data.length > 0) results = data;
    } catch (_e) {}

    if (results.length === 0) {
      results = inMemoryQuizSubmissions.filter(s => 
        (!courseId || s.course_id === courseId) &&
        (!quizId || s.quiz_id === quizId)
      );
    }
    return results;
  },

  submitQuizResult: async (submissionData) => {
    const newSubmission = {
      id: `sub-${Date.now()}`,
      quiz_id: submissionData.quiz_id,
      course_id: submissionData.course_id,
      student_id: submissionData.student_id || "#STD-ANON",
      student_name: submissionData.student_name || "Anonymous Student",
      score: parseInt(submissionData.score, 10) || 0,
      total_questions: parseInt(submissionData.total_questions, 10) || 0,
      passed: !!submissionData.passed,
      submitted_at: new Date().toISOString()
    };

    inMemoryQuizSubmissions.unshift(newSubmission);
    try {
      await supabase.from("quiz_submissions").insert([newSubmission]);
    } catch (_e) {}

    return newSubmission;
  },


  // --- Courses CRUD with Guaranteed Status Persistence ---
  // --- Courses CRUD with Guaranteed Status Persistence & Robust Deletion ---
  getCourses: async () => {
    let combinedCourses = [];
    try {
      const { data, error } = await supabase.from("courses").select("*");
      if (!error && data && data.length > 0) {
        combinedCourses = [...data];
      }
    } catch (_e) {}

    if (combinedCourses.length === 0) {
      combinedCourses = [...defaultCourses];
    }

    try {
      const { data: customRows } = await supabase.from("students").select("*");
      if (customRows && Array.isArray(customRows)) {
        const courseConfigRow = customRows.find(r => r.id === "CONFIG_CUSTOM_COURSES");
        if (courseConfigRow && courseConfigRow.email) {
          try {
            const customList = JSON.parse(courseConfigRow.email);
            if (Array.isArray(customList)) {
              customList.forEach(c => {
                const existingIdx = combinedCourses.findIndex(x => x.id === c.id);
                if (existingIdx >= 0) {
                  combinedCourses[existingIdx] = { ...combinedCourses[existingIdx], ...c };
                } else {
                  combinedCourses.push(c);
                }
              });
            }
          } catch (_e) {}
        }
      }
    } catch (_e) {}

    if (inMemoryCourses && inMemoryCourses.length > 0) {
      inMemoryCourses.forEach(c => {
        if (!combinedCourses.some(x => x.id === c.id)) {
          combinedCourses.unshift(c);
        }
      });
    }

    return combinedCourses;
  },
  addCourse: async (courseData) => {
    const courseId = `course-${Date.now()}`;
    const newCourse = {
      id: courseId,
      title: courseData.title || "New Course",
      category: courseData.category || "Digital Marketing / SMMA",
      price: courseData.price || "8,500 ETB",
      duration: courseData.duration || "6 Weeks (24 Hours)",
      description: courseData.description || "",
      tg_channel: courseData.tg_channel || "",
      tg_group: courseData.tg_group || "",
      status: courseData.status || "ON",
      coupon_code: courseData.coupon_code ? courseData.coupon_code.trim().toUpperCase() : "",
      coupon_discount: courseData.coupon_discount ? courseData.coupon_discount.trim() : "",
      enrolled_students: parseInt(courseData.enrolled_students, 10) || 0,
      created_at: new Date().toISOString()
    };
    inMemoryCourses.unshift(newCourse);

    try {
      const allCurrent = await dbStore.getCourses();
      if (!allCurrent.some(c => c.id === courseId)) {
        allCurrent.unshift(newCourse);
      }
      const customOnly = allCurrent.filter(c => !defaultCourses.some(dc => dc.id === c.id) || c.id === courseId);

      await supabase.from("students").upsert([{
        id: "CONFIG_CUSTOM_COURSES",
        name: "Founders Academy Custom Courses Store",
        phone: "+251000000000",
        email: JSON.stringify(customOnly),
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      }]);
    } catch (_e) {}

    return newCourse;
  },
  updateCourse: async (id, updateData) => {
    const allCourses = await dbStore.getCourses();
    const target = allCourses.find(x => x.id === id);
    if (target) {
      if (updateData.coupon_code !== undefined) {
        updateData.coupon_code = updateData.coupon_code ? updateData.coupon_code.trim().toUpperCase() : "";
      }
      if (updateData.coupon_discount !== undefined) {
        updateData.coupon_discount = updateData.coupon_discount ? updateData.coupon_discount.trim() : "";
      }
      Object.assign(target, updateData);
    }
    try {
      const customOnly = allCourses.filter(c => !defaultCourses.some(dc => dc.id === c.id && JSON.stringify(dc) === JSON.stringify(c)));
      await supabase.from("students").upsert([{
        id: "CONFIG_CUSTOM_COURSES",
        name: "Founders Academy Custom Courses Store",
        phone: "+251000000000",
        email: JSON.stringify(customOnly),
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      }]);
    } catch (_e) {}
    return target || { id, ...updateData };
  },
  deleteCourse: async (id) => {
    let allCourses = await dbStore.getCourses();
    allCourses = allCourses.filter(x => x.id !== id);
    inMemoryCourses = inMemoryCourses.filter(x => x.id !== id);
    try {
      const customOnly = allCourses.filter(c => !defaultCourses.some(dc => dc.id === c.id));
      await supabase.from("students").upsert([{
        id: "CONFIG_CUSTOM_COURSES",
        name: "Founders Academy Custom Courses Store",
        phone: "+251000000000",
        email: JSON.stringify(customOnly),
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      }]);
    } catch (_e) {}
    return true;
  },

  // --- Course Bundles CRUD ---
  getCourseBundles: async () => {
    let rawBundles = [];
    try {
      const { data, error } = await supabase.from("course_bundles").select("*");
      if (!error && data && data.length > 0) {
        rawBundles = data;
      }
    } catch (_e) {}

    if (rawBundles.length === 0) {
      rawBundles = [...inMemoryBundles];
    } else {
      inMemoryBundles.forEach(mb => {
        if (!rawBundles.some(rb => rb.id === mb.id)) {
          rawBundles.push(mb);
        }
      });
    }

    const allCourses = await dbStore.getCourses();

    return rawBundles.map(b => {
      const mainCourse = allCourses.find(c => c.id === b.main_course_id) || null;
      let incIds = Array.isArray(b.included_course_ids) ? b.included_course_ids : [];
      if (typeof b.included_course_ids === "string") {
        try { incIds = JSON.parse(b.included_course_ids); } catch (_e) { incIds = []; }
      }

      // Include courses even if OFF/inactive as long as they exist in catalog
      const includedCourses = incIds.map(cid => allCourses.find(c => c.id === cid)).filter(Boolean);
      
      const allContainedCourses = mainCourse ? [mainCourse, ...includedCourses.filter(c => c.id !== mainCourse.id)] : includedCourses;
      
      let totalIndividualPriceNum = 0;
      allContainedCourses.forEach(c => {
        const num = parseInt(String(c.price || "").replace(/[^0-9]/g, ""), 10) || 0;
        totalIndividualPriceNum += num;
      });

      return {
        ...b,
        main_course: mainCourse,
        included_courses: includedCourses,
        all_contained_courses: allContainedCourses,
        total_courses_count: allContainedCourses.length,
        total_individual_price_etb: totalIndividualPriceNum ? `${totalIndividualPriceNum.toLocaleString()} ETB` : "N/A"
      };
    });
  },

  getCourseBundleById: async (id) => {
    const bundles = await dbStore.getCourseBundles();
    return bundles.find(b => b.id === id || String(b.id).toLowerCase() === String(id).toLowerCase()) || null;
  },

  addCourseBundle: async (bundleData) => {
    const bundleId = `bundle-${Date.now()}`;
    const mainCourseId = bundleData.main_course_id || bundleData.mainCourseId || "";
    let incCourseIds = Array.isArray(bundleData.included_course_ids) ? bundleData.included_course_ids : (Array.isArray(bundleData.includedCourseIds) ? bundleData.includedCourseIds : []);

    const newBundle = {
      id: bundleId,
      title: (bundleData.title || "New Course Package").trim(),
      description: (bundleData.description || "").trim(),
      price: (bundleData.price || "15,000 ETB").trim(),
      main_course_id: mainCourseId,
      included_course_ids: incCourseIds,
      status: bundleData.status || "ON",
      created_at: new Date().toISOString()
    };

    inMemoryBundles.unshift(newBundle);

    try {
      await supabase.from("course_bundles").insert([newBundle]);
    } catch (_e) {}

    return newBundle;
  },

  updateCourseBundle: async (id, updateData) => {
    const target = inMemoryBundles.find(b => b.id === id);
    if (target) {
      if (updateData.title !== undefined) target.title = updateData.title.trim();
      if (updateData.description !== undefined) target.description = updateData.description.trim();
      if (updateData.price !== undefined) target.price = updateData.price.trim();
      if (updateData.main_course_id !== undefined) target.main_course_id = updateData.main_course_id;
      if (updateData.mainCourseId !== undefined) target.main_course_id = updateData.mainCourseId;
      if (updateData.included_course_ids !== undefined) target.included_course_ids = updateData.included_course_ids;
      if (updateData.includedCourseIds !== undefined) target.included_course_ids = updateData.includedCourseIds;
      if (updateData.status !== undefined) target.status = updateData.status;
    }

    try {
      const payload = {};
      if (updateData.title !== undefined) payload.title = updateData.title.trim();
      if (updateData.description !== undefined) payload.description = updateData.description.trim();
      if (updateData.price !== undefined) payload.price = updateData.price.trim();
      if (updateData.main_course_id !== undefined) payload.main_course_id = updateData.main_course_id;
      if (updateData.mainCourseId !== undefined) payload.main_course_id = updateData.mainCourseId;
      if (updateData.included_course_ids !== undefined) payload.included_course_ids = updateData.included_course_ids;
      if (updateData.includedCourseIds !== undefined) payload.included_course_ids = updateData.includedCourseIds;
      if (updateData.status !== undefined) payload.status = updateData.status;

      await supabase.from("course_bundles").update(payload).eq("id", id);
    } catch (_e) {}

    return target || { id, ...updateData };
  },

  deleteCourseBundle: async (id) => {
    inMemoryBundles = inMemoryBundles.filter(b => b.id !== id);
    try {
      await supabase.from("course_bundles").delete().eq("id", id);
    } catch (_e) {}
    return true;
  },

  // --- Students CRUD ---
  clearStudentsCache: () => {
    inMemoryStudents.length = 0;
    inMemoryTransactions.length = 0;
  },
  getStudents: async () => {
    let tgUsersMap = new Map();
    let tgUsersPhoneMap = new Map();
    try {
      const { data: tgUsers } = await supabase.from("telegram_users").select("*");
      if (tgUsers && Array.isArray(tgUsers)) {
        tgUsers.forEach(u => {
          if (u.telegram_id) {
            tgUsersMap.set(String(u.telegram_id), u);
          }
          if (u.phone_number) {
            const pDigits = String(u.phone_number).replace(/\D/g, "");
            if (pDigits.length >= 9) {
              tgUsersPhoneMap.set(pDigits.slice(-9), u);
            }
          }
        });
      }
    } catch (_e) {}

    try {
      const { data, error } = await supabase.from("students").select("*");
      if (data && Array.isArray(data)) {
        const fetchedStudents = data
          .filter(r => r.id && !String(r.id).startsWith("CONFIG_") && !String(r.id).startsWith("STORE_"))
          .map(r => {
            let cleanTgId = "";
            if (String(r.id).startsWith("TG-")) cleanTgId = String(r.id).replace(/^TG-/, "");
            else if (/^\d{6,}$/.test(String(r.id))) cleanTgId = String(r.id);
            else if (r.telegram_id) cleanTgId = String(r.telegram_id);
            else if (r.chat_id) cleanTgId = String(r.chat_id);

            let tgHandle = r.telegram_username || r.username || "";
            const resolvedTgId = r.telegram_id || r.chat_id || cleanTgId || "";

            if (!tgHandle && r.email) {
              if (r.email.startsWith("@")) {
                tgHandle = r.email.substring(1);
              } else if (r.email.endsWith("@t.me")) {
                tgHandle = r.email.replace(/@t\.me$/, "");
              }
            }

            if (tgHandle) {
              tgHandle = String(tgHandle).replace(/^@/, "").trim();
            }

            return {
              id: r.id,
              name: r.name || "",
              phone: r.phone || "",
              email: r.email || (tgHandle ? `@${tgHandle}` : ""),
              username: tgHandle ? `@${tgHandle}` : (r.username || ""),
              telegram_username: tgHandle || "",
              telegram_id: resolvedTgId || null,
              chat_id: resolvedTgId || null,
              joined_date: r.joined_date || (r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "Recent"),
              status: r.status || (r.is_banned ? "Banned" : "Active"),
              is_banned: r.is_banned || r.status === "Banned" || false,
              ban_reason: r.ban_reason || null,
              banned_at: r.banned_at || null,
              password_hash: r.password_hash || r.password || null
            };
          });

        return fetchedStudents;
      }
    } catch (_e) {}
    return [];
  },
  addStudent: async (student) => {
    const newStu = {
      id: student.id || `STU-${Math.floor(10000 + Math.random() * 90000)}`,
      name: student.name !== undefined ? student.name : "",
      phone: student.phone || "",
      email: student.email || student.username || "",
      username: student.username || student.email || "",
      password_hash: student.password_hash || student.password || "",
      telegram_id: student.telegram_id || "",
      chat_id: student.chat_id || "",
      telegram_username: student.telegram_username || "",
      status: student.status || "Active",
      joined_date: student.joined_date || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    };
    try {
      await supabase.from("students").upsert([newStu], { onConflict: "id" });
    } catch (err) {
      console.error("[dbStore.addStudent Error]:", err.message);
    }
    const existingIdx = inMemoryStudents.findIndex(s => s.id === newStu.id);
    if (existingIdx >= 0) {
      inMemoryStudents[existingIdx] = newStu;
    } else {
      inMemoryStudents.push(newStu);
    }
    return newStu;
  },
  updateStudent: async (id, data) => {
    const rawId = String(id || "").trim();
    const cleanTgId = rawId.replace(/^TG-/, "").trim();
    const candidateIds = Array.from(new Set([rawId, `TG-${cleanTgId}`, cleanTgId].filter(Boolean)));
    try {
      await supabase.from("students").update(data).in("id", candidateIds);
      if (cleanTgId) {
        await supabase.from("students").update(data).eq("telegram_id", cleanTgId);
        await supabase.from("students").update(data).eq("chat_id", cleanTgId);
      }
    } catch (_e) { /* fallback */ }

    let updated = null;
    inMemoryStudents.forEach(s => {
      const sId = String(s.id || "").trim();
      const sTg = String(s.telegram_id || "").trim();
      const sChat = String(s.chat_id || "").trim();
      if (candidateIds.includes(sId) || sTg === cleanTgId || sChat === cleanTgId) {
        Object.assign(s, data);
        updated = s;
      }
    });
    return updated || { id: rawId, ...data };
  },
  saveStudentPhone: async (telegramId, phone, name = "") => {
    const rawTgId = String(telegramId || "").trim();
    const cleanTgId = rawTgId.replace(/^TG-/, "").trim();
    const cleanPhone = String(phone || "").trim();
    if (!cleanTgId || !cleanPhone) return false;

    const candidateIds = Array.from(new Set([rawTgId, `TG-${cleanTgId}`, cleanTgId].filter(Boolean)));
    const payload = {
      phone: cleanPhone,
      telegram_id: cleanTgId,
      chat_id: cleanTgId
    };
    if (name && name.trim()) payload.name = name.trim();

    try {
      await supabase.from("students").update(payload).in("id", candidateIds);
      await supabase.from("students").update(payload).eq("telegram_id", cleanTgId);
      await supabase.from("students").update(payload).eq("chat_id", cleanTgId);
    } catch (_e) {}

    try {
      const studentPayload = {
        id: `TG-${cleanTgId}`,
        email: `user_${cleanTgId}@foundersacademy.et`,
        username: `@user_${cleanTgId}`,
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        ...payload
      };
      await supabase.from("students").upsert([studentPayload], { onConflict: "id" });
    } catch (_e) {}

    let found = false;
    inMemoryStudents.forEach(s => {
      const sId = String(s.id || "").trim();
      const sTg = String(s.telegram_id || "").trim();
      const sChat = String(s.chat_id || "").trim();
      if (candidateIds.includes(sId) || sTg === cleanTgId || sChat === cleanTgId) {
        Object.assign(s, payload);
        found = true;
      }
    });

    if (!found) {
      inMemoryStudents.push({
        id: `TG-${cleanTgId}`,
        name: name || "",
        phone: cleanPhone,
        email: `user_${cleanTgId}@foundersacademy.et`,
        username: `@user_${cleanTgId}`,
        telegram_id: cleanTgId,
        chat_id: cleanTgId,
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        status: "Active"
      });
    }

    return true;
  },

  banStudent: async (id, reason = "Violation of platform terms") => {
    const rawId = String(id || "").trim();
    const cleanTgId = rawId.replace(/^TG-/, "").trim();
    const candidateIds = Array.from(new Set([rawId, `TG-${cleanTgId}`, cleanTgId].filter(Boolean)));

    const dbPayload = {
      status: "Banned",
      ban_reason: reason
    };

    const memPayload = {
      status: "Banned",
      is_banned: true,
      ban_reason: reason,
      banned_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from("students").update(dbPayload).in("id", candidateIds);
      if (error) console.error("[banStudent DB Error]:", error.message);
    } catch (_e) {}

    if (/^\d{6,}$/.test(cleanTgId)) {
      try {
        const sanitizedReason = (reason || "Violation of platform terms").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        await telegramApi("sendMessage", {
          chat_id: cleanTgId,
          text: `🚫 <b>ACCOUNT SUSPENDED / BANNED</b> 🛑\n\nYour Founders Academy student account and Telegram bot access have been suspended by an administrator.\n\n<b>Reason:</b> ${sanitizedReason}\n\nIf you believe this is a mistake, please contact support:\n👉 @foundersupportt`,
          parse_mode: "HTML"
        });
      } catch (_e) {}
    }

    let updatedStudent = null;
    inMemoryStudents.forEach(s => {
      if (s.id && candidateIds.includes(String(s.id).trim())) {
        Object.assign(s, memPayload);
        updatedStudent = s;
      }
    });

    return updatedStudent || { id: rawId, ...memPayload };
  },
  unbanStudent: async (id) => {
    const rawId = String(id || "").trim();
    const cleanTgId = rawId.replace(/^TG-/, "").trim();
    const candidateIds = Array.from(new Set([rawId, `TG-${cleanTgId}`, cleanTgId].filter(Boolean)));

    const dbPayload = {
      status: "Active",
      ban_reason: null
    };

    const memPayload = {
      status: "Active",
      is_banned: false,
      ban_reason: null,
      banned_at: null
    };

    try {
      const { error } = await supabase.from("students").update(dbPayload).in("id", candidateIds);
      if (error) console.error("[unbanStudent DB Error]:", error.message);
    } catch (_e) {}

    if (/^\d{6,}$/.test(cleanTgId)) {
      try {
        await telegramApi("sendMessage", {
          chat_id: cleanTgId,
          text: `🎉 <b>ACCOUNT RESTORED / UNBANNED</b> ⚡\n\nYour Founders Academy student account and Telegram bot access have been restored by an administrator.\n\nYou can now access your courses and student services!`,
          parse_mode: "HTML"
        });
      } catch (_e) {}
    }

    let updatedStudent = null;
    inMemoryStudents.forEach(s => {
      if (s.id && candidateIds.includes(String(s.id).trim())) {
        Object.assign(s, memPayload);
        updatedStudent = s;
      }
    });

    return updatedStudent || { id: rawId, ...memPayload };
  },
  deleteStudent: async (id) => {
    const rawId = String(id || "").trim();
    if (!rawId) return { success: false, error: "Missing student ID" };

    const cleanTgId = rawId.replace(/^TG-/, "").trim();
    const candidateIds = Array.from(new Set([rawId, `TG-${cleanTgId}`, cleanTgId].filter(Boolean)));

    // 1. Delete from Supabase 'students' table
    try {
      await supabase.from("students").delete().in("id", candidateIds);
    } catch (_e) {}

    // 2. Delete associated transactions
    try {
      await supabase.from("transactions").delete().in("student_id", candidateIds);
    } catch (_e) {}

    // 3. Delete 1-time invite links if any
    try {
      await supabase.from("enrollment_invites").delete().in("telegram_id", candidateIds);
    } catch (_e) {}

    // 4. Remove from memory store
    inMemoryStudents = inMemoryStudents.filter(s => !candidateIds.includes(String(s.id).trim()));

    return { success: true, id: rawId };
  },
  isStudentBanned: async (telegramId) => {
    if (!telegramId) return { banned: false };
    const cleanId = String(telegramId).replace(/^TG-/, "").trim();
    const candidateIds = Array.from(new Set([`TG-${cleanId}`, cleanId, String(telegramId).trim()].filter(Boolean)));

    const mem = inMemoryStudents.find(s => s.id && candidateIds.includes(String(s.id).trim()));
    if (mem && (mem.status === "Banned" || mem.is_banned === true)) {
      return { banned: true, reason: mem.ban_reason || "Violation of platform terms" };
    }

    try {
      const { data } = await supabase
        .from("students")
        .select("id, status, ban_reason")
        .in("id", candidateIds);
      if (data && Array.isArray(data)) {
        const bannedRow = data.find(r => r.status === "Banned");
        if (bannedRow) {
          return { banned: true, reason: bannedRow.ban_reason || "Violation of platform terms" };
        }
      }
    } catch (_e) {}

    return { banned: false };
  },

  registerStudent: async (data) => dbStore.registerStudentAccount(data || {}),
  registerStudentAccount: async ({ name, phone, email, username, password }) => {
    const rawPhone = String(phone || "").trim();
    const rawEmail = String(email || "").trim();
    const rawUsername = String(username || "").trim();
    const cleanName = String(name || "").trim() || "Student";
    const passwordStr = String(password || "").trim();

    if (!passwordStr || passwordStr.length < 4) {
      return { success: false, error: "Password must be at least 4 characters long." };
    }

    let cleanPhone = rawPhone;
    let cleanUsername = rawUsername || rawEmail;

    if (rawPhone.startsWith("@")) {
      cleanUsername = rawPhone;
      cleanPhone = "";
    }

    if (!cleanUsername && cleanPhone.startsWith("@")) {
      cleanUsername = cleanPhone;
    }

    let phoneDigits = cleanPhone.replace(/[^0-9]/g, "");
    if (phoneDigits.startsWith("251")) {
      phoneDigits = phoneDigits.substring(3);
    } else if (phoneDigits.startsWith("0")) {
      phoneDigits = phoneDigits.substring(1);
    }

    if (cleanPhone && phoneDigits.length !== 9 && !cleanUsername) {
      return { success: false, error: "📱 Mandatory +251 Ethiopian phone number: Please enter a valid 9-digit number starting with +251 (e.g. +251 91 234 5678)." };
    }

    const last9Phone = phoneDigits.length >= 9 ? phoneDigits.slice(-9) : phoneDigits;

    if (!last9Phone && !cleanUsername) {
      return { success: false, error: "📱 Please enter a valid 9-digit Ethiopian phone number starting with +251 (e.g. +251 91 234 5678)." };
    }

    const allStudents = await dbStore.getStudents();
    const existing = allStudents.find(s => {
      const sDigits = (s.phone || "").replace(/[^0-9]/g, "");
      const sLast9 = sDigits.length >= 9 ? sDigits.slice(-9) : sDigits;
      const sEmail = (s.email || "").toLowerCase();
      const sUsername = (s.username || sEmail).toLowerCase();

      if (last9Phone && sLast9 && last9Phone === sLast9) return true;
      if (cleanUsername && (sEmail === cleanUsername.toLowerCase() || sUsername === cleanUsername.toLowerCase())) return true;
      return false;
    });

    if (existing && existing.password_hash) {
      return { success: false, error: "An account with this phone number or username already exists. Please log in." };
    }

    let formattedPhone = `+251 ${last9Phone.slice(0, 2)} ${last9Phone.slice(2, 5)} ${last9Phone.slice(5)}`;

    const formattedUsername = cleanUsername ? (cleanUsername.startsWith("@") ? cleanUsername : `@${cleanUsername.replace(/^@/, '')}`) : `@${last9Phone || 'student'}`;

    const studentId = existing ? existing.id : `STU-${Math.floor(10000 + Math.random() * 90000)}`;
    const studentData = {
      id: studentId,
      name: cleanName,
      phone: formattedPhone || (existing ? existing.phone : ""),
      email: formattedUsername,
      username: formattedUsername,
      password_hash: passwordStr,
      status: "Active",
      joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    };

    if (existing) {
      await dbStore.updateStudent(existing.id, studentData);
    } else {
      await dbStore.addStudent(studentData);
    }

    return {
      success: true,
      message: "Student account created successfully!",
      student: {
        id: studentData.id,
        name: studentData.name,
        phone: studentData.phone,
        email: studentData.email,
        username: studentData.username
      }
    };
  },

  authenticateStudent: async ({ identifier, password }) => {
    const rawId = String(identifier || "").trim();
    const cleanIdLower = rawId.toLowerCase();
    const idDigits = rawId.replace(/[^0-9]/g, "");
    const last9Id = idDigits.length >= 9 ? idDigits.slice(-9) : idDigits;
    const passwordStr = String(password || "").trim();

    if (!rawId) {
      return { success: false, error: "📱 Phone number or username is required." };
    }
    if (!passwordStr) {
      return { success: false, error: "🔑 Password is required." };
    }

    const allStudents = await dbStore.getStudents();
    const match = allStudents.find(s => {
      if (!s.id || String(s.id).startsWith("CONFIG_") || String(s.id).startsWith("STORE_")) return false;
      const sDigits = (s.phone || "").replace(/[^0-9]/g, "");
      const sLast9 = sDigits.length >= 9 ? sDigits.slice(-9) : sDigits;
      const sEmail = (s.email || "").toLowerCase();
      const sUsername = (s.username || sEmail).toLowerCase();
      const sId = (s.id || "").toLowerCase();

      if (last9Id && last9Id.length >= 8 && sLast9 && sLast9 === last9Id) return true;
      if (sEmail && (sEmail === cleanIdLower || sEmail === `@${cleanIdLower.replace(/^@/, '')}`)) return true;
      if (sUsername && (sUsername === cleanIdLower || sUsername === `@${cleanIdLower.replace(/^@/, '')}`)) return true;
      if (sId && sId === cleanIdLower) return true;
      return false;
    });

    if (!match) {
      return { 
        success: false, 
        error_type: "phone_not_found",
        error: `📱 Unregistered Phone Number: No student account found for "${rawId}". Please click the "Create Account" tab above to sign up!` 
      };
    }

    if (match.status === "Banned" || match.is_banned === true) {
      return { 
        success: false, 
        error_type: "account_banned",
        error: `🚫 Account Suspended: Your student account (${rawId}) has been suspended. Reason: ${match.ban_reason || 'Violation of platform terms'}` 
      };
    }

    if (match.password_hash && match.password_hash !== passwordStr) {
      return { 
        success: false, 
        error_type: "incorrect_password",
        error: `🔑 Incorrect Password: The password you entered for "${rawId}" is incorrect. Please check your password or click "Forgot Password?".` 
      };
    }

    if (!match.password_hash) {
      await dbStore.updateStudent(match.id, { password_hash: passwordStr });
    }

    return {
      success: true,
      message: "Logged in successfully!",
      student: {
        id: match.id,
        name: match.name,
        phone: match.phone,
        email: match.email,
        username: match.username || match.email
      }
    };
  },

  authenticateTelegramUser: async (tgData) => {
    const data = (tgData && tgData.user && typeof tgData.user === "object") ? tgData.user : (tgData || {});

    const action = data.action || tgData?.action;
    const identifier = data.identifier || tgData?.identifier || data.phone || data.phone_number || data.username || data.handle;
    const code = data.code || tgData?.code || data.otp;

    if (action === "request-code" || (identifier && !data.id && !data.telegram_id && !data.user_id && !data.hash && !code)) {
      return dbStore.requestStudentTelegramOtp(identifier);
    }
    if (action === "verify-code" || (identifier && code)) {
      return dbStore.verifyStudentTelegramOtp(identifier, code);
    }

    const rawId = data.id || data.telegram_id || data.user_id || data.username || data.phone || data.phone_number || data.first_name || identifier || ("tg_" + Date.now());

    if (!data || (typeof data !== "object") || Object.keys(data).length === 0) {
      return { success: false, error: "Invalid Telegram authentication payload. Empty or invalid payload." };
    }

    const tgIdStr = String(rawId).trim();
    const formattedId = tgIdStr.startsWith("TG-") ? tgIdStr : `TG-${tgIdStr}`;
    const rawNumId = tgIdStr.replace(/^TG-/, "");

    const firstName = String(data.first_name || "").trim();
    const lastName = String(data.last_name || "").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || data.name || data.username || `Telegram Student ${rawNumId}`;
    const username = data.username ? `@${String(data.username).replace(/^@/, "")}` : "";
    const photoUrl = data.photo_url || data.avatar_url || "";
    const phone = data.phone || data.phone_number || "";

    const allStudents = await dbStore.getStudents();
    const existing = allStudents.find(s => {
      if (s.id && String(s.id).trim() === formattedId) return true;
      if (s.id && String(s.id).trim().replace(/^TG-/, "") === rawNumId) return true;
      if (phone && s.phone && s.phone.replace(/[^0-9]/g, "") === phone.replace(/[^0-9]/g, "")) return true;
      if (username && s.email && s.email.toLowerCase() === username.toLowerCase()) return true;
      return false;
    });

    if (existing && (existing.status === "Banned" || existing.is_banned === true)) {
      return { success: false, error: `Account suspended. Reason: ${existing.ban_reason || 'Violation of terms'}` };
    }

    const updatedData = {
      id: existing ? existing.id : formattedId,
      name: fullName || (existing ? existing.name : "Telegram Student"),
      phone: phone || (existing ? existing.phone : ""),
      email: username || (existing ? existing.email : `${rawNumId}@telegram`),
      avatar_url: photoUrl || (existing ? existing.avatar_url : ""),
      status: "Active"
    };

    if (existing) {
      await dbStore.updateStudent(existing.id, updatedData);
    } else {
      updatedData.joined_date = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
      await dbStore.addStudent(updatedData);
    }

    return {
      success: true,
      message: existing ? "Welcome back! Logged in with Telegram." : "Account created & logged in via Telegram!",
      student: {
        id: updatedData.id,
        name: updatedData.name,
        phone: updatedData.phone,
        email: updatedData.email,
        avatar_url: updatedData.avatar_url
      }
    };
  },

  telegramAuthLogin: async (tgData) => {
    return dbStore.authenticateTelegramUser(tgData);
  },

  requestStudentTelegramOtp: async (identifier) => {
    const cleanId = String(identifier || "").trim();
    if (!cleanId) {
      return { success: false, error: "Please enter a valid Telegram handle (@username) or phone number." };
    }

    const handleStr = cleanId.startsWith("@") ? cleanId : (cleanId.startsWith("+") ? cleanId : `@${cleanId.replace(/^@/, "")}`);
    const cleanHandle = handleStr.toLowerCase();
    
    // Find linked Telegram user / student
    const students = await dbStore.getStudents();
    const existing = students.find(s => {
      const sEmail = (s.email || "").toLowerCase();
      const sPhone = (s.phone || "").replace(/[^0-9]/g, "");
      const searchDigits = cleanId.replace(/[^0-9]/g, "");
      if (sEmail === cleanHandle || sEmail === `@${cleanHandle.replace(/^@/, "")}`) return true;
      if (searchDigits && searchDigits.length >= 8 && sPhone.includes(searchDigits)) return true;
      return false;
    });

    let targetChatId = null;
    if (existing && existing.id && existing.id.startsWith("TG-")) {
      targetChatId = existing.id.replace("TG-", "");
    }

    // Generate time-limited 6-digit OTP code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    if (!globalThis._studentTelegramOtps) {
      globalThis._studentTelegramOtps = new Map();
    }

    const otpPayload = {
      code,
      expiresAt,
      handle: handleStr,
      existingStudent: existing || null,
      targetChatId
    };

    globalThis._studentTelegramOtps.set(cleanHandle, otpPayload);

    const digitsKey = cleanId.replace(/[^0-9]/g, "");
    if (digitsKey) {
      globalThis._studentTelegramOtps.set(digitsKey, otpPayload);
    }

    // Attempt direct Telegram message dispatch if chat ID is linked
    let messageSent = false;
    if (targetChatId) {
      try {
        await telegramApi("sendMessage", {
          chat_id: targetChatId,
          text: `🔐 *Founders Academy 1-Tap Security Verification*\n\nHello *${existing?.name || 'Student'}*,\nYour 1-Time Web Login Verification Code is:\n\n🔑 *${code}*\n\n_This code expires in 5 minutes. Do not share it with anyone._`,
          parse_mode: "Markdown"
        });
        messageSent = true;
      } catch (_e) {}
    }

    const botUrl = `https://t.me/founders_academybot?start=auth_${code}`;

    return {
      success: true,
      message: messageSent ? 
        `Verification code sent directly to your Telegram chat (${handleStr})!` : 
        `Verification code generated! Open Telegram Bot @founders_academybot or click below to receive code.`,
      codeSent: messageSent,
      botUrl,
      identifier: handleStr,
      demoCode: code
    };
  },

  pollStudentTelegramOtp: async (code) => {
    const codeStr = String(code || "").trim();
    const otpStore = globalThis._studentTelegramOtps;
    if (!otpStore) return { verified: false };

    for (const [_, val] of otpStore.entries()) {
      if (val.code === codeStr) {
        if (Date.now() > val.expiresAt) {
          return { verified: false, expired: true, error: "Code expired" };
        }
        if (val.verified && val.student) {
          return { verified: true, student: val.student };
        }
      }
    }
    return { verified: false };
  },

  authorizeStudentTelegramOtpFromBot: async (code, tgUser) => {
    const codeStr = String(code || "").trim();
    const otpStore = globalThis._studentTelegramOtps;
    if (!otpStore) return { success: false };

    let targetEntry = null;

    for (const [_, val] of otpStore.entries()) {
      if (val.code === codeStr && val.expiresAt > Date.now()) {
        targetEntry = val;
        break;
      }
    }

    if (!targetEntry) return { success: false };

    const result = await dbStore.authenticateTelegramUser({
      id: tgUser.id || tgUser.telegram_id,
      username: tgUser.username || targetEntry.handle,
      first_name: tgUser.first_name || targetEntry.handle.replace(/^@/, ""),
      last_name: tgUser.last_name || "",
      phone: tgUser.phone_number || tgUser.phone || ""
    });

    if (result.success && result.student) {
      targetEntry.verified = true;
      targetEntry.student = result.student;
      return { success: true, student: result.student };
    }

    return { success: false };
  },

  verifyStudentTelegramOtp: async (identifier, code) => {
    const cleanId = String(identifier || "").trim().toLowerCase();
    const digitsKey = cleanId.replace(/[^0-9]/g, "");
    const codeStr = String(code || "").trim();

    const otpStore = globalThis._studentTelegramOtps;
    let otpData = otpStore ? (otpStore.get(cleanId) || (digitsKey ? otpStore.get(digitsKey) : null)) : null;

    if (!otpData && otpStore) {
      for (const [_, val] of otpStore.entries()) {
        if (val.code === codeStr && val.expiresAt > Date.now()) {
          otpData = val;
          break;
        }
      }
    }

    if (!otpData) {
      return { success: false, error: "No verification code request found. Please request a new code." };
    }

    if (Date.now() > otpData.expiresAt) {
      return { success: false, error: "Verification code has expired. Please request a new code." };
    }

    if (otpData.code !== codeStr) {
      return { success: false, error: "Incorrect verification code. Please check the code sent to your Telegram." };
    }

    const handleStr = otpData.handle || cleanId;
    const authPayload = {
      id: otpData.targetChatId || "tg_" + Date.now(),
      username: handleStr,
      first_name: handleStr.replace(/^@/, ""),
      name: handleStr
    };

    const result = await dbStore.authenticateTelegramUser(authPayload);

    if (otpStore) {
      otpStore.delete(cleanId);
      if (digitsKey) otpStore.delete(digitsKey);
    }

    return result;
  },

  changeStudentPassword: async ({ studentId, currentPassword, newPassword }) => {
    const newPassStr = String(newPassword || "").trim();
    const curPassStr = String(currentPassword || "").trim();

    if (!newPassStr || newPassStr.length < 4) {
      return { success: false, error: "New password must be at least 4 characters long." };
    }

    const student = await dbStore.getStudentById(studentId);
    if (!student) {
      return { success: false, error: "Student account not found." };
    }

    if (student.password_hash && student.password_hash !== curPassStr) {
      return { success: false, error: "Current password is incorrect." };
    }

    await dbStore.updateStudent(student.id, { password_hash: newPassStr });
    return { success: true, message: "Password updated successfully!" };
  },

  resetStudentPassword: async ({ phone, identifier, newPassword }) => {
    const rawPhone = String(phone || identifier || "").trim();
    const passwordStr = String(newPassword || "").trim();

    if (!passwordStr || passwordStr.length < 4) {
      return { success: false, error: "New password must be at least 4 characters long." };
    }

    const cleanDigits = rawPhone.replace(/\D/g, "");
    const last9 = cleanDigits.length >= 9 ? cleanDigits.slice(-9) : cleanDigits;

    if (!last9) {
      return { success: false, error: "Please enter a valid phone number (starting with 251)." };
    }

    const allStudents = await dbStore.getStudents();
    const student = allStudents.find(s => {
      const sDigits = (s.phone || "").replace(/\D/g, "");
      return sDigits.length >= 9 && sDigits.endsWith(last9);
    });

    if (!student) {
      return { success: false, error: "No student account found with this phone number. Please sign up first." };
    }

    try {
      await supabase.from("students").update({ password_hash: passwordStr }).eq("id", student.id);
    } catch (_e) {}
    await dbStore.updateStudent(student.id, { password_hash: passwordStr });

    return {
      success: true,
      message: "Password reset successfully! You can now log in with your new password.",
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone
      }
    };
  },

  getStudentCoursesWithLinks: async (studentIdOrPhone) => {
    const allStudents = await dbStore.getStudents();
    const cleanSearch = String(studentIdOrPhone || "").trim().toLowerCase();
    const searchDigits = cleanSearch.replace(/[^0-9]/g, "");
    const searchLast9 = searchDigits.length >= 9 ? searchDigits.slice(-9) : searchDigits;

    const student = allStudents.find(s => {
      if (!s.id || String(s.id).startsWith("CONFIG_") || String(s.id).startsWith("STORE_")) return false;
      const sId = (s.id || "").toLowerCase();
      const sPhoneDigits = (s.phone || "").replace(/[^0-9]/g, "");
      const sLast9 = sPhoneDigits.length >= 9 ? sPhoneDigits.slice(-9) : sPhoneDigits;
      const sEmail = (s.email || "").toLowerCase();
      const sUsername = (s.username || sEmail).toLowerCase();

      if (sId === cleanSearch || sId === `tg-${cleanSearch}`) return true;
      if (searchLast9 && searchLast9.length >= 8 && sLast9 && sLast9 === searchLast9) return true;
      if (sEmail && (sEmail === cleanSearch || sEmail === `@${cleanSearch.replace(/^@/, '')}`)) return true;
      if (sUsername && (sUsername === cleanSearch || sUsername === `@${cleanSearch.replace(/^@/, '')}`)) return true;
      return false;
    });

    const courses = await dbStore.getCourses();
    const txns = await dbStore.getTransactions();

    const studentPhoneDigits = student ? (student.phone || "").replace(/[^0-9]/g, "") : "";
    const studentLast9 = studentPhoneDigits.length >= 9 ? studentPhoneDigits.slice(-9) : studentPhoneDigits;
    const studentIdClean = student ? (student.id || "").toLowerCase() : cleanSearch;
    const studentEmailClean = student ? (student.email || "").toLowerCase().trim() : cleanSearch;

    const matchedTxns = txns.filter(t => {
      const tPhoneDigits = (t.student_phone || t.studentPhone || t.phone || "").replace(/[^0-9]/g, "");
      const tLast9 = tPhoneDigits.length >= 9 ? tPhoneDigits.slice(-9) : tPhoneDigits;
      const tEmail = (t.student_email || t.studentEmail || t.email || "").toLowerCase().trim();
      const tName = (t.student_name || t.studentName || "").toLowerCase().trim();
      const tRef = (t.reference_number || t.referenceNumber || t.id || "").toLowerCase();
      const tStudentId = (t.student_id || t.studentId || "").toLowerCase();

      // 1. Last 9 Digits Phone Match (0961147131 vs 251961147131)
      if (searchLast9 && searchLast9.length >= 8 && tLast9 && tLast9 === searchLast9) return true;
      if (studentLast9 && studentLast9.length >= 8 && tLast9 && tLast9 === studentLast9) return true;

      // 2. Student ID Match
      if (studentIdClean && (tStudentId === studentIdClean || tRef.includes(studentIdClean))) return true;

      // 3. Email Match
      if (studentEmailClean && tEmail && (tEmail === studentEmailClean || tEmail.includes(studentEmailClean))) return true;

      // 4. Search Text & User ID Match
      if (studentIdClean && (tName === studentIdClean || tName.includes(studentIdClean))) return true;
      if (cleanSearch && cleanSearch.length >= 3 && (tEmail.includes(cleanSearch) || tName.includes(cleanSearch))) return true;

      return false;
    });

    const enrolledList = [];
    const addedCourseIds = new Set();
    const allBundles = await dbStore.getCourseBundles();

    for (const t of matchedTxns) {
      const targetId = String(t.course_id || t.courseId || "").trim();
      const targetTitle = String(t.course_title || t.courseTitle || "").trim();

      // Check if transaction was for a Course Bundle
      const matchedBundle = allBundles.find(b => 
        b.id === targetId || 
        b.id === targetTitle ||
        b.title.toLowerCase() === targetTitle.toLowerCase() ||
        targetId.startsWith("bundle-")
      );

      if (matchedBundle && Array.isArray(matchedBundle.all_contained_courses)) {
        // Unlock access for ALL contained courses (Main + all included courses, even if OFF)
        matchedBundle.all_contained_courses.forEach(c => {
          if (c && !addedCourseIds.has(c.id)) {
            addedCourseIds.add(c.id);
            enrolledList.push({
              id: c.id,
              title: c.title,
              category: c.category,
              price: c.price,
              duration: c.duration || "6 Weeks",
              is_from_bundle: true,
              bundle_id: matchedBundle.id,
              bundle_title: matchedBundle.title,
              is_main_course: matchedBundle.main_course_id === c.id,
              status: t.status === "Completed" || t.status === "VERIFIED" ? "Verified Active" : "Pending Verification",
              paymentMethod: t.payment_method || t.paymentMethod || "Bank Transfer",
              referenceNumber: t.reference_number || t.referenceNumber || t.id,
              date: t.created_at || t.date || new Date().toLocaleDateString(),
              tg_channel: c.tg_channel || "https://t.me/founders_academybot",
              tg_group: c.tg_group || "https://t.me/founders_academybot"
            });
          }
        });
      } else {
        // Standard single course enrollment
        const course = courses.find(c => String(c.id) === targetId || String(c.id) === targetTitle || String(c.title).toLowerCase() === targetTitle.toLowerCase()) || courses[0];
        if (course && !addedCourseIds.has(course.id)) {
          addedCourseIds.add(course.id);
          enrolledList.push({
            id: course.id,
            title: course.title,
            category: course.category,
            price: course.price,
            duration: course.duration || "6 Weeks",
            status: t.status === "Completed" || t.status === "VERIFIED" ? "Verified Active" : "Pending Verification",
            paymentMethod: t.payment_method || t.paymentMethod || "Bank Transfer",
            referenceNumber: t.reference_number || t.referenceNumber || t.id,
            date: t.created_at || t.date || new Date().toLocaleDateString(),
            tg_channel: course.tg_channel || "https://t.me/founders_smma_channel",
            tg_group: course.tg_group || "https://t.me/founders_smma_group"
          });
        }
      }
    }

    // Deduplicate enrolledList by course.id so each enrolled course appears ONLY ONCE
    const uniqueEnrolledList = [];
    const seenCourseIds = new Set();
    for (const item of enrolledList) {
      if (item && item.id && !seenCourseIds.has(item.id)) {
        seenCourseIds.add(item.id);
        uniqueEnrolledList.push(item);
      }
    }

    return {
      student: student || null,
      courses: uniqueEnrolledList
    };
  },

  // --- Transactions & Financial Ledger CRUD ---
  getTransactions: async () => {
    try {
      const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        return data;
      }
    } catch (_e) { /* fallback */ }

    return inMemoryTransactions;
  },
  getTransactionById: async (id) => {
    const list = await dbStore.getTransactions();
    return list.find(t => t.id === id || t.reference_number === id || t.referenceNumber === id) || null;
  },
  addTransaction: async (txnData) => {
    const newTxn = {
      id: txnData.id || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      student_name: txnData.student_name || txnData.studentName || "Anonymous",
      student_phone: txnData.student_phone || txnData.studentPhone || "",
      student_email: txnData.student_email || txnData.studentEmail || "",
      course_title: txnData.course_title || txnData.courseTitle || "Course Enrollment",
      course_id: txnData.course_id || txnData.courseId || "",
      payment_method: txnData.payment_method || txnData.paymentMethod || "telebirr",
      reference_number: txnData.reference_number || txnData.referenceNumber || "",
      account_suffix: txnData.account_suffix || txnData.accountSuffix || "",
      amount: typeof txnData.amount === "number" ? `ETB ${txnData.amount.toLocaleString()}` : (txnData.amount || "ETB 0"),
      status: txnData.status || "Completed",
      verify_et_status: txnData.verify_et_status || "VERIFIED",
      metadata: txnData.metadata || {},
      created_at: txnData.created_at || new Date().toISOString()
    };

    if (newTxn.student_phone) {
      await dbStore.addStudent({
        name: newTxn.student_name,
        phone: newTxn.student_phone,
        email: newTxn.student_email
      });
    }

    try {
      const dbPayload = {
        id: newTxn.id,
        student_name: newTxn.student_name,
        course_title: newTxn.course_title,
        amount: newTxn.amount,
        payment_method: newTxn.payment_method,
        status: newTxn.status,
        created_at: newTxn.created_at
      };
      await supabase.from("transactions").insert([dbPayload]);
    } catch (_e) { /* fallback */ }

    inMemoryTransactions.unshift(newTxn);
    return newTxn;
  },
  updateTransactionStatus: async (id, status, metadata = {}) => {
    const patch = { status, ...(metadata ? { metadata } : {}) };
    try {
      await supabase.from("transactions").update(patch).eq("id", id);
    } catch (_e) { /* fallback */ }

    const txn = inMemoryTransactions.find(t => t.id === id || t.reference_number === id);
    if (txn) {
      txn.status = status;
      if (metadata) txn.metadata = { ...(txn.metadata || {}), ...metadata };
      return txn;
    }
    return null;
  },

  // --- Auto-Enrollment Helper ---
  enrollStudentAndGrantAccess: async ({ student, courseId, txnId }) => {
    // 1. Add student if not existing
    const newStudent = await dbStore.addStudent(student);

    // 2. Increment course enrolled_students count
    const courses = await dbStore.getCourses();
    const course = courses.find(c => c.id === courseId || c.title === courseId);
    if (course) {
      const currentCount = parseInt(course.enrolled_students || 0, 10);
      await dbStore.updateCourse(course.id, {
        enrolled_students: currentCount + 1
      });
    }

    return {
      student: newStudent,
      course: course || null,
      transactionId: txnId,
      accessGranted: true,
      telegramLinks: {
        channel: course?.tg_channel || "https://t.me/founders_academybot",
        group: course?.tg_group || "https://t.me/founders_academybot"
      }
    };
  },

  // --- Maintenance State ---
  // --- Maintenance State ---
  getMaintenance: async () => {
    try {
      const { data } = await supabase.from("students").select("*").eq("id", "CONFIG_MAINTENANCE").maybeSingle();
      if (data && data.email) {
        const parsed = JSON.parse(data.email);
        inMemoryMaintenance = { ...inMemoryMaintenance, ...parsed };
        return inMemoryMaintenance;
      }
    } catch (_e) {}
    return inMemoryMaintenance;
  },
  updateMaintenance: async (data) => {
    inMemoryMaintenance = {
      status: (data && data.status) || inMemoryMaintenance.status,
      title: (data && data.title) || inMemoryMaintenance.title,
      message: (data && data.message) || inMemoryMaintenance.message
    };
    try {
      await supabase.from("students").upsert([{
        id: "CONFIG_MAINTENANCE",
        name: "Founders Academy Maintenance Store",
        phone: "+251000000000",
        email: JSON.stringify(inMemoryMaintenance),
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      }]);
    } catch (_e) {}
    return inMemoryMaintenance;
  },

  // --- Landing CMS Store ---
  getLandingConfig: async () => {
    try {
      const { data } = await supabase.from("students").select("*").eq("id", "CONFIG_LANDING_CMS").maybeSingle();
      if (data && data.email) {
        const parsed = JSON.parse(data.email);
        inMemoryLandingConfig = { ...defaultLandingConfig, ...inMemoryLandingConfig, ...parsed };
        return inMemoryLandingConfig;
      }
    } catch (_e) {}
    return inMemoryLandingConfig;
  },
  updateLandingConfig: async (config) => {
    try {
      await dbStore.getLandingConfig();
    } catch (_e) {}

    const base = inMemoryLandingConfig || defaultLandingConfig;
    const incoming = config || {};

    const mergedHero = incoming.hero ? { ...base.hero, ...incoming.hero } : base.hero;
    if (incoming.hero && incoming.hero.introVideo) {
      mergedHero.introVideo = { ...(base.hero?.introVideo || {}), ...incoming.hero.introVideo };
    }

    const mergedAnn = incoming.announcement ? { ...base.announcement, ...incoming.announcement } : base.announcement;

    inMemoryLandingConfig = {
      ...defaultLandingConfig,
      ...base,
      ...incoming,
      hero: mergedHero,
      announcement: mergedAnn
    };

    try {
      await supabase.from("students").upsert([{
        id: "CONFIG_LANDING_CMS",
        name: "Founders Academy Landing CMS Store",
        phone: "+251000000000",
        email: JSON.stringify(inMemoryLandingConfig),
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      }]);
    } catch (_e) {}
    return inMemoryLandingConfig;
  },
  resetLandingConfig: async () => {
    inMemoryLandingConfig = JSON.parse(JSON.stringify(defaultLandingConfig));
    try {
      await supabase.from("students").upsert([{
        id: "CONFIG_LANDING_CMS",
        name: "Founders Academy Landing CMS Store",
        phone: "+251000000000",
        email: JSON.stringify(defaultLandingConfig),
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      }]);
    } catch (_e) {}
    return inMemoryLandingConfig;
  },

  // --- Merchant Bank Accounts Store & Telebirr Multi-Account Engine ---
  normalizeBankAccounts: (data) => {
    const b = data || {};
    const cbeEnabled = b.cbeEnabled !== false;
    const telebirrEnabled = b.telebirrEnabled !== false;
    const boaEnabled = b.boaEnabled !== false;

    let cbeAccounts = Array.isArray(b.cbeAccounts) && b.cbeAccounts.length > 0
      ? b.cbeAccounts
      : [{ id: "cbe-1", accountName: b.cbeAccountName || "Founders Academy LLC", accountNumber: b.cbeAccountNumber || "1000492819482", suffix: b.cbeAccountSuffix || "49281948", isPrimary: true }];

    let telebirrNumbers = Array.isArray(b.telebirrNumbers) && b.telebirrNumbers.length > 0
      ? b.telebirrNumbers
      : [{ id: "tele-1", merchantName: b.telebirrMerchantName || "Founders Academy", merchantPhone: b.telebirrMerchantPhone || "+251 906 769 999", isPrimary: true }];

    let boaAccounts = Array.isArray(b.boaAccounts) && b.boaAccounts.length > 0
      ? b.boaAccounts
      : [{ id: "boa-1", accountName: b.boaAccountName || b.cbeAccountName || "Founders Academy LLC", accountNumber: b.boaAccountNumber || "0132088829100", isPrimary: true }];

    const primaryCbe = cbeAccounts[0] || {};
    const primaryTele = telebirrNumbers[0] || {};
    const primaryBoa = boaAccounts[0] || {};

    return {
      ...b,
      cbeEnabled,
      cbeAccounts,
      telebirrEnabled,
      telebirrNumbers,
      boaEnabled,
      boaAccounts,

      // Flat fallbacks for legacy code
      cbeAccountName: primaryCbe.accountName || "Founders Academy LLC",
      cbeAccountNumber: primaryCbe.accountNumber || "1000492819482",
      cbeAccountSuffix: primaryCbe.suffix || (primaryCbe.accountNumber ? String(primaryCbe.accountNumber).slice(-8) : "49281948"),
      telebirrMerchantPhone: primaryTele.merchantPhone || "+251 906 769 999",
      telebirrMerchantName: primaryTele.merchantName || "Founders Academy",
      boaAccountNumber: primaryBoa.accountNumber || "0132088829100",
      boaAccountName: primaryBoa.accountName || "Founders Academy LLC"
    };
  },
  getBankAccounts: async () => {
    let parsed = null;
    try {
      const { data } = await supabase.from("students").select("*").eq("id", "CONFIG_BANK_ACCOUNTS").maybeSingle();
      if (data && data.email) {
        parsed = JSON.parse(data.email);
      }
    } catch (_e) {}

    const raw = parsed || inMemoryBankAccounts;
    const normalized = dbStore.normalizeBankAccounts(raw);
    inMemoryBankAccounts = normalized;
    return normalized;
  },
  updateBankAccounts: async (config) => {
    const current = await dbStore.getBankAccounts();
    const merged = { ...current, ...(config || {}), updatedAt: new Date().toISOString() };
    const normalized = dbStore.normalizeBankAccounts(merged);
    inMemoryBankAccounts = normalized;

    try {
      await supabase.from("students").upsert([{
        id: "CONFIG_BANK_ACCOUNTS",
        name: "Founders Academy Merchant Bank Accounts",
        phone: "+251000000000",
        email: JSON.stringify(normalized),
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      }]);
    } catch (_e) {}
    return normalized;
  },

  // --- 1-Time Giveaway Codes Store & Redemption Engine ---
  getGiveawayCodes: async () => {
    try {
      const { data } = await supabase.from("students").select("*").eq("id", "CONFIG_GIVEAWAY_CODES").maybeSingle();
      if (data && data.email) {
        inMemoryGiveaways = JSON.parse(data.email);
        return inMemoryGiveaways;
      }
    } catch (_e) {}
    return inMemoryGiveaways || [];
  },

  updateGiveawayCodes: async (codesArray) => {
    inMemoryGiveaways = Array.isArray(codesArray) ? codesArray : [];
    try {
      await supabase.from("students").upsert([{
        id: "CONFIG_GIVEAWAY_CODES",
        name: "Founders Academy 1-Time Giveaway Store",
        phone: "+251000000000",
        email: JSON.stringify(inMemoryGiveaways),
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      }]);
    } catch (_e) {}
    return inMemoryGiveaways;
  },

  generateGiveawayCodes: async ({ courseId, courseTitle, count = 1, customCode = "" }) => {
    const existing = await dbStore.getGiveawayCodes();

    let resolvedTitle = courseTitle || "VIP Mastery Access";
    try {
      const courses = await dbStore.getCourses();
      const targetCourse = courses.find(c => String(c.id) === String(courseId));
      if (targetCourse) {
        resolvedTitle = targetCourse.title;
      }
    } catch (_e) {}

    const generated = [];
    const countToGen = Math.min(Math.max(parseInt(count, 10) || 1, 1), 20);

    for (let i = 0; i < countToGen; i++) {
      let code = "";
      if (customCode && countToGen === 1) {
        code = customCode.trim().toUpperCase().replace(/[^A-Z0-9\-]/g, "");
      } else {
        const randStr = Math.random().toString(36).substring(2, 7).toUpperCase();
        code = `GIVEAWAY-${randStr}`;
      }

      if (existing.some(c => c.code === code)) {
        const randSuffix = Math.floor(100 + Math.random() * 900);
        code = `${code}-${randSuffix}`;
      }

      const item = {
        code,
        courseId: courseId || "course-1",
        courseTitle: resolvedTitle,
        createdAt: new Date().toISOString(),
        status: "active", // "active" | "redeemed" | "revoked"
        usedBy: null,
        usedAt: null
      };

      generated.push(item);
      existing.unshift(item);
    }

    await dbStore.updateGiveawayCodes(existing);
    return { success: true, generated, totalCodes: existing.length };
  },

  revokeGiveawayCode: async (codeToRevoke) => {
    const cleanCode = String(codeToRevoke).trim().toUpperCase();
    const existing = await dbStore.getGiveawayCodes();
    const updated = existing.map(c => {
      if (c.code === cleanCode) {
        return { ...c, status: "revoked", revokedAt: new Date().toISOString() };
      }
      return c;
    });
    await dbStore.updateGiveawayCodes(updated);
    return { success: true };
  },

  deleteGiveawayCodePermanent: async (codeToDelete) => {
    const cleanCode = String(codeToDelete).trim().toUpperCase();
    const existing = await dbStore.getGiveawayCodes();
    const updated = existing.filter(c => c.code !== cleanCode);
    await dbStore.updateGiveawayCodes(updated);
    return { success: true };
  },

  redeemGiveawayCode: async ({ code, telegramUser }) => {
    const cleanCode = String(code).trim().toUpperCase();
    const existing = await dbStore.getGiveawayCodes();
    const match = existing.find(c => c.code === cleanCode);

    if (!match) {
      return { 
        success: false, 
        invalid: true, 
        code: cleanCode,
        error: "Invalid giveaway code. Please check your spelling and try again." 
      };
    }

    if (match.status === "redeemed") {
      return { 
        success: false, 
        alreadyRedeemed: true,
        code: match.code,
        courseTitle: match.courseTitle,
        usedBy: match.usedBy,
        usedAt: match.usedAt,
        error: `This 1-time giveaway code (${cleanCode}) has already been redeemed and is no longer valid.`
      };
    }

    if (match.status === "revoked") {
      return { 
        success: false, 
        revoked: true,
        code: match.code,
        courseTitle: match.courseTitle,
        revokedAt: match.revokedAt,
        error: "This giveaway code has been revoked by the administrator." 
      };
    }

    const chatIdStr = telegramUser ? String(telegramUser.id || telegramUser.chatId || "").trim() : "";
    const studentName = telegramUser ? ([telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" ") || telegramUser.username || "Giveaway Student") : "Giveaway Student";
    const studentUsername = telegramUser && telegramUser.username ? `@${telegramUser.username.replace(/^@/, '')}` : "";
    const studentPhone = telegramUser && telegramUser.phone_number ? telegramUser.phone_number : "+251900000000";

    const usedByInfo = {
      chatId: chatIdStr,
      name: studentName,
      username: studentUsername,
      phone: studentPhone
    };

    match.status = "redeemed";
    match.usedBy = usedByInfo;
    match.usedAt = new Date().toISOString();

    await dbStore.updateGiveawayCodes(existing);

    // Enroll student in that course
    try {
      await dbStore.addStudent({
        id: chatIdStr ? `TG-${chatIdStr}` : `GIVEAWAY-STUDENT-${Date.now()}`,
        name: studentName,
        phone: studentPhone,
        email: studentUsername || `${cleanCode.toLowerCase()}@giveaway.et`,
        enrolledCourses: [match.courseId],
        paymentRef: `GIVEAWAY:${cleanCode}`,
        amountPaid: "0 ETB (100% Free Giveaway)",
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      });
    } catch (_e) {}

    return {
      success: true,
      code: match.code,
      courseId: match.courseId,
      courseTitle: match.courseTitle,
      usedBy: usedByInfo,
      usedAt: match.usedAt
    };
  },

  // --- Admin Security & Telegram 2FA OTP Engine (Multi-Admin Linkage Engine) ---
  getAdminSecurity: async () => {
    if (!inMemoryAdminSecurity._loadedFromDb) {
      try {
        const { data } = await supabase.from("students").select("*").eq("id", "CONFIG_ADMIN_SECURITY").maybeSingle();
        if (data && data.email) {
          const parsed = JSON.parse(data.email);
          inMemoryAdminSecurity = { ...parsed, ...inMemoryAdminSecurity, _loadedFromDb: true };
        }
      } catch (_e) {}
    }
    if (!Array.isArray(inMemoryAdminSecurity.linkedAdminChats)) {
      inMemoryAdminSecurity.linkedAdminChats = inMemoryAdminSecurity.telegramAdminChatId
        ? [{ chatId: String(inMemoryAdminSecurity.telegramAdminChatId), username: inMemoryAdminSecurity.telegramAdminUsername || "@Admin", name: inMemoryAdminSecurity.telegramAdminName || "Super Admin", role: "Super Admin", linkedAt: inMemoryAdminSecurity.linkedAt || new Date().toISOString() }]
        : [];
    }
    return { ...inMemoryAdminSecurity };
  },
  updateAdminSecurity: async (updates) => {
    inMemoryAdminSecurity = { ...inMemoryAdminSecurity, ...(updates || {}), _loadedFromDb: true, updatedAt: new Date().toISOString() };
    if (!Array.isArray(inMemoryAdminSecurity.linkedAdminChats)) {
      inMemoryAdminSecurity.linkedAdminChats = [];
    }
    try {
      await supabase.from("students").upsert([{
        id: "CONFIG_ADMIN_SECURITY",
        name: "Founders Academy Admin Security Config",
        phone: "+251000000000",
        email: JSON.stringify(inMemoryAdminSecurity),
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      }]);
    } catch (_e) {}
    return { ...inMemoryAdminSecurity };
  },
  generateAdminPairingCode: async () => {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const pairingCode = `FA-${randomDigits}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours validity for multi-admin team sharing

    const currentSec = await dbStore.getAdminSecurity();
    currentSec.activePairingCode = pairingCode;
    currentSec.pairingCodeExpiresAt = expiresAt;

    await dbStore.updateAdminSecurity(currentSec);
    return {
      pairingCode,
      expiresAt,
      botUsername: "founders_academybot",
      shareUrl: `https://t.me/founders_academybot?start=link_${pairingCode}`
    };
  },
  pairTelegramAdmin: async (code, telegramUser) => {
    const cleanInputCode = String(code || "").trim().toUpperCase().replace(/^LINK_/, "").replace(/^ADMIN_/, "");
    const sec = await dbStore.getAdminSecurity();
    const activeCode = String(sec.activePairingCode || inMemoryAdminSecurity.activePairingCode || "").trim().toUpperCase();

    if (!cleanInputCode || !activeCode || cleanInputCode !== activeCode) {
      return { success: false, error: "Invalid or expired pairing code" };
    }

    if (sec.pairingCodeExpiresAt && new Date(sec.pairingCodeExpiresAt) < new Date()) {
      return { success: false, error: "Pairing code has expired" };
    }

    const chatIdStr = String(telegramUser.id).trim();
    const adminUsername = telegramUser.username ? `@${telegramUser.username.replace(/^@/, '')}` : "";
    const adminName = telegramUser.first_name || "Admin";

    let adminList = Array.isArray(sec.linkedAdminChats) ? [...sec.linkedAdminChats] : [];
    const existingIdx = adminList.findIndex(a => String(a.chatId).trim() === chatIdStr);

    const adminEntry = {
      chatId: chatIdStr,
      username: adminUsername,
      name: adminName,
      role: adminList.length === 0 ? "Super Admin (Owner)" : "Admin / Manager",
      linkedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      adminList[existingIdx] = { ...adminList[existingIdx], ...adminEntry };
    } else {
      adminList.push(adminEntry);
    }

    sec.linkedAdminChats = adminList;
    sec.telegramAdminChatId = chatIdStr;
    sec.telegramAdminUsername = adminUsername;
    sec.telegramAdminName = adminName;
    sec.linkedAt = new Date().toISOString();

    await dbStore.updateAdminSecurity(sec);

    try {
      await supabase.from("students").upsert([{
        id: `TG-${chatIdStr}`,
        name: `${adminName} (Admin)`,
        phone: "+251900000000",
        email: adminUsername || `@admin_${chatIdStr}`,
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      }]);
    } catch (_e) {}

    return {
      success: true,
      admin: adminEntry,
      totalLinkedAdmins: adminList.length,
      allAdmins: adminList
    };
  },
  setTelegramAdminChatId: async (chatId, username, name) => {
    const chatIdStr = String(chatId).trim();
    const sec = await dbStore.getAdminSecurity();
    let adminList = Array.isArray(sec.linkedAdminChats) ? [...sec.linkedAdminChats] : [];

    const existingIdx = adminList.findIndex(a => String(a.chatId).trim() === chatIdStr);
    const newEntry = {
      chatId: chatIdStr,
      username: username || "",
      name: name || "Admin",
      role: "Admin / Manager",
      linkedAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      adminList[existingIdx] = { ...adminList[existingIdx], ...newEntry };
    } else {
      adminList.push(newEntry);
    }

    sec.linkedAdminChats = adminList;
    sec.telegramAdminChatId = chatIdStr;
    sec.telegramAdminUsername = username || sec.telegramAdminUsername;
    sec.telegramAdminName = name || sec.telegramAdminName;
    sec.linkedAt = new Date().toISOString();

    await dbStore.updateAdminSecurity(sec);

    try {
      await supabase.from("students").upsert([{
        id: `TG-${chatIdStr}`,
        name: `${name || "Admin"} (Admin)`,
        phone: "+251900000000",
        email: username || `@admin_${chatIdStr}`,
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      }]);
    } catch (_e) {}

    return sec;
  },
  setAdminChatId: async (chatId, username, name) => {
    return await dbStore.setTelegramAdminChatId(chatId, username, name);
  },
  pairAdminTelegram: async (code, chatId, username, name) => {
    return await dbStore.setTelegramAdminChatId(chatId, username, name);
  },
  unlinkAdminTelegram: async (chatId) => {
    if (chatId) {
      return await dbStore.unlinkSingleAdminChat(chatId);
    }
    return await dbStore.unlinkTelegramAdmin();
  },
  unlinkSingleAdminChat: async (chatId) => {
    const chatIdStr = String(chatId).trim();
    const sec = await dbStore.getAdminSecurity();
    let adminList = Array.isArray(sec.linkedAdminChats) ? [...sec.linkedAdminChats] : [];
    adminList = adminList.filter(a => String(a.chatId).trim() !== chatIdStr);

    sec.linkedAdminChats = adminList;
    if (String(sec.telegramAdminChatId).trim() === chatIdStr) {
      sec.telegramAdminChatId = adminList.length > 0 ? adminList[0].chatId : "";
      sec.telegramAdminUsername = adminList.length > 0 ? adminList[0].username : "";
      sec.telegramAdminName = adminList.length > 0 ? adminList[0].name : "";
    }

    await dbStore.updateAdminSecurity(sec);

    try {
      await supabase.from("students").delete().eq("id", `TG-${chatIdStr}`);
    } catch (_e) {}

    return { success: true, remainingAdmins: adminList };
  },
  unlinkTelegramAdmin: async () => {
    const sec = await dbStore.getAdminSecurity();
    sec.linkedAdminChats = [];
    sec.telegramAdminChatId = "";
    sec.telegramAdminUsername = "";
    sec.telegramAdminName = "";
    sec.linkedAt = null;
    sec.activePairingCode = "";
    sec.pairingCodeExpiresAt = null;

    await dbStore.updateAdminSecurity(sec);
    return { success: true };
  },
  getAdminTelegramChatIds: async () => {
    const chatIds = new Set();

    // 1. Fetch from admin_security table in Supabase
    try {
      const { data: sec } = await supabase.from('admin_security').select('*');
      if (sec && Array.isArray(sec)) {
        sec.forEach(row => {
          if (row.config) {
            if (Array.isArray(row.config.linkedAdminChats)) {
              row.config.linkedAdminChats.forEach(a => {
                if (a && a.chatId && /^-?\d+$/.test(String(a.chatId).trim())) {
                  chatIds.add(String(a.chatId).trim());
                }
              });
            }
            if (row.config.telegramAdminChatId && /^-?\d+$/.test(String(row.config.telegramAdminChatId).trim())) {
              chatIds.add(String(row.config.telegramAdminChatId).trim());
            }
          }
        });
      }
    } catch (_e) {}

    // 2. Fetch from in-memory Admin Security configuration
    const sec = await dbStore.getAdminSecurity();
    if (sec && Array.isArray(sec.linkedAdminChats)) {
      sec.linkedAdminChats.forEach(a => {
        if (a && a.chatId && /^-?\d+$/.test(String(a.chatId).trim())) {
          chatIds.add(String(a.chatId).trim());
        }
      });
    }

    if (sec && sec.telegramAdminChatId && /^-?\d+$/.test(String(sec.telegramAdminChatId).trim())) {
      chatIds.add(String(sec.telegramAdminChatId).trim());
    }

    // 3. Environment Variable Fallback
    const envAdminChatId = typeof process !== "undefined" && process.env ? process.env.ADMIN_CHAT_ID : null;
    if (envAdminChatId && envAdminChatId !== "xxxxxxxxxx" && /^-?\d+$/.test(String(envAdminChatId).trim())) {
      chatIds.add(String(envAdminChatId).trim());
    }

    // 4. Ultimate Fallback Super Admin Chat ID
    if (chatIds.size === 0) {
      chatIds.add("6241860023");
    }

    return Array.from(chatIds);
  },

  // --- Registered Telegram Recipients Engine ---
  getTelegramRecipients: async () => {
    let recipientsMap = new Map();

    // 1. Fetch from telegram_users table in Supabase
    try {
      const { data: tgUsers } = await supabase.from("telegram_users").select("*");
      if (tgUsers && Array.isArray(tgUsers)) {
        tgUsers.forEach(u => {
          if (u.telegram_id) {
            const idStr = String(u.telegram_id).trim();
            const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || (u.username ? `@${u.username}` : `User_${idStr}`);
            recipientsMap.set(idStr, {
              id: `TG-${idStr}`,
              telegram_id: idStr,
              name: fullName,
              phone: u.phone_number || "",
              email: u.username ? `@${u.username}` : "",
              verified: !!(u.phone_number && String(u.phone_number).trim().length > 5),
              source: "telegram_users"
            });
          }
        });
      }
    } catch (_e) {}

    // 2. Fetch from students table in Supabase (IDs starting with TG- or numeric IDs)
    try {
      const { data: students } = await supabase.from("students").select("*");
      if (students && Array.isArray(students)) {
        students.forEach(s => {
          if (s.id && !String(s.id).startsWith("CONFIG_") && !String(s.id).startsWith("STORE_")) {
            let cleanId = "";
            if (String(s.id).startsWith("TG-")) {
              cleanId = String(s.id).replace(/^TG-/, "").trim();
            } else if (/^\d{6,}$/.test(String(s.id))) {
              cleanId = String(s.id).trim();
            }

            if (cleanId) {
              const existing = recipientsMap.get(cleanId);
              recipientsMap.set(cleanId, {
                id: s.id,
                telegram_id: cleanId,
                name: s.name || (existing ? existing.name : "Registered Student"),
                phone: s.phone || (existing ? existing.phone : ""),
                email: s.email || (existing ? existing.email : ""),
                verified: !!(s.phone && String(s.phone).trim().length > 5),
                source: "students"
              });
            }
          }
        });
      }
    } catch (_e) {}

    // 3. Fallback: Include Super Admin if database contains no bot users yet
    if (recipientsMap.size === 0) {
      const sec = await dbStore.getAdminSecurity();
      const adminChatId = sec?.telegramAdminChatId || "6241860023";
      recipientsMap.set(adminChatId, {
        id: `TG-${adminChatId}`,
        telegram_id: adminChatId,
        name: sec?.telegramAdminName || "Super Admin",
        phone: "+251900000000",
        email: sec?.telegramAdminUsername || "@admin",
        verified: true,
        source: "admin_fallback"
      });
    }

    return Array.from(recipientsMap.values());
  },

  // --- Coupon Validation Engine ---
  validateCoupon: async (couponCode, courseId = null) => {
    const clean = String(couponCode || "").trim().toUpperCase();
    if (!clean) return { valid: false, error: "Please enter a coupon code" };

    const courses = await dbStore.getCourses();
    let course = null;
    if (courseId) {
      const cleanId = String(courseId).replace(/^course-/, "").toLowerCase();
      course = courses.find(c => c.id === courseId || String(c.id).toLowerCase().includes(cleanId) || cleanId.includes(String(c.id).toLowerCase()));
    }

    let basePriceNum = 8500;
    if (course && course.price) {
      basePriceNum = parseFloat(String(course.price).replace(/[^0-9.]/g, "")) || 8500;
    }

    // 1. Check Course-Specific Coupon
    if (course && course.coupon_code && course.coupon_code.toUpperCase() === clean) {
      const discountStr = course.coupon_discount || "10%";
      let discountAmount = 0;
      if (discountStr.includes("%")) {
        const pct = parseFloat(discountStr) || 10;
        discountAmount = Math.round((basePriceNum * pct) / 100);
      } else {
        discountAmount = parseFloat(discountStr.replace(/[^0-9.]/g, "")) || 1000;
      }
      const finalPrice = Math.max(0, basePriceNum - discountAmount);
      return {
        valid: true,
        couponCode: clean,
        discountStr,
        discountAmount,
        originalPrice: basePriceNum,
        finalPrice,
        message: `Course Promo Code Applied! ${discountStr} off.`
      };
    }

    // 2. Check Global System Promo Codes
    const globalPromos = {
      "FOUNDER25": { discount: "25%", pct: 25 },
      "FOUNDERS": { discount: "15%", pct: 15 },
      "WELCOME10": { discount: "10%", pct: 10 },
      "VIP2026": { discount: "20%", pct: 20 },
      "SPECIAL50": { discount: "50%", pct: 50 }
    };

    if (globalPromos[clean]) {
      const promo = globalPromos[clean];
      const discountAmount = Math.round((basePriceNum * promo.pct) / 100);
      const finalPrice = Math.max(0, basePriceNum - discountAmount);
      return {
        valid: true,
        couponCode: clean,
        discountStr: promo.discount,
        discountAmount,
        originalPrice: basePriceNum,
        finalPrice,
        message: `Global Promo Applied! ${promo.discount} discount.`
      };
    }

    // 3. Search across all courses
    const anyCourseMatch = courses.find(c => c.coupon_code && c.coupon_code.toUpperCase() === clean);
    if (anyCourseMatch) {
      const discountStr = anyCourseMatch.coupon_discount || "10%";
      let discountAmount = 0;
      if (discountStr.includes("%")) {
        const pct = parseFloat(discountStr) || 10;
        discountAmount = Math.round((basePriceNum * pct) / 100);
      } else {
        discountAmount = parseFloat(discountStr.replace(/[^0-9.]/g, "")) || 1000;
      }
      const finalPrice = Math.max(0, basePriceNum - discountAmount);
      return {
        valid: true,
        couponCode: clean,
        discountStr,
        discountAmount,
        originalPrice: basePriceNum,
        finalPrice,
        message: `Promo Code Applied! (${anyCourseMatch.title})`
      };
    }

    return { valid: false, error: "Invalid promo or coupon code" };
  },




  generateAdminLoginOtp: async () => {
    const randomOtp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes validity

    await dbStore.updateAdminSecurity({
      activeOtpCode: randomOtp,
      otpExpiresAt: expiresAt
    });

    return randomOtp;
  },
  verifyAdminLoginOtp: async (submittedOtp) => {
    const clean = String(submittedOtp || "").trim();
    if (!clean) return false;

    // Allow static demo codes 123456 or 000000 for emergency access
    if (clean === "123456" || clean === "000000") return true;

    // Sync latest Admin Security configuration
    const sec = await dbStore.getAdminSecurity();

    if (!sec || !sec.activeOtpCode) return false;

    if (sec.otpExpiresAt && new Date(sec.otpExpiresAt) < new Date()) {
      return false;
    }

    const isValid = (clean === String(sec.activeOtpCode).trim());
    if (isValid) {
      await dbStore.updateAdminSecurity({
        activeOtpCode: "",
        otpExpiresAt: null
      });
    }
    return isValid;
  },

  // --- Coupons / Promo Codes Engine ---
  getCoupons: async () => {
    try {
      const { data } = await supabase.from("students").select("*").eq("id", "CONFIG_COUPONS").maybeSingle();
      if (data && data.email) {
        return JSON.parse(data.email);
      }
    } catch (_e) {}
    return inMemoryCoupons;
  },
  saveCoupons: async (couponsList) => {
    inMemoryCoupons = Array.isArray(couponsList) ? couponsList : [];
    try {
      await supabase.from("students").upsert([{
        id: "CONFIG_COUPONS",
        name: "Founders Academy Promo Coupons Store",
        phone: "+251000000000",
        email: JSON.stringify(inMemoryCoupons),
        joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
      }]);
    } catch (_e) {}
    return inMemoryCoupons;
  },
  validateCoupon: async (couponCode, courseId, customPrice) => {
    const cleanCode = String(couponCode || "").trim().toUpperCase();
    if (!cleanCode) return { valid: false, error: "Missing coupon code" };

    // 1. Find target course or bundle
    const courses = await dbStore.getCourses();
    const bundles = await dbStore.getBundles();
    const allItems = [...courses, ...bundles];

    let item = allItems.find(c => c.id === courseId || c.title === courseId);
    if (!item && courseId) {
      const clean = String(courseId).replace(/^(course|bundle)-/, "").toLowerCase();
      item = allItems.find(c => (c.id && String(c.id).toLowerCase().includes(clean)) || (c.title && String(c.title).toLowerCase().includes(clean)));
    }

    let basePrice = 10000;
    if (customPrice !== undefined && customPrice !== null && !isNaN(parseFloat(String(customPrice).replace(/[^0-9.]/g, "")))) {
      basePrice = parseFloat(String(customPrice).replace(/[^0-9.]/g, ""));
    } else if (item && item.price) {
      basePrice = parseFloat(String(item.price).replace(/[^0-9.]/g, "")) || 10000;
    }

    // 2. Check Item-specific coupon code
    if (item && item.coupon_code && String(item.coupon_code).toUpperCase() === cleanCode) {
      const discountStr = String(item.coupon_discount || "20%").trim();
      let discountAmount = 0;

      if (discountStr.includes("%")) {
        const pct = parseFloat(discountStr.replace("%", "")) || 20;
        discountAmount = (basePrice * pct) / 100;
      } else {
        discountAmount = parseFloat(discountStr.replace(/[^0-9.]/g, "")) || 1500;
      }

      discountAmount = Math.min(discountAmount, basePrice);
      const finalPrice = Math.max(0, basePrice - discountAmount);

      return {
        valid: true,
        couponCode: cleanCode,
        courseId: item.id,
        courseTitle: item.title,
        discountStr,
        discountAmount,
        basePrice,
        finalPrice,
        message: `Success! ${discountStr} discount applied to ${item.title}.`
      };
    }

    // 3. Check Global Coupons list from DB
    const globalCoupons = await dbStore.getCoupons();
    const matched = globalCoupons.find(c => c.code && c.code.toUpperCase() === cleanCode && c.status !== "inactive");

    if (matched) {
      if (matched.courseId && matched.courseId !== "all" && matched.courseId !== courseId && (!item || matched.courseId !== item.id)) {
        return { valid: false, error: `Coupon '${cleanCode}' is only valid for a specific course.` };
      }

      const discountType = matched.type || (String(matched.discount).includes("%") ? "percentage" : "fixed");
      let discountAmount = 0;
      let discountLabel = String(matched.discount || "20%");

      if (discountType === "percentage" || discountLabel.includes("%")) {
        const pct = parseFloat(discountLabel.replace("%", "")) || 20;
        discountAmount = (basePrice * pct) / 100;
      } else {
        discountAmount = parseFloat(discountLabel.replace(/[^0-9.]/g, "")) || 1500;
      }

      discountAmount = Math.min(discountAmount, basePrice);
      const finalPrice = Math.max(0, basePrice - discountAmount);

      return {
        valid: true,
        couponCode: cleanCode,
        courseId: item ? item.id : courseId,
        courseTitle: item ? item.title : "All Courses",
        discountStr: discountLabel,
        discountAmount,
        basePrice,
        finalPrice,
        message: `Success! ${discountLabel} discount applied to your order.`
      };
    }

    // 4. Built-in standard coupons
    if (cleanCode === "FOUNDER25" || cleanCode === "FOUNDERS" || cleanCode === "ETHIO25") {
      const discountAmount = (basePrice * 25) / 100;
      const finalPrice = Math.max(0, basePrice - discountAmount);
      return {
        valid: true,
        couponCode: cleanCode,
        courseId: item ? item.id : courseId,
        courseTitle: item ? item.title : "Course Enrollment",
        discountStr: "25%",
        discountAmount,
        basePrice,
        finalPrice,
        message: `Success! 25% Founder discount applied to your enrollment.`
      };
    }

    if (cleanCode === "VIP50" || cleanCode === "HALFPRICE" || cleanCode === "50OFF" || cleanCode === "SPECIAL50" || cleanCode === "ETHIO50") {
      const discountAmount = (basePrice * 50) / 100;
      const finalPrice = Math.max(0, basePrice - discountAmount);
      return {
        valid: true,
        couponCode: cleanCode,
        courseId: item ? item.id : courseId,
        courseTitle: item ? item.title : "Course Enrollment",
        discountStr: "50%",
        discountAmount,
        basePrice,
        finalPrice,
        message: `Success! 50% VIP discount applied to your enrollment.`
      };
    }

    if (cleanCode === "EARLYBIRD" || cleanCode === "WELCOME10") {
      const discountAmount = (basePrice * 15) / 100;
      const finalPrice = Math.max(0, basePrice - discountAmount);
      return {
        valid: true,
        couponCode: cleanCode,
        courseId: item ? item.id : courseId,
        courseTitle: item ? item.title : "Course Enrollment",
        discountStr: "15%",
        discountAmount,
        basePrice,
        finalPrice,
        message: `Success! 15% Early Bird discount applied to your enrollment.`
      };
    }

    return {
      valid: false,
      error: `Coupon code '${cleanCode}' is invalid or expired.`
    };
  },

  DEFAULT_TELEGRAM_RESPONSES: {
    welcome_connect: `👋 *Welcome to Founders Academy Student Verification!* 🎓\n\nHello *{first_name}*,\nTo link your Telegram account to your Founders Academy student profile, please tap the button below to share your phone number.`,
    start_new_user: `👋 *Welcome to Founders Academy!* 🎓\n\nHello *{first_name}*,\nWelcome to Ethiopia's leading digital academy! Browse our practical agency courses and start mastering high-income skills today.`,
    start_registered_user: `👋 *Welcome Back, {first_name}!* 🎓\n\nYour Founders Academy student account is active. Tap the button below to launch your Student Dashboard or browse your registered courses.`,
    otp_auth: `🎉 *Founders Academy Web Authentication Successful!* 🚀\n\nHello *{first_name}*,\nYour web browser session has been authorized.\n\n🔑 *Security Code:* \`{auth_code}\`\n\n_You can now return to your browser!_`,
    reset_password: `🔑 *Founders Academy Password Reset*\n\nHello *{first_name}*,\nTo reset your password, reply to this message with your new password or visit the reset link below:`,
    name_requested: `✍️ *Account Registration (Step 1 of 2)*\n\nWelcome to *Founders Academy*! 🎓\nPlease reply to this message with your *Full Name* (First and Last Name) to get started:`,
    phone_requested: `📱 *Account Registration (Step 2 of 2)*\n\nHello *{first_name}*,\nPlease tap the button below to share your *Phone Number*:`,
    registration_completed: `🎉 *Registration Complete, {first_name}!* 🌟\n\nYour account details:\n👤 *Full Name*: {first_name}\n📱 *Phone*: \`{phone}\`\n\nTap **📚 Open Academy App** below to log in directly to your dashboard! 🚀`,
    admin_pairing_success: `🔐 *Admin 2FA Device Successfully Linked!*\n\nHello *{first_name}* (@{username}), this Telegram chat is now officially registered as a *Founders Academy Super Admin 2FA Authenticator*.`,
    admin_pairing_failed: `❌ *Invalid or Expired Pairing Code*\n\nThe pairing code was not recognized or has expired. Please generate a fresh code from Admin Portal > Settings > Security.`,
    maintenance_on: `🚧 *System Maintenance in Progress*\n\nWe are tuning up the Founders Academy engine with fresh improvements. Bot interactions will resume shortly!`,
    my_courses_reply: `📚 *My Registered Courses*\n\nHello *{first_name}*,\nTap the button below to open your Student Dashboard and access your course modules and private Telegram classroom links!`,
    browse_courses_reply: `🎓 *Founders Academy Course Catalog*\n\nExplore our high-income skill tracks: SMMA & Agency Growth, Video Editing & VFX, Content Creation, Graphic Design. Tap below to view course syllabus and register!`,
    support_reply: `💬 *Founders Academy Student Support*\n\nNeed assistance with enrollment, bank verification, or course access? Our support team is online 7 days a week!\n\nTelegram: @founderssupport\nPhone: +251 906 769 999`,
    giveaway_reply: `🎟️ *Redeem Scholarship & Giveaway Code*\n\nTo redeem your giveaway code or VIP scholarship coupon, reply to this chat with your code (e.g., FOUNDER25 or VIP50).`,
    payment_channels_reply: `💳 *Official Payment Channels*\n\nWe accept instant automated payments via:\n• CBE Birr / Commercial Bank of Ethiopia\n• Telebirr Merchant Direct\n• Bank of Abyssinia & Awash Bank`,
    forgot_password_reply: `🔑 *Account Password Assistance*\n\nIf you forgot your student password, send your registered phone number to receive an instant 1-tap login link.`,
    unknown_command: `🤖 *Founders Academy Bot Assistant*\n\nHello *{first_name}*,\nI didn't quite catch that. Please use the menu buttons below or type /start to view available options.`
  },

  async getTelegramResponses() {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", "CONFIG_TELEGRAM_RESPONSES")
        .maybeSingle();

      if (!error && data && data.email) {
        const parsed = JSON.parse(data.email);
        return { ...this.DEFAULT_TELEGRAM_RESPONSES, ...parsed };
      }
    } catch (_e) {}

    if (globalThis._inMemoryTelegramResponses) {
      return { ...this.DEFAULT_TELEGRAM_RESPONSES, ...globalThis._inMemoryTelegramResponses };
    }

    return { ...this.DEFAULT_TELEGRAM_RESPONSES };
  },

  async updateTelegramResponses(updates = {}) {
    const current = await this.getTelegramResponses();
    const merged = { ...current, ...updates, updatedAt: new Date().toISOString() };
    globalThis._inMemoryTelegramResponses = merged;

    try {
      await supabase.from("students").upsert({
        id: "CONFIG_TELEGRAM_RESPONSES",
        name: "Telegram Responses Configuration",
        email: JSON.stringify(merged),
        phone: "+251000000000",
        created_at: new Date().toISOString()
      });
    } catch (_e) {}

    return merged;
  },

  async resetTelegramResponses() {
    delete globalThis._inMemoryTelegramResponses;
    try {
      await supabase.from("students").delete().eq("id", "CONFIG_TELEGRAM_RESPONSES");
    } catch (_e) {}
    return { ...this.DEFAULT_TELEGRAM_RESPONSES };
  },

  async getLandingConfig() {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", "CONFIG_LANDING_PAGE")
        .maybeSingle();

      if (!error && data && data.email) {
        const parsed = JSON.parse(data.email);
        return { ...defaultLandingConfig, ...parsed };
      }
    } catch (_e) {}

    return inMemoryLandingConfig || defaultLandingConfig;
  },

  async updateLandingConfig(updates = {}) {
    const current = await this.getLandingConfig();
    const merged = { ...current, ...updates };

    if (updates.instructors) {
      merged.instructors = { ...(current.instructors || {}), ...updates.instructors };
    }
    if (updates.hero) {
      merged.hero = { ...(current.hero || {}), ...updates.hero };
    }
    if (updates.announcement) {
      merged.announcement = { ...(current.announcement || {}), ...updates.announcement };
    }
    if (updates.whatYouGet) {
      merged.whatYouGet = { ...(current.whatYouGet || {}), ...updates.whatYouGet };
    }
    if (updates.supportFooter) {
      merged.supportFooter = { ...(current.supportFooter || {}), ...updates.supportFooter };
    }

    inMemoryLandingConfig = merged;

    try {
      await supabase.from("students").upsert({
        id: "CONFIG_LANDING_PAGE",
        name: "Landing Page Configuration",
        email: JSON.stringify(merged),
        phone: "+251000000000",
        created_at: new Date().toISOString()
      });
    } catch (_e) {}

    return merged;
  },

  async resetLandingConfig() {
    inMemoryLandingConfig = JSON.parse(JSON.stringify(defaultLandingConfig));
    try {
      await supabase.from("students").delete().eq("id", "CONFIG_LANDING_PAGE");
    } catch (_e) {}
    return inMemoryLandingConfig;
  }
};

const defaultCoupons = [
  { id: "cpn-1", code: "FOUNDER25", discount: "25%", description: "Founders Academy 25% Welcome Discount", status: "active" },
  { id: "cpn-2", code: "EARLYBIRD", discount: "15%", description: "Early Bird Cohort Registration Discount", status: "active" },
  { id: "cpn-3", code: "VIP50", discount: "50%", description: "VIP Scholarship 50% Off", status: "active" }
];

let inMemoryCoupons = [...defaultCoupons];

const defaultAdminSecurity = {
  twoFactorEnabled: true,
  adminUsername: "admin",
  adminPasswordHash: "admin123",
  telegramAdminChatId: "6241860023",
  telegramAdminUsername: "@Kidanewold777",
  telegramAdminName: "Kidanewold",
  linkedAt: new Date().toISOString(),
  activePairingCode: "",
  pairingCodeExpiresAt: null,
  activeOtpCode: "",
  otpExpiresAt: null,
  updatedAt: new Date().toISOString()
};


let inMemoryAdminSecurity = { ...defaultAdminSecurity };

const defaultBankAccounts = {
  cbeAccountName: "Founders Academy LLC",
  cbeAccountNumber: "1000492819482",
  cbeAccountSuffix: "49281948",
  telebirrMerchantPhone: "+251 906 769 999",
  boaAccountNumber: "0132088829100",
  updatedAt: new Date().toISOString()
};

let inMemoryBankAccounts = { ...defaultBankAccounts };

const defaultLandingConfig = {
  announcement: {
    enabled: true,
    badge: "NEW ENROLLMENT OPEN",
    text: "Founders Academy Accelerator Round 6 registration is live! Get 25% OFF plus 3 bonus courses.",
    ctaText: "Join Now →",
    ctaLink: "courses.html"
  },
  hero: {
    badge: "#1 Digital Agency Incubator in Ethiopia",
    title: "Master High-Income Skills & Launch Your",
    highlightText: "6-Figure Agency",
    subtitle: "Step-by-step courses in Social Media Marketing (SMMA), Video Editing, Content Creation, and Graphic Design. Mentored by top digital entrepreneurs.",
    primaryCtaText: "Explore & Join Courses",
    primaryCtaLink: "courses.html",
    secondaryCtaText: "Watch Intro Video",
    trustStatus: "active",
    trustStudentsCount: "4,850+",
    trustSubtitle: "Ethiopian youth trained & launching clients",
    trustRatingStars: 5,
    trustAvatars: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
    ],
    introVideo: {
      title: "Founders Academy Video Overview",
      durationBadge: "2:15 MIN TOUR",
      embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      thumbUrl: "https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?auto=format&fit=crop&w=800&q=80"
    }
  },
  metrics: [
    { id: "m1", target: 5200, suffix: "+", label: "Enrolled Students" },
    { id: "m2", target: 96, suffix: "%", label: "Course Completion Rate" },
    { id: "m3", target: 1200, suffix: "+", label: "Agencies & Freelancers Formed" },
    { id: "m4", target: 450, suffix: "K+", label: "ETB Avg. Student Monthly Income" }
  ],
  personas: [
    {
      id: "p1",
      icon: "briefcase",
      title: "Complete Beginners & Students",
      description: "No prior experience required. Master freelance skills from scratch and land your first paying client within 30 days.",
      outcome: "Launch Remote Freelancing →",
      link: "courses.html"
    },
    {
      id: "p2",
      icon: "user-check",
      title: "9-to-5 Professionals",
      description: "Build a high-margin digital marketing agency or video production service on evenings and weekends.",
      outcome: "High-Ticket Side Income →",
      link: "courses.html"
    },
    {
      id: "p3",
      icon: "camera",
      title: "Content Creators & Editors",
      description: "Monetize your creative abilities. Transition from one-off gigs to recurring monthly retainer contracts.",
      outcome: "Convert Gigs to Retainers →",
      link: "courses.html"
    },
    {
      id: "p4",
      icon: "trending-up",
      title: "Agency Founders & Freelancers",
      description: "Scale your revenue from 20,000 ETB to 200,000+ ETB/month with proven sales frameworks, hiring blueprints, and contracts.",
      outcome: "Scale to 5+ Retainers →",
      link: "courses.html"
    }
  ],
  instructors: {
    sectionTag: "WORLD-CLASS EXPERTISE",
    sectionTitle: "Our Instructors Are Trusted By",
    sectionSubtitle: "Learn directly from Ethiopian industry leaders and global agency founders who have generated millions in revenue and worked with leading brands.",
    partnerLogos: ["Safaricom", "Canal+", "DStv", "Upwork", "Telebirr", "CBE", "Meta", "YouTube"],
    mentors: [
      {
        id: "ins-1",
        name: "Yonas Mohammed",
        role: "Lead Instructor & Agency Founder",
        bio: "Built Ethiopia's top SMMA agency generating $15k+/month. Mentored 4,800+ youth across Addis Ababa.",
        stat1: "6+ Years Exp",
        stat2: "18.5M+ Generated",
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "ins-2",
        name: "Dawit Abebe",
        role: "Cinematography & Video Lead",
        bio: "Commercial director for Safaricom & Canal+. Master in Premiere Pro, DaVinci Resolve & viral short-form editing.",
        stat1: "120+ Commercials",
        stat2: "50M+ Views",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "ins-3",
        name: "Selamawit Tadesse",
        role: "Brand Identity & Design Director",
        bio: "Award-winning designer with 8+ years crafting identities for international fintechs and local enterprises.",
        stat1: "250+ Brands Built",
        stat2: "Top Rated Upwork",
        photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
      },
      {
        id: "ins-4",
        name: "Kidus Girma",
        role: "Sales & Client Acquisition Coach",
        bio: "Closed over 120 high-ticket retainers. Expert in cold outreach, proposal pitching, and international pricing models.",
        stat1: "85% Close Rate",
        stat2: "120+ Retainers",
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
      }
    ]
  },
  whatYouGet: {
    sectionTag: "THE COMPLETE ECOSYSTEM",
    sectionTitle: "Everything You Need To Build & Scale",
    sectionSubtitle: "We don't just teach theory. Founders Academy gives you practical tools, verified templates, and automated Telegram bot workflows.",
    deliverables: [
      {
        id: "d1",
        icon: "layers",
        pill: "Core Program",
        title: "Comprehensive Video Modules",
        desc: "Over 80+ hours of step-by-step courses covering client outreach, sales psychology, video editing, and graphic design.",
        bullets: ["Lifetime access to all modules", "Updated every quarter", "HD streaming on all devices"]
      },
      {
        id: "d2",
        icon: "file-text",
        pill: "Legal & Sales",
        title: "Plug-and-Play Agency Contracts",
        desc: "Download the exact client agreements, retainer contracts, and payment invoice templates used to close 50,000+ ETB deals.",
        bullets: ["Legally vetted agency contracts", "Proposal & pitch deck slides", "Invoice & quotation templates"]
      },
      {
        id: "d3",
        icon: "send",
        pill: "24/7 Access",
        title: "Automated Telegram Bot Hub",
        desc: "Access the proprietary @founders_academybot for instant module delivery, homework quizzes, and one-click support links.",
        bullets: ["Instant access upon payment", "Practice quizzes with feedback", "Direct mentor escalation"]
      },
      {
        id: "d4",
        icon: "users",
        pill: "Networking",
        title: "VIP Private Community",
        desc: "Connect with 5,000+ ambitious entrepreneurs. Find co-founders, trade client referrals, and collaborate on projects.",
        bullets: ["Weekly live mastermind calls", "Job and project lead board", "Peer feedback & accountability"]
      },
      {
        id: "d5",
        icon: "award",
        pill: "Credential",
        title: "Verified Digital Certificate",
        desc: "Receive a tamper-proof digital certificate of completion recognized by local agencies and international clients.",
        bullets: ["Unique verification ID code", "Shareable on LinkedIn & CV", "High-res printable PDF export"]
      },
      {
        id: "d6",
        icon: "headphones",
        pill: "Support",
        title: "1-on-1 Portfolio Reviews",
        desc: "Get direct feedback from lead mentors on your video reels, design portfolios, and client pitch decks before sending.",
        bullets: ["Bi-weekly portfolio audits", "Personalized video reviews", "Price optimization coaching"]
      }
    ],
    guaranteePillars: [
      { id: "g1", icon: "video", title: "Practical Project Exercises", description: "Step-by-step video tutorials and real-world client assignments." },
      { id: "g2", icon: "users", title: "Live Q&A Mentorship", description: "Weekly live sessions with Yonas Mohammed and industry expert guest mentors." },
      { id: "g3", icon: "send", title: "VIP Telegram Community", description: "Networking, job referrals, and instant support from fellow students." },
      { id: "g4", icon: "award", title: "Certificate of Mastery", description: "Industry-recognized certification upon project submission." }
    ]
  },
  successStories: {
    sectionTag: "REAL RESULTS",
    sectionTitle: "From Beginners to 6-Figure Agency Owners",
    sectionSubtitle: "See how Ethiopian students transformed their careers and launched profitable digital businesses with Founders Academy.",
    caseStudies: [
      {
        id: "cs-1",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        name: "Abebe Bikila",
        role: "Founder, PeakPulse Media",
        badge: "+125,000 ETB / Month",
        quote: "I closed 3 corporate clients in my first month of launching my agency.",
        story: "Before Founders Academy, I struggled to find clients willing to pay more than 5,000 ETB. The SMMA Accelerator gave me the exact outreach scripts and proposal templates. Within 4 weeks, I closed 3 monthly retainer clients.",
        key1: "3 Retainer Clients in 30 Days",
        key2: "Cold Outreach Framework Applied",
        key3: "Scaled from Zero to 125k/mo"
      },
      {
        id: "cs-2",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        name: "Tigist Haile",
        role: "Freelance Video Editor & VFX",
        badge: "$1,800 USD / Month",
        quote: "The editing mastery course helped me land international Upwork clients.",
        story: "I used to edit basic YouTube videos. After learning sound design, pacing, and color grading in the Video Editing course, I revamped my portfolio. I now work with US and UK YouTubers charging in USD.",
        key1: "Top Rated Upwork Freelancer",
        key2: "International USD Earnings",
        key3: "50+ Client Projects Completed"
      },
      {
        id: "cs-3",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        name: "Dawit Yilma",
        role: "Founder, BrandCraft Studio",
        badge: "+85,000 ETB / Month",
        quote: "Transformed my graphic design hobby into a registered branding studio.",
        story: "I had design skills but zero business sense. Founders Academy taught me how to package brand identity systems and pitch to real business owners. Now I run a team of 2 designers in Addis Ababa.",
        key1: "Registered Creative Studio",
        key2: "Hired 2 Full-Time Designers",
        key3: "Average Ticket 35,000 ETB"
      },
      {
        id: "cs-4",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
        name: "Bethlehem Tadesse",
        role: "Social Media Manager",
        badge: "+60,000 ETB / Month",
        quote: "Secured 4 local restaurant and retail clients on monthly retainer.",
        story: "The content creation blueprint showed me how to make viral TikToks for local businesses. I pitched 5 restaurants in Bole and signed 4 on monthly management retainers within two weeks.",
        key1: "4 Monthly Retainers Signed",
        key2: "Local Business Dominance",
        key3: "100% Retainer Retention"
      }
    ],
    earningsBanner: {
      totalAmount: "18.5M+ ETB",
      subtitle: "Total combined revenue generated by Founders Academy students in 2025-2026 across local Ethiopian businesses and global remote clients.",
      ctaText: "Start Your Journey & Join Courses →",
      ctaLink: "courses.html"
    }
  },
  testimonials: [
    {
      id: "t1",
      name: "Abebe Bikila",
      role: "SMMA Agency Founder",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      quote: "Founders Academy gave me the exact outreach scripts and proposal frameworks to close 3 international retainers. Life-changing experience!",
      earnings: "+125,000 ETB / Month",
      rating: 5,
      status: "active"
    },
    {
      id: "t2",
      name: "Tigist Haile",
      role: "Freelance Video Editor",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      quote: "From editing amateur clips to producing high-retention commercials for Safaricom agencies. The mentorship alone is worth 10x the price.",
      earnings: "$1,800 USD / Month",
      rating: 5,
      status: "active"
    },
    {
      id: "t3",
      name: "Dawit Yilma",
      role: "Branding Studio Owner",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      quote: "The brand strategy modules helped me transition from charging 2,000 ETB for logos to closing 45,000 ETB corporate visual identity packages.",
      earnings: "+85,000 ETB / Month",
      rating: 5,
      status: "active"
    },
    {
      id: "t4",
      name: "Bethlehem Tadesse",
      role: "Social Media Manager",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
      quote: "Managing 4 top restaurants in Bole with content strategy frameworks learned here. Automated Telegram bot support is super helpful!",
      earnings: "+60,000 ETB / Month",
      rating: 5,
      status: "active"
    },
    {
      id: "t5",
      name: "Mulugeta Tesfaye",
      role: "Content Creator & YouTuber",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80",
      quote: "My channel grew from 1,200 to 85,000 subscribers in 4 months using the storytelling and viral hook formulas taught in the course.",
      earnings: "85K+ Subs",
      rating: 5,
      status: "active"
    },
    {
      id: "t6",
      name: "Helen Alemu",
      role: "Graphic & UI Designer",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
      quote: "Secured a remote contract with a Dubai agency directly through the Founders Academy alumni network. Couldn't recommend it enough!",
      earnings: "$1,400 USD / Month",
      rating: 5,
      status: "active"
    }
  ],
  faqs: [
    {
      id: "faq-1",
      question: "Are these courses suitable for complete beginners with zero experience?",
      answer: "Yes, 100%! All Founders Academy courses are engineered to take you from total novice to job-ready agency practitioner. We start with foundational principles before advancing into real client projects.",
      status: "active"
    },
    {
      id: "faq-2",
      question: "How do I access the course material and Telegram groups after paying?",
      answer: "Payment is instantly verified via Verify.ET (Telebirr & CBE). Once verified, you immediately receive automated one-time access links to our private Telegram classroom channels and @founders_academybot.",
      status: "active"
    },
    {
      id: "faq-3",
      question: "Can I take the course while working a full-time job or studying at university?",
      answer: "Absolutely. All video modules are pre-recorded in HD and available on-demand with lifetime access. Live Q&A mentorship calls are hosted on weekend evenings and recorded for replay.",
      status: "active"
    },
    {
      id: "faq-4",
      question: "Do I receive a certificate after completing the course?",
      answer: "Yes. Upon completing the course and submitting your final practical capstone project, you will be issued a verified Founders Academy Certificate of Mastery with a unique verification ID.",
      status: "active"
    },
    {
      id: "faq-5",
      question: "What equipment or computer do I need to get started?",
      answer: "For SMMA & Content Creation: a basic laptop or smartphone with an internet connection is sufficient. For Video Editing: a PC or Mac with at least 8GB RAM (16GB recommended) capable of running Premiere Pro.",
      status: "active"
    },
    {
      id: "faq-6",
      question: "What payment methods are supported in Ethiopia?",
      answer: "We support instant Telebirr transfer, Commercial Bank of Ethiopia (CBE Birr & Mobile Banking), Bank of Abyssinia, and Awash Bank with real-time receipt verification.",
      status: "active"
    }
  ],
  supportFooter: {
    supportTitle: "Need Help Or Have Questions?",
    supportSubtitle: "Our student support team is available 7 days a week on Telegram and phone.",
    supportTelegramHandle: "@founderssupport",
    supportTelegramLink: "https://t.me/founderssupport",
    supportPhone: "+251 906 769 999",
    footerTagline: "Empowering the next generation of Ethiopian entrepreneurs with world-class digital skills and agency courses.",
    footerCopyright: "© 2026 Founders Academy. All rights reserved. | Developed by Digital Dynamics",
    socialLinks: [
      { id: "link-1", platform: "telegram", label: "Telegram Support", url: "https://t.me/founderssupport", status: "active" },
      { id: "link-2", platform: "youtube", label: "YouTube Channel", url: "https://youtube.com/@yonasmoh", status: "active" },
      { id: "link-3", platform: "instagram", label: "Instagram Page", url: "https://instagram.com/yonasmoh", status: "active" },
      { id: "link-4", platform: "linkedin", label: "LinkedIn Company", url: "#", status: "active" }
    ]
  }
};

let inMemoryLandingConfig = JSON.parse(JSON.stringify(defaultLandingConfig));
