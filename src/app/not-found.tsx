import Link from "next/link";
import { Flourish, FlourishDivider } from "@/components/ui/Ornaments";

export default function NotFound() {
  return (
    <main className="paper flex min-h-screen items-center justify-center px-6 text-center">
      <div className="card-panel gold-border max-w-md rounded-[26px] px-8 py-14">
        <Flourish role="crest" className="mx-auto w-40" />
        <h1 className="gold-text mt-6 text-2xl leading-loose khmer-wrap">
          រកមិនឃើញសំបុត្រអញ្ជើញនេះទេ
        </h1>
        <FlourishDivider className="my-6" />
        <p className="text-sm leading-loose text-ink/85 khmer-wrap">
          សូមមេត្តាពិនិត្យតំណរបស់លោកអ្នកម្ដងទៀត ឬទាក់ទងមកម្ចាស់ពិធីដោយផ្ទាល់។
        </p>
        <Link href="/" className="btn-gold mt-8">
          ត្រឡប់ទៅសំបុត្រអញ្ជើញ
        </Link>
      </div>
    </main>
  );
}
