import { NavLink } from "react-router-dom";
import logo from "../../assets/maven-logo.svg";
import { getSidebarMenuForRole } from "../../config/crmMenuConfig";
import { useSelector } from "react-redux";

export default function Sidebar({ isOpen, closeSidebar }) {
  const { profile } = useSelector((state) => state.crm);
  const authRole = useSelector((state) => state.auth.role);
  const sidebarMenu = getSidebarMenuForRole(profile?.role || authRole);

  const normalizeRole = (role) => {
    if (!role) return "";

    return role
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  const navClass =
    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all";

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-64 bg-[#173E7A] text-white shadow-xl transform transition-transform duration-300 z-40 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <img src={logo} alt="logo" />
      </div>

      {/* Navigation */}
      <div className="px-4 mt-6 space-y-2 overflow-y-auto h-[calc(100vh-160px)]">
        {sidebarMenu.map((item, index) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={index}
              to={item.path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `${navClass} ${
                  isActive ? "bg-lime-400 text-black" : "hover:bg-white/10"
                }`
              }
            >
              <Icon size={18} />
              {item.title}
            </NavLink>
          );
        })}
      </div>

      {/* Profile Section */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
          <div className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden">
            <img src="https://i.pravatar.cc/150?img=12" alt="profile" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {normalizeRole(profile?.role)}
            </p>
            <p className="text-xs text-gray-300">
              {profile?.state || profile?.department || "Lead Operations"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
