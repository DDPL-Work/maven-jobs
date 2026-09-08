export const queryKeys = {
  auth: {
    me: ["auth", "me"],
  },
  candidate: {
    dashboard: (userId) => ["candidate", "dashboard", userId],
    profile: (userId) => ["candidate", "profile", userId],
    jobs: (userId, params) => ["candidate", "jobs", userId, params],
    job: (jobId) => ["candidate", "job", jobId],
    jobSimilar: (jobId) => ["candidate", "job", jobId, "similar"],
    savedJobs: (userId) => ["candidate", "savedJobs", userId],
    applications: (userId) => ["candidate", "applications", userId],
    notifications: (userId) => ["candidate", "notifications", userId],
    chats: (userId) => ["candidate", "chats", userId],
    companies: (params) => ["candidate", "companies", params],
    company: (companyId) => ["candidate", "company", companyId],
    companyStats: (params) => ["candidate", "companyStats", params],
    companyFilterOptions: ["candidate", "companyFilterOptions"],
    quizRanking: ["candidate", "quizRanking"],
    quizToday: ["candidate", "quizToday"],
  },
  landing: {
    home: ["landing", "home"],
    jobs: (params) => ["landing", "jobs", params],
    employer: ["landing", "employer"],
    company: (companyId) => ["landing", "company", companyId],
  },
  blog: {
    published: (params) => ["blog", "published", params],
    slug: (slug) => ["blog", "slug", slug],
    categories: ["blog", "categories"],
  },
};
