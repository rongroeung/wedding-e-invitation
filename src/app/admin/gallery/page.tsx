import { asc, eq } from "drizzle-orm";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { getDb } from "@/lib/db";
import { galleryImages } from "@/lib/db/schema";
import { pageWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const weddingId = await pageWorkspace();
  if (!weddingId) return null;
  const db = await getDb();
  const images = await db.select().from(galleryImages).where(eq(galleryImages.weddingId, weddingId)).orderBy(asc(galleryImages.sortOrder));
  return <GalleryManager images={images} />;
}
