export const apiList = [
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/applications",
    "description": "This endpoint is used to create application via the portal application.",
    "internalFunction": "createApplication",
    "usedInPortalPages": [
      "useCandidateMutations.js",
      "HomeDashboard.jsx",
      "BulkQuickApplyModal.jsx",
      "JobDetailsPage.jsx",
      "JobListingPage.jsx",
      "RecommendedJobs.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/applications",
    "description": "This endpoint is used to get applications via the portal application.",
    "internalFunction": "getApplications",
    "usedInPortalPages": [
      "useCandidateQueries.js"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/auth/login",
    "description": "This endpoint is used to create/submit login via the portal application.",
    "internalFunction": "login",
    "usedInPortalPages": [
      "App.jsx",
      "ForgotPassword.jsx",
      "Login.jsx",
      "SignUp.jsx",
      "AuthContext.jsx",
      "EmployerHeader.jsx",
      "EmployerLoginModal.jsx",
      "LandingEmployeeHeader.jsx",
      "ProtectedEmployerRoute.jsx",
      "LandingFooter.jsx",
      "LandingHeader.jsx",
      "Navbar.jsx",
      "Premium3D.jsx",
      "useEmployerAuth.js",
      "FAQModal.jsx",
      "JobListingPage.jsx",
      "CandidateSitemap.jsx",
      "EmployerLandingPage.jsx",
      "NaukriLandingPage.jsx",
      "FraudAlert.jsx",
      "GrievanceRedressal.jsx",
      "TermsOfService.jsx",
      "ClientRegistrationForm.jsx",
      "AnalyticsPage.jsx",
      "Dashboards.jsx",
      "Branding.jsx",
      "Help.jsx",
      "ResumeDatabase.jsx",
      "EmployerTerms.jsx",
      "Buyonline.jsx",
      "ManageSearch.jsx",
      "SearchResults.jsx",
      "SearchResume.jsx",
      "UserManagement.jsx",
      "ResdexReport.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/auth/register",
    "description": "This endpoint is used to create/submit register via the portal application.",
    "internalFunction": "register",
    "usedInPortalPages": [
      "App.jsx",
      "ForgotPassword.jsx",
      "Login.jsx",
      "SignUp.jsx",
      "AuthContext.jsx",
      "Navbar.jsx",
      "JobListingPage.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/auth/google",
    "description": "This endpoint is used to create/submit login with google via the portal application.",
    "internalFunction": "loginWithGoogle",
    "usedInPortalPages": [
      "Login.jsx",
      "SignUp.jsx",
      "AuthContext.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/auth/me",
    "description": "This endpoint is used to get me via the portal application.",
    "internalFunction": "getMe",
    "usedInPortalPages": [
      "AuthContext.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/profile",
    "description": "This endpoint is used to update profile via the portal application.",
    "internalFunction": "updateProfile",
    "usedInPortalPages": [
      "AuthContext.jsx",
      "useCandidateMutations.js",
      "HomeDashboard.jsx",
      "ProfileDashboard.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/profile/project-media",
    "description": "This endpoint is used to create/submit upload project media via the portal application.",
    "internalFunction": "uploadProjectMedia",
    "usedInPortalPages": [
      "ProjectsSection.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/profile/image",
    "description": "This endpoint is used to create/submit upload image via the portal application.",
    "internalFunction": "uploadImage",
    "usedInPortalPages": [
      "ProfileDashboard.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/dashboard",
    "description": "This endpoint is used to get dashboard via the portal application.",
    "internalFunction": "getDashboard",
    "usedInPortalPages": [
      "useCandidateQueries.js"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/nvites",
    "description": "This endpoint is used to get nvites via the portal application.",
    "internalFunction": "getNvites",
    "usedInPortalPages": [
      "MIvitesPage.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/jobs",
    "description": "This endpoint is used to get jobs via the portal application.",
    "internalFunction": "getJobs",
    "usedInPortalPages": [
      "useCandidateQueries.js"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/jobs/:jobId",
    "description": "This endpoint is used to get job detail via the portal application.",
    "internalFunction": "getJobDetail",
    "usedInPortalPages": [
      "useCandidateQueries.js",
      "HomeDashboard.jsx",
      "JobDetailsPage.jsx",
      "JobListingPage.jsx",
      "RecommendedJobs.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/jobs/suggest",
    "description": "This endpoint is used to get suggest jobs via the portal application.",
    "internalFunction": "suggestJobs",
    "usedInPortalPages": [
      "SearchAutocomplete.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/jobs/:jobId/match-score",
    "description": "This endpoint is used to get job match score via the portal application.",
    "internalFunction": "getJobMatchScore",
    "usedInPortalPages": [
      "HomeDashboard.jsx",
      "JobDetailsPage.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/jobs/:jobId/save",
    "description": "This endpoint is used to update save job via the portal application.",
    "internalFunction": "saveJob",
    "usedInPortalPages": [
      "useCandidateMutations.js",
      "Info.jsx",
      "JobDetailsPage.jsx",
      "Jobprofile.jsx",
      "RecommendedJobs.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/jobs/:jobId/interest",
    "description": "This endpoint is used to create/submit share interest via the portal application.",
    "internalFunction": "shareInterest",
    "usedInPortalPages": [
      "EarlyAccessRoles.jsx",
      "EarlyAccessModal.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/companies/stats",
    "description": "This endpoint is used to get company stats via the portal application.",
    "internalFunction": "getCompanyStats",
    "usedInPortalPages": [
      "useCandidateQueries.js"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/companies/filter-options",
    "description": "This endpoint is used to get company filter options via the portal application.",
    "internalFunction": "getCompanyFilterOptions",
    "usedInPortalPages": [
      "useCandidateQueries.js"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/companies",
    "description": "This endpoint is used to get companies via the portal application.",
    "internalFunction": "getCompanies",
    "usedInPortalPages": [
      "useCandidateQueries.js"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/companies/:companyId",
    "description": "This endpoint is used to get company detail via the portal application.",
    "internalFunction": "getCompanyDetail",
    "usedInPortalPages": [
      "useCandidateQueries.js",
      "JobDetailsPage.jsx",
      "Jobprofile.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/companies/:companyId/reviews",
    "description": "This endpoint is used to submit company review via the portal application.",
    "internalFunction": "submitCompanyReview",
    "usedInPortalPages": [
      "useCandidateMutations.js",
      "JobDetailsPage.jsx",
      "Jobprofile.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/companies/:companyId/follow",
    "description": "This endpoint is used to update follow company via the portal application.",
    "internalFunction": "followCompany",
    "usedInPortalPages": [
      "useCandidateMutations.js",
      "JobDetailsPage.jsx",
      "Jobprofile.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/landing/home",
    "description": "This endpoint is used to get landing home via the portal application.",
    "internalFunction": "getLandingHome",
    "usedInPortalPages": [
      "useLandingQueries.js"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/landing/search-suggestions",
    "description": "This endpoint is used to get search suggestions via the portal application.",
    "internalFunction": "getSearchSuggestions",
    "usedInPortalPages": [
      "CandidateSearchBar.jsx",
      "GlobalSearchForm.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/landing/location-suggestions",
    "description": "This endpoint is used to get location suggestions via the portal application.",
    "internalFunction": "getLocationSuggestions",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/landing/jobs",
    "description": "This endpoint is used to get search public jobs via the portal application.",
    "internalFunction": "searchPublicJobs",
    "usedInPortalPages": [
      "useLandingQueries.js"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/landing/companies/:companyId",
    "description": "This endpoint is used to get public company detail via the portal application.",
    "internalFunction": "getPublicCompanyDetail",
    "usedInPortalPages": [
      "useLandingQueries.js",
      "Jobprofile.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/landing/employer",
    "description": "This endpoint is used to get employer landing via the portal application.",
    "internalFunction": "getEmployerLanding",
    "usedInPortalPages": [
      "useLandingQueries.js"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/auth/register",
    "description": "This endpoint is used to create/submit employer register via the portal application.",
    "internalFunction": "employerRegister",
    "usedInPortalPages": [
      "EmployerLandingPage.jsx",
      "ClientRegistrationForm.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/analytics",
    "description": "This endpoint is used to get employer analytics via the portal application.",
    "internalFunction": "getEmployerAnalytics",
    "usedInPortalPages": [
      "AnalyticsPage.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/activity",
    "description": "This endpoint is used to get recruiter activity via the portal application.",
    "internalFunction": "getRecruiterActivity",
    "usedInPortalPages": [
      "ResdexTab.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/dashboard",
    "description": "This endpoint is used to get employer dashboard via the portal application.",
    "internalFunction": "getEmployerDashboard",
    "usedInPortalPages": [
      "EmployerHeader.jsx",
      "useEmployerAuth.js",
      "EmployerLandingPage.jsx",
      "Dashboard.jsx",
      "Dashboards.jsx",
      "Pricing.jsx",
      "CompanyProfilePage.jsx",
      "ManageSearch.jsx",
      "SearchResults.jsx",
      "SearchResume.jsx",
      "SendMivite.jsx",
      "JobPostingReport.jsx",
      "ResdexReport.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/applications",
    "description": "This endpoint is used to get employer applications via the portal application.",
    "internalFunction": "getEmployerApplications",
    "usedInPortalPages": [
      "Dashboards.jsx",
      "ResumeDatabase.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/jobs",
    "description": "This endpoint is used to create/submit employer create job via the portal application.",
    "internalFunction": "employerCreateJob",
    "usedInPortalPages": [
      "PostJob.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/jobs/:jobId",
    "description": "This endpoint is used to get employer job via the portal application.",
    "internalFunction": "getEmployerJob",
    "usedInPortalPages": [
      "Dashboards.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/jobs/:jobId",
    "description": "This endpoint is used to update employer update job via the portal application.",
    "internalFunction": "employerUpdateJob",
    "usedInPortalPages": [
      "Dashboards.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/applications/:applicationId/resume/upload",
    "description": "This endpoint is used to create/submit employer upload application resume via the portal application.",
    "internalFunction": "employerUploadApplicationResume",
    "usedInPortalPages": [
      "Dashboards.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/ai/enhance-description",
    "description": "This endpoint is used to create/submit enhance description via the portal application.",
    "internalFunction": "enhanceDescription",
    "usedInPortalPages": [
      "PostJob.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/ai/suggest-skills",
    "description": "This endpoint is used to create/submit suggest skills via the portal application.",
    "internalFunction": "suggestSkills",
    "usedInPortalPages": [
      "PostJob.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/ai/suggest-skills-autocomplete",
    "description": "This endpoint is used to create/submit suggest skills autocomplete via the portal application.",
    "internalFunction": "suggestSkillsAutocomplete",
    "usedInPortalPages": [
      "ExperienceSection.jsx",
      "SkillsSection.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/applications/:applicationId/status",
    "description": "This endpoint is used to update application status via the portal application.",
    "internalFunction": "updateApplicationStatus",
    "usedInPortalPages": [
      "Dashboards.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/applications/:applicationId/resume/preview",
    "description": "This endpoint is used to get preview application resume via the portal application.",
    "internalFunction": "previewApplicationResume",
    "usedInPortalPages": [
      "Dashboards.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/chats",
    "description": "This endpoint is used to get employer chats via the portal application.",
    "internalFunction": "getEmployerChats",
    "usedInPortalPages": [
      "Dashboards.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/chats/:threadId/messages",
    "description": "This endpoint is used to get employer chat messages via the portal application.",
    "internalFunction": "getEmployerChatMessages",
    "usedInPortalPages": [
      "Dashboards.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/chats/:threadId/messages",
    "description": "This endpoint is used to create/submit send employer chat message via the portal application.",
    "internalFunction": "sendEmployerChatMessage",
    "usedInPortalPages": [
      "Dashboards.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/chats/:threadId/read",
    "description": "This endpoint is used to update mark employer chat read via the portal application.",
    "internalFunction": "markEmployerChatRead",
    "usedInPortalPages": [
      "Dashboards.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/reviews/react",
    "description": "This endpoint is used to create/submit react to review via the portal application.",
    "internalFunction": "reactToReview",
    "usedInPortalPages": [
      "Dashboards.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/profile",
    "description": "This endpoint is used to get employer profile via the portal application.",
    "internalFunction": "getEmployerProfile",
    "usedInPortalPages": [
      "ResumeDatabase.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/profile",
    "description": "This endpoint is used to update employer profile via the portal application.",
    "internalFunction": "updateEmployerProfile",
    "usedInPortalPages": [
      "Dashboards.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/profile/media",
    "description": "This endpoint is used to update upload employer media via the portal application.",
    "internalFunction": "uploadEmployerMedia",
    "usedInPortalPages": [
      "Dashboards.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/subscriptions",
    "description": "This endpoint is used to get employer subscriptions via the portal application.",
    "internalFunction": "getEmployerSubscriptions",
    "usedInPortalPages": [
      "MySubscriptionsPage.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/lead-generator/client-intakes",
    "description": "This endpoint is used to submit employer enquiry via the portal application.",
    "internalFunction": "submitEmployerEnquiry",
    "usedInPortalPages": [
      "EmployerLandingPage.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/auth/login",
    "description": "This endpoint is used to create/submit employer login via the portal application.",
    "internalFunction": "employerLogin",
    "usedInPortalPages": [
      "EmployerLoginModal.jsx",
      "EmployerLandingPage.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/auth/logout",
    "description": "This endpoint is used to create/submit logout employer via the portal application.",
    "internalFunction": "logoutEmployer",
    "usedInPortalPages": [
      "EmployerHeader.jsx",
      "useEmployerAuth.js",
      "Dashboards.jsx",
      "ManageSearch.jsx",
      "SearchResults.jsx",
      "SearchResume.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/dashboard",
    "description": "This endpoint is used to get quiz notification via the portal application.",
    "internalFunction": "getQuizNotification",
    "usedInPortalPages": [
      "App.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/quiz/today",
    "description": "This endpoint is used to get today quiz via the portal application.",
    "internalFunction": "getTodayQuiz",
    "usedInPortalPages": [
      "useCandidateQueries.js",
      "DailyQuiz.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/quiz/today/submit",
    "description": "This endpoint is used to submit today quiz via the portal application.",
    "internalFunction": "submitTodayQuiz",
    "usedInPortalPages": [
      "useCandidateMutations.js",
      "DailyQuiz.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/quiz/ranking",
    "description": "This endpoint is used to get quiz ranking via the portal application.",
    "internalFunction": "getQuizRanking",
    "usedInPortalPages": [
      "Premium3D.jsx",
      "useCandidateQueries.js",
      "DailyQuiz.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/chats",
    "description": "This endpoint is used to get candidate chats via the portal application.",
    "internalFunction": "getCandidateChats",
    "usedInPortalPages": [
      "useCandidateQueries.js",
      "ProfileDashboard.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/chats/:threadId/messages",
    "description": "This endpoint is used to get candidate chat messages via the portal application.",
    "internalFunction": "getCandidateChatMessages",
    "usedInPortalPages": [
      "ChatModal.jsx",
      "ProfileDashboard.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/chats/:threadId/messages",
    "description": "This endpoint is used to create/submit send candidate chat message via the portal application.",
    "internalFunction": "sendCandidateChatMessage",
    "usedInPortalPages": [
      "ChatModal.jsx",
      "ProfileDashboard.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/chats/:threadId/read",
    "description": "This endpoint is used to update mark candidate chat read via the portal application.",
    "internalFunction": "markCandidateChatRead",
    "usedInPortalPages": [
      "ChatModal.jsx",
      "ProfileDashboard.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/notifications",
    "description": "This endpoint is used to get employer notifications via the portal application.",
    "internalFunction": "getEmployerNotifications",
    "usedInPortalPages": [
      "EmployerHeader.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/notifications/:notificationId/read",
    "description": "This endpoint is used to update mark employer notification read via the portal application.",
    "internalFunction": "markEmployerNotificationRead",
    "usedInPortalPages": [
      "EmployerHeader.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/notifications",
    "description": "This endpoint is used to get candidate notifications via the portal application.",
    "internalFunction": "getCandidateNotifications",
    "usedInPortalPages": [
      "useCandidateQueries.js"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/notifications/:notificationId/read",
    "description": "This endpoint is used to update mark candidate notification read via the portal application.",
    "internalFunction": "markCandidateNotificationRead",
    "usedInPortalPages": [
      "useCandidateMutations.js"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/jobs/saved",
    "description": "This endpoint is used to get saved jobs via the portal application.",
    "internalFunction": "getSavedJobs",
    "usedInPortalPages": [
      "useCandidateQueries.js",
      "Info.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/jobs/:jobId/save",
    "description": "This endpoint is used to update toggle saved job via the portal application.",
    "internalFunction": "toggleSavedJob",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/public/landing/:shareId",
    "description": "This endpoint is used to get public candidate profile by share id via the portal application.",
    "internalFunction": "getPublicCandidateProfileByShareId",
    "usedInPortalPages": [
      "PublicProfileByShareId.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/:id",
    "description": "This endpoint is used to get public candidate by id via the portal application.",
    "internalFunction": "getPublicCandidateById",
    "usedInPortalPages": [
      "PublicCandidateProfile.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/:id/similar",
    "description": "This endpoint is used to get similar candidates via the portal application.",
    "internalFunction": "getSimilarCandidates",
    "usedInPortalPages": [
      "PublicCandidateProfile.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/:id/resume",
    "description": "This endpoint is used to get candidate resume via the portal application.",
    "internalFunction": "getCandidateResume",
    "usedInPortalPages": [
      "ResumeModal.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/profile",
    "description": "This endpoint is used to get candidate profile via the portal application.",
    "internalFunction": "getCandidateProfile",
    "usedInPortalPages": [
      "useCandidateQueries.js",
      "ResumeBuilder.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/ai/profile-analysis",
    "description": "This endpoint is used to get analyze profile with a i via the portal application.",
    "internalFunction": "analyzeProfileWithAI",
    "usedInPortalPages": [
      "useProfileAnalysis.js"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/profile/resume",
    "description": "This endpoint is used to create/submit upload resume via the portal application.",
    "internalFunction": "uploadResume",
    "usedInPortalPages": [
      "ResumeSection.jsx",
      "useCandidateMutations.js",
      "ResumeViewer.jsx"
    ]
  },
  {
    "method": "DELETE",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/profile/resume",
    "description": "This endpoint is used to delete resume via the portal application.",
    "internalFunction": "deleteResume",
    "usedInPortalPages": [
      "ResumeSection.jsx",
      "ResumeViewer.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/blog/published${qs ? ",
    "description": "This endpoint is used to get published blogs via the portal application.",
    "internalFunction": "getPublishedBlogs",
    "usedInPortalPages": [
      "useCandidateQueries.js"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/blog/:slug",
    "description": "This endpoint is used to get blog by slug via the portal application.",
    "internalFunction": "getBlogBySlug",
    "usedInPortalPages": [
      "useCandidateQueries.js",
      "BlogArticle.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/delete-account",
    "description": "This endpoint is used to create/submit employer delete account via the portal application.",
    "internalFunction": "employerDeleteAccount",
    "usedInPortalPages": [
      "Dashboards.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/blog/categories",
    "description": "This endpoint is used to get blog categories via the portal application.",
    "internalFunction": "getBlogCategories",
    "usedInPortalPages": [
      "useCandidateQueries.js"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/resdex/filters",
    "description": "This endpoint is used to get resdex filters via the portal application.",
    "internalFunction": "getResdexFilters",
    "usedInPortalPages": [
      "SearchResume.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/resdex/search",
    "description": "This endpoint is used to get search resdex candidates via the portal application.",
    "internalFunction": "searchResdexCandidates",
    "usedInPortalPages": [
      "SearchResults.jsx",
      "SearchResume.jsx",
      "SendMivite.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/resdex/ai-parse",
    "description": "This endpoint is used to create/submit ai parse resdex query via the portal application.",
    "internalFunction": "aiParseResdexQuery",
    "usedInPortalPages": [
      "SearchResume.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/resdex/searches",
    "description": "This endpoint is used to get resdex searches via the portal application.",
    "internalFunction": "getResdexSearches",
    "usedInPortalPages": [
      "ManageSearch.jsx",
      "SearchResume.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/resdex/searches",
    "description": "This endpoint is used to create/submit save resdex search via the portal application.",
    "internalFunction": "saveResdexSearch",
    "usedInPortalPages": [
      "ManageSearch.jsx",
      "SearchResume.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/resdex/searches/:id",
    "description": "This endpoint is used to update resdex search via the portal application.",
    "internalFunction": "updateResdexSearch",
    "usedInPortalPages": [
      "ManageSearch.jsx"
    ]
  },
  {
    "method": "DELETE",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/resdex/searches/:id",
    "description": "This endpoint is used to delete resdex search via the portal application.",
    "internalFunction": "deleteResdexSearch",
    "usedInPortalPages": [
      "ManageSearch.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/resdex/searches/:id/pin",
    "description": "This endpoint is used to update toggle pin resdex search via the portal application.",
    "internalFunction": "togglePinResdexSearch",
    "usedInPortalPages": [
      "ManageSearch.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/resdex/searches/recent",
    "description": "This endpoint is used to get resdex recent searches via the portal application.",
    "internalFunction": "getResdexRecentSearches",
    "usedInPortalPages": [
      "SearchResume.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/resdex/nvite/send",
    "description": "This endpoint is used to create/submit send mivite via the portal application.",
    "internalFunction": "sendMivite",
    "usedInPortalPages": [
      "SendMivite.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/resdex/nvite/list",
    "description": "This endpoint is used to get nvite list via the portal application.",
    "internalFunction": "getNviteList",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/resdex/nvite/stats",
    "description": "This endpoint is used to get nvite stats via the portal application.",
    "internalFunction": "getNviteStats",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/folders",
    "description": "This endpoint is used to get list folders via the portal application.",
    "internalFunction": "listFolders",
    "usedInPortalPages": [
      "useFolderQueries.js"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/folders/:id",
    "description": "This endpoint is used to get folder via the portal application.",
    "internalFunction": "getFolder",
    "usedInPortalPages": [
      "useFolderQueries.js"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/folders",
    "description": "This endpoint is used to create folder via the portal application.",
    "internalFunction": "createFolder",
    "usedInPortalPages": [
      "FolderSelectorModal.jsx",
      "useFolderQueries.js",
      "FolderListPage.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/folders/:id",
    "description": "This endpoint is used to update folder via the portal application.",
    "internalFunction": "updateFolder",
    "usedInPortalPages": [
      "useFolderQueries.js",
      "FolderListPage.jsx",
      "SingleFolderPage.jsx"
    ]
  },
  {
    "method": "DELETE",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/folders/:id",
    "description": "This endpoint is used to delete folder via the portal application.",
    "internalFunction": "deleteFolder",
    "usedInPortalPages": [
      "useFolderQueries.js",
      "FolderListPage.jsx",
      "SingleFolderPage.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/folders/duplicate/:id",
    "description": "This endpoint is used to get duplicate folder via the portal application.",
    "internalFunction": "duplicateFolder",
    "usedInPortalPages": [
      "useFolderQueries.js",
      "FolderListPage.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/folders/:folderId/candidates",
    "description": "This endpoint is used to create/submit add candidate to folder via the portal application.",
    "internalFunction": "addCandidateToFolder",
    "usedInPortalPages": [
      "useFolderQueries.js"
    ]
  },
  {
    "method": "DELETE",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/folders/:folderId/candidates/:candidateId",
    "description": "This endpoint is used to delete remove candidate from folder via the portal application.",
    "internalFunction": "removeCandidateFromFolder",
    "usedInPortalPages": [
      "useFolderQueries.js"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/folders/:folderId/candidates/:candidateId",
    "description": "This endpoint is used to update folder candidate via the portal application.",
    "internalFunction": "updateFolderCandidate",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/folders/:folderId/candidates/bulk-remove",
    "description": "This endpoint is used to create/submit bulk remove candidates via the portal application.",
    "internalFunction": "bulkRemoveCandidates",
    "usedInPortalPages": [
      "useFolderQueries.js"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/folders/candidates/move",
    "description": "This endpoint is used to create/submit move candidates via the portal application.",
    "internalFunction": "moveCandidates",
    "usedInPortalPages": [
      "useFolderQueries.js"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/folders/candidates/copy",
    "description": "This endpoint is used to create/submit copy candidates via the portal application.",
    "internalFunction": "copyCandidates",
    "usedInPortalPages": [
      "useFolderQueries.js"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/credits",
    "description": "This endpoint is used to get credits via the portal application.",
    "internalFunction": "getCredits",
    "usedInPortalPages": [
      "EmployerHeader.jsx",
      "Pricing.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/credits/history",
    "description": "This endpoint is used to get credit history via the portal application.",
    "internalFunction": "getCreditHistory",
    "usedInPortalPages": [
      "Pricing.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/credits/topup",
    "description": "This endpoint is used to create/submit topup credits via the portal application.",
    "internalFunction": "topupCredits",
    "usedInPortalPages": [
      "Pricing.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/credits/verify",
    "description": "This endpoint is used to create/submit verify credit topup via the portal application.",
    "internalFunction": "verifyCreditTopup",
    "usedInPortalPages": [
      "Pricing.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/credits/use",
    "description": "This endpoint is used to create/submit use credits via the portal application.",
    "internalFunction": "useCredits",
    "usedInPortalPages": [
      "ResumeModal.jsx",
      "PublicCandidateProfile.jsx",
      "CandidateFullProfile.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/credits/check/:candidateId",
    "description": "This endpoint is used to get check resume access via the portal application.",
    "internalFunction": "checkResumeAccess",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/credits/search",
    "description": "This endpoint is used to create/submit search credits via the portal application.",
    "internalFunction": "searchCredits",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/reports/job-posting",
    "description": "This endpoint is used to get job posting report via the portal application.",
    "internalFunction": "getJobPostingReport",
    "usedInPortalPages": [
      "JobPostingReport.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/reports/job-posting/subscription",
    "description": "This endpoint is used to get job posting report subscription via the portal application.",
    "internalFunction": "getJobPostingReportSubscription",
    "usedInPortalPages": [
      "JobPostingReport.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/reports/job-posting/subscription",
    "description": "This endpoint is used to create/submit save job posting report subscription via the portal application.",
    "internalFunction": "saveJobPostingReportSubscription",
    "usedInPortalPages": [
      "JobPostingReport.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/reports/job-posting/send-email",
    "description": "This endpoint is used to create/submit send job posting report email via the portal application.",
    "internalFunction": "sendJobPostingReportEmail",
    "usedInPortalPages": [
      "JobPostingReport.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/reports/resdex",
    "description": "This endpoint is used to get resdex report via the portal application.",
    "internalFunction": "getResdexReport",
    "usedInPortalPages": [
      "ResdexReport.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/reports/resdex/subscription",
    "description": "This endpoint is used to get resdex report subscription via the portal application.",
    "internalFunction": "getResdexReportSubscription",
    "usedInPortalPages": [
      "ResdexReport.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/reports/resdex/subscription",
    "description": "This endpoint is used to create/submit save resdex report subscription via the portal application.",
    "internalFunction": "saveResdexReportSubscription",
    "usedInPortalPages": [
      "ResdexReport.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/reports/resdex/send-email",
    "description": "This endpoint is used to create/submit send resdex report email via the portal application.",
    "internalFunction": "sendResdexReportEmail",
    "usedInPortalPages": [
      "ResdexReport.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/jobs-responses",
    "description": "This endpoint is used to get employer jobs via the portal application.",
    "internalFunction": "getEmployerJobs",
    "usedInPortalPages": [
      "ManageJobsResponses.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/jobs-responses/filters",
    "description": "This endpoint is used to get employer job filters via the portal application.",
    "internalFunction": "getEmployerJobFilters",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/jobs-responses/:jobId/responses",
    "description": "This endpoint is used to get job responses via the portal application.",
    "internalFunction": "getJobResponses",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/jobs-responses/:jobId/detail",
    "description": "This endpoint is used to get job detail with responses via the portal application.",
    "internalFunction": "getJobDetailWithResponses",
    "usedInPortalPages": [
      "JobResponsesDetail.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/jobs-responses/:jobId/applications/:applicationId/status",
    "description": "This endpoint is used to update candidate job status via the portal application.",
    "internalFunction": "updateCandidateJobStatus",
    "usedInPortalPages": [
      "CandidateFullProfile.jsx",
      "JobResponsesDetail.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/jobs-responses/:jobId/applications/:applicationId/comments",
    "description": "This endpoint is used to create/submit add candidate comment via the portal application.",
    "internalFunction": "addCandidateComment",
    "usedInPortalPages": [
      "CandidateFullProfile.jsx",
      "JobResponsesDetail.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/jobs-responses/:jobId/close",
    "description": "This endpoint is used to update close employer job via the portal application.",
    "internalFunction": "closeEmployerJob",
    "usedInPortalPages": [
      "ManageJobsResponses.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/jobs-responses/bulk-close",
    "description": "This endpoint is used to create/submit bulk close jobs via the portal application.",
    "internalFunction": "bulkCloseJobs",
    "usedInPortalPages": [
      "ManageJobsResponses.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/jobs-responses/bulk-refresh",
    "description": "This endpoint is used to create/submit bulk refresh jobs via the portal application.",
    "internalFunction": "bulkRefreshJobs",
    "usedInPortalPages": [
      "ManageJobsResponses.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/candidates/:candidateId/full-profile",
    "description": "This endpoint is used to get candidate full profile via the portal application.",
    "internalFunction": "getCandidateFullProfile",
    "usedInPortalPages": [
      "CandidateFullProfile.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/payment/create-order",
    "description": "This endpoint is used to create order via the portal application.",
    "internalFunction": "createOrder",
    "usedInPortalPages": [
      "MavenPro.jsx",
      "Premium.jsx",
      "ResumeBuilder.jsx",
      "Buyonline.jsx",
      "Pricing.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/payment/confirm",
    "description": "This endpoint is used to create/submit confirm payment via the portal application.",
    "internalFunction": "confirmPayment",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/payment/verify",
    "description": "This endpoint is used to create/submit verify payment via the portal application.",
    "internalFunction": "verifyPayment",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/payment/plans",
    "description": "This endpoint is used to get plans via the portal application.",
    "internalFunction": "getPlans",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/auth/send-mobile-otp",
    "description": "This endpoint is used to create/submit send mobile otp via the portal application.",
    "internalFunction": "sendMobileOtp",
    "usedInPortalPages": [
      "ClientRegistrationForm.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/auth/verify-mobile-otp",
    "description": "This endpoint is used to create/submit verify mobile otp via the portal application.",
    "internalFunction": "verifyMobileOtp",
    "usedInPortalPages": [
      "ClientRegistrationForm.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/auth/send-email-otp",
    "description": "This endpoint is used to create/submit send email otp via the portal application.",
    "internalFunction": "sendEmailOtp",
    "usedInPortalPages": [
      "ClientRegistrationForm.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/auth/verify-email-otp",
    "description": "This endpoint is used to create/submit verify email otp via the portal application.",
    "internalFunction": "verifyEmailOtp",
    "usedInPortalPages": [
      "ClientRegistrationForm.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/user-management/users",
    "description": "This endpoint is used to get users via the portal application.",
    "internalFunction": "getUsers",
    "usedInPortalPages": [
      "UserManagement.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/user-management/users",
    "description": "This endpoint is used to create user via the portal application.",
    "internalFunction": "createUser",
    "usedInPortalPages": [
      "UserManagement.jsx"
    ]
  },
  {
    "method": "PUT",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/user-management/users/:id",
    "description": "This endpoint is used to update user via the portal application.",
    "internalFunction": "updateUser",
    "usedInPortalPages": [
      "AuthContext.jsx",
      "ResumeSection.jsx",
      "HomeDashboard.jsx",
      "ProfileDashboard.jsx",
      "MavenPro.jsx",
      "Premium.jsx",
      "ResumeBuilder.jsx",
      "ResumeViewer.jsx",
      "UserManagement.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/user-management/users/bulk-delete",
    "description": "This endpoint is used to delete users via the portal application.",
    "internalFunction": "deleteUsers",
    "usedInPortalPages": [
      "UserManagement.jsx"
    ]
  },
  {
    "method": "PUT",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/user-management/users/:id/password",
    "description": "This endpoint is used to change user password via the portal application.",
    "internalFunction": "changeUserPassword",
    "usedInPortalPages": []
  },
  {
    "method": "PUT",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/user-management/users/time-restrictions",
    "description": "This endpoint is used to update time restrictions via the portal application.",
    "internalFunction": "updateTimeRestrictions",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/user-management/domains",
    "description": "This endpoint is used to get company domains via the portal application.",
    "internalFunction": "getCompanyDomains",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/user-management/domains",
    "description": "This endpoint is used to add company domain via the portal application.",
    "internalFunction": "addCompanyDomain",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/user-management/domains/otp",
    "description": "This endpoint is used to send domain otp via the portal application.",
    "internalFunction": "sendDomainOtp",
    "usedInPortalPages": [
      "UserManagement.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/user-management/domains/verify-otp",
    "description": "This endpoint is used to verify domain otp via the portal application.",
    "internalFunction": "verifyDomainOtp",
    "usedInPortalPages": [
      "UserManagement.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/user-management/security-settings",
    "description": "This endpoint is used to get security settings via the portal application.",
    "internalFunction": "getSecuritySettings",
    "usedInPortalPages": [
      "UserManagement.jsx"
    ]
  },
  {
    "method": "PUT",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/user-management/security-settings",
    "description": "This endpoint is used to update security settings via the portal application.",
    "internalFunction": "updateSecuritySettings",
    "usedInPortalPages": [
      "UserManagement.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/feedback",
    "description": "This endpoint is used to submit feedback via the portal application.",
    "internalFunction": "submitFeedback",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/chatbot/usage",
    "description": "This endpoint is used to get chatbot usage via the portal application.",
    "internalFunction": "getChatbotUsage",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/chatbot/message",
    "description": "This endpoint is used to send chatbot message via the portal application.",
    "internalFunction": "sendChatbotMessage",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/chatbot/recommend-jobs",
    "description": "This endpoint is used to get recommended jobs from chatbot via the portal application.",
    "internalFunction": "recommendJobsChatbot",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/chatbot/top-applicants",
    "description": "This endpoint is used to get top applicants from chatbot via the portal application.",
    "internalFunction": "getTopApplicantsChatbot",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/chatbot/recommend-candidates",
    "description": "This endpoint is used to get recommend candidates from chatbot via the portal application.",
    "internalFunction": "recommendCandidatesChatbot",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/chatbot/upload",
    "description": "This endpoint is used to upload file to chatbot via the portal application.",
    "internalFunction": "uploadToChatbot",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/chatbot/threads/details",
    "description": "This endpoint is used to get chatbot thread details via the portal application.",
    "internalFunction": "getChatbotThreadDetails",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/chatbot/matched-jobs",
    "description": "This endpoint is used to get matched jobs from chatbot via the portal application.",
    "internalFunction": "getMatchedJobsChatbot",
    "usedInPortalPages": []
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/chatbot/threads/:threadId/messages",
    "description": "This endpoint is used to get chatbot thread messages via the portal application.",
    "internalFunction": "getChatbotThreadMessages",
    "usedInPortalPages": []
  },
  {
    "method": "DELETE",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/chatbot/threads/:threadId",
    "description": "This endpoint is used to delete chatbot thread via the portal application.",
    "internalFunction": "deleteChatbotThread",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/auth/forgot-password",
    "description": "This endpoint is used to forgot password candidate via the portal application.",
    "internalFunction": "candidateForgotPassword",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/auth/verify-reset-otp",
    "description": "This endpoint is used to verify reset otp candidate via the portal application.",
    "internalFunction": "candidateVerifyResetOtp",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/auth/reset-password",
    "description": "This endpoint is used to reset password candidate via the portal application.",
    "internalFunction": "candidateResetPassword",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/auth/forgot-password",
    "description": "This endpoint is used to forgot password employer via the portal application.",
    "internalFunction": "employerForgotPassword",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/auth/verify-reset-otp",
    "description": "This endpoint is used to verify reset otp employer via the portal application.",
    "internalFunction": "employerVerifyResetOtp",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/auth/reset-password",
    "description": "This endpoint is used to reset password employer via the portal application.",
    "internalFunction": "employerResetPassword",
    "usedInPortalPages": []
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/auth/logout",
    "description": "This endpoint is used to logout via the portal application.",
    "internalFunction": "logout",
    "usedInPortalPages": [
      "AuthContext.jsx",
      "AvatarDropdown.jsx",
      "LogoutModal.jsx",
      "EmployerHeader.jsx",
      "useEmployerAuth.js"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/auth/mobile/send-otp",
    "description": "This endpoint is used to candidate send mobile otp via the portal application.",
    "internalFunction": "candidateSendMobileOtp",
    "usedInPortalPages": [
      "Login.jsx"
    ]
  },
  {
    "method": "POST",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/candidate/auth/mobile/verify-otp",
    "description": "This endpoint is used to candidate verify mobile otp via the portal application.",
    "internalFunction": "candidateVerifyMobileOtp",
    "usedInPortalPages": [
      "AuthContext.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/quota-usage",
    "description": "This endpoint is used to get quota usage via the portal application.",
    "internalFunction": "getQuotaUsage",
    "usedInPortalPages": [
      "ResdexTab.jsx",
      "PostJob.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/quota-management",
    "description": "This endpoint is used to get quota management via the portal application.",
    "internalFunction": "getQuotaManagement",
    "usedInPortalPages": [
      "ManageQuota.jsx"
    ]
  },
  {
    "method": "PATCH",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/quota-management",
    "description": "This endpoint is used to update quota management via the portal application.",
    "internalFunction": "updateQuotaManagement",
    "usedInPortalPages": [
      "ManageQuota.jsx"
    ]
  },
  {
    "method": "GET",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/packages",
    "description": "This endpoint is used to get packages via the portal application.",
    "internalFunction": "getPackages",
    "usedInPortalPages": [
      "Pricing.jsx"
    ]
  },
  {
    "method": "PUT",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/user-management/domains",
    "description": "This endpoint is used to edit domain via the portal application.",
    "internalFunction": "editDomain",
    "usedInPortalPages": [
      "UserManagement.jsx"
    ]
  },
  {
    "method": "DELETE",
    "fullUrl": "https://maven-jobs.onrender.com/api/v1/company-panel/user-management/domains",
    "description": "This endpoint is used to delete domain via the portal application.",
    "internalFunction": "deleteDomain",
    "usedInPortalPages": [
      "UserManagement.jsx"
    ]
  }
];
