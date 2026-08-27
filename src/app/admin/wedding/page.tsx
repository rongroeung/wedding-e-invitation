import { WeddingForm } from "@/components/admin/WeddingForm";
import { getWedding } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminWeddingPage() {
  const wedding = await getWedding();
  return <WeddingForm wedding={wedding} />;
}
