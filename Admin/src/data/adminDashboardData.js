import {
  LuActivity,
  LuBadgeCheck,
  LuBell,
  LuBriefcaseBusiness,
  LuBuilding2,
  LuChartNoAxesCombined,
  LuFileCheck2,
  LuShieldCheck,
  LuTarget,
  LuUserRoundCog,
  LuUsers,
  LuWorkflow,
} from "react-icons/lu";

export const adminKpis = [
  {
    title: "Total Clients",
    value: "248",
    change: "+18 this month",
    detail: "41 enterprise accounts actively hiring",
    icon: LuBuilding2,
    tone: "from-sky-600 to-blue-700",
  },
  {
    title: "Total Job Postings",
    value: "1,426",
    change: "+12.4%",
    detail: "182 new roles published this week",
    icon: LuBriefcaseBusiness,
    tone: "from-emerald-500 to-lime-500",
  },
  {
    title: "Total Candidates",
    value: "18.9K",
    change: "+620 verified",
    detail: "87% profile completion across the pool",
    icon: LuUsers,
    tone: "from-violet-500 to-indigo-600",
  },
  {
    title: "Total Applications",
    value: "12.4K",
    change: "+9.1%",
    detail: "Average 8.7 applications per open role",
    icon: LuFileCheck2,
    tone: "from-amber-500 to-orange-500",
  },
];

export const adminRoleViews = [
  {
    role: "Admin",
    description: "Governance, user access, platform monitoring, and reporting.",
    activeUsers: 8,
    coverage: "Global access",
    status: "Full control",
  },
  {
    role: "CRM",
    description: "Client delivery teams managing accounts, jobs, and approvals.",
    activeUsers: 26,
    coverage: "North, West, Enterprise",
    status: "Operational",
  },
  {
    role: "FSE",
    description: "Field sales teams driving acquisition and regional growth.",
    activeUsers: 41,
    coverage: "14 active territories",
    status: "Distributed",
  },
  {
    role: "Client",
    description: "Client-side hiring teams reviewing jobs and applications.",
    activeUsers: 112,
    coverage: "248 company workspaces",
    status: "Self-service",
  },
  {
    role: "Candidate",
    description: "Applicants tracking roles, interviews, and submissions.",
    activeUsers: 3896,
    coverage: "Live candidate network",
    status: "High traffic",
  },
];

export const governanceCards = [
  {
    title: "System Users",
    value: "4,083",
    note: "93 new invites pending activation",
    icon: LuUserRoundCog,
  },
  {
    title: "Role Templates",
    value: "11",
    note: "4 custom role groups under review",
    icon: LuShieldCheck,
  },
  {
    title: "Workflow Policies",
    value: "27",
    note: "2 approval flows updated today",
    icon: LuWorkflow,
  },
];

export const platformSignals = [
  { label: "System uptime", value: "99.96%", progress: 100, tone: "bg-emerald-500" },
  { label: "Role compliance", value: "97%", progress: 97, tone: "bg-blue-600" },
  { label: "Job approval SLA", value: "91%", progress: 91, tone: "bg-amber-500" },
  { label: "Candidate verification", value: "88%", progress: 88, tone: "bg-violet-500" },
];

export const oversightFeeds = [
  { company: "Asterix Mobility", jobs: 34, candidates: 621, status: "Hiring surge" },
  { company: "NorthBridge Health", jobs: 18, candidates: 284, status: "Approval pending" },
  { company: "Helio Commerce", jobs: 47, candidates: 712, status: "Stable pipeline" },
  { company: "Vertex Infra", jobs: 13, candidates: 193, status: "Needs follow-up" },
];

export const reportingHighlights = [
  { title: "Applications processed", value: "2,184", delta: "+14% vs last week" },
  { title: "Average time to shortlist", value: "2.8 days", delta: "-0.4 days improvement" },
  { title: "Client satisfaction", value: "4.7/5", delta: "Across 61 feedback responses" },
];

export const activityTimeline = [
  {
    title: "New admin role approved for enterprise support pod",
    time: "12 minutes ago",
    icon: LuShieldCheck,
  },
  {
    title: "42 candidate applications synced from client workspace",
    time: "28 minutes ago",
    icon: LuFileCheck2,
  },
  {
    title: "Monitoring alert cleared for delayed job approval queue",
    time: "1 hour ago",
    icon: LuActivity,
  },
  {
    title: "Quarterly governance report exported by super admin",
    time: "2 hours ago",
    icon: LuChartNoAxesCombined,
  },
];

export const quickActions = [
  "Create a new system user",
  "Assign a role bundle",
  "Review flagged applications",
  "Publish monthly platform report",
];

export const dashboardHighlights = [
  {
    title: "Governance status",
    value: "Stable",
    icon: LuBadgeCheck,
    note: "No major role or compliance breaches in the last 7 days.",
  },
  {
    title: "Monitoring pressure",
    value: "Moderate",
    icon: LuBell,
    note: "One critical reporting timeout and six active alerts remain open.",
  },
  {
    title: "Growth target",
    value: "82%",
    icon: LuTarget,
    note: "Platform is tracking ahead of the quarterly client acquisition plan.",
  },
];

export const adminSectionContent = {
  "/admin/users": {
    eyebrow: "Identity & Access",
    title: "User Management",
    description:
      "Provision system users, review workspace access, and keep role coverage aligned with operational demand.",
    metrics: [
      { label: "Active users", value: "4,083" },
      { label: "Pending invites", value: "93" },
      { label: "Suspended accounts", value: "17" },
    ],
    cards: [
      { title: "Admin leadership", value: "8 users", note: "All accounts protected with MFA" },
      { title: "CRM operations", value: "26 users", note: "3 onboarding requests pending" },
      { title: "FSE field network", value: "41 users", note: "2 territory transfers today" },
    ],
    tableColumns: ["Name", "Role", "Scope", "Status", "Last Active"],
    tableRows: [
      ["Rhea Sharma", "Admin", "Global", "Active", "8 min ago"],
      ["Arjun Mehta", "CRM Lead", "Enterprise Accounts", "Active", "21 min ago"],
      ["Neha Batra", "FSE", "Delhi NCR", "Pending Invite", "Not yet joined"],
      ["Ishaan Roy", "Client Admin", "Helio Commerce", "Restricted", "Yesterday"],
    ],
    sideTitle: "Access controls",
    sideItems: [
      "MFA enforced for all Admin and CRM roles",
      "Auto-expire inactive invites after 72 hours",
      "Weekly review for suspended user reactivation",
    ],
  },
  "/admin/roles": {
    eyebrow: "Governance",
    title: "Roles & Permissions",
    description:
      "Define role templates, permission groups, and approval boundaries for every panel participant.",
    metrics: [
      { label: "Role templates", value: "11" },
      { label: "Permission sets", value: "27" },
      { label: "Audit exceptions", value: "2" },
    ],
    cards: [
      { title: "Admin", value: "Full system access", note: "Reporting, governance, and user control" },
      { title: "CRM", value: "Scoped operational access", note: "Jobs, clients, approvals, and analytics" },
      { title: "Client & Candidate", value: "Workspace limited", note: "Only self-service and assigned workflow actions" },
    ],
    tableColumns: ["Permission Domain", "Admin", "CRM", "FSE", "Client"],
    tableRows: [
      ["User management", "Full", "View", "No", "No"],
      ["Job postings", "Full", "Full", "View", "Scoped"],
      ["Candidate profiles", "Full", "Full", "Scoped", "No"],
      ["Reports", "Full", "View", "No", "No"],
    ],
    sideTitle: "Current policy focus",
    sideItems: [
      "Finalize FSE lead permissions for regional reassignment",
      "Reduce Client edit rights on approved job records",
      "Lock reporting exports behind admin-only approval",
    ],
  },
  "/admin/companies": {
    eyebrow: "System Visibility",
    title: "Client Companies",
    description:
      "Track every client organization, account health, and hiring activity from one centralized view.",
    metrics: [
      { label: "Total companies", value: "248" },
      { label: "Enterprise clients", value: "41" },
      { label: "At-risk accounts", value: "9" },
    ],
    cards: [
      { title: "Fastest growth", value: "Helio Commerce", note: "11 new roles this week" },
      { title: "Needs review", value: "NorthBridge Health", note: "Approval queue older than 24 hours" },
      { title: "High engagement", value: "Asterix Mobility", note: "621 candidate interactions" },
    ],
    tableColumns: ["Company", "Open Jobs", "Applications", "Owner", "Health"],
    tableRows: [
      ["Asterix Mobility", "34", "621", "CRM West", "Growing"],
      ["NorthBridge Health", "18", "284", "CRM Enterprise", "Needs attention"],
      ["Helio Commerce", "47", "712", "CRM Central", "Strong"],
      ["Vertex Infra", "13", "193", "CRM North", "Watchlist"],
    ],
    sideTitle: "Admin responsibilities",
    sideItems: [
      "Review stalled client onboarding workflows",
      "Monitor hiring velocity across strategic accounts",
      "Escalate account health risks to CRM leadership",
    ],
  },
  "/admin/jobs": {
    eyebrow: "Operational Oversight",
    title: "Job Postings",
    description:
      "Supervise every role in the system, from draft creation through approval, publishing, and fulfillment.",
    metrics: [
      { label: "Live jobs", value: "1,426" },
      { label: "Awaiting approval", value: "53" },
      { label: "Expired this week", value: "87" },
    ],
    cards: [
      { title: "Highest volume category", value: "Sales & Growth", note: "312 active openings" },
      { title: "Approval bottleneck", value: "Healthcare", note: "11 jobs delayed beyond SLA" },
      { title: "Best conversion", value: "Engineering", note: "28% shortlist rate" },
    ],
    tableColumns: ["Role", "Company", "Department", "Stage", "Age"],
    tableRows: [
      ["Regional Sales Manager", "Asterix Mobility", "Sales", "Published", "2 days"],
      ["HRBP", "NorthBridge Health", "HR", "Approval", "19 hours"],
      ["Growth Analyst", "Helio Commerce", "Marketing", "Published", "5 days"],
      ["Site Engineer", "Vertex Infra", "Operations", "Draft", "1 day"],
    ],
    sideTitle: "Admin checks",
    sideItems: [
      "Enforce SLA on approval queues older than 24 hours",
      "Audit duplicate or stale job postings weekly",
      "Track region-wise job mix and fill performance",
    ],
  },
  "/admin/candidates": {
    eyebrow: "Talent Network",
    title: "Candidate Profiles",
    description:
      "Observe candidate quality, verification coverage, and movement through the shared talent pipeline.",
    metrics: [
      { label: "Profiles", value: "18.9K" },
      { label: "Verified", value: "16.6K" },
      { label: "Interview ready", value: "4.1K" },
    ],
    cards: [
      { title: "Top source", value: "Direct applications", note: "46% of all incoming candidates" },
      { title: "Verification risk", value: "2.3K pending", note: "Requires documentation follow-up" },
      { title: "Placement ready", value: "1.2K candidates", note: "Strong fit for active job demand" },
    ],
    tableColumns: ["Candidate", "Function", "Experience", "Stage", "Verification"],
    tableRows: [
      ["Naina Joshi", "Operations", "5 years", "Shortlisted", "Verified"],
      ["Rahul Sethi", "Sales", "7 years", "Interview", "Verified"],
      ["Tanya Iyer", "Marketing", "3 years", "Applied", "Pending"],
      ["Dev Khurana", "Engineering", "6 years", "Offer stage", "Verified"],
    ],
    sideTitle: "Admin focus",
    sideItems: [
      "Reduce verification backlog in high-volume regions",
      "Watch for duplicate profiles and compliance flags",
      "Review drop-off between shortlist and interview stages",
    ],
  },
  "/admin/applications": {
    eyebrow: "Pipeline Control",
    title: "Applications",
    description:
      "Review cross-platform application volume, funnel quality, and client delivery responsiveness.",
    metrics: [
      { label: "Applications", value: "12.4K" },
      { label: "In review", value: "2,184" },
      { label: "Shortlisted", value: "3,612" },
    ],
    cards: [
      { title: "Best performing client", value: "Helio Commerce", note: "31% shortlist conversion" },
      { title: "Slowest review cycle", value: "Vertex Infra", note: "4.6 day average turnaround" },
      { title: "Interview momentum", value: "412 this week", note: "Healthy 18% increase" },
    ],
    tableColumns: ["Candidate", "Role", "Company", "Stage", "Updated"],
    tableRows: [
      ["Naina Joshi", "Regional Sales Manager", "Asterix Mobility", "Shortlisted", "Today"],
      ["Rahul Sethi", "Growth Analyst", "Helio Commerce", "Interview", "Today"],
      ["Tanya Iyer", "HRBP", "NorthBridge Health", "Review", "Yesterday"],
      ["Dev Khurana", "Site Engineer", "Vertex Infra", "Offer", "Yesterday"],
    ],
    sideTitle: "Review priorities",
    sideItems: [
      "Escalate applications stuck in review for over 48 hours",
      "Track client-wise shortlist ratios against hiring targets",
      "Monitor offer-to-join conversion for critical accounts",
    ],
  },
  "/admin/monitoring": {
    eyebrow: "Platform Monitoring",
    title: "Monitoring",
    description:
      "Watch system health, workflow latency, and governance alerts across every operating panel.",
    metrics: [
      { label: "Open alerts", value: "6" },
      { label: "Critical alerts", value: "1" },
      { label: "Resolved today", value: "14" },
    ],
    cards: [
      { title: "Queue latency", value: "1.8 sec", note: "Approval engine within normal threshold" },
      { title: "API uptime", value: "99.96%", note: "No outage recorded this week" },
      { title: "Compliance watch", value: "2 exceptions", note: "Permission audit requires review" },
    ],
    tableColumns: ["Signal", "Owner", "Severity", "Status", "Last Updated"],
    tableRows: [
      ["Delayed job approval queue", "Admin Ops", "Medium", "Watching", "14 min ago"],
      ["Candidate verification backlog", "CRM Central", "High", "Escalated", "31 min ago"],
      ["Inactive user cleanup", "Identity Admin", "Low", "Scheduled", "Today"],
      ["Reporting export timeout", "Platform Team", "Critical", "Investigating", "Now"],
    ],
    sideTitle: "What admin should do",
    sideItems: [
      "Prioritize critical alert triage and owner assignment",
      "Verify alert closures against workflow metrics",
      "Publish weekly monitoring digest for leadership",
    ],
  },
  "/admin/reports": {
    eyebrow: "Executive Reporting",
    title: "Reports",
    description:
      "Generate executive-ready summaries across clients, hiring funnels, user activity, and platform performance.",
    metrics: [
      { label: "Scheduled reports", value: "19" },
      { label: "Exports today", value: "42" },
      { label: "Leadership decks", value: "4" },
    ],
    cards: [
      { title: "Monthly hiring report", value: "Ready for export", note: "Updated with latest application funnel" },
      { title: "Governance summary", value: "Due today", note: "Role compliance section pending sign-off" },
      { title: "Client health pack", value: "Auto-generated", note: "Shared with CRM leadership every Monday" },
    ],
    tableColumns: ["Report", "Audience", "Frequency", "Status", "Next Run"],
    tableRows: [
      ["Platform KPI Summary", "Leadership", "Daily", "Scheduled", "6:00 PM"],
      ["Governance & Access Audit", "Admin", "Weekly", "Draft", "Friday"],
      ["Client Hiring Performance", "CRM", "Weekly", "Scheduled", "Monday"],
      ["Candidate Funnel Trends", "Operations", "Monthly", "Published", "Apr 1"],
    ],
    sideTitle: "Reporting priorities",
    sideItems: [
      "Standardize KPIs across Admin and CRM reports",
      "Add role-level permission audit to the weekly pack",
      "Track report open rate for leadership stakeholders",
    ],
  },
  "/admin/settings": {
    eyebrow: "Configuration",
    title: "Admin Settings",
    description:
      "Manage the core defaults that shape authentication, notifications, workflows, and compliance handling.",
    metrics: [
      { label: "Policy modules", value: "9" },
      { label: "Active notifications", value: "14" },
      { label: "Pending config changes", value: "3" },
    ],
    cards: [
      { title: "Authentication", value: "Strict mode", note: "MFA plus session timeout enabled" },
      { title: "Notifications", value: "Rule based", note: "Escalation alerts routed by role ownership" },
      { title: "Approval workflow", value: "3-tier model", note: "Client, CRM, and Admin checkpoints active" },
    ],
    tableColumns: ["Module", "Current State", "Owner", "Risk", "Updated"],
    tableRows: [
      ["Authentication policy", "Strict", "Security Admin", "Low", "Today"],
      ["Notification routing", "Live", "Admin Ops", "Low", "Today"],
      ["Job approval workflow", "3-tier", "CRM Lead", "Medium", "Yesterday"],
      ["Data retention", "90 days", "Compliance", "Medium", "This week"],
    ],
    sideTitle: "Change control",
    sideItems: [
      "Review pending configuration requests before deployment",
      "Document all governance-impacting settings updates",
      "Align notification thresholds with monitoring severity",
    ],
  },
};
