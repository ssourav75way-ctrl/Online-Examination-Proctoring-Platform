import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { CONSTANTS } from "@/constants";
import { ROLE_NAVIGATION_MAP } from "@/constants/navigation";
import { useGetUnreadCountQuery } from "@/services/notificationApi";
import { useUpdateProfileMutation } from "@/services/userApi";
import { NotificationIcon } from "@/components/common/Icons";
import {
  InstitutionProvider,
  useInstitution,
} from "@/contexts/InstitutionContext";

function AppLayoutInner() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const effectiveRole = useSelector(
    (state: RootState) => state.auth.effectiveRole,
  );

  const {
    activeMembership,
    allMemberships,
    hasMultiple,
    switchInstitution,
    activeIndex,
  } = useInstitution();

  const [showInstitutionPicker, setShowInstitutionPicker] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem(CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);
    dispatch(logout());
  };

  const userRole =
    activeMembership?.role || effectiveRole || String(user?.globalRole || "");
  const navItems =
    ROLE_NAVIGATION_MAP[userRole] || ROLE_NAVIGATION_MAP["CANDIDATE"];

  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: CONSTANTS.POLLING_INTERVAL_MS,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });

  const unreadCount = unreadData?.data.unreadCount ?? 0;
  const [updateProfile] = useUpdateProfileMutation();

  // High-contrast: use local state + localStorage so it works instantly
  const [isHighContrast, setIsHighContrast] = useState(() => {
    const saved = localStorage.getItem("oep_high_contrast");
    if (saved !== null) return saved === "true";
    return user?.highContrastMode ?? false;
  });

  // Apply the class on mount and whenever the state changes
  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [isHighContrast]);

  const handleToggleContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem("oep_high_contrast", String(newValue));
    if (newValue) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    updateProfile({ highContrastMode: newValue }).catch(() => {});
  };

  // Screen reader mode: local state + localStorage
  const [isScreenReader, setIsScreenReader] = useState(() => {
    const saved = localStorage.getItem("oep_screen_reader");
    if (saved !== null) return saved === "true";
    return user?.screenReaderEnabled ?? false;
  });

  useEffect(() => {
    if (isScreenReader) {
      document.documentElement.classList.add("screen-reader-mode");
      document.documentElement.setAttribute("data-sr", "true");
    } else {
      document.documentElement.classList.remove("screen-reader-mode");
      document.documentElement.removeAttribute("data-sr");
    }
  }, [isScreenReader]);

  const handleToggleScreenReader = () => {
    const newValue = !isScreenReader;
    setIsScreenReader(newValue);
    localStorage.setItem("oep_screen_reader", String(newValue));
    if (newValue) {
      document.documentElement.classList.add("screen-reader-mode");
      document.documentElement.setAttribute("data-sr", "true");
    } else {
      document.documentElement.classList.remove("screen-reader-mode");
      document.documentElement.removeAttribute("data-sr");
    }
    updateProfile({ screenReaderEnabled: newValue }).catch(() => {});
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface shadow-soft z-10 hidden md:flex md:flex-col">
        <div className="flex h-16 items-center px-6 border-b border-border bg-primary-700">
          <span className="font-bold text-lg text-white tracking-wide">
            {CONSTANTS.APP_NAME}
          </span>
        </div>

        {/* Institution Switcher in Sidebar */}
        {activeMembership && (
          <div className="px-4 pt-4 pb-2">
            {hasMultiple ? (
              <div className="relative">
                <button
                  onClick={() =>
                    setShowInstitutionPicker(!showInstitutionPicker)
                  }
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-primary-50 border border-primary-200 rounded-xl text-left hover:bg-primary-100 transition-colors"
                >
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-wider text-primary-500">
                      {activeMembership.role}
                    </p>
                    <p className="text-xs font-bold text-primary-800 truncate">
                      {activeMembership.institution.name}
                    </p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-primary-500 shrink-0 transition-transform ${showInstitutionPicker ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showInstitutionPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {allMemberships.map((membership, idx) => (
                      <button
                        key={membership.institution.id}
                        onClick={() => {
                          switchInstitution(idx);
                          setShowInstitutionPicker(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-xs transition-colors ${
                          idx === activeIndex
                            ? "bg-primary-50 text-primary-700 font-bold"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <p className="font-bold truncate">
                          {membership.institution.name}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase">
                          {membership.role} &middot;{" "}
                          {membership.institution.code}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-3 py-2.5 bg-primary-50 border border-primary-200 rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-wider text-primary-500">
                  {activeMembership.role}
                </p>
                <p className="text-xs font-bold text-primary-800 truncate">
                  {activeMembership.institution.name}
                </p>
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-4 py-4 gap-2 flex flex-col">
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-text-main capitalize">
              {userRole.toLowerCase().replace("_", " ")} Portal
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-text-main">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-text-muted font-medium">
                {user?.email}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard/notifications")}
              className="relative inline-flex items-center justify-center h-9 w-9 rounded-full border border-border bg-surface hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <NotificationIcon className="w-4 h-4 text-text-muted" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 min-w-5 h-4 rounded-full bg-primary-600 text-[0.65rem] font-bold text-white shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* High Contrast Toggle */}
            <button
              type="button"
              onClick={handleToggleContrast}
              title={
                isHighContrast
                  ? "Disable high contrast"
                  : "Enable high contrast"
              }
              aria-label={
                isHighContrast
                  ? "Disable high contrast mode"
                  : "Enable high contrast mode"
              }
              className={`relative inline-flex items-center justify-center h-9 w-9 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isHighContrast
                  ? "bg-yellow-400 border-yellow-500 text-black"
                  : "border-border bg-surface hover:bg-primary-50 text-text-muted"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </button>

            {/* Screen Reader Toggle */}
            <button
              type="button"
              onClick={handleToggleScreenReader}
              title={
                isScreenReader
                  ? "Disable screen reader mode"
                  : "Enable screen reader mode"
              }
              aria-label={
                isScreenReader
                  ? "Disable screen reader optimizations"
                  : "Enable screen reader optimizations"
              }
              className={`relative inline-flex items-center justify-center h-9 w-9 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isScreenReader
                  ? "bg-indigo-500 border-indigo-600 text-white"
                  : "border-border bg-surface hover:bg-primary-50 text-text-muted"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>

            <div className="h-8 w-px bg-border"></div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors focus:outline-none p-2 -mr-2 md:p-0 md:mr-0"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function AppLayout() {
  return (
    <InstitutionProvider>
      <AppLayoutInner />
    </InstitutionProvider>
  );
}
