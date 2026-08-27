import { ThemeStyle } from "@/components/ThemeStyle";
import { InvitationPage } from "@/components/invitation/InvitationPage";
import { getInvitationData } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Public invitation (no personalised guest name). */
export default async function Home() {
  const data = await getInvitationData();
  return (
    <>
      <ThemeStyle wedding={data.wedding} />
      <InvitationPage data={data} guest={null} />
    </>
  );
}
