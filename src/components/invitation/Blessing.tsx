import type { Wedding } from "@/lib/db/schema";
import { GoldDivider, Lotus, PatternBackground } from "@/components/ui/Ornaments";

/** Closing blessing (ពរជ័យ) and signature. */
export function Blessing({ wedding }: { wedding: Wedding }) {
  return (
    <section id="blessing" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-beige/45" />
      <PatternBackground pattern={wedding.pattern} />

      <div className="section-pad relative mx-auto max-w-2xl text-center">
        <Lotus className="reveal mx-auto h-8 w-8 animate-floaty text-gold-dark" />

        <p className="reveal mt-8 text-base leading-loose text-ink/92 khmer-wrap">
          {wedding.blessingThanks}
        </p>

        <GoldDivider className="my-8" width="max-w-[180px]" />

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
