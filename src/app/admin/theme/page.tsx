import { ThemeForm } from "@/components/admin/ThemeForm";
import { getWedding } from "@/lib/queries";
import { pageWorkspace } from "@/lib/workspace";


export const dynamic = "force-dynamic";

export default async function AdminThemePage() {
  const weddingId = await pageWorkspace();
  if (!weddingId) return null;
  return <ThemeForm wedding={await getWedding(weddingId)} />;
}
