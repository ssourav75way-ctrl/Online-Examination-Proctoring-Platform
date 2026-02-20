import { Outlet, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { CONSTANTS } from "@/constants";
import { ROLE_NAVIGATION_MAP } from "@/constants/navigation";

/**
 * Main Application Layout for authenticated users.
 * Implements clean sidebar and top navigation.
 */
export default function AppLayout() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const effectiveRole = useSelector(
    (state: RootState) => state.auth.effectiveRole,
  );

  const handleLogout = () => {
    localStorage.removeItem(CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);
    dispatch(logout());
  };

  const userRole = effectiveRole || String(user?.globalRole || "");
  const navItems =
    ROLE_NAVIGATION_MAP[userRole] || ROLE_NAVIGATION_MAP["CANDIDATE"];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface shadow-soft z-10 hidden md:flex md:flex-col">
        <div className="flex h-16 items-center px-6 border-b border-border bg-primary-700">
          <span className="font-bold text-lg text-white tracking-wide">
            {CONSTANTS.APP_NAME}
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6 gap-2 flex flex-col">
          <p className="text-xs font-black tracking-wider text-text-muted mb-2 uppercase px-2">
            Navigation
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary-50 text-primary-700 shadow-sm border border-primary-100"
                    : "text-text-muted hover:bg-background hover:text-text-main"
                }`
              }
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-text-main capitalize">
              {userRole.toLowerCase().replace("_", " ")} Portal
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {user?.institutionMembers && user.institutionMembers.length > 0 && (
              <div className="hidden lg:flex flex-col items-end pr-6 border-r border-border">
                <span className="text-xs font-black uppercase tracking-widest text-primary-600">
                  {user.institutionMembers[0].role}
                </span>
                <span className="text-sm font-bold text-text-main truncate max-w-[200px]">
                  {user.institutionMembers[0].institution.name}
                </span>
              </div>
            )}

            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-text-main">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-text-muted font-medium">
                {user?.email}
              </span>
            </div>
            <div className="h-8 w-px bg-border"></div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors focus:outline-none p-2 -mr-2 md:p-0 md:mr-0"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
