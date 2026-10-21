# Frame artwork

**kbach-top.png**, **kbach-bottom.png** — gold Khmer kbach bands for the head
and foot of the card. The supplied files had their transparency flattened onto
a checkerboard, so `scripts/dekey-checkerboard.py` restored it: the checker is
two neutral greys while the ink is chromatic, so alpha comes from chroma plus a
darkness term, the ornament's interior is filled so pale highlights are not
punched through, and pixels matching a checker tone are never revived — which is
what keeps the gaps between the scrolls open.

The royal corner frames that used to live here were removed when the couple
narrowed the frames to the vintage flourish corners (`/kit/flourish/`) and
this kbach band.

> These files came from artwork the project owner provided. If you reuse this
> project, replace them with artwork you hold the rights to, or upload your own
> through **Admin → រូបរាង → ស៊ុមសំបុត្រ**.
