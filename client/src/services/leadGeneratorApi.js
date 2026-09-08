import api from "./api";

export const getLeadGeneratorMeta = async () => {
  const { data } = await api.get("/lead-generator/meta");
  return data.data;
};

export const getLeadGeneratorDashboard = async () => {
  const { data } = await api.get("/lead-generator/dashboard");
  return data.data;
};

export const createLead = async (payload) => {
  const { data } = await api.post("/lead-generator/leads", payload);
  return data.data;
};
