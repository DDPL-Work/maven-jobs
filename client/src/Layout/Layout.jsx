import { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar/Sidebar";
import Header from "./Header/Header";
import { Outlet } from "react-router-dom";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">

      {/* Sidebar */}
      <div ref={sidebarRef}>
        <Sidebar
          isOpen={isSidebarOpen}
          closeSidebar={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto px-6 pb-6 pt-24">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
