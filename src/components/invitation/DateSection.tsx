import type { Wedding } from "@/lib/db/schema";
import { buddhistEra, formatKhmerDate, formatKhmerTime } from "@/lib/khmer";
import { Flourish, FlourishDivider, PatternBackground } from "@/components/ui/Ornaments";
import { Countdown } from "./Countdown";

/** Wedding date, time and the live countdown. */
export function DateSection({ wedding }: { wedding: Wedding }) {
  const date = new Date(wedding.weddingDate);
  const khmerDate = wedding.weddingDateKhmer || formatKhmerDate(date);
  const khmerTime = wedding.weddingTimeKhmer || formatKhmerTime(date);
  const be = wedding.buddhistYear || buddhistEra(date);

  return (
    <section id="date" className="relative overflow-hidden">
      <div className="section-glow absolute inset-0" aria-hidden="true" />
      <PatternBackground pattern={wedding.pattern} />

      <div className="section-pad relative mx-auto max-w-3xl text-center">
        <p className="reveal date-eyebrow text-sm text-gold-deep">
          ថ្ងៃដ៏សិរីមង្គល
        </p>

        <div className="reveal mt-6">
          <Flourish role="fleuron" className="mx-auto w-14" />
          <h2 className="gold-text foil-text mt-5 text-[1.35rem] leading-loose khmer-wrap">
            {khmerDate}
          </h2>
          <p className="mt-3 text-base leading-loose text-heading khmer-wrap">
            {khmerTime}
          </p>
          <FlourishDivider role="rule" width={260} className="my-6" />
          <p className="text-sm text-ink/80 khmer-wrap">{be}</p>
        </div>

        {wedding.showCountdown && <Countdown date={new Date(wedding.weddingDate).toISOString()} />}
      </div>
    </section>
  );
}
