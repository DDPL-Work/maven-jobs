import api from "./api";

class AIService {
  constructor() {
    this.pendingRequests = new Map();
    this.cache = new Map();
    this.CACHE_TTL = 10 * 60 * 1000;
    this.REQUEST_TIMEOUT = 120000;
  }

  generateKey(endpoint, params) {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  getCached(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async request(endpoint, params, options = {}) {
    const { signal, useCache = true, onProgress } = options;
    const key = this.generateKey(endpoint, params);

    if (useCache) {
      const cached = this.getCached(key);
      if (cached) return cached;
    }

    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const controller = new AbortController();
    const combinedSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;

    const promise = api.post(`/ai${endpoint}`, params, {
      signal: combinedSignal,
    })
      .then((response) => {
        const data = response.data;
        if (data.success) {
          this.setCache(key, data.data);
          return data.data;
        }
        throw new Error(data.message || "AI request failed");
      })
      .catch((error) => {
        if (error.name === "CanceledError") throw error;
        const message = error.response?.data?.message || error.message || "AI request failed";
        throw new Error(message);
      })
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);

    if (onProgress) {
      onProgress("started");
    }

    return promise;
  }

  cancelRequest(endpoint, params) {
    const key = this.generateKey(endpoint, params);
    const promise = this.pendingRequests.get(key);
    if (promise && promise.cancel) {
      promise.cancel();
    }
  }

  cancelAll() {
    this.pendingRequests.forEach((promise) => {
      if (promise.cancel) promise.cancel();
    });
    this.pendingRequests.clear();
  }

  async getAIMatchScore(jobId, profileId) {
    return this.request("/match-score", { jobId, profileId });
  }

  async enhanceResume(profile, resumeText, section) {
    return this.request("/resume/enhance", { profile, resumeText, section });
  }

  async analyzeResumeATS(profile, resumeText) {
    return this.request("/resume/ats-score", { profile, resumeText });
  }

  async analyzeResume(profile, resumeText, mode) {
    return this.request("/resume/analyze", { profile, resumeText, mode });
  }

  async suggestSkills(profile, partialSkill) {
    return this.request("/skills/suggest", { profile, partialSkill });
  }

  async analyzeProfile(profile) {
    return this.request("/profile/analyze", { profile });
  }

  clearCache() {
    this.cache.clear();
  }
}

export const aiService = new AIService();