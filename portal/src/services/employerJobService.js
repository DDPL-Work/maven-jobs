import api from './api';

/**
 * Service for employer manage jobs & responses features
 */
export const employerJobService = {
  /**
   * Fetch paginated jobs with response metrics, dynamic filters, and search
   * @param {Object} params - { page, limit, search, status, category, postedBy, sortBy }
   */
  getEmployerJobs: async (params = {}) => {
    try {
      const response = await api.get('/company-panel/jobs-responses', { params });
      return response.data?.data || { items: [], pagination: { totalCount: 0, totalPages: 1 } };
    } catch (error) {
      console.error('Failed to fetch employer jobs:', error);
      throw error.response?.data || { message: 'Failed to fetch jobs' };
    }
  },

  /**
   * Fetch dynamic filter counts (statuses, categories, team posters)
   */
  getEmployerJobFilters: async () => {
    try {
      const response = await api.get('/company-panel/jobs-responses/filters');
      return response.data?.data || { totalJobs: 0, statuses: [], categories: [], posters: [] };
    } catch (error) {
      console.error('Failed to fetch job filters:', error);
      throw error.response?.data || { message: 'Failed to fetch filters' };
    }
  },

  /**
   * Fetch candidate applications / responses for a single job
   * @param {string} jobId
   * @param {Object} params - { page, limit, status, search }
   */
  getJobResponses: async (jobId, params = {}) => {
    try {
      const response = await api.get(`/company-panel/jobs-responses/${jobId}/responses`, { params });
      return response.data?.data || { job: null, responses: [], pagination: { totalCount: 0, totalPages: 1 } };
    } catch (error) {
      console.error(`Failed to fetch responses for job ${jobId}:`, error);
      throw error.response?.data || { message: 'Failed to fetch job responses' };
    }
  },

  /**
   * Fetch full job detail + insights + candidates for the dedicated tab page
   * @param {string} jobId
   */
  getJobDetailWithResponses: async (jobId) => {
    try {
      const response = await api.get(`/company-panel/jobs-responses/${jobId}/detail`);
      return response.data?.data || null;
    } catch (error) {
      console.error(`Failed to fetch full job detail for ${jobId}:`, error);
      throw error.response?.data || { message: 'Failed to fetch job details' };
    }
  },

  /**
   * Update candidate status on a job (SHORTLISTED, MAYBE, REJECTED) or callStatus (Called, Messaged, Not picked, Not reachable)
   * @param {string} jobId
   * @param {string} applicationId
   * @param {string} [status]
   * @param {string} [callStatus]
   */
  updateCandidateJobStatus: async (jobId, applicationId, status, callStatus) => {
    try {
      const payload = {};
      if (status) payload.status = status;
      if (callStatus) payload.callStatus = callStatus;
      const response = await api.patch(`/company-panel/jobs-responses/${jobId}/applications/${applicationId}/status`, payload);
      return response.data;
    } catch (error) {
      console.error(`Failed to update candidate status:`, error);
      throw error.response?.data || { message: 'Failed to update candidate status' };
    }
  },

  /**
   * Add a comment to a candidate application
   * @param {string} jobId
   * @param {string} applicationId
   * @param {string} text
   */
  addCandidateComment: async (jobId, applicationId, text) => {
    try {
      const response = await api.post(`/company-panel/jobs-responses/${jobId}/applications/${applicationId}/comments`, { text });
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Failed to add candidate comment:`, error);
      throw error.response?.data || { message: 'Failed to add comment' };
    }
  },

  /**
   * Close a single job
   * @param {string} jobId
   */
  closeEmployerJob: async (jobId) => {
    try {
      const response = await api.patch(`/company-panel/jobs-responses/${jobId}/close`);
      return response.data;
    } catch (error) {
      console.error(`Failed to close job ${jobId}:`, error);
      throw error.response?.data || { message: 'Failed to close job' };
    }
  },

  /**
   * Bulk close multiple jobs
   * @param {string[]} jobIds
   */
  bulkCloseJobs: async (jobIds = []) => {
    try {
      const response = await api.post('/company-panel/jobs-responses/bulk-close', { jobIds });
      return response.data;
    } catch (error) {
      console.error('Failed to bulk close jobs:', error);
      throw error.response?.data || { message: 'Failed to bulk close jobs' };
    }
  },

  /**
   * Bulk refresh / touch multiple jobs
   * @param {string[]} jobIds
   */
  bulkRefreshJobs: async (jobIds = []) => {
    try {
      const response = await api.post('/company-panel/jobs-responses/bulk-refresh', { jobIds });
      return response.data;
    } catch (error) {
      console.error('Failed to bulk refresh jobs:', error);
      throw error.response?.data || { message: 'Failed to bulk refresh jobs' };
    }
  },

  /**
   * Fetch the full profile of a candidate (for employer view)
   * @param {string} candidateId
   * @param {Object} [params] - { applicationId, jobId }
   */
  getCandidateFullProfile: async (candidateId, params = {}) => {
    try {
      const response = await api.get(`/company-panel/candidates/${candidateId}/full-profile`, { params });
      return response.data?.data || null;
    } catch (error) {
      console.error(`Failed to fetch full profile for candidate ${candidateId}:`, error);
      throw error.response?.data || { message: 'Failed to fetch candidate profile' };
    }
  },
};

export default employerJobService;
