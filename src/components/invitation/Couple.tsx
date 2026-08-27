import type { Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { GoldDivider, Lotus, WeddingRings } from "@/components/ui/Ornaments";
import { SectionTitle } from "@/components/ui/SectionTitle";

function Person({
  role,
  title,
  name,
  father,
  mother,
  photo,
  align,
}: {
  role: string;
  title: string;
  name: string;
  father: string;
  mother: string;
  photo: string;
  align: "left" | "right";
}) {
  return (
    <article className="reveal flex-1 text-center">
      <div className="relative mx-auto h-44 w-44 sm:h-56 sm:w-56">
        <div className="absolute inset-0 rounded-full bg-gold-sheen p-[2px] shadow-gold">
          <div className="h-full w-full overflow-hidden rounded-full bg-cream">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cream to-beige">
                <Lotus className="h-14 w-14 text-gold/50" />
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-gold-deep/85">{role}</p>
      <h3 className="mt-3 text-xl text-burgundy khmer-wrap sm:text-2xl">
        <span className="text-base text-ink/60">{title} </span>
        {name}
      </h3>

      <GoldDivider className="my-5" width="max-w-[120px]" icon="diamond" />

      <p className="text-xs text-ink/60 khmer-wrap sm:text-sm">
        {align === "left" ? "កូនប្រុសរបស់" : "កូនស្រីរបស់"}
      </p>
      <p className="mt-2 text-sm leading-loose text-ink/85 khmer-wrap sm:text-base">{father}</p>
      <p className="text-xs text-ink/55">និង</p>
      <p className="text-sm leading-loose text-ink/85 khmer-wrap sm:text-base">{mother}</p>
    </article>
  );
}

export function Couple({ wedding }: { wedding: Wedding }) {
  return (
    <section id="couple" className="section-pad relative">
      <div className="mx-auto max-w-5xl">
        <SectionTitle eyebrow="គូស្វាមីភរិយាថ្មី" title="កូនប្រុស និង កូនស្រី" />

        <div className="flex flex-col items-center gap-12 sm:gap-10 md:flex-row md:items-start">
          <Person
            role="កូនប្រុស"
            title={wedding.groomTitle}
            name={wedding.groomFullName}
            father={wedding.groomFatherName}
            mother={wedding.groomMotherName}
            photo={mediaSrc(wedding.groomPhotoId, wedding.groomPhotoUrl)}
            align="left"
          />

          <div className="reveal flex shrink-0 flex-col items-center gap-3 self-center text-gold">
            <WeddingRings className="h-12 w-20" />
            <span className="font-latin text-sm italic text-gold-deep">និង</span>
          </div>

          <Person
            role="កូនស្រី"
            title={wedding.brideTitle}
            name={wedding.brideFullName}
            father={wedding.brideFatherName}
            mother={wedding.brideMotherName}
            photo={mediaSrc(wedding.bridePhotoId, wedding.bridePhotoUrl)}
            align="right"
          />
        </div>
      </div>
    </section>
  );
}
