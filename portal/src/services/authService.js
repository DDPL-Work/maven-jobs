import api from './api';

const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/candidate/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/candidate/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  loginWithGoogle: async (credential) => {
    try {
      const response = await api.post('/candidate/auth/google', { credential });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Google login failed' };
    }
  },

  getMe: async () => {
    try {
      const response = await api.get('/candidate/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user data' };
    }
  },
  
  updateProfile: async (profileData) => {
    try {
      const response = await api.patch('/candidate/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Profile update failed' };
    }
  },

  uploadProjectMedia: async (formData, onProgress) => {
    try {
      const response = await api.post('/candidate/profile/project-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
      });
      return response.data;
    } catch (error) {
      return { success: false, data: null };
    }
  },

  uploadImage: async (formData) => {
    try {
      const response = await api.post('/candidate/profile/image', formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Image upload failed' };
    }
  },

  getDashboard: async () => {
    try {
      const response = await api.get('/candidate/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dashboard data' };
    }
  },

  getNvites: async () => {
    try {
      const response = await api.get('/candidate/nvites');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch MIvites' };
    }
  },

  getJobs: async (params) => {
    try {
      const response = await api.get('/candidate/jobs', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch jobs' };
    }
  },

  getJobDetail: async (jobId) => {
    try {
      const response = await api.get(`/candidate/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch job details' };
    }
  },

  suggestJobs: async (q) => {
    try {
      const response = await api.get('/candidate/jobs/suggest', { params: { q } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch suggestions' };
    }
  },

  getJobMatchScore: async (jobId) => {
    try {
      const response = await api.get(`/candidate/jobs/${jobId}/match-score`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch match score' };
    }
  },

  createApplication: async (applicationData) => {
    try {
      const response = await api.post('/candidate/applications', applicationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Application failed' };
    }
  },

  saveJob: async (jobId, save = true) => {
    try {
      const response = await api.patch(`/candidate/jobs/${jobId}/save`, { save });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update saved job' };
    }
  },

  shareInterest: async (jobId) => {
    try {
      const response = await api.post(`/candidate/jobs/${jobId}/interest`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to share interest' };
    }
  },

  getApplications: async () => {
    try {
      const response = await api.get('/candidate/applications');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch applications' };
    }
  },

  getCompanyStats: async (params = {}) => {
    try {
      const response = await api.get('/candidate/companies/stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch company stats' };
    }
  },

  getCompanyFilterOptions: async () => {
    try {
      const response = await api.get('/candidate/companies/filter-options');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch company filter options' };
    }
  },

  getCompanies: async (params) => {
    try {
      const response = await api.get('/candidate/companies', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch companies' };
    }
  },

  getCompanyDetail: async (companyId) => {
    try {
      const response = await api.get(`/candidate/companies/${companyId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch company details' };
    }
  },

  submitCompanyReview: async (companyId, payload) => {
    try {
      const response = await api.post(`/candidate/companies/${companyId}/reviews`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit review' };
    }
  },

  followCompany: async (companyId, follow = true) => {
    try {
      const response = await api.patch(`/candidate/companies/${companyId}/follow`, { follow });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update follow status' };
    }
  },

  getLandingHome: async () => {
    try {
      const response = await api.get('/landing/home');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch landing data' };
    }
  },

  getSearchSuggestions: async (q) => {
    try {
      const response = await api.get('/landing/search-suggestions', { params: { q } });
      return response.data;
    } catch {
      return { success: true, data: { suggestions: [] } };
    }
  },

  getLocationSuggestions: async (q) => {
    try {
      const response = await api.get('/landing/location-suggestions', { params: { q } });
      return response.data;
    } catch {
      return { success: true, data: { suggestions: [] } };
    }
  },

  searchPublicJobs: async (params) => {
    try {
      const response = await api.get('/landing/jobs', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to search jobs' };
    }
  },

  getPublicCompanyDetail: async (companyId) => {
    try {
      const response = await api.get(`/landing/companies/${companyId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch company profile' };
    }
  },

  getEmployerLanding: async () => {
    try {
      const response = await api.get('/landing/employer');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch employer landing data' };
    }
  },

  employerRegister: async (payload) => {
    try {
      const response = await api.post('/company-panel/auth/register', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Employer registration failed' };
    }
  },

  getEmployerAnalytics: async (range = '12m') => {
    try {
      const response = await api.get('/company-panel/analytics', { params: { range } });
      return response.data;
    } catch {
      return { success: false, data: null };
    }
  },

  getRecruiterActivity: async (page = 1, limit = 5) => {
    try {
      const response = await api.get('/company-panel/activity', { params: { page, limit } });
      return response.data;
    } catch {
      return { success: false, data: { items: [], pagination: { page: 1, limit, totalItems: 0, totalPages: 1, hasPrevPage: false, hasNextPage: false } } };
    }
  },

  getEmployerDashboard: async () => {
    try {
      const response = await api.get('/company-panel/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch employer dashboard' };
    }
  },

  getEmployerApplications: async () => {
    try {
      const response = await api.get('/company-panel/applications');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch employer applications' };
    }
  },

  employerCreateJob: async (payload) => {
    try {
      const response = await api.post('/company-panel/jobs', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Job creation failed' };
    }
  },

  getEmployerJob: async (jobId) => {
    try {
      const response = await api.get(`/company-panel/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch job' };
    }
  },

  employerUpdateJob: async (jobId, payload) => {
    try {
      const response = await api.patch(`/company-panel/jobs/${jobId}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Job update failed' };
    }
  },

  employerUploadApplicationResume: async (applicationId, file) => {
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const response = await api.post(`/company-panel/applications/${applicationId}/resume/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Resume upload failed' };
    }
  },

  enhanceDescription: async (text, type = 'description') => {
    try {
      const response = await api.post('/company-panel/ai/enhance-description', { text, type });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'AI enhancement failed' };
    }
  },

  suggestSkills: async (skills) => {
    try {
      const response = await api.post('/company-panel/ai/suggest-skills', { skills });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Skill suggestion failed' };
    }
  },

  suggestSkillsAutocomplete: async (query, existingSkills = []) => {
    try {
      const response = await api.post('/candidate/ai/suggest-skills-autocomplete', { query, existingSkills });
      return response.data;
    } catch (error) {
      return { success: true, data: { suggestions: [] } };
    }
  },

  updateApplicationStatus: async (applicationId, status) => {
    try {
      const response = await api.patch(`/company-panel/applications/${applicationId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update application status' };
    }
  },
  previewApplicationResume: async (applicationId) => {
    try {
      const response = await api.get(`/company-panel/applications/${applicationId}/resume/preview`, { responseType: 'blob' });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to preview resume' };
    }
  },
  getEmployerChats: async () => {
    try {
      const response = await api.get('/company-panel/chats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch employer chats' };
    }
  },

  getEmployerChatMessages: async (threadId) => {
    try {
      const response = await api.get(`/company-panel/chats/${threadId}/messages`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch chat messages' };
    }
  },

  sendEmployerChatMessage: async (threadId, payload) => {
    try {
      const response = await api.post(`/company-panel/chats/${threadId}/messages`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send chat message' };
    }
  },

  markEmployerChatRead: async (threadId) => {
    try {
      const response = await api.patch(`/company-panel/chats/${threadId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to mark chat as read' };
    }
  },

  reactToReview: async (reviewId, reaction) => {
    try {
      const response = await api.post('/company-panel/reviews/react', { reviewId, reaction });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to react to review' };
    }
  },
  getEmployerProfile: async () => {
    try {
      const response = await api.get('/company-panel/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch employer profile' };
    }
  },

  updateEmployerProfile: async (payload) => {
    try {
      const response = await api.patch('/company-panel/profile', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update employer profile' };
    }
  },

  uploadEmployerMedia: async (kind, file) => {
    try {
      const formData = new FormData();
      formData.append('kind', kind);
      formData.append('image', file);
      const response = await api.patch('/company-panel/profile/media', formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload company image' };
    }
  },

  submitEmployerEnquiry: async (payload) => {
    try {
      const response = await api.post('/lead-generator/client-intakes', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit employer enquiry' };
    }
  },

  employerLogin: async (email, password) => {
    try {
      const response = await api.post('/company-panel/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Employer login failed' };
    }
  },

  getQuizNotification: async () => {
    try {
      const response = await api.get('/candidate/dashboard');
      return response.data?.data?.quiz || null;
    } catch {
      return null;
    }
  },

  getTodayQuiz: async () => {
    try {
      const response = await api.get('/candidate/quiz/today');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch quiz' };
    }
  },

  submitTodayQuiz: async (answers) => {
    try {
      const response = await api.post('/candidate/quiz/today/submit', { answers });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit quiz' };
    }
  },

  getQuizRanking: async () => {
    try {
      const response = await api.get('/candidate/quiz/ranking');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch ranking' };
    }
  },

  getCandidateChats: async () => {
    try {
      const response = await api.get('/candidate/chats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch candidate chats' };
    }
  },

  getCandidateChatMessages: async (threadId) => {
    try {
      const response = await api.get(`/candidate/chats/${threadId}/messages`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch candidate chat messages' };
    }
  },

  sendCandidateChatMessage: async (threadId, payload) => {
    try {
      const response = await api.post(`/candidate/chats/${threadId}/messages`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send candidate chat message' };
    }
  },

  markCandidateChatRead: async (threadId) => {
    try {
      const response = await api.patch(`/candidate/chats/${threadId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to mark candidate chat as read' };
    }
  },

  getEmployerNotifications: async () => {
    try {
      const response = await api.get('/company-panel/notifications');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch employer notifications' };
    }
  },

  markEmployerNotificationRead: async (notificationId) => {
    try {
      const response = await api.patch(`/company-panel/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to mark employer notification as read' };
    }
  },

  getCandidateNotifications: async () => {
    try {
      const response = await api.get('/candidate/notifications');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch notifications' };
    }
  },

  markCandidateNotificationRead: async (notificationId) => {
    try {
      const response = await api.patch(`/candidate/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to mark notification as read' };
    }
  },

  getSavedJobs: async () => {
    try {
      const response = await api.get('/candidate/jobs/saved');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch saved jobs' };
    }
  },

  toggleSavedJob: async (jobId, save = true) => {
    try {
      const response = await api.patch(`/candidate/jobs/${jobId}/save`, { save });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update saved job' };
    }
  },
  getPublicCandidateProfileByShareId: async (shareId) => {
    try {
      const response = await api.get(`/candidate/public/landing/${shareId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch public candidate profile' };
    }
  },
  getPublicCandidateById: async (id) => {
    try {
      const response = await api.get(`/candidate/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch candidate profile' };
    }
  },
  getCandidateResume: async (id) => {
    try {
      const response = await api.get(`/candidate/${id}/resume`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch resume' };
    }
  },

  // Protected: ensures backend lazily generates/saves publicShareId if missing
  getCandidateProfile: async () => {
    try {
      const response = await api.get('/candidate/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch candidate profile' };
    }
  },

  analyzeProfileWithAI: async () => {
    try {
      const response = await api.get('/candidate/ai/profile-analysis');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'AI profile analysis failed' };
    }
  },

  uploadResume: async (file) => {
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const response = await api.post('/candidate/profile/resume', formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Resume upload failed' };
    }
  },

  deleteResume: async () => {
    try {
      const response = await api.delete('/candidate/profile/resume');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Resume delete failed' };
    }
  },

  getPublishedBlogs: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.category) query.set('category', params.category);
      if (params.page) query.set('page', params.page);
      if (params.limit) query.set('limit', params.limit);
      const qs = query.toString();
      const response = await api.get(`/blog/published${qs ? `?${qs}` : ''}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch blogs' };
    }
  },

  getBlogBySlug: async (slug) => {
    try {
      const response = await api.get(`/blog/${slug}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Blog not found' };
    }
  },

  employerDeleteAccount: async (payload) => {
    try {
      const response = await api.post('/company-panel/delete-account', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete account' };
    }
  },

  getBlogCategories: async () => {
    try {
      const response = await api.get('/blog/categories');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch categories' };
    }
  },

  // ── Resdex (Resume Search & Database) ──────────────────────────────────────
  getResdexFilters: async () => {
    try {
      const response = await api.get('/company-panel/resdex/filters');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch resdex filters' };
    }
  },

  searchResdexCandidates: async (params) => {
    try {
      const response = await api.get('/company-panel/resdex/search', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to search candidates' };
    }
  },

  aiParseResdexQuery: async (query) => {
    try {
      const response = await api.post('/company-panel/resdex/ai-parse', { query });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'AI parse failed' };
    }
  },

  getResdexSearches: async (pinnedOnly = false) => {
    try {
      const params = pinnedOnly ? { pinnedOnly: 'true' } : {};
      const response = await api.get('/company-panel/resdex/searches', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch saved searches' };
    }
  },

  saveResdexSearch: async (payload) => {
    try {
      const response = await api.post('/company-panel/resdex/searches', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to save search' };
    }
  },

  updateResdexSearch: async (id, payload) => {
    try {
      const response = await api.patch(`/company-panel/resdex/searches/${id}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update search' };
    }
  },

  deleteResdexSearch: async (id) => {
    try {
      const response = await api.delete(`/company-panel/resdex/searches/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete search' };
    }
  },

  togglePinResdexSearch: async (id) => {
    try {
      const response = await api.patch(`/company-panel/resdex/searches/${id}/pin`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to toggle pin' };
    }
  },

  getResdexRecentSearches: async () => {
    try {
      const response = await api.get('/company-panel/resdex/searches/recent');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch recent searches' };
    }
  },

  // ── NVite (Send MIvites) ────────────────────────────────────────────────────
  sendMivite: async (payload) => {
    try {
      const response = await api.post('/company-panel/resdex/nvite/send', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send invitations' };
    }
  },

  getNviteList: async (params = {}) => {
    try {
      const response = await api.get('/company-panel/resdex/nvite/list', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch sent invitations' };
    }
  },

  getNviteStats: async () => {
    try {
      const response = await api.get('/company-panel/resdex/nvite/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch invitation stats' };
    }
  },

  // ── Folder Management ──
  listFolders: async (params) => {
    const response = await api.get('/company-panel/folders', { params });
    return response.data;
  },
  getFolder: async (id) => {
    const response = await api.get(`/company-panel/folders/${id}`);
    return response.data;
  },
  createFolder: async (data) => {
    const response = await api.post('/company-panel/folders', data);
    return response.data;
  },
  updateFolder: async (id, data) => {
    const response = await api.patch(`/company-panel/folders/${id}`, data);
    return response.data;
  },
  deleteFolder: async (id) => {
    const response = await api.delete(`/company-panel/folders/${id}`);
    return response.data;
  },
  duplicateFolder: async (id) => {
    const response = await api.get(`/company-panel/folders/duplicate/${id}`);
    return response.data;
  },
  addCandidateToFolder: async (folderId, candidateId) => {
    const response = await api.post(`/company-panel/folders/${folderId}/candidates`, { candidateId });
    return response.data;
  },
  removeCandidateFromFolder: async (folderId, candidateId) => {
    const response = await api.delete(`/company-panel/folders/${folderId}/candidates/${candidateId}`);
    return response.data;
  },
  updateFolderCandidate: async (folderId, candidateId, data) => {
    const response = await api.patch(`/company-panel/folders/${folderId}/candidates/${candidateId}`, data);
    return response.data;
  },
  bulkRemoveCandidates: async (folderId, candidateIds) => {
    const response = await api.post(`/company-panel/folders/${folderId}/candidates/bulk-remove`, { candidateIds });
    return response.data;
  },
  moveCandidates: async (fromFolderId, toFolderId, candidateIds) => {
    const response = await api.post('/company-panel/folders/candidates/move', { fromFolderId, toFolderId, candidateIds });
    return response.data;
  },
  copyCandidates: async (toFolderId, candidateIds) => {
    const response = await api.post('/company-panel/folders/candidates/copy', { toFolderId, candidateIds });
    return response.data;
  },

  // Credits
  getCredits: async () => {
    const response = await api.get('/company-panel/credits');
    return response.data;
  },
  getCreditHistory: async (params) => {
    const response = await api.get('/company-panel/credits/history', { params });
    return response.data;
  },
  topupCredits: async () => {
    const response = await api.post('/company-panel/credits/topup');
    return response.data;
  },
  verifyCreditTopup: async (payload) => {
    const response = await api.post('/company-panel/credits/verify', payload);
    return response.data;
  },
  useCredits: async (action, candidateId) => {
    const response = await api.post('/company-panel/credits/use', { action, candidateId });
    return response.data;
  },
  checkResumeAccess: async (candidateId) => {
    const response = await api.get(`/company-panel/credits/check/${candidateId}`);
    return response.data;
  },
  searchCredits: async () => {
    const response = await api.post('/company-panel/credits/search');
    return response.data;
  },
};

export default authService;

