import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";

const Login = lazy(() => import("../pages/Login"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const AdminSection = lazy(() => import("../pages/AdminSection"));
const BlogEditorPage = lazy(() => import("../pages/BlogEditorPage"));
const BlogsPage = lazy(() => import("../pages/BlogsPage"));
const RolesPage = lazy(() => import("../pages/RolesPage"));
const UsersPage = lazy(() => import("../pages/UsersPage"));
const PaymentsPage = lazy(() => import("../pages/PaymentsPage"));
const NotFound = lazy(() => import("../pages/NotFound"));

function SuspenseSpinner() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center">
      <div className="rounded-[28px] border border-slate-200 bg-white px-8 py-7 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
          Loading...
        </p>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <Suspense fallback={<SuspenseSpinner />}>
        <Login />
      </Suspense>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          {
            path: "/admin/dashboard",
            element: (
              <Suspense fallback={<SuspenseSpinner />}>
                <AdminDashboard />
              </Suspense>
            ),
          },
          {
            path: "/admin/users",
            element: (
              <Suspense fallback={<SuspenseSpinner />}>
                <UsersPage />
              </Suspense>
            ),
          },
          {
            path: "/admin/roles",
            element: (
              <Suspense fallback={<SuspenseSpinner />}>
                <RolesPage />
              </Suspense>
            ),
          },
          {
            path: "/admin/companies",
            element: (
              <Suspense fallback={<SuspenseSpinner />}>
                <AdminSection />
              </Suspense>
            ),
          },
          {
            path: "/admin/jobs",
            element: (
              <Suspense fallback={<SuspenseSpinner />}>
                <AdminSection />
              </Suspense>
            ),
          },
          {
            path: "/admin/candidates",
            element: (
              <Suspense fallback={<SuspenseSpinner />}>
                <AdminSection />
              </Suspense>
            ),
          },
          {
            path: "/admin/applications",
            element: (
              <Suspense fallback={<SuspenseSpinner />}>
                <AdminSection />
              </Suspense>
            ),
          },
          {
            path: "/admin/payments",
            element: (
              <Suspense fallback={<SuspenseSpinner />}>
                <PaymentsPage />
              </Suspense>
            ),
          },
          {
            path: "/admin/blogs",
            element: (
              <Suspense fallback={<SuspenseSpinner />}>
                <BlogsPage />
              </Suspense>
            ),
          },
          {
            path: "/admin/blogs/new",
            element: (
              <Suspense fallback={<SuspenseSpinner />}>
                <BlogEditorPage />
              </Suspense>
            ),
          },
          {
            path: "/admin/blogs/:id/edit",
            element: (
              <Suspense fallback={<SuspenseSpinner />}>
                <BlogEditorPage />
              </Suspense>
            ),
          },
          {
            path: "/admin/monitoring",
            element: (
              <Suspense fallback={<SuspenseSpinner />}>
                <AdminSection />
              </Suspense>
            ),
          },
          {
            path: "/admin/reports",
            element: (
              <Suspense fallback={<SuspenseSpinner />}>
                <AdminSection />
              </Suspense>
            ),
          },
          {
            path: "/admin/settings",
            element: (
              <Suspense fallback={<SuspenseSpinner />}>
                <AdminSection />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<SuspenseSpinner />}>
        <NotFound />
      </Suspense>
    ),
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
