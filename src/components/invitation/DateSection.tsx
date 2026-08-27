import type { Wedding } from "@/lib/db/schema";
import { buddhistEra, formatKhmerDate, formatKhmerTime, formatLatinDate } from "@/lib/khmer";
import { GoldDivider, Lotus, PatternBackground } from "@/components/ui/Ornaments";
import { Countdown } from "./Countdown";

/** Wedding date, time and the live countdown. */
export function DateSection({ wedding }: { wedding: Wedding }) {
  const date = new Date(wedding.weddingDate);
  const khmerDate = wedding.weddingDateKhmer || formatKhmerDate(date);
  const khmerTime = wedding.weddingTimeKhmer || formatKhmerTime(date);
  const be = wedding.buddhistYear || buddhistEra(date);

  return (
    <section id="date" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-beige/35 to-transparent" />
      <PatternBackground pattern={wedding.pattern} />

      <div className="section-pad relative mx-auto max-w-3xl text-center">
        <p className="reveal text-xs text-gold-deep sm:text-sm">
          ថ្ងៃដ៏សិរីមង្គល
        </p>

        <div className="reveal mt-6">
          <Lotus className="mx-auto h-7 w-7 text-gold-dark" />
          <h2 className="gold-text mt-5 text-2xl leading-loose khmer-wrap sm:text-4xl">
            {khmerDate}
          </h2>
          <p className="mt-3 text-base leading-loose text-heading khmer-wrap sm:text-lg">
            {khmerTime}
          </p>
          <GoldDivider className="my-6" width="max-w-[200px]" />
          <p className="font-latin text-sm tracking-wide text-ink/75 sm:text-base">
            {formatLatinDate(date)}
          </p>
          <p className="mt-1 text-xs text-ink/75 sm:text-sm">{be}</p>
        </div>

        {wedding.showCountdown && <Countdown date={new Date(wedding.weddingDate).toISOString()} />}
      </div>
    </section>
  );
}
