/**
 * A typed "02" in a number box stays "02": React leaves the box alone because
 * it means the same number as the state (2). Rewrite the box itself so it
 * shows the plain number — 02 → 2, 007 → 7 (a lone 0 and decimals like 0.5
 * are left as they are).
 */
export function dropLeadingZeros(input: HTMLInputElement) {
  const v = input.value;
  const plain = v.replace(/^(-?)0+(?=\d)/, "$1");
  if (plain !== v) input.value = plain;
}
