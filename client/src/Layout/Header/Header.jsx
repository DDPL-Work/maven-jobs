import { useState, useRef, useEffect } from "react";
import { LuBell, LuMenu, LuUser, LuSettings, LuLogOut } from "react-icons/lu";
import { getMyProfile } from "../../Redux/thunks/crmThunks";
import { logoutUser } from "../../Redux/thunks/authThunks";
import { clearProfile } from "../../Redux/slices/crmSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function Header({ toggleSidebar }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile } = useSelector((state) => state.crm);

  useEffect(() => {
    if (!profile) {
      dispatch(getMyProfile());
    }
  }, [dispatch, profile]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizeRole = (role) => {
    if (!role) return "";

    return role
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleLogout = async () => {
    dispatch(clearProfile());
    await dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <div className="h-16 bg-white shadow-sm flex items-center justify-between px-8 fixed top-0 left-0 right-0 z-30">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 transition"
        >
          <LuMenu size={22} />
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6 relative">
        {/* Notification */}
        <div className="relative cursor-pointer">
          <LuBell size={20} className="text-gray-600" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </div>

        {/* Profile */}
        <div ref={dropdownRef} className="relative cursor-pointer">
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3"
          >
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {profile?.fullName || "Loading..."}
              </p>
              <p className="text-xs text-gray-500">
                {normalizeRole(profile?.role)}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden">
              <img src="https://i.pravatar.cc/150?img=12" alt="profile" />
            </div>
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-fadeIn">
              <button className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 w-full text-left">
                <LuUser size={16} />
                View Profile
              </button>

              <button className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 w-full text-left">
                <LuSettings size={16} />
                Settings
              </button>

              <div className=" my-2"></div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left"
              >
                <LuLogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
