import api from "./api";

const commercialService = {
  // Public catalog fetching
  fetchPlans: async () => {
    try {
      const res = await api.get("/company-panel/commercial/plans");
      return res.data?.plans || [];
    } catch (err) {
      console.error("[commercialService] Failed to fetch plans:", err);
      return [];
    }
  },

  fetchOffers: async () => {
    try {
      const res = await api.get("/company-panel/commercial/offers");
      return res.data?.offers || [];
    } catch (err) {
      console.error("[commercialService] Failed to fetch offers:", err);
      return [];
    }
  },

  fetchProducts: async () => {
    try {
      const res = await api.get("/company-panel/commercial/products");
      return res.data?.products || [];
    } catch (err) {
      console.error("[commercialService] Failed to fetch products:", err);
      return [];
    }
  },

  // Authenticated company entitlements & live balances
  fetchEntitlements: async () => {
    try {
      const res = await api.get("/company-panel/commercial/entitlements");
      return res.data?.data || null;
    } catch (err) {
      // 401 or 403 means user is not logged in as employer, which is fine for browsing
      return null;
    }
  },

  // Purchase operations
  purchasePlan: async (payload) => {
    const res = await api.post("/company-panel/commercial/purchase-plan", payload);
    return res.data;
  },

  purchaseProductOffer: async (payload) => {
    const res = await api.post("/company-panel/commercial/purchase-product", payload);
    return res.data;
  },

  upgradePlan: async (payload) => {
    const res = await api.post("/company-panel/commercial/upgrade", payload);
    return res.data;
  },

  scheduleDowngrade: async (payload) => {
    const res = await api.post("/company-panel/commercial/downgrade", payload);
    return res.data;
  },

  renewPlan: async (payload) => {
    const res = await api.post("/company-panel/commercial/renew", payload);
    return res.data;
  },

  submitSalesInquiry: async (payload) => {
    const res = await api.post("/company-panel/commercial/contact-sales", payload);
    return res.data;
  },
};

export default commercialService;
