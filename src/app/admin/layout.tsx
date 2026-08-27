import Link from "next/link";
import { getSession } from "@/lib/api";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "ផ្ទាំងគ្រប់គ្រង", icon: "📊" },
  { href: "/admin/wedding", label: "ព័ត៌មានអាពាហ៍ពិពាហ៍", icon: "💍" },
  { href: "/admin/program", label: "កម្មវិធី & រឿងរ៉ាវ", icon: "🗓️" },
  { href: "/admin/gallery", label: "រូបភាព", icon: "🖼️" },
  { href: "/admin/guests", label: "ភ្ញៀវ & តំណអញ្ជើញ", icon: "👥" },
  { href: "/admin/rsvp", label: "ការបញ្ជាក់វត្តមាន", icon: "✅" },
  { href: "/admin/gift", label: "ចំណងដៃ", icon: "🎁" },
  { href: "/admin/music", label: "ភ្លេង", icon: "🎵" },
  { href: "/admin/theme", label: "រូបរាង", icon: "🎨" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // The login page renders inside this layout too, but without the chrome.
  if (!session) return <div className="min-h-screen bg-slate-50">{children}</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
          <div className="px-5 py-5">
            <p className="text-sm font-semibold text-slate-800">Wedding Admin</p>
            <p className="mt-0.5 text-xs text-slate-500">សិរីមង្គលអាពាហ៍ពិពាហ៍</p>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-amber-50 hover:text-amber-800"
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden border-t border-slate-100 px-5 py-4 lg:block">
            <p className="truncate text-xs text-slate-500">{session.email}</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/"
                target="_blank"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-center text-xs text-slate-600 hover:bg-slate-50"
              >
                មើលសំបុត្រអញ្ជើញ ↗
              </Link>
              <LogoutButton />
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
        <LogoutButton />
      </div>
    </div>
  );
}
