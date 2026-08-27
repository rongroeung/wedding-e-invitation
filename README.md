# 🇰🇭 សិរីមង្គលអាពាហ៍ពិពាហ៍ — Formal Khmer Wedding E-Invitation

A premium, mobile-first Cambodian wedding e-invitation with a complete admin
dashboard. Every word a guest sees is in formal Khmer; every value is editable
from the dashboard — nothing is hard-coded.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind CSS · Drizzle ORM · PostgreSQL**.

---

## ✨ What is included

**Guest-facing invitation** (`/` and `/invite/<code>`)

| | |
|---|---|
| 💌 Envelope cover | Full-screen cover with a gold-foil card that opens into the invitation |
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
https://your-domain.com/invite/theng-rathrongroeung
https://your-domain.com/invite/ABC123
```

The invitation then greets them by name (`សូមគោរពអញ្ជើញ លោក …`), pre-fills the
RSVP form, and every open is counted on the dashboard.

In **Admin → ភ្ញៀវ & តំណអញ្ជើញ** you can add guests one at a time or paste a
whole list (`ឈ្មោះ, លេខទូរស័ព្ទ, ចំនួនកៅអី` — one guest per line), then copy the
link, download the QR code as PNG, or share straight to Telegram.

---

## 🎨 Theme

**Admin → រូបរាង** controls the whole visual identity at runtime: five colours,
the Khmer heading and body fonts, and the decorative pattern (lotus, Angkor,
floral or none). The values are injected as CSS custom properties, so changes
apply instantly without a rebuild.

Four ready-made palettes are included, the default being champagne gold, royal
gold, deep burgundy and ivory.

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
│   └── ui/                      # Khmer ornaments (hand-drawn inline SVG)
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
| `npm run db:migrate` | Apply the SQL migrations |
| `npm run db:seed` | Insert demo content + create the admin user |
| `npm run db:generate` | Regenerate migrations after editing the schema |
| `npm run db:studio` | Drizzle Studio (browse the database) |
| `npm run fonts:download` | Self-host the Khmer web fonts in `public/fonts` |

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
