import { MusicForm } from "@/components/admin/MusicForm";
import { getWedding } from "@/lib/queries";
import { pageWorkspace } from "@/lib/workspace";


export const dynamic = "force-dynamic";

export default async function AdminMusicPage() {
  const weddingId = await pageWorkspace();
  if (!weddingId) return null;
  return <MusicForm wedding={await getWedding(weddingId)} />;
}
