# Frame artwork

**kbach-top.png**, **kbach-bottom.png** — gold Khmer kbach bands for the head
and foot of the card. The supplied files had their transparency flattened onto
a checkerboard, so `scripts/dekey-checkerboard.py` restored it: the checker is
two neutral greys while the ink is chromatic, so alpha comes from chroma plus a
darkness term, the ornament's interior is filled so pale highlights are not
punched through, and pixels matching a checker tone are never revived — which is
what keeps the gaps between the scrolls open.

**royal-corner.png**, **royal-light-corner.png** — gold corner ornaments,
extracted from artwork supplied by the couple. Each is one top-left corner; the
app mirrors it into the other three, so the four corners always match.

The paper background was lifted to transparency by treating the ink as a
multiply layer over the sampled paper colour: alpha comes from the darkest
channel ratio and the colour is then un-premultiplied, which preserves the
shading and anti-aliased edges instead of hard-keying and leaving a fringe.

> These files came from artwork the project owner provided. If you reuse this
> project, replace them with artwork you hold the rights to, or upload your own
> through **Admin → រូបរាង → ស៊ុមសំបុត្រ**.
