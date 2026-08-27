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
| 💌 Card cover | Monogram, the guest's name, and one button — like lifting an envelope flap |
| 🙏 Formal invitation | Respectful Khmer wording, personalised with the guest’s name |
| 👰 Couple section | Both families, parents’ names and portraits |
| 📅 Date + countdown | Khmer numerals, Buddhist era, live countdown that turns into a congratulation |
| 🗓️ Wedding programme | Grouped by ពេលព្រឹក / ពេលល្ងាច, fully configurable |
| 📍 Venue | Address, “បើក Google Maps” button, click-to-load embedded map |
| 💞 Love story | Optional alternating timeline |
| 🖼️ Gallery | Masonry grid with a full-screen lightbox (swipe, keyboard, arrows) |
| ✅ RSVP | Name, phone, attending, guest count, blessing message |
| 🎁 ចំណងដៃ | ABA / ACLEDA / Wing accounts, QR codes, copy-to-clipboard |
| 🎵 Music | Floating player that only ever starts from a user gesture |
| 📞 Contact | `tel:` buttons for the groom and bride |
| 🔗 Sharing | Telegram, Facebook, Messenger, copy link, Open Graph preview image |
| 🧾 Desktop rails | Date and venue at a glance; the guest's QR code and live RSVP status |

**Admin dashboard** (`/admin`) — statistics, wedding information, programme &
love story, gallery, guests with personalised links and QR codes, RSVP list with
search/filter/CSV export, gift accounts, music, and a live theme editor.

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
whole list (`ឈ្មោះ, លេខទូរស័ព្ទ, ចំនួនកៅអី` — one guest per line), then copy the
link, download the QR code as PNG, or share straight to Telegram.

---

## 🎨 Theme

**Admin → រូបរាង** controls the whole visual identity at runtime: five colours,
the Khmer heading and body fonts, and the decorative pattern. The values are
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
