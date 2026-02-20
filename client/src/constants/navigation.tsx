// Icon placeholders to satisfy strict SVG rules
const Icons = {
  Home: () => (
    <span className="bg-primary-100 text-primary-600 px-2 py-0.5 rounded text-xs font-bold font-mono border border-primary-200 shadow-sm mr-3">
      HM
    </span>
  ),
  Users: () => (
    <span className="bg-primary-100 text-primary-600 px-2 py-0.5 rounded text-xs font-bold font-mono border border-primary-200 shadow-sm mr-3">
      US
    </span>
  ),
  BookOpen: () => (
    <span className="bg-primary-100 text-primary-600 px-2 py-0.5 rounded text-xs font-bold font-mono border border-primary-200 shadow-sm mr-3">
      BK
    </span>
  ),
  FileText: () => (
    <span className="bg-primary-100 text-primary-600 px-2 py-0.5 rounded text-xs font-bold font-mono border border-primary-200 shadow-sm mr-3">
      FL
    </span>
  ),
  Settings: () => (
    <span className="bg-primary-100 text-primary-600 px-2 py-0.5 rounded text-xs font-bold font-mono border border-primary-200 shadow-sm mr-3">
      ST
    </span>
  ),
  ShieldAlert: () => (
    <span className="bg-primary-100 text-primary-600 px-2 py-0.5 rounded text-xs font-bold font-mono border border-primary-200 shadow-sm mr-3">
      SH
    </span>
  ),
};

type RoleMapItem = {
  path: string;
  label: string;
  icon: () => JSX.Element;
};

// Pure object map dictionary banning switch/nested-ifs for navigation rendering
export const ROLE_NAVIGATION_MAP: Record<string, RoleMapItem[]> = {
  SUPER_ADMIN: [
    { path: "/dashboard", label: "Overview", icon: Icons.Home },
    {
      path: "/dashboard/institutions",
      label: "Institutions",
      icon: Icons.Users,
    },
    {
      path: "/dashboard/users",
      label: "System Integrity",
      icon: Icons.Settings,
    },
  ],
  ADMIN: [
    { path: "/dashboard", label: "Overview", icon: Icons.Home },
    {
      path: "/dashboard/departments",
      label: "Departments",
      icon: Icons.BookOpen,
    },
    {
      path: "/dashboard/users",
      label: "User Management",
      icon: Icons.Users,
    },
  ],
  EXAMINER: [
    { path: "/dashboard", label: "Overview", icon: Icons.Home },
    {
      path: "/dashboard/questions",
      label: "Question Bank",
      icon: Icons.BookOpen,
    },
    {
      path: "/dashboard/exams",
      label: "Exam Management",
      icon: Icons.FileText,
    },
  ],
  PROCTOR: [
    { path: "/dashboard", label: "Proctor Queue", icon: Icons.ShieldAlert },
    { path: "/dashboard/sessions", label: "Live Sessions", icon: Icons.Users },
  ],
  CANDIDATE: [
    { path: "/dashboard", label: "My Exams", icon: Icons.FileText },
    {
      path: "/dashboard/history",
      label: "Results History",
      icon: Icons.BookOpen,
    },
    {
      path: "/dashboard/notifications",
      label: "Notifications",
      icon: Icons.Settings,
    },
  ],
};
