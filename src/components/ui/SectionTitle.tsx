import { GoldDivider } from "./Ornaments";

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="reveal mb-10 text-center sm:mb-14">
      {eyebrow && (
        <p className="mb-3 text-[0.7rem] text-gold-deep sm:text-xs">{eyebrow}</p>
      )}
      <h2 className="gold-text text-lg leading-[1.9] khmer-wrap sm:text-[1.35rem]">{title}</h2>
      <GoldDivider className="mt-5" width="max-w-[220px]" />
      {subtitle && (
        <p className="mx-auto mt-5 max-w-xl text-[0.85rem] leading-loose text-ink/85 khmer-wrap">
          {subtitle}
        </p>
      )}
    </header>
  );
}
