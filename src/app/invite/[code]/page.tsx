import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemeStyle } from "@/components/ThemeStyle";
import { FieldReport } from "@/components/invitation/FieldReport";
import { InvitationPage } from "@/components/invitation/InvitationPage";
import { getGuestByCode, getGuestRsvp, getInvitationData, getWedding } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Which build this is.
 *
 * Vercel sets the commit on every deployment; falling back to the build time
 * still tells a rebuild from a stale one. It is only ever shown behind
 * `?diag=1`, and it exists because "still broken" and "not deployed yet" look
 * exactly alike from the other end of a bug report.
 */
const BUILD =
  (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7) || new Date().toISOString().slice(0, 16);

export async function generateMetadata({ params }: Pick<Params, "params">): Promise<Metadata> {
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
export default async function GuestInvitation({ params, searchParams }: Params) {
  const { code } = await params;
  const query = await searchParams;
  const diag = query.diag === "1";
  const skipEnvelope = query.envelope === "skip";
  const guest = await getGuestByCode(decodeURIComponent(code));
  if (!guest) notFound();

  const [data, reply] = await Promise.all([getInvitationData(), getGuestRsvp(guest.code)]);
  const rsvpStatus = reply ? (reply.attending ? "attending" : "declined") : "pending";
  return (
    <>
      <ThemeStyle wedding={data.wedding} />
      {diag && <FieldReport build={BUILD} />}
      <InvitationPage
        data={data}
        guest={guest}
        rsvpStatus={rsvpStatus}
        skipEnvelope={skipEnvelope}
        rsvpReply={
          reply && {
            name: reply.name,
            attending: reply.attending,
            guestCount: reply.guestCount,
            message: reply.message,
          }
        }
      />
    </>
  );
}
