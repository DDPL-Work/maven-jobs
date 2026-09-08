import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import CrmLayout from "../layout/CrmLayout";
import AnalyticsPage from "../pages/AnalyticsPage";
import ApplicationsPage from "../pages/ApplicationsPage";
import ApprovalsPage from "../pages/ApprovalsPage";
import CandidatesPage from "../pages/CandidatesPage";
import ClientsPage from "../pages/ClientsPage";
import CrmDashboard from "../pages/CrmDashboard";
import JobsPage from "../pages/JobsPage";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import NotificationsPage from "../pages/NotificationsPage";
import PackagesPage from "../pages/PackagesPage";
import PaymentsPage from "../pages/PaymentsPage";
import ProtectedRoute from "./ProtectedRoute";
import QRCodesPage from "../pages/QRCodesPage";
import SettingsPage from "../pages/SettingsPage";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <CrmLayout />,
        children: [
          { index: true, element: <Navigate to="/crm/dashboard" replace /> },
          { path: "/crm/dashboard", element: <CrmDashboard /> },
          { path: "/crm/clients", element: <ClientsPage /> },
          { path: "/crm/jobs", element: <JobsPage /> },
          { path: "/crm/approvals", element: <ApprovalsPage /> },
          { path: "/crm/packages", element: <PackagesPage /> },
          { path: "/crm/qr-codes", element: <QRCodesPage /> },
          { path: "/crm/candidates", element: <CandidatesPage /> },
          { path: "/crm/applications", element: <ApplicationsPage /> },
          { path: "/crm/payments", element: <PaymentsPage /> },
          { path: "/crm/notifications", element: <NotificationsPage /> },
          { path: "/crm/analytics", element: <AnalyticsPage /> },
          { path: "/crm/settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
