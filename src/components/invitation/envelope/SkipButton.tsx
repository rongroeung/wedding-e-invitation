"use client";

/** A quiet way past the animation. Present, findable, never competing. */
export function SkipButton({
  label,
  onSkip,
  hidden,
}: {
  label: string;
  onSkip: () => void;
  hidden: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSkip}
      className={`env-skip absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 rounded-full px-4 py-2 text-xs underline-offset-4 transition-opacity duration-500 hover:underline khmer-wrap sm:bottom-6 sm:right-6 ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {label}
    </button>
  );
}
