import type { Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { Flourish, FlourishDivider, Heart } from "@/components/ui/Ornaments";
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
                <Flourish role="rosette" className="w-14 opacity-60" />
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-gold-deep">{role}</p>
      <h3 className="mt-3 text-lg text-heading khmer-wrap">
        <span className="text-base text-ink/75">{title} </span>
        {name}
      </h3>

      <FlourishDivider role="wing" width={44} className="my-5" />

      <p className="text-sm text-ink/75 khmer-wrap">
        {align === "left" ? "កូនប្រុសរបស់" : "កូនស្រីរបស់"}
      </p>
      <p className="mt-2 text-base leading-loose text-ink/95 khmer-wrap">{father}</p>
      <p className="text-xs text-ink/75">និង</p>
      <p className="text-base leading-loose text-ink/95 khmer-wrap">{mother}</p>
    </article>
  );
}

export function Couple({ wedding }: { wedding: Wedding }) {
  return (
    <section id="couple" className="section-pad relative">
      <div className="mx-auto max-w-5xl">
        <SectionTitle eyebrow="គូស្វាមីភរិយាថ្មី" title="កូនប្រុស និង កូនស្រី" flourish="title-couple" />

        <div className="flex flex-col items-center gap-12">
          <Person
            role="កូនប្រុស"
            title={wedding.groomTitle}
            name={wedding.groomFullName}
            father={wedding.groomFatherName}
            mother={wedding.groomMotherName}
            photo={mediaSrc(wedding.groomPhotoId, wedding.groomPhotoUrl)}
            align="left"
          />

          {/* the heart from the couple's name mark, joining the two of them */}
          <div className="reveal flex shrink-0 self-center" role="img" aria-label="និង">
            <Heart className="couple-heart h-9 w-9" />
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
