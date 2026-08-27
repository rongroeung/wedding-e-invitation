import type { StoryItem } from "@/lib/db/schema";
import { Lotus } from "@/components/ui/Ornaments";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * រឿងរ៉ាវស្នេហារបស់យើង — optional timeline.
 *
 * A single column, never alternating sides. The card is a fixed ~560px measure
 * however wide the window is, so a two-sided timeline had entries colliding
 * across the spine on desktop — viewport breakpoints fire there while the
 * column stays narrow.
 */
export function LoveStory({ items }: { items: StoryItem[] }) {
  if (items.length === 0) return null;

  return (
    <section id="story" className="section-pad relative">
      <div className="mx-auto max-w-2xl">
        <SectionTitle eyebrow="ដំណើរជីវិត" title="រឿងរ៉ាវស្នេហារបស់យើង" />

        <ol className="relative mx-auto max-w-xl pl-9">
          <span
            className="absolute left-[11px] top-2 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-champagne via-gold/60 to-transparent"
            aria-hidden="true"
          />
          {items.map((item) => (
            <li key={item.id} className="reveal relative mb-9 last:mb-0">
              <span
                className="absolute -left-9 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ivory ring-1 ring-champagne"
                aria-hidden="true"
              >
                <Lotus className="h-3.5 w-3.5 text-gold-dark" />
              </span>
              <p className="gold-solid text-sm font-medium">{item.label}</p>
              <h3 className="mt-1 text-sm leading-loose text-heading khmer-wrap sm:text-base">
                {item.title}
              </h3>
              {item.description && (
                <p className="mt-1 text-[0.85rem] leading-loose text-ink/80 khmer-wrap">
                  {item.description}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
