"use client";

import { classNames } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "bordered" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className,
  variant = "default",
  padding = "md",
}: CardProps) {
  const variantStyles = {
    default: "bg-white border border-slate-200",
    elevated: "bg-white shadow-xl shadow-slate-200/50",
    bordered: "bg-white border-2 border-slate-200",
    glass: "bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl",
  };

  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={classNames(
        "rounded-2xl",
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}



