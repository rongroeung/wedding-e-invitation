import { asc } from "drizzle-orm";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { getDb } from "@/lib/db";
import { galleryImages } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const db = await getDb();
  const images = await db.select().from(galleryImages).orderBy(asc(galleryImages.sortOrder));
  return <GalleryManager images={images} />;
}
