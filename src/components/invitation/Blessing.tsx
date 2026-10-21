import type { Wedding } from "@/lib/db/schema";
import { Flourish, FlourishDivider, PatternBackground } from "@/components/ui/Ornaments";

/** Closing blessing (ពរជ័យ) and signature. */
export function Blessing({ wedding }: { wedding: Wedding }) {
  return (
    <section id="blessing" className="relative overflow-hidden">
      <div className="section-glow absolute inset-0" aria-hidden="true" />
      <PatternBackground pattern={wedding.pattern} />

      <div className="section-pad relative mx-auto max-w-2xl text-center">
        <Flourish role="crest" className="reveal mx-auto max-w-[70%]" style={{ width: "calc(170px * var(--orn-crest-scale, 1))" }} />

        <p className="reveal mt-8 text-base leading-loose text-ink/92 khmer-wrap">
          {wedding.blessingThanks}
        </p>

        <FlourishDivider role="rule" width={220} className="my-8" />

        <p className="reveal text-base leading-loose text-ink/92 khmer-wrap">
          {wedding.blessingWish}
        </p>

        <div className="reveal mt-12">
          <p className="text-sm leading-loose text-ink/75 khmer-wrap">
            ដោយក្តីគោរព និងក្តីស្រឡាញ់ពី
          </p>
          <p className="gold-text mt-3 text-lg leading-loose khmer-wrap">
            {wedding.groomName} &amp; {wedding.brideName} ❤️
          </p>
        </div>
      </div>
    </section>
  );
}
