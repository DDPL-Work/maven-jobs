import api from './api';

const userManagementService = {
  // Users
  getUsers: async () => {
    try {
      const response = await api.get('/company-panel/user-management/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post('/company-panel/user-management/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create user' };
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/company-panel/user-management/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user' };
    }
  },

  deleteUsers: async (ids) => {
    try {
      const response = await api.post('/company-panel/user-management/users/bulk-delete', { ids });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete users' };
    }
  },

  changePassword: async (id, newPassword) => {
    try {
      const response = await api.put(`/company-panel/user-management/users/${id}/password`, { newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update password' };
    }
  },

  updateRestrictions: async (data) => {
    try {
      const response = await api.put('/company-panel/user-management/users/time-restrictions', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update restrictions' };
    }
  },

  // Domains
  getDomains: async () => {
    try {
      const response = await api.get('/company-panel/user-management/domains');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch domains' };
    }
  },

  addDomain: async (domain, domainToken) => {
    try {
      const response = await api.post('/company-panel/user-management/domains', { domain, domainToken });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add domain' };
    }
  },

  editDomain: async (oldDomain, newDomain, domainToken) => {
    try {
      const response = await api.put('/company-panel/user-management/domains', { oldDomain, newDomain, domainToken });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to edit domain' };
    }
  },

  deleteDomain: async (domain, domainToken) => {
    try {
      const response = await api.delete('/company-panel/user-management/domains', { params: { domain, domainToken } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete domain' };
    }
  },

  sendDomainOtp: async (method) => {
    try {
      const response = await api.post('/company-panel/user-management/domains/otp', { method });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send OTP' };
    }
  },

  verifyDomainOtp: async (sessionId, otp) => {
    try {
      const response = await api.post('/company-panel/user-management/domains/verify-otp', { sessionId, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify OTP' };
    }
  },

  // Security Settings
  getSecuritySettings: async () => {
    try {
      const response = await api.get('/company-panel/user-management/security-settings');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch security settings' };
    }
  },

  updateSecuritySettings: async (settings) => {
    try {
      const response = await api.put('/company-panel/user-management/security-settings', settings);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update security settings' };
    }
  },

  // Product Settings
  getProductSettings: async () => {
    try {
      const response = await api.get('/company-panel/product-settings');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch product settings' };
    }
  },

  updateProductSettings: async (settings) => {
    try {
      const response = await api.put('/company-panel/product-settings', settings);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update product settings' };
    }
  },

  resetSubusersResdexLogin: async () => {
    try {
      const response = await api.post('/company-panel/product-settings/reset-resdex-logins');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reset subusers login' };
    }
  }
};

export default userManagementService;
