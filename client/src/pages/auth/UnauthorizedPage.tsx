import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-red-500 to-orange-400"></div>
        <h1 className="text-6xl font-black text-slate-100 tracking-tighter">
          403
        </h1>
        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Unauthorized Access
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            You do not have the required permissions to view this secure area.
            Please return to your dashboard or sign in with a different account.
          </p>
        </div>
        <div className="flex justify-center mt-8 pt-4 border-t border-slate-100">
          <Link to="/dashboard" className="w-full">
            <Button variant="primary" className="w-full">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
