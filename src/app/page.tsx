import { ThemeStyle } from "@/components/ThemeStyle";
import { InvitationPage } from "@/components/invitation/InvitationPage";
import { getInvitationData } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Params = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Public invitation (no personalised guest name). */
export default async function Home({ searchParams }: Params) {
  const query = await searchParams;
  /*
   * The same two escapes the personalised page honours, and for the same
   * reason: both the skip link and the envelope's own tap target are plain
   * `<a href>`s, so that they still work when the page's JavaScript does not.
   * A server that ignored them would answer the tap with an identical page —
   * the envelope still shut — and the guest would be stuck in a loop of taps
   * that each reload the invitation they cannot reach.
   */
  const skipEnvelope = query.envelope === "skip" || query.envelope === "open";
  const data = await getInvitationData();
  return (
    <>
      <ThemeStyle wedding={data.wedding} />
      <InvitationPage data={data} guest={null} skipEnvelope={skipEnvelope} />
    </>
  );
}
