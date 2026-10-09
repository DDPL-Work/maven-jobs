const API_ROOT =
  import.meta.env.VITE_ADMIN_API_URL || "http://localhost:5050/api/v1/admin";

const SESSION_KEY = "admin_panel_session";

const parseJsonSafely = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

export function getStoredSession() {
  const rawValue = sessionStorage.getItem(SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setStoredSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("admin-session-updated"));
}

export function clearStoredSession() {
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("admin-session-updated"));
}

export function getStoredAdmin() {
  return getStoredSession()?.user || null;
}

export function getStoredToken() {
  return getStoredSession()?.token || "";
}

let inFlightRefreshPromise = null;

async function refreshAuthSession() {
  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise;
  }

  inFlightRefreshPromise = (async () => {
    try {
      const response = await fetch(`${API_ROOT}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      const payload = await parseJsonSafely(response);

      if (!response.ok) {
        clearStoredSession();
        throw new Error(payload.message || "Session expired");
      }

      const newToken = payload.accessToken || payload.token;
      setStoredSession({
        token: newToken,
        user: payload.user,
      });

      return newToken;
    } finally {
      inFlightRefreshPromise = null;
    }
  })();

  return inFlightRefreshPromise;
}

export async function restoreStoredSession() {
  const token = await refreshAuthSession();
  const profile = await getAdminProfile();
  setStoredSession({
    token,
    user: profile.user,
  });
  return getStoredSession();
}

async function request(
  path,
  { method = "GET", body, auth = true, retryOnUnauthorized = true, tokenOverride = "" } = {},
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = tokenOverride || getStoredToken();

    if (!token) {
      const refreshedToken = await refreshAuthSession();
      headers.Authorization = `Bearer ${refreshedToken}`;
    } else {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_ROOT}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    if (auth && response.status === 401 && retryOnUnauthorized) {
      try {
        const refreshedToken = await refreshAuthSession();
        return request(path, {
          method,
          body,
          auth,
          retryOnUnauthorized: false,
          tokenOverride: refreshedToken,
        });
      } catch {
        clearStoredSession();
      }
    }

    if (auth && response.status === 401) {
      clearStoredSession();
    }

    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

export async function loginAdmin(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: credentials,
    auth: false,
  });
}

export async function logoutAdmin() {
  return request("/auth/logout", {
    method: "POST",
    auth: false,
  }).finally(clearStoredSession);
}

export async function getAdminProfile() {
  return request("/auth/me");
}

export async function getDashboardData() {
  return request("/dashboard");
}

export async function getSectionData(sectionKey) {
  return request(`/sections/${sectionKey}`);
}

export async function getUsersData() {
  return request("/users");
}

export async function createAdminUser(payload) {
  return request("/users", {
    method: "POST",
    body: payload,
  });
}

export async function updateAdminUser({ source, id, payload }) {
  return request(`/users/${source}/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteAdminUser({ source, id }) {
  return request(`/users/${source}/${id}`, {
    method: "DELETE",
  });
}

export async function getRolesData() {
  return request("/roles");
}

export async function createAdminRole(payload) {
  return request("/roles", {
    method: "POST",
    body: payload,
  });
}

export async function updateRolePermissions({ id, permissions }) {
  return request(`/roles/${id}/permissions`, {
    method: "PATCH",
    body: { permissions },
  });
}

export async function assignAdminRole({ id, source, userId }) {
  return request(`/roles/${id}/assign`, {
    method: "POST",
    body: { source, userId },
  });
}

export async function getBlogs(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.category) query.set("category", params.category);
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  if (params.search) query.set("search", params.search);

  const qs = query.toString();
  return request(`/blogs${qs ? `?${qs}` : ""}`);
}

export async function getBlogById(id) {
  return request(`/blogs/id/${id}`);
}

export async function createBlog(formData) {
  const token = getStoredToken();

  const response = await fetch(`${API_ROOT}/blogs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: formData,
  });

  const payload = await parseJsonSafely(response);
  if (!response.ok) throw new Error(payload.message || "Failed to create blog");
  return payload;
}

export async function updateBlog({ id, formData }) {
  const token = getStoredToken();

  const response = await fetch(`${API_ROOT}/blogs/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: formData,
  });

  const payload = await parseJsonSafely(response);
  if (!response.ok) throw new Error(payload.message || "Failed to update blog");
  return payload;
}

export async function deleteBlog(id) {
  return request(`/blogs/${id}`, { method: "DELETE" });
}

export async function toggleBlogStatus(id) {
  return request(`/blogs/${id}/toggle-status`, { method: "PATCH" });
}

export async function uploadBlogInlineImage(formData) {
  const token = getStoredToken();

  const response = await fetch(`${API_ROOT}/blogs/upload-inline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: formData,
  });

  const payload = await parseJsonSafely(response);
  if (!response.ok) throw new Error(payload.message || "Failed to upload image");
  return payload;
}

export async function getPayments(params = {}) {
  const query = new URLSearchParams();
  if (params.role) query.set("role", params.role);
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  const qs = query.toString();
  return request(`/payments${qs ? `?${qs}` : ""}`);
}

export async function getNotifications(page = 1, limit = 20) {
  return request(`/notifications?page=${page}&limit=${limit}`);
}

export async function markNotificationRead(id) {
  return request(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead() {
  return request("/notifications/read-all", {
    method: "PATCH",
  });
}

// ── Commercial Management APIs ──
export async function getCommercialDashboard() {
  return request("/commercial/dashboard");
}

export async function getCommercialProducts(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") query.set(k, v);
  });
  const qs = query.toString();
  return request(`/commercial/products${qs ? `?${qs}` : ""}`);
}

export async function getCommercialProductById(id) {
  return request(`/commercial/products/${id}`);
}

export async function createCommercialProduct(payload) {
  return request("/commercial/products", {
    method: "POST",
    body: payload,
  });
}

export async function updateCommercialProduct(id, payload) {
  return request(`/commercial/products/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function setCommercialProductStatus(id, status) {
  return request(`/commercial/products/${id}/status`, {
    method: "POST",
    body: { status },
  });
}

export async function deleteCommercialProduct(id) {
  return request(`/commercial/products/${id}`, {
    method: "DELETE",
  });
}

export async function getCommercialOffers(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") query.set(k, v);
  });
  const qs = query.toString();
  return request(`/commercial/offers${qs ? `?${qs}` : ""}`);
}

export async function createCommercialOffer(payload) {
  return request("/commercial/offers", {
    method: "POST",
    body: payload,
  });
}

export async function updateCommercialOffer(id, payload) {
  return request(`/commercial/offers/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteCommercialOffer(id) {
  return request(`/commercial/offers/${id}`, {
    method: "DELETE",
  });
}

export async function getCommercialPlans(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") query.set(k, v);
  });
  const qs = query.toString();
  return request(`/commercial/plans${qs ? `?${qs}` : ""}`);
}

export async function getCommercialPlanById(id) {
  return request(`/commercial/plans/${id}`);
}

export async function createCommercialPlan(payload) {
  return request("/commercial/plans", {
    method: "POST",
    body: payload,
  });
}

export async function updateCommercialPlan(id, payload) {
  return request(`/commercial/plans/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function setCommercialPlanStatus(id, status) {
  return request(`/commercial/plans/${id}/status`, {
    method: "POST",
    body: { status },
  });
}

export async function createCommercialPlanVersion(planId, payload) {
  return request(`/commercial/plans/${planId}/versions`, {
    method: "POST",
    body: payload,
  });
}

export async function updateCommercialPlanVersion(versionId, payload) {
  return request(`/commercial/versions/${versionId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function publishCommercialPlanVersion(planId, versionId) {
  return request(`/commercial/plans/${planId}/publish`, {
    method: "POST",
    body: { versionId },
  });
}

export async function getCommercialSubscriptions(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") query.set(k, v);
  });
  const qs = query.toString();
  return request(`/commercial/subscriptions${qs ? `?${qs}` : ""}`);
}

export async function getCommercialSubscriptionById(id) {
  return request(`/commercial/subscriptions/${id}`);
}

export async function getCommercialCreditLedger(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") query.set(k, v);
  });
  const qs = query.toString();
  return request(`/commercial/credit-ledger${qs ? `?${qs}` : ""}`);
}

export async function adjustCommercialCredit(payload) {
  return request("/commercial/credit-ledger/adjust", {
    method: "POST",
    body: payload,
  });
}

export async function getCommercialAuditLogs(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") query.set(k, v);
  });
  const qs = query.toString();
  return request(`/commercial/audit-logs${qs ? `?${qs}` : ""}`);
}

