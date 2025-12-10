"use client";

import { classNames } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "bordered" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  style?: React.CSSProperties;
}

export function Card({
  children,
  className,
  variant = "default",
  padding = "md",
  hover = false,
  style,
}: CardProps) {
  const variantStyles = {
    default: "bg-white border border-slate-200/60",
    elevated: "bg-white shadow-soft-lg",
    bordered: "bg-white border-2 border-slate-200/80",
    glass: "bg-white/60 backdrop-blur-xl border border-white/40 shadow-soft",
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
        "rounded-2xl transition-all duration-300",
        variantStyles[variant],
        paddingStyles[padding],
        hover && "hover:shadow-soft-lg hover:-translate-y-0.5",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
