import { GiftManager } from "@/components/admin/GiftManager";
import { getWedding } from "@/lib/queries";
import { pageWorkspace } from "@/lib/workspace";


export const dynamic = "force-dynamic";

export default async function AdminGiftPage() {
  const weddingId = await pageWorkspace();
  if (!weddingId) return null;
  return <GiftManager wedding={await getWedding(weddingId)} />;
}
