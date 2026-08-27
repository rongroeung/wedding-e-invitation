/**
 * Generates elegant SVG placeholder artwork for the demo gallery so a freshly
 * seeded site still looks finished before real photographs are uploaded.
 */
const PALETTES: [string, string, string][] = [
  ["#F6EBD8", "#E4CE9B", "#7B1F2F"],
  ["#F3E3E4", "#D9B6A3", "#6B1B2B"],
  ["#EFE7DA", "#C8A24A", "#3E2A20"],
  ["#F7F1E6", "#E8D5A9", "#8F6B22"],
  ["#EDE4E4", "#C9A6A6", "#7B1F2F"],
  ["#F2EDE2", "#D8C08A", "#4A3226"],
];

export function placeholderPhoto(caption: string, index = 0): string {
  const [bg, mid, ink] = PALETTES[index % PALETTES.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" role="img" aria-label="${escapeXml(caption)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="55%" stop-color="${mid}" stop-opacity=".55"/>
      <stop offset="100%" stop-color="${bg}"/>
    </linearGradient>
    <radialGradient id="v" cx="50%" cy="42%" r="70%">
      <stop offset="60%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="${ink}" stop-opacity=".14"/>
    </radialGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#g)"/>
  <rect width="800" height="1000" fill="url(#v)"/>
  <g fill="none" stroke="${ink}" stroke-opacity=".28" stroke-width="1.4">
    <rect x="36" y="36" width="728" height="928" rx="6"/>
    <rect x="50" y="50" width="700" height="900" rx="4" stroke-opacity=".16"/>
  </g>
  <g transform="translate(400 470)" fill="${ink}" fill-opacity=".22">
    <path d="M0-96C24-52 40-22 40 6c0 26-18 44-40 44S-40 32-40 6C-40-22-24-52 0-96Z"/>
    <path d="M-46-46c-30 26-46 54-44 82 2 26 22 42 44 40 10-1 18-6 24-13-16-24-24-52-24-84Z" fill-opacity=".7"/>
    <path d="M46-46c30 26 46 54 44 82-2 26-22 42-44 40-10-1-18-6-24-13 16-24 24-52 24-84Z" fill-opacity=".7"/>
    <path d="M-96 6c-4 30 10 56 34 68 22 11 46 6 62-10-30-8-62-28-96-58Z" fill-opacity=".45"/>
    <path d="M96 6c4 30-10 56-34 68-22 11-46 6-62-10 30-8 62-28 96-58Z" fill-opacity=".45"/>
  </g>
  <circle cx="400" cy="470" r="170" fill="none" stroke="${ink}" stroke-opacity=".2" stroke-width="1"/>
</svg>`;
}

function escapeXml(value: string) {
  return value.replace(/[<>&"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c] as string,
  );
}
