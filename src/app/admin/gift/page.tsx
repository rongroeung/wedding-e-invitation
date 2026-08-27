import { asc } from "drizzle-orm";
import { GiftManager } from "@/components/admin/GiftManager";
import { getDb } from "@/lib/db";
import { giftAccounts } from "@/lib/db/schema";
import { getWedding } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminGiftPage() {
  const db = await getDb();
  const [wedding, accounts] = await Promise.all([
    getWedding(),
    db.select().from(giftAccounts).orderBy(asc(giftAccounts.sortOrder)),
  ]);
  return <GiftManager wedding={wedding} accounts={accounts} />;
}
