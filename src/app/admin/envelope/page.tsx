import { EnvelopeForm } from "@/components/admin/EnvelopeForm";
import { getWedding } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminEnvelopePage() {
  return <EnvelopeForm wedding={await getWedding()} />;
}
