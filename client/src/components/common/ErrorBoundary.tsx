import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";
import { Button } from "@/components/common/Button";


export function ErrorBoundary() {
  const error = useRouteError();

  let errorMessage = "An unexpected error occurred.";
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {

    errorMessage = error.data?.message || error.statusText;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-6">
      <div className="card max-w-lg w-full p-8 text-center animate-in fade-in zoom-in-95 duration-200 shadow-xl border-border/50">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6 border-8 border-red-50">
          <svg
            className="h-10 w-10 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-text-main mb-2">
          {errorStatus === 404 ? "Page Not Found" : "Oops! Something broke."}
        </h1>
        <p className="text-text-muted text-lg mb-8 leading-relaxed">
          {errorStatus === 404
            ? "The page you are looking for doesn't exist or has been moved."
            : "We're sorry, but the application encountered an unexpected error. Our team has been notified."}
        </p>

        {errorStatus !== 404 && (
          <div className="bg-red-50 text-red-800 text-sm p-4 rounded-lg border border-red-200 mb-8 text-left overflow-x-auto font-mono">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-700 focus:ring-primary-500 px-4 py-3 sm:px-3 sm:py-1.5 text-base sm:text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
