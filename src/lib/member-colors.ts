/** Fixed member palette, chosen to read well on both the paper and ink themes. */
export const MEMBER_COLORS = [
  "#e2734a",
  "#4f8f6a",
  "#4a7dbf",
  "#b85c9e",
  "#c9a227",
  "#7a6bd0",
  "#2e9d97",
  "#c0574f",
] as const;

export const memberColorAt = (index: number) =>
  MEMBER_COLORS[index % MEMBER_COLORS.length];
