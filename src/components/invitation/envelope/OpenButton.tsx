"use client";

import { useOpeningReadyState } from "../openingReady";

/**
 * The one thing a guest has to do.
 *
 * Deliberately large and deliberately alone: many of these guests are elderly
 * and will open the invitation on a phone, in Telegram, one-handed. No drag,
 * no gesture, no second step — and it is the only way in: no tap elsewhere on
 * the page, no skip link.
 *
 * It is a link (`?envelope=open`), not a `<button>`: a link is the one thing a
 * phone follows without asking the page's JavaScript, which is what the old
 * whole-page tap target was for (iPhones whose scripts were still busy did not
 * answer taps). With JavaScript running the click is taken here and the full
 * opening plays; without it, the server answers with the invitation itself.
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
  /* Until the pictures and the film are in, the button counts up instead of
     opening (openingReady); the tap is ignored by the opening itself. */
  const { ready, progress } = useOpeningReadyState();
  const pct = Math.round(progress * 100);
  return (
    <div
      className={`flex flex-col items-center transition-all duration-500 ${
        hidden ? "pointer-events-none translate-y-2 opacity-0" : "opacity-100"
      }`}
    >
      <a
        href="?envelope=open"
        role="button"
        onClick={(event) => {
          event.preventDefault();
          onOpen();
        }}
        onKeyDown={(event) => {
          // a link answers Enter by itself; a button also answers Space
          if (event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
        data-open-control=""
        aria-disabled={!ready}
        aria-busy={!ready}
        className={`btn-seal inline-flex min-h-[52px] min-w-[220px] items-center justify-center khmer-wrap ${ready ? "env-open-pulse" : "env-open-loading"}`}
      >
        {ready ? (
          label
        ) : (
          <span className="flex flex-col items-center gap-1.5">
            <span>
              កំពុងរៀបចំសំបុត្រ… <span className="tabular-nums">{pct}%</span>
            </span>
            <span className="env-open-bar" aria-hidden="true">
              <span style={{ width: `${pct}%` }} />
            </span>
          </span>
        )}
      </a>
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
