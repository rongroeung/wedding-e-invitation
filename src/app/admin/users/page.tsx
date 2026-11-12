import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { UserManager } from "@/components/admin/UserManager";
import { getDb } from "@/lib/db";
import { users, workspaceMembers } from "@/lib/db/schema";
import { getAdminContext } from "@/lib/workspace";

export const dynamic = "force-dynamic";

/** The admins of the workspace being managed. */
export default async function AdminUsersPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (!ctx.weddingId) return null;

  const db = await getDb();
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.weddingId, ctx.weddingId))
    .orderBy(asc(users.createdAt));

  return <UserManager users={rows} currentUserId={ctx.userId} />;
}
