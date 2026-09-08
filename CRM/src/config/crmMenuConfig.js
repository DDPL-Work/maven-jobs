import {
  LuBadgePercent,
  LuBellRing,
  LuBriefcaseBusiness,
  LuBuilding2,
  LuChartColumnIncreasing,
  LuLayoutDashboard,
  LuQrCode,
  LuSettings,
  LuShieldCheck,
  LuUser,
  LuUsers,
  LuWallet,
} from "react-icons/lu";

export const crmMenu = [
  { title: "Dashboard", path: "/crm/dashboard", icon: LuLayoutDashboard },
  { title: "Client Accounts", path: "/crm/clients", icon: LuBuilding2 },
  { title: "Job Postings", path: "/crm/jobs", icon: LuBriefcaseBusiness },
  { title: "Approval Queue", path: "/crm/approvals", icon: LuShieldCheck },
  { title: "Packages", path: "/crm/packages", icon: LuBadgePercent },
  { title: "QR Management", path: "/crm/qr-codes", icon: LuQrCode },
  { title: "Candidates", path: "/crm/candidates", icon: LuUser },
  { title: "Applications", path: "/crm/applications", icon: LuUsers },
  { title: "Notifications", path: "/crm/notifications", icon: LuBellRing },
  { title: "Payments", path: "/crm/payments", icon: LuWallet },
  { title: "Analytics", path: "/crm/analytics", icon: LuChartColumnIncreasing },
  { title: "Settings", path: "/crm/settings", icon: LuSettings },
];

export function getCrmPageMeta(pathname = "") {
  const page =
    crmMenu.find(
      ({ path }) => pathname === path || pathname.startsWith(`${path}/`),
    ) || crmMenu[0];

  return {
    title: page.title,
    panelLabel: "CRM Panel",
  };
}
