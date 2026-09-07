import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { UserManager } from "@/components/admin/UserManager";
import { getSession } from "@/lib/api";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const db = await getDb();
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.createdAt));

  return <UserManager users={rows} currentUserId={session.sub} />;
}
