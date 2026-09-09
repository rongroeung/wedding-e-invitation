/**
 * A diagnostic that keeps working when the app does not.
 *
 * Three separate mobile faults have now been fixed on a reading of how a
 * browser is documented to behave, and the envelope is still reported stuck on
 * one particular phone that cannot be reproduced here — there is no WebKit in
 * the build environment at all. Guessing a fourth time is not engineering.
 *
 * So this asks the device. It is rendered only for `?diag=1`, and it is written
 * as a **plain inline script rather than as a React component**, deliberately:
 * the leading theory is that React never hydrates on that phone, and a panel
 * built in React cannot report React failing to start. It touches no framework
 * code, runs before hydration, and keeps updating whether or not hydration ever
 * happens.
 *
 * What it answers, in one screenshot:
 *
 * - **Does JavaScript run at all?** The panel appearing is the answer.
 * - **Did React hydrate?** `InvitationOpening` sets `data-hydrated` on the
 *   overlay from an effect. If that never appears, the bundle is failing, and
 *   every tap on the page is dead rather than just the envelope's.
 * - **Did the tap reach the page?** Counters for `pointerdown`, `touchstart`
 *   and `click`, captured on `document` so nothing downstream can hide them.
 * - **What is actually under the finger?** `elementFromPoint` at the centre of
 *   the envelope. If something is lying over the tap target, this names it.
 * - **What broke?** The first error and the first unhandled rejection, captured
 *   from the very top of the document so nothing is missed.
 * - **Which build is this?** Because "still broken" and "not deployed yet" look
 *   identical from here, and one of them has cost three rounds.
 */
export function FieldReport({ build }: { build: string }) {
  const script = `
(function () {
  var first = null, reject = null;
  window.addEventListener('error', function (e) {
    if (!first) first = (e.message || 'error') + ' @ ' + (e.filename || '?') + ':' + (e.lineno || 0);
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    if (!reject) reject = String((e.reason && (e.reason.message || e.reason)) || 'rejection').slice(0, 120);
  });

  var count = { pointerdown: 0, touchstart: 0, click: 0 };
  Object.keys(count).forEach(function (type) {
    document.addEventListener(type, function () { count[type]++; }, true);
  });

  function ready() {
    var box = document.createElement('div');
    box.setAttribute('style', 'position:fixed;left:6px;top:6px;z-index:2147483647;max-width:92vw;' +
      'background:rgba(15,12,20,.92);color:#f4ead8;font:11px/1.45 ui-monospace,Menlo,monospace;' +
      'padding:8px 10px;border-radius:8px;white-space:pre-wrap;pointer-events:none');
    document.body.appendChild(box);

    setInterval(function () {
      var tap = document.querySelector('.env-tap');
      var piece = document.querySelector('.env-piece');
      var overlay = document.querySelector('[data-opening]');
      var over = '—';
      if (piece) {
        var r = piece.getBoundingClientRect();
        var el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (el) over = el.tagName.toLowerCase() + (el.className && el.className.baseVal === undefined
          ? '.' + String(el.className).split(' ').filter(Boolean).slice(0, 2).join('.') : '');
      }
      box.textContent =
        'build     ' + ${JSON.stringify(build)} + '\\n' +
        'hydrated  ' + (overlay ? (overlay.getAttribute('data-hydrated') || 'NO') : 'no overlay') + '\\n' +
        'step      ' + (overlay ? (overlay.getAttribute('data-step') || '?') : '—') + '\\n' +
        'tap target' + (tap ? ' yes ' + Math.round(tap.getBoundingClientRect().width) + 'x' +
                              Math.round(tap.getBoundingClientRect().height) : ' MISSING') + '\\n' +
        'under tap ' + over + '\\n' +
        'events    down ' + count.pointerdown + '  touch ' + count.touchstart + '  click ' + count.click + '\\n' +
        'error     ' + (first || 'none') + '\\n' +
        'rejected  ' + (reject || 'none');
    }, 400);
  }

  /*
   * The panel is built late, on purpose.
   *
   * Appending anything to the body *before* React hydrates is the same thing a
   * meddling browser extension does, and React says so in as many words: it
   * finds a node it did not render, the hydration mismatches, and the tool
   * meant to diagnose a fault has caused one. The listeners above are installed
   * immediately, so nothing is missed; only the drawing waits.
   */
  setTimeout(ready, 2000);
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
