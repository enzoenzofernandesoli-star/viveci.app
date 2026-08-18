import { HTMLAttributes } from "react";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  id?: string;
  as?: "section" | "div";
}

export default function Section({
  id,
  as = "section",
  className = "",
  children,
  ...props
}: SectionProps) {
  const Tag = as;
  return (
    <Tag
      id={id}
      className={`py-24 md:py-32 ${className}`}
      {...props}
    >
      <div className="mx-auto max-w-container px-6 md:px-10">{children}</div>
    </Tag>
  );
}
