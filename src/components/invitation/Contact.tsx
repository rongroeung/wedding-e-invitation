import type { Wedding } from "@/lib/db/schema";
import { FlourishDivider } from "@/components/ui/Ornaments";
import { SectionTitle } from "@/components/ui/SectionTitle";

function ContactCard({
  role,
  title,
  name,
  phone,
  action,
}: {
  role: string;
  title: string;
  name: string;
  phone: string;
  action: string;
}) {
  if (!phone) return null;
  return (
    <div className="reveal card-panel gold-border flex flex-col items-center rounded-2xl px-3 py-6 text-center sm:px-5 sm:py-7">
      <p className="text-xs text-gold-deep">{role}</p>
      <p className="mt-3 text-lg text-heading khmer-wrap">
        <span className="text-sm text-ink/75">{title} </span>
        {name}
      </p>
      <FlourishDivider role="fleuron" width={64} className="my-4" />
      <p className="mb-5 font-latin text-base tracking-wide text-ink/88 whitespace-nowrap">📞 {phone}</p>
      <a href={`tel:${phone.replace(/\s/g, "")}`} className="btn-gold mt-auto px-4 text-sm whitespace-nowrap">
        {action}
      </a>
    </div>
  );
}

/** ទំនាក់ទំនង — tap-to-call cards. */
export function Contact({ wedding }: { wedding: Wedding }) {
  if (!wedding.groomPhone && !wedding.bridePhone) return null;

  return (
    <section id="contact" className="section-pad relative">
      <div className="mx-auto max-w-3xl">
        <SectionTitle title="ទំនាក់ទំនង" />
        {/* the groom and the bride side by side, on one row, cards of equal height */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <ContactCard
            role="កូនប្រុស"
            title={wedding.groomTitle}
            name={wedding.groomFullName}
            phone={wedding.groomPhone}
            action="ទូរស័ព្ទទៅកូនប្រុស"
          />
          <ContactCard
            role="កូនស្រី"
            title={wedding.brideTitle}
            name={wedding.brideFullName}
            phone={wedding.bridePhone}
            action="ទូរស័ព្ទទៅកូនស្រី"
          />
        </div>
      </div>
    </section>
  );
}
