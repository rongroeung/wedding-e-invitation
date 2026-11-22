import type { CSSProperties } from "react";
import { programIconSrc } from "@/lib/programIcons";

/** An event's icon: one of the agenda's own icons, filled with the given colour, or an emoji as typed. */
export function ProgramIcon({ icon, className = "" }: { icon: string; className?: string }) {
  if (!icon) return null;
  const src = programIconSrc(icon);
  if (!src) return <span className={className} aria-hidden="true">{icon}</span>;
  return (
    <span
      className={`program-icon ${className}`}
      style={{ "--pi": `url("${src}")` } as CSSProperties}
      aria-hidden="true"
    />
  );
}
