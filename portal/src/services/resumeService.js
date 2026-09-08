import api from "./api";

const resumeService = {
  async enhanceWithAI({ section, content, context }) {
    const res = await api.post("/candidate/resume/enhance", { section, content, context });
    return res.data;
  },
  async analyzeATS(resume) {
    const res = await api.post("/candidate/resume/ats-score", { resume });
    return res.data;
  },
  async analyzeResume({ mode, resume, content }) {
    const res = await api.post("/candidate/resume/analyze", { mode, resume, content });
    return res.data;
  },
};

export default resumeService;
