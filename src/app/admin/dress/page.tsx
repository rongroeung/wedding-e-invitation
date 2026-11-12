import { DressColorsManager } from "@/components/admin/DressColorsManager";
import { getWedding } from "@/lib/queries";
import { pageWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function AdminDressPage() {
  const weddingId = await pageWorkspace();
  if (!weddingId) return null;
  return <DressColorsManager wedding={await getWedding(weddingId)} />;
}
