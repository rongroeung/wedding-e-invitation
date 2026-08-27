import { MusicForm } from "@/components/admin/MusicForm";
import { getWedding } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminMusicPage() {
  return <MusicForm wedding={await getWedding()} />;
}
