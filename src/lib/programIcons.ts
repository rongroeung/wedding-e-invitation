/**
 * The programme's ceremony icons, taken from the couple's own printed agenda
 * (public/program-icons, alpha masks), and one drawn to match them for
 * ពិធីយកពាលាជ័យ, which the agenda left without (peala-chey: a folded
 * banana-leaf cone on a footed offering bowl), and ចៅមហានិយាយជើងការ រាប់ផ្លែឈើ
 * (chao-moha: a footed tray heaped with fruit to be counted; source in
 * scripts/icons/chao-moha.svg). An event's `icon` names one as
 * `pi:<key>`; anything else in that field is shown as typed (an emoji).
 */
export const PROGRAM_ICONS = [
  { key: "guests", km: "ភ្ញៀវកិត្តិយស" },
  { key: "procession", km: "ហែជំនូន" },
  { key: "offering-bowl", km: "ពានជំនូន" },
  { key: "chao-moha", km: "ចៅមហា · រាប់ផ្លែឈើ" },
  { key: "dining", km: "អាហារ" },
  { key: "haircut", km: "កាត់សក់" },
  { key: "khan-sla", km: "ខាន់ស្លា" },
  { key: "bok-leak", km: "បុកល័ក្ខ" },
  { key: "peala-chey", km: "យកពាលាជ័យ" },
  { key: "couple-feast", km: "សំពះផ្ទឹម" },
  { key: "toast", km: "ពិសាអាហារល្ងាច" },
] as const;

export function programIconSrc(icon: string): string | null {
  if (!icon.startsWith("pi:")) return null;
  const key = icon.slice(3);
  return PROGRAM_ICONS.some((i) => i.key === key) ? `/program-icons/${key}.png` : null;
}
