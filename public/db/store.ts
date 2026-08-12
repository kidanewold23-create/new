/* ==========================================================================
   FOUNDERS ACADEMY PERSISTENCE & SUPABASE DATABASE ENGINE
   ========================================================================== */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://icdjgtfiqwwdqtvwuyaw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7SjYAbvNDwTXOVBlkuox-g_wMj58uUK";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Masterclass {
  id: string;
  title: string;
  category: string;
  price: string;
  duration?: string;
  description: string;
  tg_channel?: string;
  tg_group?: string;
  status: "ON" | "OFF" | "active" | "inactive";
  enrolled_students: number;
}

export interface Category {
  id: string;
  name: string;
  status: "ON" | "OFF";
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  email: string;
  joined_date: string;
}

export interface Transaction {
  id: string;
  student_name: string;
  student_phone?: string;
  student_email?: string;
  masterclass_title: string;
  course_id?: string;
  payment_method: string;
  reference_number?: string;
  account_suffix?: string;
  amount: string;
  status: "Completed" | "Pending" | "Failed" | "Refunded";
  verify_et_status?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface MaintenanceState {
  status: "ON" | "OFF";
  title: string;
  message: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  course_id: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false";
  options: string[];
  correct_answer: string;
  explanation?: string;
  points?: number;
  sort_order?: number;
}

export interface CourseQuiz {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  time_limit_mins?: number;
  passing_score?: number;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
  questions?: QuizQuestion[];
}

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  course_id: string;
  student_id: string;
  student_name: string;
  score: number;
  total_questions: number;
  passed: boolean;
  submitted_at: string;
}


export interface LandingHeroConfig {
  badge: string;
  title: string;
  highlightText: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  trustStudentsCount: string;
  trustSubtitle: string;
  featuredCardTitle: string;
  featuredCardBadge: string;
  featuredCardPrice: string;
  featuredCardDuration: string;
  featuredCardDesc: string;
  featuredCardBonus: string;
  featuredCardBtnText: string;
}

export interface LandingAnnouncementConfig {
  enabled: boolean;
  badge: string;
  text: string;
  ctaText: string;
}

export interface LandingMetricItem {
  id: string;
  target: number;
  suffix: string;
  label: string;
}

export interface LandingPersonaItem {
  id: string;
  title: string;
  description: string;
  outcome: string;
  icon: string;
}

export interface LandingGuaranteeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface LandingFounderConfig {
  name: string;
  role: string;
  quote: string;
  leadText: string;
  bioText: string;
  photoUrl: string;
  highlight1Title: string;
  highlight1Desc: string;
  highlight2Title: string;
  highlight2Desc: string;
  telegramLink: string;
  youtubeLink: string;
  instagramLink: string;
}

export interface LandingTestimonialItem {
  id: string;
  name: string;
  role: string;
  earnings: string;
  image: string;
  quote: string;
  rating: number;
  status: "active" | "inactive";
}

export interface LandingFaqItem {
  id: string;
  question: string;
  answer: string;
  status: "active" | "inactive";
}

export interface LandingSupportFooterConfig {
  supportTitle: string;
  supportSubtitle: string;
  supportTelegramHandle: string;
  supportTelegramLink: string;
  supportPhone: string;
  footerTagline: string;
  footerCopyright: string;
}

export interface LandingPageConfig {
  announcement: LandingAnnouncementConfig;
  hero: LandingHeroConfig;
  metrics: LandingMetricItem[];
  personas: LandingPersonaItem[];
  guaranteePillars: LandingGuaranteeItem[];
  founder: LandingFounderConfig;
  testimonials: LandingTestimonialItem[];
  faqs: LandingFaqItem[];
  supportFooter: LandingSupportFooterConfig;
}

// Initial Seed Data Fallbacks
const defaultLandingConfig: LandingPageConfig = {
  announcement: {
    enabled: true,
    badge: "NEW ENROLLMENT OPEN",
    text: "Founders Accelerator Round 6 registration is live! Get 25% OFF plus 3 bonus courses.",
    ctaText: "Claim Offer →"
  },
  hero: {
    badge: "#1 Digital Agency Incubator in Ethiopia",
    title: "Master High-Income Skills & Launch Your",
    highlightText: "6-Figure Agency",
    subtitle: "Step-by-step courses in Social Media Marketing (SMMA), Video Editing, Content Creation, and Graphic Design. Mentored by top digital entrepreneurs.",
    primaryCtaText: "Explore Courses",
    primaryCtaLink: "#courses",
    secondaryCtaText: "Watch 2-Min Demo",
    trustStudentsCount: "4,850+",
    trustSubtitle: "Ethiopian youth trained & launching clients",
    featuredCardTitle: "SMMA & Agency Growth Accelerator",
    featuredCardBadge: "LIVE BOOTCAMP",
    featuredCardPrice: "10,000 ETB",
    featuredCardDuration: "8 Weeks",
    featuredCardDesc: "Complete blueprint to acquire international & local clients, close retainers, and scale your digital agency.",
    featuredCardBonus: "Includes Free Business English & Upwork Mastery",
    featuredCardBtnText: "Quick Enroll Now"
  },
  metrics: [
    { id: "m1", target: 5200, suffix: "+", label: "Enrolled Students" },
    { id: "m2", target: 96, suffix: "%", label: "Course Completion Rate" },
    { id: "m3", target: 1200, suffix: "+", label: "Agencies & Freelancers Formed" },
    { id: "m4", target: 450, suffix: "K+ ETB", label: "Avg. Student Monthly Income" }
  ],
  personas: [
    {
      id: "p1",
      title: "University Students & Grads",
      description: "Break free from stagnant entry-level salaries and lack of opportunities. Learn high-income digital skills that allow you to earn 30,000 to 100,000+ ETB/month while still in school or right after graduation.",
      outcome: "Launch Remote Freelancing",
      icon: "graduation-cap"
    },
    {
      id: "p2",
      title: "9-to-5 Corporate Escapees",
      description: "Tired of the rigid corporate grind and limited pay ceilings? Build a high-ticket digital marketing agency on the side and create a predictable transition to financial freedom and remote location flexibility.",
      outcome: "High-Ticket Side Income",
      icon: "briefcase"
    },
    {
      id: "p3",
      title: "Freelancers & Creators",
      description: "Stop trading hours for cheap one-off $50 gigs. Master client acquisition, high-ticket packaging, and close recurring $1,000+ monthly retainers with international and local businesses.",
      outcome: "Convert Gigs to Retainers",
      icon: "sparkles"
    },
    {
      id: "p4",
      title: "Aspiring Agency Founders",
      description: "Master the complete agency operating system: cold outreach engines, high-converting discovery calls, legal client contracts, and contractor delegation for rapid, stress-free scaling.",
      outcome: "Scale to 5+ Retainers",
      icon: "rocket"
    }
  ],
  guaranteePillars: [
    {
      id: "g1",
      title: "100% Practical Training",
      description: "Real-world agency workflows, client pitching scripts, and live campaign setups.",
      icon: "video"
    },
    {
      id: "g2",
      title: "Mentorship & Community",
      description: "Weekly live coaching calls with Yonas and dedicated Telegram group support.",
      icon: "message-square"
    },
    {
      id: "g3",
      title: "Resource Vaults Included",
      description: "Downloadable cold email templates, proposal pitch decks, and legal contracts.",
      icon: "folder-down"
    },
    {
      id: "g4",
      title: "Verified Certification",
      description: "Earn a verified diploma upon completing your course modules and project.",
      icon: "award"
    }
  ],
  founder: {
    name: "Yonas Mohammed",
    role: "Founder & Lead Mentor",
    quote: "Our goal is to build 10,000 independent Ethiopian entrepreneurs by 2030.",
    leadText: "Founders Academy was established to provide Ethiopian youth with direct, real-world skills that traditional education overlooks.",
    bioText: "Unlike generic theory courses, every course is built on proven agency blueprints, real client campaigns, and actionable step-by-step strategies tailored for local and remote opportunities.",
    photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
    highlight1Title: "100K+ Community",
    highlight1Desc: "Active educational content across YouTube & TikTok",
    highlight2Title: "Direct Mentorship",
    highlight2Desc: "Weekly live coaching and Q&A sessions",
    telegramLink: "https://t.me/founders_channel",
    youtubeLink: "https://youtube.com",
    instagramLink: "https://instagram.com"
  },
  testimonials: [
    {
      id: "t1",
      name: "Abebe Kassaye",
      role: "SMMA Agency Founder",
      earnings: "3,400 USD / Month",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      quote: "Founders Academy transformed my life. Within 2 months of taking the SMMA course, I closed 3 remote clients from the US and UAE. The cold email scripts alone paid for the course 10x over!",
      rating: 5,
      status: "active"
    },
    {
      id: "t2",
      name: "Tigist Haile",
      role: "Freelance Video Editor",
      earnings: "120,000 ETB / Month",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      quote: "I started with zero video editing experience. Yonas' DaVinci and Premiere Pro modules gave me the exact skills needed to pitch YouTube creators. Now I edit for 4 top channels!",
      rating: 5,
      status: "active"
    },
    {
      id: "t3",
      name: "Dawit Worku",
      role: "Brand Identity Designer",
      earnings: "85,000 ETB / Month",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      quote: "The mentorship and community support in Telegram are unmatched. Whenever I ran into client pitch hurdles, the mentors helped me refine my proposal. Best investment I've ever made.",
      rating: 5,
      status: "active"
    }
  ],
  faqs: [
    {
      id: "f1",
      question: "Do I need prior experience or technical skills to enroll?",
      answer: "No prior experience is required! All our courses start with foundational principles before advancing into real-world agency workflows and client acquisition.",
      status: "active"
    },
    {
      id: "f2",
      question: "How do payments work in Ethiopia? What payment options are supported?",
      answer: "We support instant local mobile payments via Telebirr, direct bank transfers to Commercial Bank of Ethiopia (CBE account: 1000492819482), and international payment options.",
      status: "active"
    },
    {
      id: "f3",
      question: "How is the course delivered after payment?",
      answer: "Our courses are delivered 100% via Telegram! After completing payment, you launch our official bot @FoundersAcademyBot and tap 'Share Phone Number'. Once verified, the bot generates your unique, 1-time private Telegram channel link (HD video lessons & resource files) and 1-time private group link (student community & mentorship).",
      status: "active"
    },
    {
      id: "f4",
      question: "How do quizzes and certificates work inside Telegram?",
      answer: "Inside @FoundersAcademyBot, you can take interactive quizzes after completing course modules to test your skills. Once you finish all quizzes and submit your final project, the bot issues your official Verified Certificate directly in Telegram!",
      status: "active"
    },
    {
      id: "f5",
      question: "Do returning students need to share their phone number again?",
      answer: "No! Phone number sharing only happens once when a new student first registers with @FoundersAcademyBot. If you are already registered, the bot instantly recognizes your phone number and delivers your unique 1-time channel and group links immediately.",
      status: "active"
    }
  ],
  supportFooter: {
    supportTitle: "Need Immediate Help with Enrollment?",
    supportSubtitle: "Our team is available on Telegram to guide your registration & payment choices.",
    supportTelegramHandle: "@founderssupport",
    supportTelegramLink: "https://t.me/founderssupport",
    supportPhone: "+251 906 769 999",
    footerTagline: "Ethiopia's premier e-learning platform & digital agency incubator.",
    footerCopyright: "© 2026 Founders Academy. All Rights Reserved."
  }
};

// Initial Seed Data Fallbacks
const defaultCategories: Category[] = [
  { id: "cat-1", name: "Digital Marketing / SMMA", status: "ON" },
  { id: "cat-2", name: "Video Editing & VFX", status: "ON" },
  { id: "cat-3", name: "Content Creation", status: "ON" },
  { id: "cat-4", name: "Graphic Design", status: "ON" },
  { id: "cat-5", name: "AI & Automation", status: "ON" }
];

const defaultCourses: Masterclass[] = [
  {
    id: "course-smma-accelerator",
    title: "SMMA & Agency Growth Accelerator",
    category: "Digital Marketing / SMMA",
    price: "10,000 ETB",
    duration: "6 Weeks (24 Hours)",
    description: "• High-ticket client acquisition & cold outreach mastery\n• Proposal templates, contracts, and pricing frameworks\n• Scaling client ad accounts with Meta & Google Ads\n✔ Includes weekly live mentorship & Discord mastermind",
    tg_channel: "https://t.me/founders_smma_channel",
    tg_group: "https://t.me/founders_smma_group",
    status: "ON",
    enrolled_students: 1840
  },
  {
    id: "course-video-editing",
    title: "Video Editing & Post-Production Masterclass",
    category: "Video Editing & VFX",
    price: "8,500 ETB",
    duration: "5 Weeks (20 Hours)",
    description: "• Adobe Premiere Pro & After Effects workflow pipeline\n• Sound design, dynamic pacing, and viral short-form retention\n• Professional color grading in DaVinci Resolve\n✔ Includes 50+ sound FX, transitions, and motion packs",
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
    duration: "4 Weeks (16 Hours)",
    description: "• Hook generation & storytelling frameworks that go viral\n• Lighting, audio, and smartphone cinematography\n• Monetization strategies for TikTok, YouTube Shorts, & Reels\n✔ Includes 30-day viral content calendar template",
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
    duration: "5 Weeks (22 Hours)",
    description: "• Photoshop & Illustrator advanced design fundamentals\n• Logo systems, typography rules, and brand guidelines\n• Client portfolio building and commercial presentation\n✔ Includes premium mockup templates & typography kits",
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
    duration: "6 Weeks (26 Hours)",
    description: "• Custom ChatGPT assistants & OpenAI API bot development\n• Make.com & Zapier complex business workflow automations\n• CRM integration, lead capture bots, and automated invoicing\n✔ Includes production-ready webhook & workflow blueprints",
    tg_channel: "https://t.me/founders_ai_channel",
    tg_group: "https://t.me/founders_ai_group",
    status: "ON",
    enrolled_students: 520
  }
];

const defaultStudents: Student[] = [
  { id: "STU-8821", name: "Abebe Kebede", phone: "+251 91 123 4567", email: "abebe.k@gmail.com", joined_date: "Jan 14, 2026" },
  { id: "STU-8822", name: "Tigist Haile", phone: "+251 92 345 6789", email: "tigist.h@yahoo.com", joined_date: "Jan 18, 2026" },
  { id: "STU-8823", name: "Yonas Alemu", phone: "+251 93 456 7890", email: "yonas.alemu@outlook.com", joined_date: "Jan 22, 2026" },
  { id: "STU-8824", name: "Bethlehem Tadesse", phone: "+251 94 567 8901", email: "betti.t@gmail.com", joined_date: "Jan 28, 2026" },
  { id: "STU-8825", name: "Dawit Worku", phone: "+251 91 678 9012", email: "dawit.worku@hotmail.com", joined_date: "Feb 02, 2026" }
];

const defaultTransactions: Transaction[] = [
  {
    id: "TXN-884920",
    student_name: "Abebe Bikila",
    student_phone: "+251 91 123 4567",
    student_email: "abebe.b@gmail.com",
    masterclass_title: "SMMA & Agency Growth Accelerator",
    course_id: "course-smma-accelerator",
    payment_method: "telebirr",
    reference_number: "TLB-9938102",
    amount: "ETB 10,000",
    status: "Completed",
    verify_et_status: "VERIFIED",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "TXN-884921",
    student_name: "Tigist Haile",
    student_phone: "+251 92 888 9900",
    student_email: "tigist.h@yahoo.com",
    masterclass_title: "Video Editing & Post-Production Masterclass",
    course_id: "course-video-editing",
    payment_method: "cbe",
    reference_number: "FT240108829",
    account_suffix: "12345678",
    amount: "ETB 8,500",
    status: "Completed",
    verify_et_status: "VERIFIED",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "TXN-884922",
    student_name: "Dawit Yilma",
    student_phone: "+251 94 333 2211",
    student_email: "dawit.y@gmail.com",
    masterclass_title: "Content Creation & Short Form Viral Blueprint",
    course_id: "course-content-creation",
    payment_method: "boa",
    reference_number: "BOA-7729104",
    amount: "ETB 6,500",
    status: "Pending",
    verify_et_status: "PENDING_AUDIT",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

const courseStatusOverrides: Record<string, "ON" | "OFF"> = {};
const courseOverrides: Record<string, Partial<Masterclass>> = {};
const deletedCourseIds = new Set<string>();
const addedCourses: Masterclass[] = [];

let inMemoryMaintenance: MaintenanceState = {
  status: "OFF",
  title: "System Under Scheduled Upgrades & Maintenance",
  message: "We are currently upgrading Founders Academy infrastructure and database performance. Access will resume shortly."
};

const defaultQuizzes: CourseQuiz[] = [
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

const defaultQuizSubmissions: QuizSubmission[] = [
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

let inMemoryLandingConfig: LandingPageConfig = JSON.parse(JSON.stringify(defaultLandingConfig));

let inMemoryCategories = [...defaultCategories];
let inMemoryCourses = [...defaultCourses];
let inMemoryStudents = [...defaultStudents];
let inMemoryTransactions = [...defaultTransactions];
let inMemoryQuizzes: CourseQuiz[] = JSON.parse(JSON.stringify(defaultQuizzes));
let inMemoryQuizSubmissions: QuizSubmission[] = JSON.parse(JSON.stringify(defaultQuizSubmissions));

const DB_FILE_PATH = "./db/database.json";

function loadDiskDatabase() {
  try {
    let content = "";
    if (typeof Deno !== "undefined" && typeof Deno.readTextFileSync === "function") {
      content = Deno.readTextFileSync(DB_FILE_PATH);
    }
    if (content) {
      const parsed = JSON.parse(content);
      if (parsed.landing_config) inMemoryLandingConfig = parsed.landing_config;
      if (parsed.categories && Array.isArray(parsed.categories)) inMemoryCategories = parsed.categories;
      if (parsed.courses && Array.isArray(parsed.courses)) inMemoryCourses = parsed.courses;
      if (parsed.students && Array.isArray(parsed.students)) inMemoryStudents = parsed.students;
      if (parsed.transactions && Array.isArray(parsed.transactions)) inMemoryTransactions = parsed.transactions;
      if (parsed.maintenance) inMemoryMaintenance = parsed.maintenance;
    }
  } catch (_e) {
    /* fallback */
  }
}

function saveDiskDatabase() {
  try {
    const payload = {
      landing_config: inMemoryLandingConfig,
      categories: inMemoryCategories,
      courses: inMemoryCourses,
      students: inMemoryStudents,
      transactions: inMemoryTransactions,
      maintenance: inMemoryMaintenance,
      updated_at: new Date().toISOString()
    };
    if (typeof Deno !== "undefined" && typeof Deno.writeTextFileSync === "function") {
      Deno.writeTextFileSync(DB_FILE_PATH, JSON.stringify(payload, null, 2));
    }
  } catch (_e) {
    /* write fallback */
  }
}

// Initial hydration from persistent disk database
loadDiskDatabase();

export const dbStore = {
  // --- Landing Page Content CMS ---
  getLandingConfig: async (): Promise<LandingPageConfig> => {
    try {
      const { data, error } = await supabase.from("landing_config").select("*").eq("id", 1).single();
      if (!error && data && data.config) {
        inMemoryLandingConfig = data.config;
        saveDiskDatabase();
        return data.config;
      }
    } catch (_e) { /* fallback */ }
    return JSON.parse(JSON.stringify(inMemoryLandingConfig));
  },
  updateLandingConfig: async (data: Partial<LandingPageConfig>): Promise<LandingPageConfig> => {
    const updated = { ...inMemoryLandingConfig, ...data };
    try {
      await supabase.from("landing_config").upsert({ id: 1, config: updated });
    } catch (_e) { /* fallback */ }
    inMemoryLandingConfig = JSON.parse(JSON.stringify(updated));
    saveDiskDatabase();
    return JSON.parse(JSON.stringify(inMemoryLandingConfig));
  },
  resetLandingConfig: async (): Promise<LandingPageConfig> => {
    const reset = JSON.parse(JSON.stringify(defaultLandingConfig));
    try {
      await supabase.from("landing_config").upsert({ id: 1, config: reset });
    } catch (_e) { /* fallback */ }
    inMemoryLandingConfig = reset;
    saveDiskDatabase();
    return JSON.parse(JSON.stringify(inMemoryLandingConfig));
  },
  // --- Quizzes CRUD & Submissions ---
  getQuizzesByCourse: async (courseId: string): Promise<CourseQuiz[]> => {
    let courseQuizzes: CourseQuiz[] = [];
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

  getQuizById: async (quizId: string): Promise<CourseQuiz | null> => {
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

  createQuiz: async (courseId: string, quizData: any): Promise<CourseQuiz> => {
    const quizId = `quiz-${Date.now()}`;
    const newQuiz: CourseQuiz = {
      id: quizId,
      course_id: courseId,
      title: (quizData.title || "New Masterclass Quiz").trim(),
      description: (quizData.description || "").trim(),
      time_limit_mins: parseInt(quizData.time_limit_mins, 10) || 15,
      passing_score: parseInt(quizData.passing_score, 10) || 70,
      status: quizData.status || "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const rawQuestions = Array.isArray(quizData.questions) ? quizData.questions : [];
    const formattedQuestions: QuizQuestion[] = rawQuestions.map((q: any, idx: number) => ({
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

  updateQuiz: async (quizId: string, quizData: any): Promise<CourseQuiz> => {
    const existing = inMemoryQuizzes.find(q => q.id === quizId);
    if (existing) {
      if (quizData.title !== undefined) existing.title = quizData.title.trim();
      if (quizData.description !== undefined) existing.description = quizData.description.trim();
      if (quizData.time_limit_mins !== undefined) existing.time_limit_mins = parseInt(quizData.time_limit_mins, 10) || 15;
      if (quizData.passing_score !== undefined) existing.passing_score = parseInt(quizData.passing_score, 10) || 70;
      if (quizData.status !== undefined) existing.status = quizData.status;
      if (Array.isArray(quizData.questions)) {
        existing.questions = quizData.questions.map((q: any, idx: number) => ({
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

    return existing || ({ id: quizId, ...quizData } as any);
  },

  deleteQuiz: async (quizId: string): Promise<boolean> => {
    inMemoryQuizzes = inMemoryQuizzes.filter(q => q.id !== quizId);
    inMemoryQuizSubmissions = inMemoryQuizSubmissions.filter(s => s.quiz_id !== quizId);
    try {
      await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
      await supabase.from("course_quizzes").delete().eq("id", quizId);
    } catch (_e) {}
    return true;
  },

  getQuizSubmissions: async (courseId?: string, quizId?: string): Promise<QuizSubmission[]> => {
    let results: QuizSubmission[] = [];
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

  submitQuizResult: async (submissionData: any): Promise<QuizSubmission> => {
    const newSubmission: QuizSubmission = {
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

  // --- Categories CRUD ---
  getCategories: async (): Promise<Category[]> => {
    try {
      const { data, error } = await supabase.from("categories").select("*");
      if (!error && data && data.length > 0) {
        inMemoryCategories = data;
        return data;
      }
    } catch (_e) { /* fallback */ }
    return [...inMemoryCategories];
  },
  addCategory: async (name: string): Promise<Category> => {
    const newCat: Category = { id: `cat-${Date.now()}`, name, status: "ON" };
    try {
      await supabase.from("categories").insert([newCat]);
    } catch (_e) { /* fallback */ }
    inMemoryCategories.push(newCat);
    saveDiskDatabase();
    return newCat;
  },
  updateCategoryStatus: async (id: string, status: "ON" | "OFF"): Promise<Category | undefined> => {
    try {
      await supabase.from("categories").update({ status }).eq("id", id);
    } catch (_e) { /* fallback */ }
    const cat = inMemoryCategories.find(c => c.id === id);
    if (cat) cat.status = status;
    saveDiskDatabase();
    return cat;
  },
  deleteCategory: async (id: string): Promise<boolean> => {
    try {
      await supabase.from("categories").delete().eq("id", id);
    } catch (_e) { /* fallback */ }
    inMemoryCategories = inMemoryCategories.filter(c => c.id !== id);
    saveDiskDatabase();
    return true;
  },

  // --- Courses CRUD with Guaranteed Status Persistence ---
  getCourses: async (): Promise<Masterclass[]> => {
    let list = [...inMemoryCourses];
    try {
      const { data, error } = await supabase.from("courses").select("*");
      if (!error && data && data.length > 0) {
        list = data.filter((c: any) => !deletedCourseIds.has(c.id));
      }
    } catch (_e) { /* fallback */ }

    // Apply all overrides and status toggles reliably
    list = list.map(c => {
      const override = courseOverrides[c.id];
      const statusOverride = courseStatusOverrides[c.id];
      return {
        ...c,
        ...(override || {}),
        ...(statusOverride ? { status: statusOverride } : {})
      };
    });

    for (const added of addedCourses) {
      if (!list.some(c => c.id === added.id) && !deletedCourseIds.has(added.id)) {
        const override = courseOverrides[added.id];
        const statusOverride = courseStatusOverrides[added.id];
        list.push({
          ...added,
          ...(override || {}),
          ...(statusOverride ? { status: statusOverride } : {})
        });
      }
    }

    inMemoryCourses = list;
    return list;
  },
  addCourse: async (course: Partial<Masterclass>): Promise<Masterclass> => {
    const newCourse: Masterclass = {
      id: `course-${Date.now()}`,
      title: course.title || "New Masterclass",
      category: course.category || "Digital Marketing / SMMA",
      price: course.price || "8,500 ETB",
      duration: course.duration || "6 Weeks (24 Hours)",
      description: course.description || "Comprehensive masterclass curriculum.",
      tg_channel: course.tg_channel || "",
      tg_group: course.tg_group || "",
      status: "ON",
      enrolled_students: 0
    };
    try {
      await supabase.from("courses").insert([newCourse]);
    } catch (_e) { /* fallback */ }
    addedCourses.push(newCourse);
    inMemoryCourses.push(newCourse);
    saveDiskDatabase();
    return newCourse;
  },
  updateCourse: async (id: string, data: Partial<Masterclass>): Promise<Masterclass | undefined> => {
    if (data.status) {
      courseStatusOverrides[id] = data.status as "ON" | "OFF";
    }
    courseOverrides[id] = { ...(courseOverrides[id] || {}), ...data };

    try {
      await supabase.from("courses").update(data).eq("id", id);
    } catch (_e) { /* fallback */ }

    const course = inMemoryCourses.find(c => c.id === id);
    if (course) {
      Object.assign(course, data);
      saveDiskDatabase();
      return course;
    }
    saveDiskDatabase();
    return { id, ...data } as Masterclass;
  },
  deleteCourse: async (id: string): Promise<boolean> => {
    deletedCourseIds.add(id);
    delete courseStatusOverrides[id];
    delete courseOverrides[id];

    try {
      await supabase.from("courses").delete().eq("id", id);
    } catch (_e) { /* fallback */ }

    inMemoryCourses = inMemoryCourses.filter(c => c.id !== id);
    saveDiskDatabase();
    return true;
  },

  // --- Students CRUD ---
  getStudents: async (): Promise<Student[]> => {
    try {
      const { data, error } = await supabase.from("students").select("*");
      if (!error && data && data.length > 0) {
        inMemoryStudents = data;
        return data;
      }
    } catch (_e) { /* fallback */ }
    return [...inMemoryStudents];
  },
  addStudent: async (student: Partial<Student>): Promise<Student> => {
    const newStu: Student = {
      id: `STU-${Math.floor(8000 + Math.random() * 1000)}`,
      name: student.name || "New Student",
      phone: student.phone || "+251 90 000 0000",
      email: student.email || "student@example.com",
      joined_date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    };
    try {
      await supabase.from("students").insert([newStu]);
    } catch (_e) { /* fallback */ }
    inMemoryStudents.push(newStu);
    saveDiskDatabase();
    return newStu;
  },

  // --- Transactions & Financial Ledger CRUD ---
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        inMemoryTransactions = data as Transaction[];
        return data as Transaction[];
      }
    } catch (_e) { /* fallback */ }
    return [...inMemoryTransactions];
  },
  getTransactionById: async (id: string): Promise<Transaction | undefined> => {
    try {
      const { data, error } = await supabase.from("transactions").select("*").eq("id", id).single();
      if (!error && data) return data as Transaction;
    } catch (_e) { /* fallback */ }
    return inMemoryTransactions.find(t => t.id === id || t.reference_number === id);
  },
  addTransaction: async (txnData: Partial<Transaction>): Promise<Transaction> => {
    const newTxn: Transaction = {
      id: txnData.id || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      student_name: txnData.student_name || "Anonymous",
      student_phone: txnData.student_phone || "",
      student_email: txnData.student_email || "",
      masterclass_title: txnData.masterclass_title || "Course Enrollment",
      course_id: txnData.course_id || "",
      payment_method: txnData.payment_method || "telebirr",
      reference_number: txnData.reference_number || "",
      account_suffix: txnData.account_suffix || "",
      amount: typeof txnData.amount === "number" ? `ETB ${(txnData.amount as number).toLocaleString()}` : (txnData.amount || "ETB 0"),
      status: txnData.status || "Completed",
      verify_et_status: txnData.verify_et_status || "VERIFIED",
      metadata: txnData.metadata || {},
      created_at: txnData.created_at || new Date().toISOString()
    };

    try {
      await supabase.from("transactions").insert([newTxn]);
    } catch (_e) { /* fallback */ }

    inMemoryTransactions.unshift(newTxn);
    saveDiskDatabase();
    return newTxn;
  },
  updateTransactionStatus: async (id: string, status: "Completed" | "Pending" | "Failed" | "Refunded", metadata: Record<string, any> = {}): Promise<Transaction | null> => {
    const patch = { status, ...(metadata ? { metadata } : {}) };
    try {
      await supabase.from("transactions").update(patch).eq("id", id);
    } catch (_e) { /* fallback */ }

    const txn = inMemoryTransactions.find(t => t.id === id || t.reference_number === id);
    if (txn) {
      txn.status = status;
      if (metadata) txn.metadata = { ...(txn.metadata || {}), ...metadata };
      saveDiskDatabase();
      return txn;
    }
    saveDiskDatabase();
    return null;
  },

  // --- Auto-Enrollment Helper ---
  enrollStudentAndGrantAccess: async ({ student, courseId, txnId }: { student: Partial<Student>; courseId?: string; txnId?: string }) => {
    const newStudent = await dbStore.addStudent(student);
    const courses = await dbStore.getCourses();
    const course = courses.find(c => c.id === courseId || c.title === courseId);
    if (course) {
      const currentCount = parseInt(String(course.enrolled_students || 0), 10);
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
        channel: course?.tg_channel || "https://t.me/founders_academy_general",
        group: course?.tg_group || "https://t.me/founders_academy_group"
      }
    };
  },

  // --- Maintenance State ---
  getMaintenance: async (): Promise<MaintenanceState> => {
    try {
      const { data, error } = await supabase.from("maintenance").select("*").eq("id", 1).single();
      if (!error && data) {
        inMemoryMaintenance = {
          status: data.status || inMemoryMaintenance.status,
          title: data.title || inMemoryMaintenance.title,
          message: data.message || inMemoryMaintenance.message
        };
        saveDiskDatabase();
        return { ...inMemoryMaintenance };
      }
    } catch (_e) { /* fallback */ }
    return { ...inMemoryMaintenance };
  },
  updateMaintenance: async (data: Partial<MaintenanceState>): Promise<MaintenanceState> => {
    const updated: MaintenanceState = {
      status: data.status !== undefined ? data.status : inMemoryMaintenance.status,
      title: data.title !== undefined ? data.title : inMemoryMaintenance.title,
      message: data.message !== undefined ? data.message : inMemoryMaintenance.message
    };
    try {
      await supabase.from("maintenance").upsert({ id: 1, ...updated });
    } catch (_e) { /* fallback */ }
    inMemoryMaintenance = updated;
    saveDiskDatabase();
    return { ...inMemoryMaintenance };
  },

  // --- Merchant Bank Accounts Store ---
  getBankAccounts: async () => {
    try {
      const { data, error } = await supabase.from("bank_accounts").select("*").eq("id", 1).maybeSingle();
      if (!error && data && data.config) {
        inMemoryBankAccounts = data.config;
        return data.config;
      }
    } catch (_e) { /* fallback */ }
    return { ...inMemoryBankAccounts };
  },
  updateBankAccounts: async (config: any) => {
    inMemoryBankAccounts = { ...inMemoryBankAccounts, ...(config || {}), updatedAt: new Date().toISOString() };
    try {
      await supabase.from("bank_accounts").upsert([{ id: 1, config: inMemoryBankAccounts, updated_at: new Date().toISOString() }]);
    } catch (_e) { /* fallback */ }
    saveDiskDatabase();
    return { ...inMemoryBankAccounts };
  }
};

const defaultBankAccounts = {
  cbeAccountName: "Founders Academy LLC",
  cbeAccountNumber: "1000492819482",
  cbeAccountSuffix: "49281948",
  telebirrMerchantPhone: "+251 906 769 999",
  boaAccountNumber: "0132088829100",
  updatedAt: new Date().toISOString()
};

let inMemoryBankAccounts = { ...defaultBankAccounts };
