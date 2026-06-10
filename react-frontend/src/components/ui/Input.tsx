import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = "text", className = "", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <input
          ref={ref}
          type={type}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm shadow-xs transition-all focus:outline-hidden focus:ring-2 
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
            } ${className}`}
          {...props}
        />
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
