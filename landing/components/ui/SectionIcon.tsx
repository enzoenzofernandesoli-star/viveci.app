"use client";

import type { LucideIcon } from "lucide-react";

interface SectionIconProps {
  icon: LucideIcon;
  label: string;
}

export default function SectionIcon({ icon: Icon, label }: SectionIconProps) {
  return (
    <div
      aria-hidden="true"
      className="group relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface transition-all duration-300 hover:w-40 hover:border-action hover:bg-action"
    >
      <Icon
        className="h-5 w-5 shrink-0 scale-100 text-muted opacity-100 transition-all duration-300 group-hover:scale-0 group-hover:opacity-0"
        strokeWidth={1.75}
      />
      <span className="absolute scale-0 whitespace-nowrap text-xs font-medium uppercase tracking-wide text-ink opacity-0 transition-all delay-100 duration-300 group-hover:scale-100 group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}
