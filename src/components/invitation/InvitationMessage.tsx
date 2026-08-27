import type { Guest, Wedding } from "@/lib/db/schema";
import { GoldDivider, Lotus, OrnateFrame } from "@/components/ui/Ornaments";

/** The formal invitation wording (សិរីមង្គលអាពាហ៍ពិពាហ៍). */
export function InvitationMessage({
  wedding,
  guest,
}: {
  wedding: Wedding;
  guest: Guest | null;
}) {
  return (
    <section id="invitation" className="section-pad relative">
      <div className="mx-auto max-w-3xl">
        <div className="reveal card-panel gold-border relative overflow-hidden rounded-[26px] px-6 py-14 text-center sm:px-12">
          <OrnateFrame />
          <div className="relative">
            <Lotus className="mx-auto h-7 w-7 text-gold" />

            <h2 className="gold-text mt-6 text-2xl leading-loose khmer-wrap sm:text-3xl">
              {wedding.title}
            </h2>

            <GoldDivider className="my-8" width="max-w-[200px]" />

            <p className="text-sm leading-loose text-ink/80 khmer-wrap sm:text-base">
              {wedding.invitationIntro}
            </p>

            {guest ? (
              <p className="mt-6 text-lg leading-loose text-burgundy khmer-wrap sm:text-xl">
                {guest.title} {guest.name}
              </p>
            ) : (
              <p className="mt-6 text-base leading-loose text-burgundy khmer-wrap sm:text-lg">
                {wedding.invitationHonorific}
              </p>
            )}

            <p className="mt-6 text-sm leading-loose text-ink/80 khmer-wrap sm:text-base">
              {wedding.invitationBody}
            </p>

            <div className="my-8 space-y-2">
              <p className="text-xl text-burgundy khmer-wrap sm:text-2xl">
                <span className="text-base text-ink/60 sm:text-lg">{wedding.groomTitle} </span>
                {wedding.groomFullName}
              </p>
              <p className="font-latin text-sm italic text-gold-deep/80">និង</p>
              <p className="text-xl text-burgundy khmer-wrap sm:text-2xl">
                <span className="text-base text-ink/60 sm:text-lg">{wedding.brideTitle} </span>
                {wedding.brideFullName}
              </p>
            </div>

            <GoldDivider className="my-8" width="max-w-[160px]" icon="diamond" />

            <p className="mx-auto max-w-xl text-sm leading-loose text-ink/80 khmer-wrap sm:text-base">
              {wedding.invitationClosing}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
