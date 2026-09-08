import {
  LuBellRing,
  LuBriefcaseBusiness,
  LuFileUser,
  LuLayoutDashboard,
  LuScrollText,
} from "react-icons/lu";

export const candidateMenu = [
  { title: "Dashboard", path: "/candidate/dashboard", icon: LuLayoutDashboard },
  { title: "Jobs", path: "/candidate/jobs", icon: LuBriefcaseBusiness },
  { title: "Applications", path: "/candidate/applications", icon: LuScrollText },
  { title: "Profile", path: "/candidate/profile", icon: LuFileUser },
  { title: "Notifications", path: "/candidate/notifications", icon: LuBellRing },
];

export function getCandidatePageMeta(pathname = "") {
  const page =
    candidateMenu.find(
      ({ path }) => pathname === path || pathname.startsWith(`${path}/`),
    ) || candidateMenu[0];

  return {
    title: page.title,
    panelLabel: "Candidate Panel",
  };
}
