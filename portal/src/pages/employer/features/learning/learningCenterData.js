import heroLearning from '../../../../../assets/heroLearning.png';
import heroLearning2 from '../../../../../assets/heroLearning2.png';
import hero3 from '../../../../../assets/hero3.png';
import hero4 from '../../../../../assets/hero4.png';
import hero5 from '../../../../../assets/hero5.png';
import mentor1 from '../../../../../assets/mentor1.png';
import mentor2 from '../../../../../assets/mentor2.png';
import mentor3 from '../../../../../assets/mentor3.png';

/* ─── ROTATING WORDS FOR HERO TITLE ─── */
export const ROTATING_WORDS = ['video tutorials', 'step-by-step guides', 'free webinars'];

/* ─── PRODUCTS OVERVIEW ─── */
export const PRODUCTS = [
  {
    id: 'resdex',
    label: 'Resdex',
    title: 'Resdex',
    desc: "India's largest resume database, with over 10Cr+ profiles across industries, functions, and experience levels. Search, filter, and reach out to the right candidates - all in one place.",
    tags: ['Read Guide'],
    color: '#002366',
    gradient: 'linear-gradient(135deg, #002366 0%, #0050a0 100%)',
    img: heroLearning,
    guidePath: '/employers/learning-center/guides/resdex'
  },
  {
    id: 'ai',
    label: 'AI Sourcing',
    title: 'Maven AI Sourcing (AI REX)',
    desc: "AI-powered talent sourcing that finds, screens, and ranks candidates automatically — cutting sourcing time from days to hours. Let the AI do the heavy lifting so you focus on hiring decisions.",
    tags: ['Read Guide'],
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    img: hero5,
    guidePath: '/employers/learning-center/guides/ai-rex'
  },
  {
    id: 'jobs',
    label: 'Job Posting',
    title: 'Job Posting',
    desc: "List your open jobs in front of India's largest pool of job seekers, where candidates find and apply to your jobs. You can edit, manage, and track your postings all in one place.",
    tags: ['Read Guide'],
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    img: heroLearning2,
    guidePath: '/employers/learning-center/guides/job-posting'
  },
  {
    id: 'analytics',
    label: 'Talent Analytics',
    title: 'Talent Pulse Analytics',
    desc: "AI-powered workforce intelligence that surfaces talent availability, salary benchmarks, and competitor hiring trends — helping you make smarter, faster, data-driven hiring decisions.",
    tags: [],
    color: '#dc2626',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
    img: hero4
  },
  {
    id: 'branding',
    label: 'Employer Branding',
    title: 'Employer Branding Hub',
    desc: "Build a compelling employer brand that attracts top talent. Showcase your company culture, benefits, and values with a rich Company Page that makes candidates choose you over competitors.",
    tags: [],
    color: '#0284c7',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    img: hero3
  },
];

/* ─── UPCOMING LIVE WEBINARS ─── */
export const WEBINARS = [
  { id: 1, product: 'Resume Database', title: 'Basics of Resume Search', desc: 'Learn how to search, filter & shortlist candidates that match your hiring brief.', schedule: 'Mon & Wed', duration: '30 mins', seats: 48 },
  { id: 2, product: 'Resume Database', title: 'Advanced Boolean Masterclass', desc: 'Boolean search, proximity search & advanced filters to surface profiles others miss.', schedule: 'Tue & Thu', duration: '45 mins', seats: 32 },
  { id: 3, product: 'AI Sourcing', title: 'Getting Started with AI Sourcing', desc: 'Set up your first AI sourcing campaign and screen hundreds of candidates automatically.', schedule: 'Wed & Fri', duration: '30 mins', seats: 60 },
  { id: 4, product: 'Job Posting', title: 'Writing Jobs That Convert', desc: 'Craft compelling job descriptions that attract quality applicants and reduce drop-offs.', schedule: 'Mon & Thu', duration: '30 mins', seats: 75 },
  { id: 5, product: 'Talent Analytics', title: 'Data-Driven Hiring Decisions', desc: 'Use market intelligence to benchmark salaries and identify talent gaps before they cost you.', schedule: 'Tue & Fri', duration: '45 mins', seats: 28 },
];

/* ─── PRODUCT EXPERTS & TALENT COACHES ─── */
export const EXPERTS = [
  { name: 'Sahil Manoj', role: 'Senior Talent Coach', sessions: '900+', trained: '5850+', initials: 'SM', color: '#002366', img: mentor1 },
  { name: 'Nancy', role: 'AI Hiring Specialist', sessions: '800+', trained: '6000+', initials: 'N', color: '#7c3aed', img: mentor2 },
  { name: 'Anannya Kulshrestha', role: 'Resume Search Expert', sessions: '1200+', trained: '7800+', initials: 'AK', color: '#059669', img: mentor3 },
  { name: 'Rahul Mehta', role: 'Job Posting Strategist', sessions: '850+', trained: '5900+', initials: 'RM', color: '#002366', img: mentor1 },
  { name: 'Meera Iyer', role: 'Employer Branding Lead', sessions: '650+', trained: '4400+', initials: 'MI', color: '#7c3aed', img: mentor2 },
  { name: 'Priya Sharma', role: 'Talent Acquisition Expert', sessions: '1100+', trained: '7200+', initials: 'VB', color: '#059669', img: mentor3 },
  { name: 'Vikram Bose', role: 'Senior Talent Coach', sessions: '950+', trained: '6100+', initials: 'PS', color: '#002366', img: mentor1 },
  { name: 'Amita Desai', role: 'AI Hiring Specialist', sessions: '720+', trained: '4800+', initials: 'AD', color: '#7c3aed', img: mentor2 },
  { name: 'Kavya Singh', role: 'Resume Search Expert', sessions: '1300+', trained: '8100+', initials: 'KS', color: '#059669', img: mentor3 },
  { name: 'Rohan Gupta', role: 'Job Posting Strategist', sessions: '880+', trained: '6000+', initials: 'RG', color: '#002366', img: mentor1 },
];

/* ─── FEATURED GUIDES ─── */
export const GUIDES = [
  { id: 1, product: 'Resume Database', title: 'The Complete Guide to Resume Search: Find Talent Faster', badge: 'Beginner Friendly', color: '#002366', readTime: '18 min read', img: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=600', path: '/employers/learning-center/guides/resdex' },
  { id: 2, product: 'Job Posting', title: 'Post & Manage Jobs Like a Pro: A Step-by-Step Playbook', badge: 'Most Popular', color: '#059669', readTime: '15 min read', img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600', path: '/employers/learning-center/guides/job-posting' },
  { id: 3, product: 'AI Sourcing', title: 'Getting Started with AI-Powered Candidate Sourcing (AI REX)', badge: 'New', color: '#7c3aed', readTime: '14 min read', img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=600', path: '/employers/learning-center/guides/ai-rex' },
];

/* ─── ENTERPRISE COMPANY LOGOS ─── */
export const COMPANY_LOGOS = [
  {
    name: 'Tata Consultancy Services',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg'
  },
  {
    name: 'Infosys',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg'
  },
  {
    name: 'Wipro',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg'
  },
  {
    name: 'Accenture',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg'
  },
  {
    name: 'Deloitte',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Deloitte.svg'
  },
  {
    name: 'IBM',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg'
  },
  {
    name: 'Cognizant',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Cognizant_logo_2022.svg'
  },
  {
    name: 'HCLTech',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/87/HCL_Tech_logo.svg'
  },
  {
    name: 'Tech Mahindra',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Tech_Mahindra_New_Logo.svg'
  },
  {
    name: 'Capgemini',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Capgemini_201x_logo.svg'
  },
  {
    name: 'Microsoft',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg'
  },
  {
    name: 'Amazon',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'
  },
  {
    name: 'Flipkart',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Flipkart_logo.svg'
  }
];

export const COMPANIES = ['Tata Consultancy', 'Infosys', 'Wipro', 'HCL', 'Accenture', 'Deloitte', 'IBM', 'Cognizant', 'Tech Mahindra', 'Capgemini'];

/* ─── FREQUENTLY ASKED QUESTIONS ─── */
export const FAQ_CATEGORIES = [
  {
    id: 'general',
    title: 'General & Account',
    faqs: [
      { q: 'Is the Maven Learning Center free to use?', a: 'Yes! All guides, webinars, and the certification programme are completely free for all registered employers on MavenJobs.' },
      { q: 'How do I create or update my employer profile?', a: 'Log into your MavenJobs account, click on your profile avatar in the top right, and select "Company Profile" to update details.' },
      { q: 'What happens if I forget my password?', a: 'Click on "Forgot Password" on the login page. An email with a reset link will be sent to your registered email address.' },
      { q: 'Can I add multiple recruiters to the same company account?', a: 'Yes. Account administrators can invite team members from the Settings > Manage Team page.' },
      { q: 'Where can I see my current plan or subscription details?', a: 'Go to Settings > Billing & Subscriptions to view your active plans, remaining credits, and next renewal date.' },
    ]
  },
  {
    id: 'resdex',
    title: 'Resume Database (Resdex)',
    faqs: [
      { q: 'How do I run a basic search in Resdex?', a: 'Enter skills, designations, or keywords in the main search bar on the Resdex dashboard and click Search.' },
      { q: 'What is a Boolean search?', a: 'Boolean search uses operators like AND, OR, and NOT to combine keywords, making your search highly specific and targeted.' },
      { q: 'How do I save a search query for later?', a: 'After running a search, click the "Save Search" button at the top of the results page and give it a name.' },
      { q: 'How do candidate contact credits work?', a: 'One credit is deducted when you unlock a candidate\'s email or phone number. Viewing their profile does not consume credits.' },
      { q: 'Can I download resumes in bulk?', a: 'Yes, select multiple candidates using the checkboxes and click "Download Resumes". Bulk downloads are subject to your plan limits.' },
    ]
  },
  {
    id: 'jobs',
    title: 'Job Posting',
    faqs: [
      { q: 'How do I post a new job?', a: 'Click the "Post a Job" button on your dashboard. Fill in the title, description, requirements, and click Publish.' },
      { q: 'What is the difference between Hot Vacancy and Standard Job?', a: 'Hot Vacancies receive premium placement and visibility in search results for faster hiring compared to Standard Jobs.' },
      { q: 'How long does a job posting stay active?', a: 'Standard jobs usually remain active for 30 days unless closed manually. Hot Vacancies can have custom durations.' },
      { q: 'Can I edit a job after it has been published?', a: 'Yes, go to Manage Jobs, click the three dots next to the active job, and select Edit.' },
      { q: 'How do I close a job if I have hired a candidate?', a: 'In the Manage Jobs section, select the job and change its status to "Closed". This stops new applications from coming in.' },
    ]
  },
  {
    id: 'webinars',
    title: 'Webinars & Certifications',
    faqs: [
      { q: 'How do I register for a live webinar?', a: 'Click "Book a Seat" on any upcoming webinar card. You will receive a calendar invite and reminder email with the joining link.' },
      { q: 'Can I access recorded sessions after the live webinar?', a: 'Yes, all webinar recordings are available in your Learning Center dashboard within 24 hours of the live session.' },
      { q: 'What is the Maven Maestro Recruiter Certification?', a: 'A structured training programme with modules and assessments. Complete it to earn an industry-recognised digital certificate.' },
      { q: 'How long does the certification programme take?', a: 'Most recruiters complete it in 4-6 hours spread across a week. It is entirely self-paced and on-demand.' },
      { q: 'Do I get a badge for completing the certification?', a: 'Yes! You will receive a digital badge that you can add to your LinkedIn profile and email signature to showcase your skills.' },
    ]
  }
];

/* ═══════════════════════════════════════════════════════════════
   GUIDE 1: AI REX (AI SOURCING) PLAYBOOK CONTENT
   ═══════════════════════════════════════════════════════════════ */

export const AI_REX_GUIDE_CONFIG = {
  id: 'ai-rex',
  title: 'Getting Started with AI REX: Agentic Recruitment Platform',
  subtitle: 'Master the full potential of MavenJobs AI REX — our autonomous hiring co-pilot that understands hiring briefs, mines passive talent, conducts two-way screening via WhatsApp and calls, and delivers qualified shortlists in hours instead of weeks.',
  category: 'AI Sourcing',
  categoryColor: '#7c3aed',
  badgeText: 'AI Sourcing Playbook',
  readTime: '14 min read',
  lastUpdated: 'October 2026',
  author: { name: 'Nancy', role: 'AI Hiring Specialist', img: mentor2 },
  heroKeyPoints: [
    'Understand how agentic AI parses job mandates beyond plain keywords',
    'Learn the autonomous multi-channel screening engine (WhatsApp & Voice)',
    'Train AI REX using the recruiter reinforcement feedback loop',
    'Step-by-step setup for launching high-converting sourcing campaigns'
  ],
  heroAction: {
    label: 'Launch AI Sourcing',
    targetPath: '/hiring-automation'
  },
  prevGuide: {
    title: 'The Master Guide to Resdex',
    path: '/employers/learning-center/guides/resdex'
  },
  nextGuide: {
    title: 'The Complete Guide for Posting & Managing Jobs',
    path: '/employers/learning-center/guides/job-posting'
  }
};

export const AI_REX_TOC_SECTIONS = [
  { id: 'sec-intro', title: 'What is AI REX?' },
  { id: 'sec-mandate', title: 'Mandate Understanding' },
  { id: 'sec-matching', title: 'Candidate Discovery & Matching' },
  { id: 'sec-screening', title: 'Automated Multi-Channel Outreach' },
  { id: 'sec-feedback', title: 'Recruiter Feedback Loop' },
  { id: 'sec-workflow', title: 'End-to-End Workflow' },
  { id: 'sec-simulation', title: 'Interactive AI Simulator' },
  { id: 'sec-metrics', title: 'Recruiter Efficiency & ROI' },
  { id: 'sec-faqs', title: 'Frequently Asked Questions' }
];

export const AI_REX_SAMPLE_MANDATES = [
  {
    role: 'Senior React / Full-Stack Engineer',
    exp: '4 - 8 Years',
    budget: '₹22 - 32 LPA',
    location: 'Bengaluru (Hybrid)',
    mustHave: ['React.js', 'Node.js', 'TypeScript', 'System Design'],
    goodToHave: ['AWS / Cloud', 'GraphQL', 'Next.js', 'Docker'],
    extractedIntent: 'Targeting high-velocity product engineers with microfrontend architecture experience, low notice period, and active github contributions.'
  },
  {
    role: 'Growth Marketing Lead',
    exp: '5 - 9 Years',
    budget: '₹20 - 28 LPA',
    location: 'Mumbai / Remote',
    mustHave: ['Performance Marketing', 'CAC Optimization', 'SQL / Analytics', 'Meta & Google Ads'],
    goodToHave: ['SEO Strategy', 'HubSpot', 'B2B SaaS experience'],
    extractedIntent: 'Focus on growth leaders who scaled user acquisition 3x+ in B2B or consumer-tech environments.'
  }
];

export const AI_REX_SCORE_FACTORS = [
  {
    factor: 'Core Skill Alignment',
    weight: '40%',
    eval: 'Overlap with primary required technologies, frameworks, and tools.',
    sample: 'Hands-on experience in 80%+ of must-have stack.'
  },
  {
    factor: 'Experience & Seniority',
    weight: '25%',
    eval: 'Total relevant years of experience, leadership roles, and scope of ownership.',
    sample: 'Led architectural redesign in a team of 10+.'
  },
  {
    factor: 'Compensation Compatibility',
    weight: '15%',
    eval: 'Current CTC vs. offered CTC range, avoiding candidates priced outside budget.',
    sample: 'Expected hike aligns with 20-30% market standard.'
  },
  {
    factor: 'Notice Period & Availability',
    weight: '10%',
    eval: 'Official notice period, active serving status, or buyout feasibility.',
    sample: 'Serving notice period with < 30 days remaining.'
  },
  {
    factor: 'Intent & Activity Recency',
    weight: '10%',
    eval: 'Recent logins, profile updates, and active engagement with recruiters.',
    sample: 'Updated resume in the last 14 days.'
  }
];

export const AI_REX_FAQS = [
  {
    q: 'How does AI REX differ from traditional Boolean search in Resdex?',
    a: 'Traditional Boolean search depends strictly on exact keyword string matches, often missing exceptional talent who use slightly different titles or phrasing on their CVs. AI REX utilizes multi-dimensional semantic vector embeddings to understand the true intent, contextual experience, and skill depth of candidates, uncovering high-potential matches that keyword filters overlook.'
  },
  {
    q: 'What channels does AI REX use to communicate with candidates?',
    a: 'AI REX engages candidates across verified touchpoints including automated conversational WhatsApp agents, smart email invitations, and AI voice screening calls. Every communication is branded with your company profile and strictly adheres to TRAI and messaging consent protocols.'
  },
  {
    q: 'How does the AI determine candidate relevance and matching score?',
    a: 'The scoring model calculates a multi-factor score: core skill overlap (40%), years of hands-on experience and seniority alignment (25%), salary benchmark compatibility (15%), notice period & availability signals (10%), and freshness/recency of activity (10%).'
  },
  {
    q: 'What happens when a candidate responds to an automated screening question?',
    a: 'AI REX evaluates the candidate\'s natural language response in real time against your mandate guidelines (e.g. verifying willingness to work hybrid or confirm expected CTC). Candidates who pass the criteria are immediately tagged as "Pre-Screened & Interested" and elevated to your dashboard for one-click interview scheduling.'
  },
  {
    q: 'Can AI REX integrate with external Enterprise ATS systems?',
    a: 'Yes. AI REX supports native bi-directional integration with major Applicant Tracking Systems (including Greenhouse, Lever, Workday, and SAP SuccessFactors), syncing shortlisted candidates and screening transcripts directly into your workflow.'
  },
  {
    q: 'How are credits consumed when running AI REX campaigns?',
    a: 'Credits are only consumed when a candidate successfully engages with an outreach message or completes an automated screening assessment. Profiles that remain unresponsive do not deplete your premium engagement quota.'
  }
];

/* ═══════════════════════════════════════════════════════════════
   GUIDE 2: JOB POSTING PLAYBOOK CONTENT
   ═══════════════════════════════════════════════════════════════ */

export const JOB_POSTING_GUIDE_CONFIG = {
  id: 'job-posting',
  title: 'The Complete Guide for Posting & Managing Jobs',
  subtitle: 'The authoritative playbook for recruiting teams: craft high-converting job descriptions, implement intelligent screening questions, manage applicant pipelines, and track performance analytics on MavenJobs.',
  category: 'Job Posting',
  categoryColor: '#059669',
  badgeText: 'Recruiter Playbook',
  readTime: '15 min read',
  lastUpdated: 'October 2026',
  author: { name: 'Rahul Mehta', role: 'Job Posting Strategist', img: mentor1 },
  heroKeyPoints: [
    'Full walkthrough of all Job Posting form fields and best practices',
    'Techniques for writing high-converting JDs that attract top 5% talent',
    'Setting up screening dealbreakers to eliminate unqualified applications',
    'End-to-end response management: Shortlist, Maybe, and AI Stack-Ranking'
  ],
  heroAction: {
    label: 'Post a New Job',
    targetPath: '/post-job'
  },
  prevGuide: {
    title: 'Getting Started with AI REX',
    path: '/employers/learning-center/guides/ai-rex'
  },
  nextGuide: {
    title: 'The Master Guide to Resdex',
    path: '/employers/learning-center/guides/resdex'
  }
};

export const JOB_POSTING_TOC_SECTIONS = [
  { id: 'sec-intro', title: 'Job Posting Overview' },
  { id: 'sec-form', title: 'The Job Posting Form' },
  { id: 'sec-jd-guide', title: 'Writing High-Converting JDs' },
  { id: 'sec-screening', title: 'Screening Questions & Filters' },
  { id: 'sec-advanced', title: 'Advanced Posting Options' },
  { id: 'sec-manage', title: 'Job Lifecycle & Management' },
  { id: 'sec-responses', title: 'Managing Responses & Applications' },
  { id: 'sec-ai-insights', title: 'AI Matching & Response Insights' },
  { id: 'sec-analytics', title: 'Job Analytics & Performance' },
  { id: 'sec-faqs', title: 'Job Posting FAQs' }
];

export const JOB_POSTING_TYPES = [
  {
    type: 'Hot Vacancy (Premium)',
    ranking: 'Top of Results (Highlighted)',
    reach: '3x - 5x Higher Applications',
    alerts: 'Daily instant push + email blasts',
    idealFor: 'Urgent hiring, niche tech roles, executive openings'
  },
  {
    type: 'Standard Classified',
    ranking: 'Standard Relevance Ranking',
    reach: 'Consistent organic traffic',
    alerts: 'Standard job matching alerts',
    idealFor: 'Ongoing bulk hiring, entry-level, non-urgent roles'
  }
];

export const JOB_POSTING_SAMPLE_JD = `Role: Senior Backend Engineer (Node.js / Distributed Systems)
Location: Bengaluru / Hybrid (2 Days Office)
Experience: 4 - 7 Years | Salary: ₹24,00,000 - ₹34,00,000 P.A.

About the Role:
We are seeking an experienced Backend Engineer to lead the scalability of our core transactional engine handling 10M+ daily events.

Key Responsibilities:
• Architect, deploy, and maintain high-throughput microservices using Node.js & Go.
• Optimize PostgreSQL databases, Redis caching layers, and Kafka streaming pipelines.
• Collaborate with product managers and frontend leads to design resilient REST and gRPC APIs.
• Drive code reviews, automated unit/integration testing, and CI/CD best practices.

Must-Have Qualifications:
• 4+ years of backend engineering experience in high-scale web applications.
• Strong proficiency in JavaScript/TypeScript (Node.js) and relational SQL systems.
• Proven track record with asynchronous event queues (Kafka, RabbitMQ, or AWS SQS).
• B.Tech/B.E. or equivalent degree in Computer Science or related field.

Perks & Benefits:
• Premium comprehensive health insurance for family.
• Annual learning & conference stipend (₹75,000).
• Flexible work hours and quarterly wellness holidays.`;

export const JOB_POSTING_FAQS = [
  {
    q: 'How long does a job posting remain active on MavenJobs?',
    a: 'Standard Job Postings and Hot Vacancies remain active for 30 consecutive days from publication. During this period, candidates can discover, view, and apply to your requisition. You can close or pause the job at any time before 30 days without forfeiting your applicant data.'
  },
  {
    q: 'What is the exact difference between a Standard Job and a Hot Vacancy?',
    a: 'A Hot Vacancy features priority search placement, a prominent highlighted border in candidate search results, automated inclusion in relevant candidate recommendation emails, and up to 3x higher application volume compared to standard listings.'
  },
  {
    q: 'Can I edit a job posting after it has already gone live?',
    a: 'Yes. Most fields—including responsibilities, perks, company info, screening questions, and recruiter contact notifications—can be edited at any time with immediate effect. Major modifications to core criteria (such as changing the primary job role or location) may trigger a quick 15-minute automated moderation check.'
  },
  {
    q: 'How does the Job Refresh feature work?',
    a: 'Refreshing a job resets its publication timestamp to "Just Now," pushing your vacancy back to the top of candidate search results and alert feeds. Refresh credits depend on your employer subscription tier.'
  },
  {
    q: 'What happens to incoming applications when I close a job?',
    a: 'Closing a job immediately prevents new candidates from applying and removes it from public search. All previously received candidate profiles, resumes, screening responses, and notes remain permanently accessible in your Manage Jobs & Responses dashboard.'
  },
  {
    q: 'Can multiple recruiters collaborate on the same job posting?',
    a: 'Yes. In the Advanced Options section, you can add co-recruiters and hiring managers by email. Collaborators can view incoming applications, add internal interview notes, and shortlist candidates without needing your primary login credentials.'
  }
];

/* ═══════════════════════════════════════════════════════════════
   GUIDE 3: RESDEX (RESUME SEARCH) PLAYBOOK CONTENT
   ═══════════════════════════════════════════════════════════════ */

export const RESDEX_GUIDE_CONFIG = {
  id: 'resdex',
  title: "The Master Guide to Resdex: Source Talent from India's Largest Database",
  subtitle: 'The comprehensive reference manual for recruiters: master Boolean syntax, apply multi-dimensional filters, organize talent pipelines with folders, and execute high-converting candidate outreach across 10Cr+ verified resumes.',
  category: 'Resume Database',
  categoryColor: '#002366',
  badgeText: 'Masterclass Guide',
  readTime: '18 min read',
  lastUpdated: 'October 2026',
  author: { name: 'Anannya Kulshrestha', role: 'Resume Search Expert', img: mentor3 },
  heroKeyPoints: [
    'Comprehensive Boolean syntax guide: AND, OR, NOT, quotes, and nesting',
    'Ready-to-use search strings for Engineering, Product, DevOps, and Finance',
    'Deep-dive into 15+ search filters: Notice period, Freshness, and CTC',
    'Pipeline management: Folders, NVite outreach, and Resume Alerts'
  ],
  heroAction: {
    label: 'Search Resdex Now',
    targetPath: '/resume-search'
  },
  prevGuide: {
    title: 'The Complete Guide for Posting & Managing Jobs',
    path: '/employers/learning-center/guides/job-posting'
  },
  nextGuide: {
    title: 'Getting Started with AI REX',
    path: '/employers/learning-center/guides/ai-rex'
  }
};

export const RESDEX_TOC_SECTIONS = [
  { id: 'sec-intro', title: 'What is Resdex?' },
  { id: 'sec-search-inputs', title: 'Search Inputs & Keyword Types' },
  { id: 'sec-boolean', title: 'Boolean Search Masterclass' },
  { id: 'sec-strategy', title: 'Recruiter Search Strategy' },
  { id: 'sec-filters', title: 'Deep Filtering Parameters' },
  { id: 'sec-results', title: 'Search Results & Candidate Cards' },
  { id: 'sec-folders', title: 'Folders & Pipeline Organization' },
  { id: 'sec-contact', title: 'Candidate Outreach & NVites' },
  { id: 'sec-alerts', title: 'Resume Alerts & Auto-Updates' },
  { id: 'sec-roles', title: 'User Roles & Quota Management' },
  { id: 'sec-faqs', title: 'Resdex FAQs' }
];

export const RESDEX_BOOLEAN_OPERATORS = [
  { op: 'AND', meaning: 'Both terms must be present', example: 'React AND Node', result: 'Finds CVs containing BOTH "React" and "Node"' },
  { op: 'OR', meaning: 'At least one term must be present', example: 'React OR Angular OR Vue', result: 'Broadens search across synonymous or equivalent skills' },
  { op: 'NOT / AND NOT', meaning: 'Excludes candidates with this term', example: 'Java AND NOT "Core Java"', result: 'Disqualifies resumes matching the excluded term' },
  { op: '" " (Quotes)', meaning: 'Exact phrase match in exact order', example: '"System Architect"', result: 'Searches for the contiguous phrase, not scattered words' },
  { op: '( ) (Parentheses)', meaning: 'Groups logic to enforce precedence', example: '(AWS OR Azure) AND Python', result: 'Requires Python combined with either cloud provider' }
];

export const RESDEX_BOOLEAN_SAMPLES = [
  {
    role: 'Full-Stack Developer (MERN / TypeScript)',
    query: '("Full Stack" OR "Fullstack" OR "MERN") AND (React OR React.js OR ReactJS) AND (Node OR Node.js OR NodeJS) AND (TypeScript OR "Type Script") AND NOT (Intern OR Fresher OR Trainee)'
  },
  {
    role: 'Senior Product Manager (B2B SaaS / Growth)',
    query: '("Product Manager" OR "Lead PM" OR "Group Product Manager") AND ("B2B" OR SaaS OR Enterprise) AND (Roadmap OR "Product Strategy" OR "Product Discovery") AND (SQL OR Mixpanel OR Amplitude) AND NOT (Project OR Program OR QA)'
  },
  {
    role: 'DevOps & Cloud Infrastructure Engineer',
    query: '(DevOps OR "Site Reliability Engineer" OR SRE OR "Cloud Engineer") AND (AWS OR "Amazon Web Services" OR Azure OR GCP) AND (Kubernetes OR K8s OR Docker) AND (Terraform OR Ansible) AND (CI/CD OR Jenkins OR "GitLab CI")'
  },
  {
    role: 'Financial Controller / Chartered Accountant',
    query: '("Chartered Accountant" OR "CA" OR "Financial Controller") AND ("Statutory Audit" OR "US GAAP" OR "IFRS" OR "IND AS") AND (SAP OR Oracle OR "Tally Prime") AND (Taxation OR "Financial Planning" OR FP&A)'
  }
];

export const RESDEX_DEEP_FILTERS = [
  { filter: 'Experience (Min - Max)', desc: 'Narrow candidate pool by exact total years of working experience.' },
  { filter: 'Annual Salary (CTC)', desc: 'Set minimum and maximum CTC bounds to stay within recruitment budget.' },
  { filter: 'Current Location & Preferred Location', desc: 'Target local candidates or talent open to relocation.' },
  { filter: 'Notice Period', desc: 'Filter for Immediate joiners, 15 days, 30 days, or 60+ days.' },
  { filter: 'Candidate Active Within (Freshness)', desc: 'Filter by resume freshness (e.g. Active in last 7, 15, 30, or 90 days).' },
  { filter: 'Company / Industry', desc: 'Target candidates currently working at specific competitor companies or tier-1 firms.' },
  { filter: 'Educational Qualifications', desc: 'Specify premier institutes (IIT, IIM, NIT, BITS) or required degrees (B.Tech, MBA, MCA).' },
  { filter: 'Diversity / Gender', desc: 'Support company diversity hiring mandates with dedicated female candidate filters.' },
  { filter: 'Function & Role Category', desc: 'Ensure candidate functional specialization matches your department structure.' }
];

export const RESDEX_FAQS = [
  {
    q: 'When does a Resdex CV view consume an access credit?',
    a: "Viewing candidate profiles in search results (including candidate name, current designation, experience, current company, and skill highlights) does NOT deduct any credits. One CV Access Credit is consumed only when you choose to unlock the candidate's full contact information (phone number, personal email address, and complete downloadable resume file)."
  },
  {
    q: 'What is the "Search Within Results" feature used for?',
    a: 'When your primary search query yields a large pool (e.g. 15,000 candidates), "Search Within Results" allows you to apply secondary niche criteria (such as specific tertiary tools, certifications, or niche company names) strictly to that filtered subset, without altering your original search parameters.'
  },
  {
    q: 'How many candidates can I contact at once using NVite?',
    a: 'Depending on your employer subscription tier, you can send NVites or custom email campaigns to up to 100 selected candidates simultaneously. Candidates receive personalized communications with their first name dynamically injected.'
  },
  {
    q: 'What is the difference between Super-User and Sub-User accounts?',
    a: 'The Super-User (typically the Head of TA or Account Admin) has the authority to purchase subscriptions, allocate monthly CV view and contact quotas across team members, configure privacy settings, and view company-wide recruiter audit logs. Sub-Users (recruiters) utilize their assigned quota to search, shortlist, and contact candidates.'
  },
  {
    q: 'How do automated Resume Alerts help recruiters hire faster?',
    a: 'Resume Alerts monitor the database 24/7 for candidates matching your saved search criteria. Whenever top candidates register or update their resumes, an automated digest is emailed to you, allowing you to reach out before competitor recruiters even see their profile.'
  },
  {
    q: 'Can I export candidates to Excel or CSV?',
    a: 'Yes. Recruiters can select candidate profiles from search results or folders and click "Export Summary" to generate an Excel spreadsheet containing candidate names, experience, designations, locations, and recruiter comments.'
  }
];

