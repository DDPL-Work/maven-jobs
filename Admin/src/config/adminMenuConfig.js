import {
  LuBookOpen,
  LuBriefcase,
  LuBuilding2,
  LuChartColumn,
  LuFileCheck2,
  LuLayoutDashboard,
  LuMonitorCog,
  LuSettings,
  LuShieldCheck,
  LuUserCog,
  LuUsers,
  LuWallet,
  LuLayers,
  LuPackage,
  LuReceipt,
  LuBadgePercent,
  LuHistory,
} from "react-icons/lu";

export const adminMenu = [
  { title: "Dashboard", path: "/admin/dashboard", icon: LuLayoutDashboard },
  { title: "Commercial Overview", path: "/admin/commercial/dashboard", icon: LuBadgePercent },
  { title: "Products & Offers", path: "/admin/commercial/products", icon: LuPackage },
  { title: "Plans & Builder", path: "/admin/commercial/plans", icon: LuLayers },
  { title: "Subscriptions", path: "/admin/commercial/subscriptions", icon: LuReceipt },
  { title: "Credit Ledger", path: "/admin/commercial/credit-ledger", icon: LuWallet },
  { title: "Commercial Audit Logs", path: "/admin/commercial/audit-logs", icon: LuHistory },
  { title: "User Management", path: "/admin/users", icon: LuUsers },
  { title: "Roles & Permissions", path: "/admin/roles", icon: LuShieldCheck },
  { title: "Client Companies", path: "/admin/companies", icon: LuBuilding2 },
  { title: "Job Postings", path: "/admin/jobs", icon: LuBriefcase },
  { title: "Candidates", path: "/admin/candidates", icon: LuUserCog },
  { title: "Applications", path: "/admin/applications", icon: LuFileCheck2 },
  { title: "Blogs", path: "/admin/blogs", icon: LuBookOpen },
  { title: "Payments", path: "/admin/payments", icon: LuWallet },
  { title: "Monitoring", path: "/admin/monitoring", icon: LuMonitorCog },
  { title: "Reports", path: "/admin/reports", icon: LuChartColumn },
  { title: "Settings", path: "/admin/settings", icon: LuSettings },
];

export function getAdminPageMeta(pathname = "") {
  const page =
    adminMenu.find(
      ({ path }) => pathname === path || pathname.startsWith(`${path}/`),
    ) || adminMenu[0];

  return {
    title: page.title,
    subtitle: "Centralized governance, monitoring, and role-based control.",
    panelLabel: "Admin Panel",
  };
}
