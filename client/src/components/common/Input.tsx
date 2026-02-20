import { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  helperText?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, error, leftIcon, rightIcon, helperText, label, id, ...props },
    ref,
  ) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text-main">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            id={id}
            ref={ref}
            className={cn(
              "w-full px-4 py-2 border rounded-lg bg-surface text-text-main transition-shadow",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              "disabled:opacity-50 disabled:bg-background",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error ? "border-red-500 focus:ring-red-500" : "border-border",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>

        {}
        {error && <p className="text-sm text-red-600 mt-0.5">{error}</p>}

        {helperText && !error && (
          <p className="text-sm text-text-muted mt-0.5">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
