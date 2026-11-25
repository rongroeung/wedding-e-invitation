import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { BRAND_NAME } from "@/components/admin/Brand";
import { AdminPrefsProvider } from "@/components/admin/AdminPrefs";
import { adminPrefs } from "@/lib/i18n/server";
import { translator } from "@/lib/i18n/admin";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/api";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { WorkspaceSwitcher } from "@/components/admin/WorkspaceSwitcher";
import { getAdminContext, workspacePath } from "@/lib/workspace";

export const dynamic = "force-dynamic";

/* every admin page's tab carries the system's name */
export const metadata = { title: { template: `%s · ${BRAND_NAME}`, default: BRAND_NAME } };

const NAV = [
  { href: "/admin", label: "ផ្ទាំងគ្រប់គ្រង", icon: "📊" },
  { href: "/admin/wedding", label: "ព័ត៌មានអាពាហ៍ពិពាហ៍", icon: "💍" },
  { href: "/admin/program", label: "កម្មវិធី & រឿងរ៉ាវ", icon: "🗓️" },
  { href: "/admin/gallery", label: "រូបភាព", icon: "🖼️" },
  { href: "/admin/guests", label: "ភ្ញៀវ & តំណអញ្ជើញ", icon: "👥" },
  { href: "/admin/rsvp", label: "ការបញ្ជាក់វត្តមាន", icon: "✅" },
  { href: "/admin/dress", label: "ពណ៌សម្លៀកបំពាក់", icon: "👗" },
  { href: "/admin/gift", label: "ចំណងដៃ", icon: "🎁" },
  { href: "/admin/music", label: "ភ្លេង", icon: "🎵" },
  { href: "/admin/theme", label: "រូបរាង", icon: "🎨" },
  { href: "/admin/envelope", label: "សំបុត្រ & ស៊ុម ៣មិតិ", icon: "✉️" },
  { href: "/admin/users", label: "គណនីគ្រប់គ្រង", icon: "🔐" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminContext();
  const prefs = await adminPrefs();
  const t = translator(prefs.lang);

  // A signed-in cookie whose account is gone (deleted, or the database was
  // reset or changed): it would render a blank dashboard, so clear it and sign in again.
  if (!ctx && (await getSession())) redirect("/api/auth/logout?next=/admin/login");

  // The login page renders inside this layout too, but without the chrome.
  if (!ctx)
    return (
      <AdminPrefsProvider {...prefs} className="min-h-screen bg-slate-50">
        {children}
      </AdminPrefsProvider>
    );
  const session = ctx.session;
  const nav = ctx.isOwner ? [...NAV, { href: "/admin/workspaces", label: "កន្លែងធ្វើការទាំងអស់", icon: "🗂️" }] : NAV;

  return (
    <AdminPrefsProvider {...prefs} className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        <AdminSidebar
          nav={nav}
          title={BRAND_NAME}
          subtitle={ctx.workspace ? ctx.workspace.label : t("សិរីមង្គលអាពាហ៍ពិពាហ៍")}
          email={session.email}
          viewHref={ctx.workspace ? workspacePath(ctx.workspace.slug) : "/"}
          switcher={
            ctx.workspace && ctx.workspaces.length > 1 ? (
              <WorkspaceSwitcher
                current={ctx.workspace.id}
                options={ctx.workspaces.map((w) => ({ id: w.id, label: w.label, slug: w.slug }))}
              />
            ) : undefined
          }
          logout={<LogoutButton />}
        />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {ctx.weddingId ? (
            children
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              {prefs.lang === "en" ? (
                "This account has no workspace yet. Ask the site owner to add you to your wedding's workspace."
              ) : (
                <>
                  គណនីនេះមិនទាន់មានកន្លែងធ្វើការនៅឡើយទេ។ សូមទាក់ទងម្ចាស់ប្រព័ន្ធ ដើម្បីបន្ថែមអ្នកទៅក្នុងកន្លែងធ្វើការនៃពិធីមង្គលការរបស់អ្នក។
                  <span className="mt-1 block text-xs text-amber-700">
                    This account has no workspace yet. Ask the site owner to add you to your wedding&apos;s workspace.
                  </span>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </AdminPrefsProvider>
  );
}
