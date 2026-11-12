import type { Wedding } from "@/lib/db/schema";
import { mediaSrc } from "@/lib/media";
import { Flourish, Heart } from "@/components/ui/Ornaments";
import { SectionTitle } from "@/components/ui/SectionTitle";

/**
 * One of the couple: photo, role, and name. Groom and bride are drawn by the
 * same component at the same size, side by side on every screen, so neither
 * reads as first or larger. (Their parents are named in the formal wording of
 * the invitation, not repeated here.)
 */
function Person({ role, title, name, photo }: { role: string; title: string; name: string; photo: string }) {
  return (
    <article className="reveal min-w-0 text-center">
      <div className="couple-photo relative mx-auto">
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
                <Flourish role="rosette" className="w-[30%] opacity-60" />
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-5 text-xs text-gold-deep">{role}</p>
      <h3 className="couple-name mt-2 text-heading khmer-wrap">
        <span className="couple-title text-ink/75">{title} </span>
        {name}
      </h3>
    </article>
  );
}

export function Couple({ wedding }: { wedding: Wedding }) {
  return (
    <section id="couple" className="section-pad relative">
      <div className="mx-auto max-w-5xl">
        <SectionTitle eyebrow="គូស្វាមីភរិយាថ្មី" title="កូនប្រុស និង កូនស្រី" flourish="title-couple" />

        {/* groom | heart | bride — one row on every screen, two equal columns */}
        <div className="couple-row">
          <Person
            role="កូនប្រុស"
            title={wedding.groomTitle}
            name={wedding.groomFullName}
            photo={mediaSrc(wedding.groomPhotoId, wedding.groomPhotoUrl)}
          />

          {/* the heart from the couple's name mark, joining the two of them */}
          <div className="couple-and reveal flex justify-center" role="img" aria-label="និង">
            <Heart className="couple-heart h-full w-full" />
          </div>

          <Person
            role="កូនស្រី"
            title={wedding.brideTitle}
            name={wedding.brideFullName}
            photo={mediaSrc(wedding.bridePhotoId, wedding.bridePhotoUrl)}
          />
        </div>
      </div>
    </section>
  );
}
