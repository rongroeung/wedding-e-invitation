"use client";

/**
 * The one thing a guest has to do.
 *
 * Deliberately large and deliberately alone: many of these guests are elderly
 * and will open the invitation on a phone, in Telegram, one-handed. No drag,
 * no gesture, no second step.
 */
export function OpenButton({
  label,
  hint,
  onOpen,
  hidden,
}: {
  label: string;
  hint: string;
  onOpen: () => void;
  hidden: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center transition-all duration-500 ${
        hidden ? "pointer-events-none translate-y-2 opacity-0" : "opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="btn-gold env-open-pulse min-h-[52px] min-w-[220px] khmer-wrap"
      >
        {label}
      </button>
      {hint && (
        /*
         * Light on dark, not the page's ink. The hint used to inherit the
         * invitation's brown, which was written for an ivory page — on the
         * dark set it disappeared into the backdrop entirely. Warm rather than
         * pure white, so it belongs to the same lighting as the envelope.
         */
        <p className="env-hint mt-3 text-xs leading-relaxed khmer-wrap">{hint}</p>
      )}
    </div>
  );
}
