import Link from "next/link";
import { getDashboardStats, getWedding } from "@/lib/queries";
import { toKhmerNumber } from "@/lib/khmer";

export const dynamic = "force-dynamic";

function Stat({ label, value, tone = "slate" }: { label: string; value: number; tone?: string }) {
  const tones: Record<string, string> = {
    slate: "border-slate-200 text-slate-800",
    green: "border-emerald-200 text-emerald-700",
    amber: "border-amber-200 text-amber-700",
    red: "border-red-200 text-red-600",
    blue: "border-sky-200 text-sky-700",
  };
  return (
    <div className={`rounded-xl border bg-white px-5 py-4 shadow-sm ${tones[tone]}`}>
      <p className="text-2xl font-semibold tabular-nums">
        {value.toLocaleString("en-US")}
        <span className="ml-2 text-sm font-normal opacity-60">{toKhmerNumber(value)}</span>
      </p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const [stats, wedding] = await Promise.all([getDashboardStats(), getWedding()]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">ផ្ទាំងគ្រប់គ្រង</h1>
        <p className="mt-1 text-sm text-slate-500">
          {wedding.groomName} &amp; {wedding.brideName} · {wedding.weddingDateKhmer}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="ភ្ញៀវសរុប" value={stats.totalGuests} />
        <Stat label="ចំនួនមើលសំបុត្រ" value={stats.totalViews} tone="blue" />
        <Stat label="បានបញ្ជាក់ចូលរួម" value={stats.confirmed} tone="green" />
        <Stat label="មិនទាន់ឆ្លើយតប" value={stats.pending} tone="amber" />
        <Stat label="មិនអាចចូលរួម" value={stats.declined} tone="red" />
        <Stat label="អ្នកចូលរួមរំពឹងទុក" value={stats.expectedAttendees} tone="green" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">ការបញ្ជាក់វត្តមានថ្មីៗ</h2>
          <Link href="/admin/rsvp" className="text-xs text-amber-700 hover:underline">
            មើលទាំងអស់ →
          </Link>
        </header>
        <div className="divide-y divide-slate-100">
          {stats.recentRsvps.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              មិនទាន់មានការបញ្ជាក់វត្តមានទេ
            </p>
          )}
          {stats.recentRsvps.map((rsvp) => (
            <div key={rsvp.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
              <span className="text-sm font-medium text-slate-800">{rsvp.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  rsvp.attending ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}
              >
                {rsvp.attending ? `ចូលរួម · ${toKhmerNumber(rsvp.guestCount)} នាក់` : "មិនអាចចូលរួម"}
              </span>
              {rsvp.message && (
                <span className="w-full truncate text-xs text-slate-500">“{rsvp.message}”</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/admin/wedding", title: "កែព័ត៌មានអាពាហ៍ពិពាហ៍", text: "ឈ្មោះ ថ្ងៃខែ ទីតាំង អត្ថបទអញ្ជើញ" },
          { href: "/admin/guests", title: "គ្រប់គ្រងភ្ញៀវ", text: "បង្កើតតំណ និង QR Code ផ្ទាល់ខ្លួន" },
          { href: "/admin/gallery", title: "បញ្ចូលរូបភាព", text: "រូបភាពមុនអាពាហ៍ពិពាហ៍ និងក្រុមគ្រួសារ" },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-amber-300"
          >
            <p className="text-sm font-medium text-slate-800">{card.title}</p>
            <p className="mt-1 text-xs text-slate-500">{card.text}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
