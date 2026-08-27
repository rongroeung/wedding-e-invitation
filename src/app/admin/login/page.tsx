import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "ចូលប្រព័ន្ធគ្រប់គ្រង", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <LoginForm />
    </main>
  );
}
