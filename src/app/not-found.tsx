import Link from "next/link";
import { GoldDivider, Lotus } from "@/components/ui/Ornaments";

export default function NotFound() {
  return (
    <main className="paper flex min-h-screen items-center justify-center px-6 text-center">
      <div className="card-panel gold-border max-w-md rounded-[26px] px-8 py-14">
        <Lotus className="mx-auto h-9 w-9 text-gold" />
        <h1 className="gold-text mt-6 text-2xl leading-loose khmer-wrap">
          រកមិនឃើញសំបុត្រអញ្ជើញនេះទេ
        </h1>
        <GoldDivider className="my-6" width="max-w-[150px]" />
        <p className="text-sm leading-loose text-ink/70 khmer-wrap">
          សូមមេត្តាពិនិត្យតំណរបស់លោកអ្នកម្ដងទៀត ឬទាក់ទងមកម្ចាស់ពិធីដោយផ្ទាល់។
        </p>
        <Link href="/" className="btn-gold mt-8">
          ត្រឡប់ទៅសំបុត្រអញ្ជើញ
        </Link>
      </div>
    </main>
  );
}
