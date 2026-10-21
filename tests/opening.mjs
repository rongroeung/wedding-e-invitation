/**
 * The opening, checked in a real browser against a running server.
 *
 *   npm run build && PORT=3100 npm start      # in one terminal
 *   npx playwright@1.49.1 install chromium    # once, if you have no browser
 *   node tests/opening.mjs                    # BASE=http://localhost:3100
 *
 * Every assertion is about what a guest can see or touch, not about what is
 * in the DOM: an element that exists behind a curtain is not one a guest can
 * use (see the build notes on `deadjs`).
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3100";
const GUEST = process.env.GUEST ?? "/invite/K7Q4MXA2";
const exe = process.env.CHROMIUM;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

async function page(opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    ...opts,
  });
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(e.message));
  p.on("console", (m) => m.type() === "error" && p.errors.push(m.text()));
  return p;
}

/* Watch the beats from inside the page, so timing is the page's, not ours. */
const recordSteps = () => {
  window.__steps = [];
  const o = document.querySelector("[data-opening]");
  if (!o) return;
  new MutationObserver(() => {
    const s = o.getAttribute("data-step");
    if (s && window.__steps[window.__steps.length - 1] !== s) window.__steps.push(s);
  }).observe(o, { attributes: true, attributeFilter: ["data-step"] });
};

const coverButtonReachable = (p) =>
  p.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "បើកលិខិត");
    if (!b) return "no button";
    const r = b.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return hit && (hit === b || b.contains(hit)) ? "ok" : `covered by ${hit?.className || hit?.tagName}`;
  });

// 1 — a finger opens it, every beat runs once and in order, and the guest lands on a usable cover
{
  const p = await page();
  await p.goto(BASE + GUEST, { waitUntil: "networkidle" });
  await p.evaluate(recordSteps);
  await p.waitForTimeout(1200);
  await p.touchscreen.tap(195, 420);
  await p.touchscreen.tap(195, 420); // a second, impatient tap
  await p.waitForFunction(() => !document.querySelector("[data-opening]"), null, { timeout: 12000 });
  const steps = await p.evaluate(() => window.__steps);
  // `done` unmounts the overlay, so the last beat that can be observed is `fill`.
  const want = ["press", "lift", "flap", "card", "lower", "fill"];
  check("finger tap opens the envelope", true);
  check("beats run once, in order", JSON.stringify(steps) === JSON.stringify(want), steps.join(" → "));
  await p.waitForTimeout(3800); // curtains part and are struck
  check("cover button reachable after opening", (await coverButtonReachable(p)) === "ok", await coverButtonReachable(p));
  const clips = await p.evaluate(() =>
    [...document.querySelectorAll(".cv .namelogo-name")].map((e) => getComputedStyle(e).clipPath));
  await p.waitForTimeout(3500); // the name mark's reveal
  const after = await p.evaluate(() =>
    [...document.querySelectorAll(".cv .namelogo-name")].map((e) => getComputedStyle(e).clipPath));
  check("name mark's mask is removed after the reveal", after.every((c) => c === "none"), `${clips} → ${after}`);
  const scroll = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  check("no horizontal scroll", !scroll);
  const btn = await p.$("text=បើកលិខិត");
  await btn.tap();
  await p.waitForTimeout(1300);
  const mainVisible = await p.evaluate(() => getComputedStyle(document.querySelector("main")).opacity);
  check("cover's own button still opens the invitation", mainVisible === "1", `main opacity ${mainVisible}`);
  check("no console errors", p.errors.length === 0, p.errors.join(" | "));
  await p.context().close();
}

// 2 — the music starts from the opening tap, when the couple has music on
// (left to MusicPlayer's own behaviour; asserted only that nothing throws)

// 2b — the physical construction, measured in the browser while the run is slowed down
{
  const p = await page({ viewport: { width: 1280, height: 800 }, hasTouch: false, isMobile: false });
  await p.goto(BASE + GUEST, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  const closed = await p.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    const env = r(".pe-back"), flap = r(".pe-flap-out");
    // what is on top at the flap's tip, the seal's centre, and the card's middle
    const top = (x, y) => document.elementFromPoint(x, y)?.className?.toString() ?? "";
    const seal = r(".pe-seal");
    return {
      flapTop: Math.round(flap.top - env.top),
      atSeal: top(seal.left + seal.width / 2, seal.top + seal.height / 2),
      inner: getComputedStyle(document.querySelector(".pe-flap-in")).backfaceVisibility,
    };
  });
  check("closed: flap hinged on the envelope's top edge", Math.abs(closed.flapTop) <= 1, `offset ${closed.flapTop}px`);
  check("closed: lining is a back face (hidden from the front)", closed.inner === "hidden", closed.inner);
  await p.mouse.click(640, 440);
  // Sampled the instant the card beat begins: the flap has finished turning,
  // and the card has not yet moved up in front of the lining.
  await p.waitForFunction(() => document.querySelector(".pe")?.getAttribute("data-phase") === "card", null, { timeout: 8000, polling: "raf" });
  // The overlay deliberately takes no pointer events (see InvitationOpening),
  // so hit-testing would see straight through the drawing. Turn it back on for
  // the measurement only — it changes nothing that is painted.
  await p.addStyleTag({ content: ".env-column, .env-column * { pointer-events: auto !important; }" });
  const open = await p.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    const back = r(".pe-back"), lining = r(".pe-flap-in");
    // Orientation, by hit-testing the clipped shape: with the point up, the
    // top centre of the lining's box is lining and its top corners are not.
    // (The old fault — point down — passes a bounding-box check and fails this.)
    const at = (fx, fy) => {
      const el = document.elementFromPoint(lining.left + lining.width * fx, lining.top + lining.height * fy);
      return !!el?.closest(".pe-flap-in");
    };
    return {
      pointUp: at(0.5, 0.12) && !at(0.06, 0.06) && !at(0.94, 0.06),
      liningAbove: Math.round(back.top - lining.bottom),
      liningSpan: Math.round(lining.height),
      sealGone: !document.querySelector(".pe-seal") || getComputedStyle(document.querySelector(".pe-seal")).opacity === "0"
        || document.querySelector(".pe-seal").getBoundingClientRect().left > innerWidth * 0.6,
    };
  });
  check("open: lining stands above the envelope, joined at the hinge", open.liningAbove >= -2 && open.liningAbove <= 2 && open.liningSpan > 20,
        `gap ${open.liningAbove}px, height ${open.liningSpan}px`);
  check("open: lining points up, as a folded-back flap does", open.pointUp);
  check("open: seal has been carried off the envelope", open.sealGone);
  await p.context().close();
}

// 3 — skip with JavaScript: no navigation, straight to a usable cover
{
  const p = await page();
  await p.goto(BASE + GUEST, { waitUntil: "networkidle" });
  const url = p.url();
  await p.waitForTimeout(800);
  await p.tap(".env-skip");
  await p.waitForFunction(() => !document.querySelector("[data-opening]"), null, { timeout: 6000 });
  check("skip does not navigate", p.url() === url, p.url());
  await p.waitForTimeout(3600);
  check("skip lands on a usable cover", (await coverButtonReachable(p)) === "ok");
  await p.context().close();
}

// 4 — no JavaScript: the envelope is visible, and its tap target is a link that lands on the cover
{
  const p = await page({ javaScriptEnabled: false });
  await p.goto(BASE + GUEST, { waitUntil: "load" });
  const boxes = await p.evaluate(() =>
    [".env-piece", ".pe-flap", ".pe-pocket", ".pe-seal", ".env-heading-title", ".env-anywhere"].map((s) => {
      const e = document.querySelector(s);
      if (!e) return `${s}:missing`;
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 ? "ok" : `${s}:empty`;
    }));
  check("no-JS: envelope, flap, pocket, seal, heading and link have size", boxes.every((b) => b === "ok"), boxes.join(","));
  await Promise.all([p.waitForURL(/envelope=open/), p.tap(".env-anywhere")]);
  await p.waitForLoadState("load");
  const overlay = await p.$("[data-opening]");
  check("no-JS: tapping lands on the invitation", !overlay && p.url().includes("envelope=open"), p.url());
  await p.context().close();
}

// 5 — reduced motion jumps straight through
{
  const p = await page({ reducedMotion: "reduce" });
  await p.goto(BASE + GUEST, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  const t0 = Date.now();
  await p.touchscreen.tap(195, 420);
  await p.waitForFunction(() => !document.querySelector("[data-opening]"), null, { timeout: 4000 });
  check("reduced motion: opening takes under 1.5s", Date.now() - t0 < 1500, `${Date.now() - t0}ms`);
  await p.context().close();
}

// 6 — a backgrounded tab mid-opening still finishes
{
  const p = await page();
  await p.goto(BASE + GUEST, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  await p.touchscreen.tap(195, 420);
  await p.waitForTimeout(900);
  const other = await p.context().newPage();
  await other.goto("about:blank");
  await other.waitForTimeout(6500);
  await p.bringToFront();
  await p.waitForTimeout(800);
  check("backgrounded mid-opening: overlay gone on return", !(await p.$("[data-opening]")));
  await p.context().close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
