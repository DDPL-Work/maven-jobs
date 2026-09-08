import api from './api';

const applicationService = {
  createApplication: async (applicationData) => {
    try {
      const response = await api.post('/candidate/applications', applicationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Application failed' };
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
};

export default applicationService;
