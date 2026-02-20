import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { ShieldIcon } from "@/components/common/Icons";

export default function AuthLayout() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {}
      <div className="hidden w-1/2 flex-col justify-center bg-primary-700 relative overflow-hidden px-16 text-white lg:flex">
        {}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid-pattern"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M0 40L40 0H20L0 20M40 40V20L20 40"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-xl mb-8 backdrop-blur-sm border border-white/20 shadow-xl">
            {}
            <ShieldIcon className="w-8 h-8 text-primary-50" />
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight leading-tight">
            Secure Online Exam Platform
          </h1>
          <p className="text-primary-100 text-lg leading-relaxed opacity-90">
            Enterprise-grade assessment suite featuring real-time proctoring,
            adaptive questioning, and secure execution environments.
          </p>
        </div>
      </div>

      {}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
