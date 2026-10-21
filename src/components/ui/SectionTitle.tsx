import type { OrnamentRole } from "@/lib/designKit";
import { FlourishDivider } from "./Ornaments";

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  flourish = "title",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Which of the kit's title ornaments sits under this heading. */
  flourish?: OrnamentRole;
}) {
  return (
    <header className="reveal mb-10 text-center sm:mb-14">
      {eyebrow && (
        <p className="mb-3 text-xs text-gold-deep">{eyebrow}</p>
      )}
      <h2 className="gold-text text-[1.35rem] leading-[1.9] khmer-wrap">{title}</h2>
      <FlourishDivider role={flourish} width={150} className="mt-4" />
      {subtitle && (
        <p className="mx-auto mt-5 max-w-xl text-[0.85rem] leading-loose text-ink/85 khmer-wrap">
          {subtitle}
        </p>
      )}
    </header>
  );
}
