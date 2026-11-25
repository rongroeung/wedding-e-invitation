import { Brand } from "@/components/admin/Brand";
import { LoginForm } from "@/components/admin/LoginForm";
import { AdminPrefsToggles } from "@/components/admin/AdminPrefs";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const t = await getT();
  return { title: t("ចូលប្រព័ន្ធគ្រប់គ្រង"), robots: { index: false } };
}

export default async function LoginPage() {
  const t = await getT();
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10">
      <AdminPrefsToggles className="absolute right-4 top-4" />
      <Brand size="lg" tagline={t("ប្រព័ន្ធសំបុត្រអញ្ជើញអាពាហ៍ពិពាហ៍អនឡាញ")} />
      <LoginForm />
    </main>
  );
}
