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
        <p className="mb-3 text-xs text-gold-deep/80 sm:text-sm">{eyebrow}</p>
      )}
      <h2 className="gold-text text-2xl leading-relaxed khmer-wrap sm:text-3xl lg:text-4xl">{title}</h2>
      <GoldDivider className="mt-5" width="max-w-[220px]" />
      {subtitle && (
        <p className="mx-auto mt-5 max-w-xl text-sm leading-loose text-ink/75 khmer-wrap sm:text-base">
          {subtitle}
        </p>
      )}
    </header>
  );
}
