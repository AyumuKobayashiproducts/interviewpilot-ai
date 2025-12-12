"use client";

import { classNames } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={classNames(
            "w-full px-3 py-2 rounded-md border text-sm",
            "bg-white",
            "placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF]",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/30"
              : "border-[#E6EBF1] hover:border-slate-300",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";











