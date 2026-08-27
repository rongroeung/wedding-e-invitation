import type { StoryItem } from "@/lib/db/schema";
import { Lotus } from "@/components/ui/Ornaments";
import { SectionTitle } from "@/components/ui/SectionTitle";

/** រឿងរ៉ាវស្នេហារបស់យើង — optional timeline. */
export function LoveStory({ items }: { items: StoryItem[] }) {
  if (items.length === 0) return null;

  return (
    <section id="story" className="section-pad relative">
      <div className="mx-auto max-w-3xl">
        <SectionTitle eyebrow="ដំណើរជីវិត" title="រឿងរ៉ាវស្នេហារបស់យើង" />

        <ol className="relative mx-auto max-w-2xl">
          <span
            className="absolute left-[11px] top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-champagne via-gold/60 to-transparent sm:left-1/2"
            aria-hidden="true"
          />
          {items.map((item, index) => (
            <li
              key={item.id}
              className={`reveal relative mb-8 pl-10 sm:mb-12 sm:w-1/2 sm:pl-0 ${
                index % 2 === 0 ? "sm:pr-12 sm:text-right" : "sm:ml-auto sm:pl-12 sm:text-left"
              }`}
            >
              <span
                className={`absolute left-0 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-ivory ring-1 ring-champagne sm:left-auto ${
                  index % 2 === 0 ? "sm:-right-3" : "sm:-left-3"
                }`}
                aria-hidden="true"
              >
                <Lotus className="h-3.5 w-3.5 text-gold" />
              </span>
              <p className="gold-text text-sm sm:text-base">{item.label}</p>
              <h3 className="mt-1 text-base leading-loose text-burgundy khmer-wrap sm:text-lg">
                {item.title}
              </h3>
              {item.description && (
                <p className="mt-1 text-sm leading-loose text-ink/70 khmer-wrap">
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
