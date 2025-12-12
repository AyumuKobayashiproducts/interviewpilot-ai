"use client";

import { classNames } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  isLoading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary:
      "bg-[#635BFF] text-white hover:bg-[#4C46D4] focus:ring-[#635BFF]/40",
    secondary:
      "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-600/40",
    outline:
      "border border-[#E6EBF1] bg-white text-slate-800 hover:bg-slate-50 focus:ring-[#635BFF]/30",
    ghost:
      "text-slate-700 hover:bg-slate-50 focus:ring-slate-300/40",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600/40",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-3.5 py-2 text-sm gap-2",
    lg: "px-4 py-2.5 text-sm gap-2",
  };

  return (
    <button
      className={classNames(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
