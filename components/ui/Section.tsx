"use client";

import { classNames } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  centered?: boolean;
}

export function Section({
  children,
  className,
  title,
  subtitle,
  centered = false,
}: SectionProps) {
  return (
    <section
      className={classNames(
        "py-8 md:py-12",
        centered && "text-center",
        className
      )}
    >
      {(title || subtitle) && (
        <div className={classNames("mb-8", centered && "mx-auto max-w-2xl")}>
          {title && (
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg text-slate-600">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}



