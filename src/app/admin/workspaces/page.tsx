import { redirect } from "next/navigation";
import { WorkspaceManager } from "@/components/admin/WorkspaceManager";
import { siteUrl } from "@/lib/site";
import { getAdminContext } from "@/lib/workspace";
import { listWorkspaces } from "@/lib/workspaceAdmin";

export const dynamic = "force-dynamic";

/** The owner's page: every wedding on the site, and who runs each. */
export default async function AdminWorkspacesPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (!ctx.isOwner) redirect("/admin");
  const rows = await listWorkspaces();
  return (
    <WorkspaceManager
      workspaces={rows.map((w) => ({ ...w, createdAt: String(w.createdAt) }))}
      current={ctx.weddingId}
      siteUrl={siteUrl()}
    />
  );
}
