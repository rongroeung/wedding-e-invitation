import type { Wedding } from "@/lib/db/schema";
import { PatternBackground } from "@/components/ui/Ornaments";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * The closing letters: សេចក្ដីថ្លែងអំណរគុណ (thanks) and លិខិតសូមអភ័យទោស
 * (an apology for any invitation not delivered in person or any name written
 * wrongly), in the couple's own words. A letter left
 * empty in admin is not shown. No signature follows them.
 */
export function Blessing({ wedding }: { wedding: Wedding }) {
  const thanks = wedding.thanksLetter.trim();
  const apology = wedding.apologyLetter.trim();
  return (
    <section id="blessing" className="relative overflow-hidden">
      <div className="section-glow absolute inset-0" aria-hidden="true" />
      <PatternBackground pattern={wedding.pattern} />

      <div className="section-pad relative mx-auto max-w-2xl text-center">
        {thanks && (
          <div className="reveal">
            <SectionTitle title="សេចក្ដីថ្លែងអំណរគុណ" />
            <p className="text-base leading-loose msg-ink khmer-wrap">{thanks}</p>
          </div>
        )}
        {apology && (
          <div className={`reveal ${thanks ? "mt-14" : ""}`}>
            <SectionTitle title="លិខិតសូមអភ័យទោស" />
            <p className="text-base leading-loose msg-ink khmer-wrap">{apology}</p>
          </div>
        )}

      </div>
    </section>
  );
}
