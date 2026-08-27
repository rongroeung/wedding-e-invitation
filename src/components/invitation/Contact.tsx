import type { Wedding } from "@/lib/db/schema";
import { GoldDivider } from "@/components/ui/Ornaments";
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
    <div className="reveal card-panel gold-border rounded-2xl px-5 py-7 text-center">
      <p className="text-xs text-gold-deep/85">{role}</p>
      <p className="mt-3 text-lg text-burgundy khmer-wrap">
        <span className="text-sm text-ink/60">{title} </span>
        {name}
      </p>
      <GoldDivider className="my-4" width="max-w-[100px]" icon="none" />
      <p className="font-latin text-base tracking-wide text-ink/75">📞 {phone}</p>
      <a href={`tel:${phone.replace(/\s/g, "")}`} className="btn-gold mt-5 text-sm">
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
        <SectionTitle eyebrow="ព័ត៌មានទំនាក់ទំនង" title="ទំនាក់ទំនង" />
        <div className="grid gap-4 sm:grid-cols-2">
          <ContactCard
            role="កូនប្រុស"
            title={wedding.groomTitle}
            name={wedding.groomName}
            phone={wedding.groomPhone}
            action="ទូរស័ព្ទទៅកូនប្រុស"
          />
          <ContactCard
            role="កូនស្រី"
            title={wedding.brideTitle}
            name={wedding.brideName}
            phone={wedding.bridePhone}
            action="ទូរស័ព្ទទៅកូនស្រី"
          />
        </div>
      </div>
    </section>
  );
}
