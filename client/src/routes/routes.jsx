// routes/routes.jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Unauthorized from "../pages/Auth/Unauthorized";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../Layout/Layout";
import Login from "../pages/Auth/Login";
import NotFound from "./NotFound";
import LeadGeneratorDashboard from "../pages/LeadGenerator/LeadGeneratorDashboard";
import AddLead from "../pages/LeadGenerator/AddLead";
import LeadGeneratorHome from "../pages/LeadGenerator/LeadGeneratorHome";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <LeadGeneratorHome /> },
          {
            element: (
              <ProtectedRoute
                allowedRoles={["LEAD_GENERATOR", "STATE_MANAGER", "APPROVER", "ADMIN"]}
              />
            ),
            children: [
              {
                path: "lead-generator/dashboard",
                element: <LeadGeneratorDashboard />,
              },
              {
                path: "lead-generator/add-lead",
                element: <AddLead />,
              },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
