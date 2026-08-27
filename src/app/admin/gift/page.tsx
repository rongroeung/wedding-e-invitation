import { GiftManager } from "@/components/admin/GiftManager";
import { getWedding } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminGiftPage() {
  return <GiftManager wedding={await getWedding()} />;
}
