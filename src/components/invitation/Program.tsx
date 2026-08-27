import type { WeddingEvent } from "@/lib/db/schema";
import { GoldDivider } from "@/components/ui/Ornaments";
import { SectionTitle } from "@/components/ui/SectionTitle";

/** កម្មវិធីសិរីមង្គលអាពាហ៍ពិពាហ៍ — grouped by the labels set in the dashboard. */
export function Program({ events }: { events: WeddingEvent[] }) {
  if (events.length === 0) return null;

  const groups = events.reduce<Record<string, { icon: string; items: WeddingEvent[] }>>(
    (acc, event) => {
      const key = event.groupName || "កម្មវិធី";
      acc[key] ??= { icon: event.groupIcon, items: [] };
      acc[key].items.push(event);
      return acc;
    },
    {},
  );

  return (
    <section id="program" className="section-pad relative">
      <div className="mx-auto max-w-3xl">
        <SectionTitle eyebrow="កម្មវិធី" title="កម្មវិធីសិរីមង្គលអាពាហ៍ពិពាហ៍" />

        <div className="space-y-12">
          {Object.entries(groups).map(([groupName, group]) => (
            <div key={groupName} className="reveal">
              <div className="mb-6 flex items-center justify-center gap-3">
                <span className="text-lg" aria-hidden="true">{group.icon}</span>
                <h3 className="text-base text-heading khmer-wrap sm:text-lg">{groupName}</h3>
              </div>
              <GoldDivider className="mb-8" width="max-w-[140px]" icon="none" />

              <ol className="relative space-y-4 border-l border-gold/45 pl-6 sm:pl-8">
                {group.items.map((event) => (
                  <li key={event.id} className="relative">
                    <span
                      className="absolute -left-[calc(1.5rem+5px)] top-5 h-2.5 w-2.5 rounded-full bg-gold-dark shadow-gold sm:-left-[calc(2rem+5px)]"
                      aria-hidden="true"
                    />
                    <div className="card-panel gold-border rounded-2xl px-5 py-4 transition-transform duration-500 hover:-translate-y-0.5 sm:px-6 sm:py-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="gold-solid text-sm font-medium sm:text-base">{event.timeLabel}</p>
                        {event.location && (
                          <p className="text-xs text-ink/75 khmer-wrap">{event.location}</p>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-loose text-heading khmer-wrap sm:text-base">
                        {event.icon && <span className="mr-2">{event.icon}</span>}
                        {event.title}
                      </p>
                      {event.description && (
                        <p className="mt-1 text-sm leading-loose text-ink/85 khmer-wrap">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
