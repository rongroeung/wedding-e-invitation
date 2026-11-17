import type { Wedding } from "@/lib/db/schema";
import { PatternBackground } from "@/components/ui/Ornaments";
import { Countdown } from "./Countdown";

/**
 * The live countdown to the wedding. The date, time and Buddhist-era year
 * that used to head this section (ថ្ងៃដ៏សិរីមង្គល) are left out: the letter
 * above already states them, so the section is the countdown alone, and it
 * is not drawn at all when the countdown is switched off.
 */
export function DateSection({ wedding }: { wedding: Wedding }) {
  if (!wedding.showCountdown) return null;

  return (
    <section id="date" className="relative overflow-hidden">
      <div className="section-glow absolute inset-0" aria-hidden="true" />
      <PatternBackground pattern={wedding.pattern} />

      <div className="section-pad relative mx-auto max-w-3xl text-center">
        <Countdown date={new Date(wedding.weddingDate).toISOString()} />
      </div>
    </section>
  );
}
