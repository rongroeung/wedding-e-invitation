# 🇰🇭 សិរីមង្គលអាពាហ៍ពិពាហ៍ — Formal Khmer Wedding E-Invitation

A premium, mobile-first Cambodian wedding e-invitation with a complete admin
dashboard. Every word a guest sees is in formal Khmer; every value is editable
from the dashboard — nothing is hard-coded.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS · Drizzle ORM · PostgreSQL**.

---

## ✨ What is included

The invitation is presented as a **printed card**: a column of textured paper
stock framed in antique gold, resting on a muted stage. On wide screens the
stage divides into three zones — event details, the card, and the guest's QR
code and RSVP status — each a proportional column with its own surface and a
hairline boundary. The side zones are equal, so the card sits exactly centred
and never grows past a comfortable reading measure.

**Guest-facing invitation** (`/` and `/invite/<code>`)

| | |
|---|---|
| ✉️ 3D envelope | A sealed, gold-ornamented envelope the guest opens before the invitation — flap, wax seal, and the card rising out of it, all in CSS 3D |
| 💌 Card cover | Monogram, the guest's name, and one button — the card inside the envelope, and the invitation's own cover when the envelope is switched off |
| 🙏 Formal invitation | Respectful Khmer wording, personalised with the guest’s name |
| 👰 Couple section | Both families, parents’ names and portraits |
| 📅 Date + countdown | Khmer numerals, Buddhist era, live countdown that turns into a congratulation |
| 🗓️ Wedding programme | Grouped by ពេលព្រឹក / ពេលល្ងាច, fully configurable |
| 📍 Venue | Address, “បើក Google Maps” button, click-to-load embedded map |
| 💞 Love story | Optional alternating timeline |
| 🖼️ Gallery | Masonry grid with a full-screen lightbox (swipe, keyboard, arrows) |
| ✅ RSVP | Name, attending, guest count, blessing message — a guest who has already replied is thanked and shown what was recorded, not asked again |
| 🎁 ចំណងដៃ | A single KHQR to scan, with the account name beside it |
| 🎵 Music | Floating player that only ever starts from a user gesture |
| 📞 Contact | `tel:` buttons for the groom and bride |
| 🔗 Sharing | Telegram, Facebook, Messenger, copy link, Open Graph preview image |
| 🧾 Desktop rails | Date and venue at a glance; the guest's QR code and live RSVP status |

**Admin dashboard** (`/admin`) — statistics, wedding information, programme &
love story, gallery, guests with personalised links and QR codes, RSVP list with
search/filter/CSV export, the ចំណងដៃ QR, music, a live theme editor, the 3D
envelope, and the administrator accounts.

---

## 🚀 Quick start (zero configuration)

```bash
npm install
cp .env.example .env
npm run db:setup     # creates the schema + demo content + admin user
npm run dev
```

Open <http://localhost:3000> for the invitation and
<http://localhost:3000/admin> for the dashboard.

Default admin credentials (change them in `.env` before seeding, or change the
password later):

```
admin@wedding.local
ChangeMe123!
```

With `DATABASE_URL` empty the app runs on **PGlite** — a real PostgreSQL engine
compiled to WebAssembly that stores its data in `./.data`. No database server,
no Docker, no setup. The moment you set `DATABASE_URL` it switches to that
PostgreSQL server instead; the schema is identical.

---

## ☁️ Deploying to Vercel

1. **Create a Postgres database** — Vercel Postgres, [Neon](https://neon.tech),
   [Supabase](https://supabase.com) or any other provider all work.
2. **Import the repository** into Vercel (framework preset: Next.js).
3. **Set the environment variables** (Project → Settings → Environment Variables):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `postgresql://user:password@host/db?sslmode=require` |
   | `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | used once, when you seed |

4. **Create the schema and the first admin**, from your own machine, pointed at
   the production database:

   ```bash
   DATABASE_URL="postgresql://..." npm run db:setup
   ```

5. Deploy. `NEXT_PUBLIC_SITE_URL` is what QR codes and share links use, so set it
   to the final domain before you generate invitations.

> **Region tip:** `vercel.json` pins the functions to `sin1` (Singapore) — the
> closest region to Cambodia. Put your database in the same region.

---

## 👥 Personalised invitations

Each guest gets their own link and QR code:

```
https://your-domain.com/invite/K7Q4MXA2
https://your-domain.com/invite/P3WHY9TB
```

Codes are random 8-character strings, never derived from the guest's name — a
name in the URL would reveal who was invited to anyone who sees the link. You
can still set a memorable code by hand, or press **កូដថ្មី** to issue a new one
(which immediately invalidates the old link).

The invitation then greets them by name (`សូមគោរពអញ្ជើញ លោក …`), pre-fills the
RSVP form, and every open is counted on the dashboard.

In **Admin → ភ្ញៀវ & តំណអញ្ជើញ** you can add guests one at a time or paste a
whole list (`ឈ្មោះ, ចំនួនកៅអី` — one guest per line), then copy the link,
download the QR code as PNG, or share straight to Telegram.

A guest replies once. Coming back to the invitation shows the confirmation —
their name, whether they are attending, the seats, and their blessing — with
**កែប្រែចម្លើយ** to change it. Changing an answer edits that one reply rather
than filing a second, so the RSVP list never shows the same guest twice.

---

## ✉️ The 3D envelope

The invitation arrives sealed. A guest sees a gold-ornamented envelope with the
couple's names and the date, a wax seal bearing their initials, and one button —
**បើកសំបុត្រអញ្ជើញ**. Tapping it (or the envelope itself) releases the seal, opens
the flap, lifts the invitation card out, brings it toward the camera and lands it
exactly on the invitation's own card, which is already live underneath. One tap,
one continuous movement, and the guest is in the invitation.

**Admin → សំបុត្រ & ស៊ុម ៣មិតិ** controls all of it: on/off, one of four styles,
custom paper and gold, the seal and its lettering, the animation and its length,
whether music starts afterwards, the skip button, whether the envelope appears on
every visit, and the wording of all three labels — plus the frame treatment below.

Four styles ship, and adding a fifth is a row in `ENVELOPE_STYLES`
(`src/lib/envelope.ts`) rather than a new branch through the markup:

| | |
|---|---|
| `royal-khmer` | Ivory paper, antique gold. The default. |
| `burgundy-royal` | Deep burgundy, champagne gold. |
| `white-gold` | Pure ivory, the lightest touch of champagne. |
| `khmer-heritage` | Ivory and gold, carrying the fuller Khmer border. |

Notes for anyone changing it:

- **It is CSS 3D, deliberately — not WebGL.** These invitations are opened on
  mid-range phones inside Telegram and Messenger, and `transform`/`opacity` are
  the only properties a browser animates without touching the main thread. Three.js
  would look no better on a 500px card and would cost a megabyte and a warm battery.
- **Depth is `translateZ`, never `z-index`.** The five layers stand at five
  distances inside one `preserve-3d` stage, which is what lets the card pass
  *behind* the front panel as it rises. `z-index` cannot do that.
- **The camera drops and pulls back as the card rises.** A card is nearly as tall
  as the envelope holding it, and both are nearly as tall as a phone screen, so a
  card that only slid upward would leave the frame long before it cleared the paper.
- **The last step is a morph, not a zoom.** The card is measured mid-flight and
  landed on the real card's rect — same width, same top edge — so the two gold
  frames coincide and one dissolves into the other.
- **The envelope renders outside `CardShell`.** Inside, it would sit in the scroll
  region's stacking context and be clipped by that region's mask, however high its
  `z-index` (the same trap the gallery lightbox fell into).
- `prefers-reduced-motion`, the admin's "បើកចលនា ៣មិតិ" switch and the skip button
  all take the same path: straight into the invitation with a short fade.
- Opening is remembered in `sessionStorage`, so a guest who comes back during the
  same visit is not made to watch it again — unless "បង្ហាញសំបុត្រគ្រប់ពេលចូលមើល" is on.

### The seal, the lining and the emboss

The seal is the envelope's focal point, so it is large — a third of the width,
struck across the joint where the flap meets the pocket. It is a Khmer emblem
rather than a wax blob: a ring of lotus buds held between two fine rules, a
raised band, a shallow depression, and the couple's initials (from the wedding
record) cut into the metal. Its relief is *drawn*, not filtered — every ring is
a pair of arcs, one catching the key light on its shoulder and one in shadow
below, which is cheaper than a filter and far more controllable. It belongs to
the flap, so it travels with the paper it is stuck to; a seal left hanging over
an open envelope undoes every other detail. It stands ten pixels proud of the
flap, which is what gives it its own parallax when the camera leans.

The envelope is **lined**. The lining sits between the card and the pocket, a
shade deeper than the outside and carrying a pattern the outside does not, so
opening the envelope is worth doing — and so the card can wait completely out of
sight instead of showing through the mouth from the start.

Both the lining and the envelope's face are **blind embossed**: the same Khmer
kbach die (`--env-kbach-light` / `--env-kbach-dark`) laid down twice, once in
white a pixel up and once in black a pixel down, with bare paper between. That
is what an emboss is — a lit edge and a shadow, no ink — and it means the
pattern only really appears where light rakes across it. On the envelope's face
it is masked away through the middle, because blind embossing on real stationery
is laid *around* the type, never under it.

### The flap

The flap is the piece a guest looks at longest, so it is the piece that is
designed rather than assembled. It is not a triangle and not a clipped
rectangle: the silhouette is a real SVG path — a lotus-bud ogee that sweeps in
from the shoulders to a point — which means the paper's edge, its shadow and its
ornament all follow one curve, and the shadow an open flap casts is the shape of
the flap rather than the shape of its bounding box.

Its Khmer artwork (`FlapOrnament.tsx`) is drawn for the envelope and for nothing
else. The invitation's four-corner frame deliberately does not appear on it: an
envelope and the card inside it read as one set precisely because they are not
the same drawing — the envelope is the ceremonial face and the card is the quiet
one. Everything is built from a single kbach unit, a spiral that tightens into a
curl with a leaf off its shoulder, placed and mirrored along the curve the way
the motif is repeated in carved work. A lotus medallion (`CentralEmblem.tsx`)
holds the middle; the couple's initials are on the wax below it, because saying
the same thing twice on one envelope is the difference between ceremony and
clutter.

The gold is struck three times from one set of paths — offset downward in
shadow, in the metal itself, and as an SVG `<mask>` for the highlight that
travels across it. A single-pass stroke reads as ink however good the colour is.

It turns on its real hinge, in two movements: a short lift as the seal gives,
then the swing back to 148° — not flat, because a flap folded all the way back
reads as a mirror image of itself lying on the table.

### The envelope as an object

The paper is not a coloured rectangle. It carries the invitation's own turbulence
grain, a key light falling off towards the lower right, a hairline of white along
its top edge and shadow along its bottom, a sliver of its own thickness showing
past the front panel, the faint diagonals of the back flaps folded in, and three
stacked shadows — tight, broad and very wide — plus a blurred contact shadow that
breathes with the idle float. The wax seal is domed, lipped and not quite round
(four different corner radii), and it lifts and turns as the paper lets go.

On a device with a mouse the envelope answers to it: five or six degrees of
parallax, coalesced into one animation frame per move, suspended the moment the
pointer takes over from the idle drift and absent entirely on touch. On a phone
reporting four cores or less, or 3 GB or less, `useRichDevice` drops the blur and
the stacked drop-shadows — the same envelope in flatter light, not a cheaper one.

### The gold, printed

The corner artwork is unchanged; what is added is what separates printed gold
from a picture of it. Two `drop-shadow` passes — dark below, light above —
follow the artwork's own alpha, so the relief traces every curl of the kbach
rather than sitting in a box behind it. Tinting lays the theme colour through
that alpha and draws the artwork back in luminosity, so a recoloured frame keeps
every highlight the gold was photographed with. Hairlines run in from each corner
to a lotus at the centre, which is what stops four ornaments reading as four
unrelated pictures.

**All of it is static.** The frame is stationery: it renders once, finished, and
never moves. There is no reveal, no sweep, no shimmer, no pointer response and
no scroll response — not disabled, *removed*, along with the state and the
listeners that drove them. The animation lives on the envelope, where it belongs;
by the time the card becomes the invitation the gold is already struck.
**Admin → ស៊ុមក្បាច់ខ្មែរ** carries only the emboss and its depth; the frame's
size lives with the other frame settings under **រូបរាង**.

Two things keep the ornament off the writing, and they are belt and braces:

- **The frame is structural, not an overlay.** `FrameEdge` renders the head and
  foot as siblings of the scroll region rather than floating over it, so content
  is clipped by the region and *cannot* appear beneath the gold, at any width or
  scroll position. An overlay with a z-index would only make it unlikely.
- **`.frame-safe`** adds explicit, viewport-scaled breathing room inside the
  region, so the title never comes up against the ornament even at the tightest
  width. Content wins that measurement by default.

---

## 🎨 Theme

**Admin → រូបរាង** controls the whole visual identity at runtime: five colours,
the Khmer heading and body fonts, the frame, and two size sliders — **ទំហំក្បាច់**
(frame, 30–100%) and **ទំហំអក្សរទាំងមូល** (type, 70–140%). The type slider scales
the invitation's root font size, so text and the spacing around it move together
in proportion.

**ក្បាច់ជាប់នឹងអេក្រង់** holds the frame on screen and scrolls the invitation
inside it. Switch it off and the whole card scrolls with the page instead. The values are
injected as CSS custom properties, so changes apply instantly without a rebuild.

The single gold you pick is expanded into a four-stop metallic ramp, and the
stage colour is derived from the paper colour, so a palette change stays
coherent across the frame, dividers and buttons. Four ready-made palettes are
included; the default is cotton paper, dark brown ink and antique gold.

### The card frame

The card is crowned by an ornament band, mirrored at its foot, with hairline
rules joining the two. **Admin → រូបរាង → ស៊ុមសំបុត្រ** offers two sources:

**Built-in** — three kinds:

- *Band artwork* (`kbach`, the default) — gold Khmer kbach across the head and
  foot, from artwork in `public/frames` (see the note there about rights).
- *Corner artwork* (`royal`, `royal-light`) — one ornament mirrored into all
  four corners.
- *Generated bands* (`lotus`, `flame`, `angkor`, `wheel`) — drawn by
  `scripts/ornament-source.mjs`; edit that and re-run
  `node scripts/emit-ornaments.mjs` rather than hand-editing the component.

**Your own artwork** — upload a band and the app uses it instead. This is the
right route for professionally drawn Khmer kbach, which no generator will match.

| | |
|---|---|
| Format | PNG with a transparent background, or SVG |
| Width | 1200–2000px recommended; it is scaled to the card width |
| Height | Anything — the side rules fill whatever space the bands leave |
| Layout | *Band* (head and foot) or *Corner* (mirrored into all four) |
| What to upload | Band: the **top** band only, mirrored for the foot unless you upload a separate one. Corner: the **top-left** corner only, mirrored into the other three. |

Don't upload a complete four-sided frame as one image: the card grows with its
content, so a fixed frame would stretch. Top and bottom bands plus the side
rules give the same look at any length. You can also paste an image URL instead
of uploading, and turn the side rules off if your artwork already has edges.

The cover monogram (**Admin → ព័ត៌មានអាពាហ៍ពិពាហ៍**) and an optional Latin form
of each guest's name (**Admin → ភ្ញៀវ**) let the cover read the way a printed
card does — `Mr. Theng Rathrongroeung` above the open button.

---

## 🗂️ Project structure

```
src/
├── app/
│   ├── page.tsx                 # public invitation
│   ├── invite/[code]/page.tsx   # personalised invitation
│   ├── admin/                   # dashboard (protected by middleware)
│   └── api/                     # REST API + media, QR, OG image, CSV export
├── components/
│   ├── invitation/              # cover, couple, countdown, gallery, RSVP …
│   ├── admin/                   # dashboard forms and tables
│   └── ui/                      # card frame, ornament bands, monogram
├── lib/
│   ├── db/                      # Drizzle schema + connection
│   ├── khmer.ts                 # Khmer numerals, dates, time zone handling
│   ├── auth.ts                  # JWT session helpers
│   └── rate-limit.ts
└── middleware.ts                # guards every /admin route
drizzle/                         # generated SQL migrations
scripts/                         # migrate, seed, optional font download
```

### npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build and server |
| `npm run db:setup` | Migrate **and** seed in one step |
| `npm run db:migrate` | Apply pending SQL migrations (tracked in a ledger table) |
| `npm run db:seed` | Insert demo content + create the admin user |
| `npm run db:generate` | Regenerate migrations after editing the schema |
| `npm run db:studio` | Drizzle Studio (browse the database) |
| `npm run fonts:download` | Self-host the Khmer web fonts in `public/fonts` |
| `node scripts/emit-ornaments.mjs` | Regenerate the ornament band SVG component |

---

## 🔒 Security

- Passwords hashed with bcrypt (cost 12); login is rate limited and compares a
  dummy hash for unknown accounts so timing does not leak which emails exist.
- Sessions are signed JWTs in an `httpOnly`, `SameSite=Lax`, `Secure` cookie.
- `src/middleware.ts` blocks every `/admin` route without a valid session, and
  each mutating API route re-checks the session **and** the request origin.
- All input validated with Zod; uploads are checked for MIME type, size (6 MB
  images / 12 MB audio) **and** magic bytes.
- RSVP submissions are rate limited (5 per 10 minutes per IP).
- Guests can only ever read their own invitation — there is no guest listing
  endpoint on the public side.

### Administrator accounts

**Admin → គណនីគ្រប់គ្រង** is where you change your own password and add the
other people who should be able to sign in. Changing your own password asks for
the current one — the session proves who you are, but not that you are the one
at the keyboard. New passwords are at least ten characters. Deleting your own
account, or the last remaining one, is refused, so the dashboard can never be
locked away from everybody.

**Before going live:** set a strong `AUTH_SECRET`, change the admin password,
and never commit your `.env`.

---

## ⚡ Performance notes

Built for Cambodian mobile networks and in-app browsers (Telegram, Messenger,
Facebook):

- ~114 kB of JavaScript on first load; no animation library.
- Images lazy-loaded and served with immutable cache headers.
- The Google Map only loads when the guest taps it.
- Scroll-reveal animations use one `IntersectionObserver` and are disabled for
  `prefers-reduced-motion`.
- Uploads are stored in the database, so the app works on read-only serverless
  filesystems without any external object storage.
- If `fonts.googleapis.com` is slow on your guests’ networks, run
  `npm run fonts:download` once and the fonts are served from your own domain.

---

## 🇰🇭 Khmer typography

Khmer script is never letter-spaced (it breaks the clusters) and uses generous
line-height. Headings use **Noto Serif Khmer**, body text **Noto Sans Khmer**,
and Latin accents **Cormorant Garamond**. Dates are formatted in a fixed time
zone (`Asia/Phnom_Penh`, override with `NEXT_PUBLIC_TIMEZONE`) so the server and
the guest’s phone always agree.

---

## 📄 Licence

Private project. The demo content (សុខ វិសាល & លីន ស្រីពៅ) is placeholder data —
replace it in the dashboard before sending any invitation.
