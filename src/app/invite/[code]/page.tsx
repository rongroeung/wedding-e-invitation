import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemeStyle } from "@/components/ThemeStyle";
import { InvitationPage } from "@/components/invitation/InvitationPage";
import { getGuestByCode, getGuestRsvpStatus, getInvitationData, getWedding } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  const [wedding, guest] = await Promise.all([getWedding(), getGuestByCode(decodeURIComponent(code))]);
  const title = `${wedding.title} | ${wedding.groomName} & ${wedding.brideName}`;
  return {
    title: guest ? `${title} — ${guest.title} ${guest.name}` : title,
    description: guest
      ? `សូមគោរពអញ្ជើញ ${guest.title} ${guest.name} • ${wedding.weddingDateKhmer}`
      : wedding.metaDescription,
  };
}

/** Personalised invitation: /invite/<code> */
export default async function GuestInvitation({ params }: Params) {
  const { code } = await params;
  const guest = await getGuestByCode(decodeURIComponent(code));
  if (!guest) notFound();

  const [data, rsvpStatus] = await Promise.all([
    getInvitationData(),
    getGuestRsvpStatus(guest.code),
  ]);
  return (
    <>
      <ThemeStyle wedding={data.wedding} />
      <InvitationPage data={data} guest={guest} rsvpStatus={rsvpStatus} />
    </>
  );
}
