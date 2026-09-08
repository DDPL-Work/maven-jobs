import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminHeader from "../components/AdminHeader";
import AdminSidebar from "../components/AdminSidebar";

const DESKTOP_BREAKPOINT = "(min-width: 768px)";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(DESKTOP_BREAKPOINT).matches
      : false,
  );
  const { pathname } = useLocation();

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_BREAKPOINT);
    const syncViewport = (event) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  }, [isDesktop, pathname]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = !isDesktop && isSidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isDesktop, isSidebarOpen]);

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <AdminSidebar
        isOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
        shouldCloseOnNavigate={!isDesktop}
      />

      <div
        className={`transition-all duration-300 ${
          isSidebarOpen && isDesktop ? "md:pl-72" : ""
        }`}
      >
        <AdminHeader toggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

