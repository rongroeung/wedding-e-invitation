import { EnvelopeForm } from "@/components/admin/EnvelopeForm";
import { getWedding } from "@/lib/queries";
import { pageWorkspace } from "@/lib/workspace";


export const dynamic = "force-dynamic";

export default async function AdminEnvelopePage() {
  const weddingId = await pageWorkspace();
  if (!weddingId) return null;
  return <EnvelopeForm wedding={await getWedding(weddingId)} />;
}
