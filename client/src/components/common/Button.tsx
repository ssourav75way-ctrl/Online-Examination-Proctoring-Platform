import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "../../utils/cn";


const buttonVariants: Record<
  "primary" | "secondary" | "danger" | "ghost",
  string
> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-700 focus:ring-primary-500",
  secondary:
    "bg-white text-text-main border border-border hover:bg-background active:bg-background focus:ring-primary-500",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-700 focus:ring-red-500",
  ghost:
    "bg-transparent text-text-main hover:bg-background active:bg-background focus:ring-border",
};

const buttonSizes: Record<"sm" | "md" | "lg", string> = {
  sm: "px-3 py-2 sm:px-2.5 sm:py-1 text-sm sm:text-xs",
  md: "px-4 py-3 sm:px-3 sm:py-1.5 text-base sm:text-sm",
  lg: "px-5 py-3.5 sm:px-4 sm:py-2 text-lg sm:text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          buttonVariants[variant],
          buttonSizes[size],
          className,
        )}
        {...props}
      >
        {}
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
