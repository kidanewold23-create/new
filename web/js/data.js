/* ==========================================================================
   FOUNDERS ACADEMY DATA STORE & TRANSLATIONS
   ========================================================================== */

const COURSES = [
  {
    id: "smma-accelerator",
    title: "SMMA & Agency Growth Accelerator",
    category: "marketing",
    badge: "Bestseller",
    priceETB: "10,000 ETB",
    originalPriceETB: "15,000 ETB",
    priceUSD: "$180",
    rating: 4.9,
    students: "1,840",
    duration: "8 Weeks",
    modulesCount: 48,
    level: "All Levels",
    description: "The complete step-by-step course to launch your social media marketing agency, close local & international clients, and build recurring monthly revenue.",
    outcomes: [
      "Find and audit prospective clients in local and foreign markets",
      "Master high-converting cold email, LinkedIn, and Instagram outreach",
      "Run profitable Facebook, Instagram, and TikTok ad campaigns for businesses",
      "Standardize agency onboarding, service delivery, and monthly retainer billing"
    ],
    bonuses: [
      "Included: Professional Business English Course ($150 Value)",
      "Included: Cold Email & Upwork Client Outreach Scripts ($100 Value)",
      "Included: Client Contract & Service Level Agreement Templates"
    ],
    modules: [
      { title: "Module 1: Agency Foundation & Service Niche Selection", duration: "1h 45m" },
      { title: "Module 2: Setting Up Your Agency Entity & Online Assets", duration: "2h 10m" },
      { title: "Module 3: Prospecting & Lead Generation", duration: "3h 00m" },
      { title: "Module 4: The 2-Step Discovery & Closing Call Script", duration: "2h 30m" },
      { title: "Module 5: Meta & TikTok Paid Ads Delivery", duration: "4h 15m" },
      { title: "Module 6: Scaling to 5 Active Retainers & Hiring Contractors", duration: "2h 00m" }
    ]
  },
  {
    id: "video-editing-pro",
    title: "Video Editing & Post-Production Course",
    category: "video",
    badge: "High Demand",
    priceETB: "8,500 ETB",
    originalPriceETB: "11,000 ETB",
    priceUSD: "$150",
    rating: 4.95,
    students: "1,420",
    duration: "6 Weeks",
    modulesCount: 36,
    level: "Beginner to Advanced",
    description: "Master Premiere Pro, DaVinci Resolve, and After Effects to edit viral reels, YouTube videos, and commercial ads for global creators and brands.",
    outcomes: [
      "Master Premiere Pro & After Effects color grading, motion graphics, and audio mixing",
      "Edit fast-paced, high-retention vertical videos for TikTok, YouTube Shorts, and Reels",
      "Build a killer video editor portfolio site that attracts high-paying creators",
      "Price your editing packages and close monthly content editing retainers"
    ],
    bonuses: [
      "Included: 50GB+ Sound Effects & Motion Preset Asset Pack ($200 Value)",
      "Included: Client Brief & Video Approval Workflow Sheets"
    ],
    modules: [
      { title: "Module 1: Software Setup & Video Editing Workflow Essentials", duration: "2h 00m" },
      { title: "Module 2: High-Retention Pacing, Cuts & Sound Design Secrets", duration: "2h 45m" },
      { title: "Module 3: Motion Graphics, Captions & Sound Effects in After Effects", duration: "3h 30m" },
      { title: "Module 4: Color Grading (DaVinci & Premiere)", duration: "2h 15m" },
      { title: "Module 5: Portfolio Creation & Pitching YouTube Creators", duration: "2h 00m" }
    ]
  },
  {
    id: "content-branding",
    title: "Content Creation & Personal Branding Blueprint",
    category: "content",
    badge: "Trending",
    priceETB: "7,500 ETB",
    originalPriceETB: "9,500 ETB",
    priceUSD: "$130",
    rating: 4.88,
    students: "980",
    duration: "5 Weeks",
    modulesCount: 30,
    level: "All Levels",
    description: "Learn how to build a powerful personal brand on social media, create engaging video content, and monetize your audience through digital products and sponsorships.",
    outcomes: [
      "Define your unique content niche and audience persona",
      "Script, film, and edit engaging videos with just your smartphone",
      "Grow your organic reach across YouTube, Instagram, and TikTok",
      "Monetize through digital courses, consulting, and brand sponsorships"
    ],
    bonuses: [
      "Included: 100+ Viral Hook Templates & Content Calendar Planner",
      "Included: Brand Deal Negotiation & Sponsorship Rate Card Guide"
    ],
    modules: [
      { title: "Module 1: Brand Positioning & Finding Your High-Impact Niche", duration: "1h 30m" },
      { title: "Module 2: Scripting & Storytelling for High Retention", duration: "2h 15m" },
      { title: "Module 3: Smartphone Production, Lighting & Audio Setup", duration: "1h 45m" },
      { title: "Module 4: Algorithm Mastery & Multi-Platform Distribution", duration: "2h 30m" },
      { title: "Module 5: Monetization Blueprint & Digital Product Launch", duration: "2h 00m" }
    ]
  },
  {
    id: "graphic-design-agency",
    title: "Graphic Design & Brand Identity Mastery",
    category: "design",
    badge: "Popular",
    priceETB: "8,000 ETB",
    originalPriceETB: "10,500 ETB",
    priceUSD: "$140",
    rating: 4.85,
    students: "1,110",
    duration: "6 Weeks",
    modulesCount: 34,
    level: "Beginner to Intermediate",
    description: "Go from design fundamentals to building full brand identities, logo suites, social media assets, and UI design packages for businesses.",
    outcomes: [
      "Master Photoshop, Illustrator, and Figma for professional design work",
      "Create complete visual brand identities, brand guidelines, and logos",
      "Design high-converting social media carousels and ad creatives",
      "Package design services into recurring monthly design retainers"
    ],
    bonuses: [
      "Included: 500+ Premium Font Suite & Mockup Asset Library",
      "Included: Brand Identity Proposal & Invoice Templates"
    ],
    modules: [
      { title: "Module 1: Design Principles, Typography & Color Theory", duration: "2h 10m" },
      { title: "Module 2: Logo Design & Vector Graphics in Illustrator", duration: "3h 00m" },
      { title: "Module 3: Social Media Asset & Ad Creative Design in Photoshop", duration: "2h 45m" },
      { title: "Module 4: Brand Identity Systems & Style Guidelines", duration: "2h 20m" },
      { title: "Module 5: Portfolio Building & Freelance Client Acquisition", duration: "2h 00m" }
    ]
  },
  {
    id: "cinematography-pro",
    title: "Commercial Cinematography & Production",
    category: "video",
    badge: "Featured",
    priceETB: "9,000 ETB",
    originalPriceETB: "12,000 ETB",
    priceUSD: "$160",
    rating: 4.92,
    students: "740",
    duration: "7 Weeks",
    modulesCount: 40,
    level: "Intermediate to Advanced",
    description: "Learn high-end camera operating, lighting setups, commercial video scripting, and production techniques to shoot commercials for local and international brands.",
    outcomes: [
      "Master camera settings, lens selection, and 3-point studio lighting",
      "Direct and shoot commercial ads, music videos, and corporate promos",
      "Develop commercial storyboards and production pitch decks",
      "Build a video production company and pitch business clients"
    ],
    bonuses: [
      "Included: Cinematic LUTs & Color Grading Preset Pack ($150 Value)",
      "Included: Commercial Production Budget & Pitch Deck Templates"
    ],
    modules: [
      { title: "Module 1: Camera Mechanics, Lenses & Exposure", duration: "2h 30m" },
      { title: "Module 2: Cinematic Lighting Setup & Studio Rigging", duration: "3h 15m" },
      { title: "Module 3: Commercial Directing & Storyboarding Secrets", duration: "2h 40m" },
      { title: "Module 4: Audio Recording, Microphones & Field Mixing", duration: "2h 00m" },
      { title: "Module 5: Pricing Production Packages & Closing Corporate Clients", duration: "2h 15m" }
    ]
  },
  {
    id: "free-starter",
    title: "Online Business & Freelancing Kickstart",
    category: "free",
    badge: "100% FREE",
    priceETB: "0 ETB",
    originalPriceETB: "2,500 ETB",
    priceUSD: "FREE",
    rating: 4.96,
    students: "4,200",
    duration: "1 Week",
    modulesCount: 10,
    level: "Beginner",
    description: "An introductory crash course explaining how digital freelancing works, setting up your Upwork profile, and choosing the right high-income skill for your career.",
    outcomes: [
      "Understand the global digital economy and high-income skills",
      "Set up an optimized Upwork and Fiverr freelance profile",
      "Learn how to receive payments securely in Ethiopia"
    ],
    bonuses: [
      "Included: PDF Checklist: Top 10 In-Demand Remote Skills for 2026"
    ],
    modules: [
      { title: "Module 1: Welcome to Digital Entrepreneurship", duration: "30m" },
      { title: "Module 2: Navigating Upwork & Setting Up Your Profile", duration: "45m" },
      { title: "Module 3: Choosing Your High-Income Career Path", duration: "40m" }
    ]
  }
];

const TESTIMONIALS = [
  {
    name: "Abebe Kassaye",
    role: "SMMA Agency Founder",
    earnings: "3,400 USD / Month",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    quote: "Founders Academy transformed my life. Within 2 months of taking the SMMA course, I closed 3 remote clients from the US and UAE. The cold email scripts alone paid for the course 10x over!"
  },
  {
    name: "Tigist Haile",
    role: "Freelance Video Editor",
    earnings: "120,000 ETB / Month",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    quote: "I started with zero video editing experience. Yonas' DaVinci and Premiere Pro modules gave me the exact skills needed to pitch YouTube creators. Now I edit for 4 top channels!"
  },
  {
    name: "Dawit Worku",
    role: "Brand Identity Designer",
    earnings: "85,000 ETB / Month",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    quote: "The mentorship and community support in Telegram are unmatched. Whenever I ran into client pitch hurdles, Yonas and the mentors helped me refine my proposal. Best investment I've ever made."
  }
];

const FAQS = [
  {
    question: "Do I need prior experience or technical skills to enroll?",
    answer: "No prior experience is required! All our courses start with foundational principles before advancing into real-world agency workflows and client acquisition."
  },
  {
    question: "How do payments work in Ethiopia? What payment options are supported?",
    answer: "We support instant local mobile payments via Telebirr, direct bank transfers to Commercial Bank of Ethiopia (CBE account: 1000492819482), and international payment options."
  },
  {
    question: "How is the course delivered after payment?",
    answer: "Our courses are delivered 100% via Telegram! After completing payment, you launch our official bot @founders_academybot and tap 'Share Phone Number'. Once verified, the bot generates your unique, 1-time private Telegram channel link (HD video lessons & resource files) and 1-time private group link (student community & mentorship)."
  },
  {
    question: "How do quizzes and certificates work inside Telegram?",
    answer: "Inside @founders_academybot, you can take interactive quizzes after completing course modules to test your skills. Once you finish all quizzes and submit your final project, the bot issues your official Verified Certificate directly in Telegram!"
  },
  {
    question: "Do returning students need to share their phone number again?",
    answer: "No! Phone number sharing only happens once when a new student first registers with @founders_academybot. If you are already registered, the bot instantly recognizes your phone number and delivers your unique 1-time channel and group links immediately."
  }
];



