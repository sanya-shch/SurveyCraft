import { forwardRef, useId, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = "text", className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full space-y-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-xs transition-all focus:outline-hidden focus:ring-2 
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
            } ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
