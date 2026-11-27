import { redirect } from "next/navigation";
import { OwnerForm } from "@/components/admin/OwnerForm";
import { getT } from "@/lib/i18n/server";
import { getSystemOwner } from "@/lib/queries";
import { getAdminContext } from "@/lib/workspace";

export const dynamic = "force-dynamic";

/** The system owner's details, shown at the end of every invitation. */
export default async function AdminOwnerPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  if (!ctx.isOwner) redirect("/admin");
  const t = await getT();
  if (ctx.weddingId !== "main")
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {t("ព័ត៌មានម្ចាស់ប្រព័ន្ធ កំណត់បានតែពីកន្លែងធ្វើការមេប៉ុណ្ណោះ។ សូមប្ដូរទៅកន្លែងធ្វើការមេជាមុនសិន។")}
      </p>
    );
  const owner = await getSystemOwner();
  return <OwnerForm owner={{ ...owner, updatedAt: String(owner.updatedAt) }} />;
}
