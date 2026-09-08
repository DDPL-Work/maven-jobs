const permissionActions = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "export",
];

const permissionDomains = [
  "users",
  "roles",
  "companies",
  "jobs",
  "candidates",
  "applications",
  "reports",
  "settings",
];

const buildPermissionPreset = (type = "custom") => {
  const base = Object.fromEntries(
    permissionDomains.map((domain) => [
      domain,
      Object.fromEntries(permissionActions.map((action) => [action, false])),
    ]),
  );

  if (type === "admin") {
    return Object.fromEntries(
      permissionDomains.map((domain) => [
        domain,
        Object.fromEntries(permissionActions.map((action) => [action, true])),
      ]),
    );
  }

  if (type === "crm") {
    return {
      ...base,
      companies: {
        view: true,
        create: true,
        edit: true,
        delete: false,
        approve: false,
        export: true,
      },
      jobs: {
        view: true,
        create: true,
        edit: true,
        delete: false,
        approve: true,
        export: true,
      },
      candidates: {
        view: true,
        create: false,
        edit: true,
        delete: false,
        approve: false,
        export: true,
      },
      applications: {
        view: true,
        create: false,
        edit: true,
        delete: false,
        approve: true,
        export: true,
      },
      reports: {
        view: true,
        create: false,
        edit: false,
        delete: false,
        approve: false,
        export: true,
      },
    };
  }

  if (type === "fse") {
    return {
      ...base,
      companies: {
        view: true,
        create: true,
        edit: true,
        delete: false,
        approve: false,
        export: false,
      },
      users: {
        view: true,
        create: false,
        edit: false,
        delete: false,
        approve: false,
        export: false,
      },
      jobs: {
        view: true,
        create: false,
        edit: false,
        delete: false,
        approve: false,
        export: false,
      },
    };
  }

  if (type === "client") {
    return {
      ...base,
      jobs: {
        view: true,
        create: true,
        edit: true,
        delete: false,
        approve: false,
        export: false,
      },
      applications: {
        view: true,
        create: false,
        edit: true,
        delete: false,
        approve: false,
        export: true,
      },
    };
  }

  if (type === "candidate") {
    return {
      ...base,
      jobs: {
        view: true,
        create: false,
        edit: false,
        delete: false,
        approve: false,
        export: false,
      },
      applications: {
        view: true,
        create: true,
        edit: false,
        delete: false,
        approve: false,
        export: false,
      },
    };
  }

  return base;
};

const defaultAdminRoles = [
  {
    name: "Admin",
    code: "ADMIN",
    scope: "Global",
    description: "Full platform governance, user control, reporting, and oversight.",
    isSystemRole: true,
    systemRoleKey: "ADMIN",
    permissions: buildPermissionPreset("admin"),
  },
  {
    name: "CRM",
    code: "CRM",
    scope: "Operational",
    description: "Owns client delivery, job approvals, and operational analytics.",
    isSystemRole: true,
    systemRoleKey: "CRM",
    permissions: buildPermissionPreset("crm"),
  },
  {
    name: "FSE",
    code: "FSE",
    scope: "Regional",
    description: "Field acquisition and territory-level account movement.",
    isSystemRole: true,
    systemRoleKey: "FSE",
    permissions: buildPermissionPreset("fse"),
  },
  {
    name: "Client",
    code: "CLIENT",
    scope: "Workspace",
    description: "Client-side account with scoped job and application visibility.",
    isSystemRole: true,
    systemRoleKey: "CLIENT",
    permissions: buildPermissionPreset("client"),
  },
  {
    name: "Candidate",
    code: "CANDIDATE",
    scope: "Individual",
    description: "Candidate-facing access to jobs, applications, and progress tracking.",
    isSystemRole: true,
    systemRoleKey: "CANDIDATE",
    permissions: buildPermissionPreset("candidate"),
  },
];

const defaultAdminSettings = [
  {
    module: "authentication",
    title: "Authentication policy",
    owner: "Security Admin",
    risk: "Low",
    currentState: "Strict",
    description: "MFA plus session timeout enabled.",
    value: { mfaRequired: true, sessionTimeoutMinutes: 45, passwordRotationDays: 90 },
  },
  {
    module: "notifications",
    title: "Notification routing",
    owner: "Admin Ops",
    risk: "Low",
    currentState: "Live",
    description: "Escalation alerts routed by role ownership.",
    value: { escalationChannels: ["email", "dashboard"], notifyAdmins: true },
  },
  {
    module: "workflow",
    title: "Job approval workflow",
    owner: "CRM Lead",
    risk: "Medium",
    currentState: "3-tier",
    description: "Client, CRM, and Admin checkpoints active.",
    value: { stages: ["client", "crm", "admin"], autoEscalationHours: 24 },
  },
  {
    module: "retention",
    title: "Data retention",
    owner: "Compliance",
    risk: "Medium",
    currentState: "90 days",
    description: "Retention window for exported operational data.",
    value: { retentionDays: 90, archiveEnabled: true },
  },
];

const normalizeCrmDisplayRole = (role) => {
  if (role === "ADMIN") {
    return "ADMIN";
  }

  if (role === "FSE") {
    return "FSE";
  }

  return "CRM";
};

const normalizeDisplayRole = (doc, source) => {
  if (source === "CRM") {
    return normalizeCrmDisplayRole(doc.role);
  }

  return doc.role;
};

const normalizeAccessStatus = (doc) => {
  if (doc.accessStatus) {
    return doc.accessStatus;
  }

  return doc.isActive ? "ACTIVE" : "RESTRICTED";
};

const mapDisplayRoleToCrmRole = (displayRole) => {
  if (displayRole === "ADMIN") {
    return "ADMIN";
  }

  if (displayRole === "FSE") {
    return "FSE";
  }

  return "APPROVER";
};

module.exports = {
  buildPermissionPreset,
  defaultAdminRoles,
  defaultAdminSettings,
  normalizeDisplayRole,
  normalizeAccessStatus,
  mapDisplayRoleToCrmRole,
  permissionActions,
  permissionDomains,
};
