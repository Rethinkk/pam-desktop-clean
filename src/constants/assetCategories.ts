// src/constants/assetCategories.ts
export const ASSET_CATEGORIES = [
    "Bankrekeningen",
    "Beleggingen",
    "Onroerend goed",
    "Voertuigen",
    "Verzekeringen",
    "Pensioen",
    "Bedrijfsbelangen",
    "Kunst/collecties",
    "Cryptovaluta",
    "Contracten/licenties",
    "Overig"
  ] as const;
  export type AssetCategory = typeof ASSET_CATEGORIES[number];
  