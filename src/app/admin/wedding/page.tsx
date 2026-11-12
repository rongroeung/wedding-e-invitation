import { WeddingForm } from "@/components/admin/WeddingForm";
import { getWedding } from "@/lib/queries";
import { pageWorkspace } from "@/lib/workspace";


export const dynamic = "force-dynamic";

export default async function AdminWeddingPage() {
  const weddingId = await pageWorkspace();
  if (!weddingId) return null;
  const wedding = await getWedding(weddingId);
  return <WeddingForm wedding={wedding} />;
}
