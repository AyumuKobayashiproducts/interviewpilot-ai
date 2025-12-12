"use client";

import { classNames } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "muted";
  padding?: "none" | "sm" | "md" | "lg";
  inset?: boolean;
  header?: ReactNode;
}

export function Card({
  children,
  className,
  variant = "default",
  padding = "md",
  inset = false,
  header,
}: CardProps) {
  const variantStyles = {
    default: "bg-white border border-[#E6EBF1]",
    muted: "bg-[#F6F9FC] border border-[#E6EBF1]",
  };

  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <section
      className={classNames(
        "rounded-lg",
        inset ? "" : "shadow-sm",
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
    >
      {header && (
        <header className="mb-3 flex items-center justify-between">
          {header}
        </header>
      )}
      {children}
    </section>
  );
}
