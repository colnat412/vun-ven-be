export const CATEGORY_ICON_IDS = [
  "utensils",
  "coffee",
  "bike",
  "car",
  "shopping-bag",
  "receipt",
  "gamepad",
  "heart",
  "home",
  "book",
  "gift",
  "plane",
  "briefcase",
  "wallet",
  "music",
  "paw",
  "leaf",
  "ellipsis",
] as const;

export function isCategoryIcon(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== "string" || value.length > 64) return false;
  if (CATEGORY_ICON_IDS.some((id) => id === value)) return true;
  if (!value.startsWith("emoji:")) return false;
  const emoji = value.slice(6);
  return (
    [...new Intl.Segmenter("vi", { granularity: "grapheme" }).segment(emoji)]
      .length === 1 &&
    /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(emoji)
  );
}
