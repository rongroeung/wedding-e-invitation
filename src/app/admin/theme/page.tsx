import { ThemeForm } from "@/components/admin/ThemeForm";
import { getWedding } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminThemePage() {
  return <ThemeForm wedding={await getWedding()} />;
}
