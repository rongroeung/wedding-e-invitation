# Flowers, five new papers, six new animations, envelope animation, a living butterfly

## 1. Settings: one card
The old "រូបភាពផ្ទៃខាងក្រោយ" card is now part of "ក្រដាស និងចលនា"
(`admin/ThemeForm.tsx`). The merged card has, in order:
1. the paper swatches;
2. the couple's own paper (a design or an uploaded picture);
3. animation and its intensity;
4. the page background;
5. the guest panel toggle.

Choosing a design or uploading a picture for the card now selects
"ក្រដាសរបស់គូស្វាមីភរិយា" automatically.

## 2. Papers rebuilt with flowers (`scripts/kbach-paper.py`)
The generator now draws in five layers: foil, blind emboss, petals, flower
hearts and leaves. Later shapes cover earlier ones in both colour and height,
so overlapping petals show real edges in the relief.

How the flowers are drawn:
- every petal has a colour gradient from base to tip, is shaped like a cupped
  dome, and has fine vein grooves;
- leaves have a carved midrib and side veins;
- the colour layers look like watercolour: the colour gathers at the edges,
  varies across the sheet and bleeds slightly into the paper.

**Flowers drawn here:**
- lotus, open from the side and open from above, and buds;
- lotus pads;
- rumduol;
- frangipani (champa);
- jasmine and its buds;
- roses and rosebuds.

**Seven seamless patterns.** Each pattern has five neutral tiles; CSS supplies
the colours. All tiles together come to 628 KB.

| Pattern | What it shows |
|---|---|
| damask | kbach sprays, a lotus at the heart, rumduol, champa and jasmine with leaves along the vines |
| silk | a hol lattice with lotus blooms and leaves |
| lotus | a lotus pond with kbach water waves |
| rumduol | an ogee trellis with rumduol clusters |
| champa | frangipani clusters with kbach sprays |
| rose | roses in kbach cartouches |
| jasmine | a night net of kbach and jasmine |

## 3. Five new papers
| Paper | Colours |
|---|---|
| សួនផ្ការំដួល · Rumduol Garden | cream, butter-yellow rumduol, gold trellis |
| ឈូករាជ · Royal Lotus | celadon, pink lotus, jade pads, gold waves |
| ផ្កាចំប៉ាពណ៌គុជ · Champa Pearl | pearl, cream frangipani, saffron hearts |
| សួនផ្កាកុលាប · Rose Garden | dusty rose, deeper roses, rose-gold kbach |
| រាត្រីអង្គរ · Midnight Angkor | night blue, gold kbach, ivory jasmine |

Midnight Angkor is a dark paper: like Deep Burgundy, the writing on it turns
light (`DARK_PAPERS` in `lib/appearance.ts`).

The original five papers now use the floral damask (Khmer Heritage uses the
silk lattice).

## 4. Six new animations (`appearance/fxModes.ts`)
| Animation | What it does |
|---|---|
| មេអំបៅហើរ · Butterflies | Wingbeats lift the body on each downstroke. They glide with open wings and make wandering turns. They land, rest with slowly opening wings, then take off. The wings fold in 3D and catch the light, and a shadow falls further and softer in flight. |
| អំពិលអំពែក · Fireflies | Lights drift and blink: a quick swell, a glow, a slow fade. |
| ផ្កាម្លិះ និងចំប៉ាជ្រុះ · Falling Blossoms | Whole frangipani and jasmine flowers spin and tumble as they fall, with shadows. |
| ស្លឹកមាស · Gold Leaf | Crinkled gold-leaf flakes turn as they fall and flash when a facet meets the light. |
| ផ្កាយភ្លឺ · Starlight | Stars at different depths twinkle, with an occasional shooting star. |
| ពន្លឺព្រះអាទិត្យ · Sunbeams | Shafts of light breathe, and motes brighten as they cross them. |

The guest panel now shows animations in two columns.

## 5. The envelope's background (`envelope/RoomFx.tsx`)
The envelope's room plays the same animation as the card: the couple's
default, or the guest's own saved choice. It uses the room's palette, in which
the gold glows. Reduced motion turns it off unless the guest chose an
animation themselves.

## 6. The logo butterfly (`ui/Butterfly.tsx`)
This butterfly sits on the name logo, on the envelope flap and on the cover.
- **Artwork:** split into two wings and a body (`kit/butterfly-wing.svg`,
  `kit/butterfly-body.svg`). Each wing folds in 3D and darkens as it rises.
- **Behaviour:**
  - while resting, it slowly opens and closes its wings;
  - every few seconds it gives a quick burst of wingbeats;
  - every 9–18 seconds it takes off, makes a small loop facing its direction of
    travel, lifts off the paper (its shadow grows and softens), then lands and
    settles.
- **Entrance:** during the logo's entrance it flaps quickly.
- **Efficiency:** it stops when off screen and stays still under reduced
  motion.

## Tests run
All tests used Playwright with Chromium on a production build.
- **Seven sizes, full test:**
  - the envelope opening;
  - the cover with no clipping, no collisions and the button visible;
  - all 12 sections, with no overflow and no errors.
- **Opening suite:** 18/18 passed.
- **Curtain:** 390 and 1440, both clean.
- **Guest panel:** all checks passed, including the eleven papers and eleven
  animations; the panel scrolls within the screen.
- **All ten papers** on a phone and on a desktop, with no failed requests and
  no errors. The writing turns light on the two dark papers.
- **New animations:** all six on ivory and midnight, at high intensity, on a
  phone at 2×. Every one renders and moves, at about 46–58 frames per second
  in a headless browser.
- **Original animations:** all five still work at their usual counts.
- **Envelope room:** butterflies, dust and starlight at 390, and fireflies at
  1280. The animation canvas sits behind the envelope and does not block taps.
- **Logo butterfly:**
  - on the envelope flap, the wing angle ranged from 8° to 65° over 1.5
    seconds;
  - on the cover over 20 seconds, it went from 8° to 78°, flew out up to 88% of
    its own width and back, and was photographed mid-flight.
- **Settings:**
  - the merged card renders, and the old card is gone;
  - choosing a card design selects the couple's paper;
  - saving Midnight Angkor with Butterflies reached a new guest, and the
    defaults were then restored to Classic Ivory with Gold Dust.

**Not tested:** Safari and real phones, including frame rate on a mid-range
phone.
