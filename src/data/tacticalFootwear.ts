import type { ProductSpec } from "@/components/ProductCard";

export interface ColorVariant {
  label: string;
  image?: string;
  swatch?: string;
}

export interface SpecSheet {
  title: string;
  image: string;
}

export interface FootwearProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  images: string[];
  specs: ProductSpec[];
  sizes?: string[];
  colorVariants?: ColorVariant[];
  specSheets?: SpecSheet[];
}

const FOOTWEAR_SIZES = ["6", "7", "8", "9", "10", "11"];

export const tacticalFootwearProducts: FootwearProduct[] = [
  {
    id: "kritex-pt-shoe-white",
    name: "Kritex PT Shoe — White",
    category: "PT / Training Footwear",
    description:
      "Lightweight training shoe built for daily physical training, drill, and parade routines, with a breathable construction for extended wear.",
    images: [
      "/products/kritex-pt-shoes-white/kritex-ptShoes-white-1.png",
      "/products/kritex-pt-shoes-white/kritex-ptShoes-white-2.png",
      "/products/kritex-pt-shoes-white/kritex-ptShoes-white-3.png",
      "/products/kritex-pt-shoes-white/kritex-ptShoes-white-4.png",
    ],
    specs: [
      { label: "Upper", value: "Breathable mesh with synthetic overlays" },
      { label: "Sole", value: "Moulded EVA, cushioned midsole" },
      { label: "Closure", value: "Lace-up, reinforced eyelets" },
      { label: "Colourway", value: "White" },
    ],
    sizes: FOOTWEAR_SIZES,
  },
  {
    id: "kritex-pt-shoe-black",
    name: "Kritex PT Shoe — Black",
    category: "PT / Training Footwear",
    description:
      "Lightweight training shoe built for daily physical training, drill, and parade routines, with a breathable construction for extended wear.",
    images: [
      "/products/kritex-pt-shoes-black/kritex-ptShoes-black-1.png",
      "/products/kritex-pt-shoes-black/kritex-ptShoes-black-2.png",
      "/products/kritex-pt-shoes-black/kritex-ptShoes-black3.png",
      "/products/kritex-pt-shoes-black/kritex-ptShoes-black4.png",
    ],
    specs: [
      { label: "Upper", value: "Breathable mesh with synthetic overlays" },
      { label: "Sole", value: "Moulded EVA, cushioned midsole" },
      { label: "Closure", value: "Lace-up, reinforced eyelets" },
      { label: "Colourway", value: "Black" },
    ],
    sizes: FOOTWEAR_SIZES,
  },
  {
    id: "liberty-jungle-boot",
    name: "Liberty Warrior Jungle Boot",
    category: "Combat Footwear",
    description:
      "Olive Defence Jungle Boot from Liberty's Warrior — Multi Terrain Professional line, built with a hard toe and rugged multi-terrain lug outsole for wet and rugged terrain.",
    images: [
      "/products/liberty-jungle-boot/liberty-jungle-boot-1.jpg",
      "/products/liberty-jungle-boot/liberty-jungle-boot-2.jpg",
      "/products/liberty-jungle-boot/liberty-jungle-boot-3.jpg",
      "/products/liberty-jungle-boot/liberty-jungle-boot-4.jpg",
    ],
    specs: [
      { label: "Upper", value: "Canvas" },
      { label: "Sole", value: "Rugged multi-terrain lug outsole" },
      { label: "Closure", value: "Lace-up" },
      { label: "Toe", value: "Hard toe" },
      { label: "Colourway", value: "Olive/Black with camo trim" },
    ],
    sizes: FOOTWEAR_SIZES,
  },
  {
    id: "sega-dms-boot",
    name: "Sega DMS Boot",
    category: "Combat Footwear",
    description:
      "Standard-issue DMS ankle boot from Sega's Armed Forces line, with a side-zip for quick don and a genuine leather upper for general duty wear.",
    images: [
      "/products/sega-dms-boot/sega-dms-boot-1.png",
      "/products/sega-dms-boot/sega-dms-boot-2.png",
      "/products/sega-dms-boot/sega-dms-boot-3.png",
    ],
    specs: [
      { label: "Upper", value: "Genuine leather" },
      { label: "Sole", value: "Rubber outsole with Phylon midsole" },
      { label: "Closure", value: "Lace-up with side zipper" },
      { label: "Colourway", value: "Black" },
    ],
    sizes: FOOTWEAR_SIZES,
  },
  {
    id: "cosmo-dms-boot",
    name: "Cosmo DMS Boot",
    category: "Combat Footwear",
    description: "Direct Moulded Sole ankle boot from Cosmo — \"The Soldier Choice\" — built for standard-issue duty wear.",
    images: [
      "/products/cosmo-dms-boot/cosmo-dms-boot-1.jpeg",
      "/products/cosmo-dms-boot/cosmo-dms-boot-2.jpeg",
      "/products/cosmo-dms-boot/cosmo-dms-boot-3.jpeg",
      "/products/cosmo-dms-boot/cosmo-dms-boot-4.jpeg",
    ],
    specs: [
      { label: "Upper", value: "Leather" },
      { label: "Sole", value: "Moulded sole" },
      { label: "Closure", value: "Lace-up" },
      { label: "Colourway", value: "Black" },
    ],
    sizes: FOOTWEAR_SIZES,
  },
  {
    id: "olive-green-jungle-boot",
    name: "Olive Green Jungle Boot",
    category: "Jungle Boots",
    description:
      "High-ankle jungle boot in durable olive green textile with a heavy-duty grip sole and padded ankle support for tactical, outdoor and industrial applications.",
    images: ["/products/olive-green-jungle-boot/olive-green-jungle-boot-1.png"],
    specs: [
      { label: "Upper", value: "Durable Olive Green Textile" },
      { label: "Design", value: "High-Ankle Construction" },
      { label: "Toe", value: "Reinforced Protective Toe" },
      { label: "Sole", value: "Heavy-Duty Grip Sole" },
      { label: "Closure", value: "Secure Lace-Up System" },
      { label: "Colourway", value: "Olive Green/Black" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/jungle-boots-defence-sheet.png" }],
  },
  {
    id: "liberty-warrior-dms-boot",
    name: "Liberty Warrior DMS Boot",
    category: "Jungle Boots",
    description:
      "Side-zip jungle boot crafted from genuine black leather with hard toe protection, built for defence, security and tactical use.",
    images: ["/products/liberty-warrior-dms-boot/liberty-warrior-dms-boot-1.png"],
    specs: [
      { label: "Material", value: "Genuine Leather" },
      { label: "Closure", value: "Lace-Up with Side Zip" },
      { label: "Toe", value: "Hard Toe Protection, Round" },
      { label: "Heel", value: "Flat" },
      { label: "Colourway", value: "Classic Black" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/jungle-boots-warrior-sheet.png" }],
  },
  {
    id: "freedom-jungle-boot",
    name: "Freedom Olive Green Casual Lacing Defence Jungle Boot",
    category: "Jungle Boots",
    description:
      "Olive green canvas jungle boot with an EVA sole and mid-heel construction, built for defence and field use.",
    images: ["/products/freedom-jungle-boot/freedom-jungle-boot-1.png"],
    specs: [
      { label: "Upper", value: "Durable Canvas" },
      { label: "Lining", value: "Fabric" },
      { label: "Sole", value: "EVA" },
      { label: "Closure", value: "Lace-Up" },
      { label: "Heel", value: "Mid Heel" },
      { label: "Colourway", value: "Olive Green" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/jungle-boots-warrior-sheet.png" }],
  },
  {
    id: "side-zip-jungle-boot",
    name: "Side Zip Jungle Boot",
    category: "Jungle Boots",
    description:
      "Ankle-height canvas jungle boot with a polyurethane sole and reinforced round toe, built for defence, security and outdoor use.",
    images: ["/products/side-zip-jungle-boot/side-zip-jungle-boot-1.png"],
    specs: [
      { label: "Upper", value: "Durable Canvas" },
      { label: "Shaft", value: "Ankle Height" },
      { label: "Closure", value: "Lace-Up" },
      { label: "Toe", value: "Round / Reinforced" },
      { label: "Sole", value: "Polyurethane (PU)" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/jungle-boots-warrior-sheet.png" }],
  },
  {
    id: "tactical-combat-boot",
    name: "Tactical Combat Boot",
    category: "Tactical Boots",
    description:
      "Built for demanding operations and rugged terrain, this tactical boot delivers superior durability, grip and comfort with a waterproof suede leather upper.",
    images: ["/products/tactical-combat-boot/tactical-combat-boot-1.png"],
    specs: [
      { label: "Upper", value: "Waterproof Suede Leather & Textile" },
      { label: "Lining", value: "Breathable Recycled Mesh" },
      { label: "Footbed", value: "Removable EVA Foam" },
      { label: "Midsole", value: "Shock-Absorbing Compound" },
      { label: "Outsole", value: "High-Traction Rubber" },
      { label: "Colourway", value: "Desert Tan" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/tactical-boots-combat-sheet.png" }],
  },
  {
    id: "black-high-ankle-tactical-boot",
    name: "Black High Ankle Tactical Boot",
    category: "Tactical Boots",
    description:
      "High-ankle tactical boot with a leather and breathable mesh upper, reinforced toe and heavy-duty anti-slip sole for tactical, defence and security applications.",
    images: ["/products/black-high-ankle-tactical-boot/black-high-ankle-tactical-boot-1.png"],
    specs: [
      { label: "Upper", value: "Leather & Breathable Mesh" },
      { label: "Design", value: "High-Ankle" },
      { label: "Toe", value: "Reinforced" },
      { label: "Sole", value: "Heavy-Duty Anti-Slip" },
      { label: "Closure", value: "Lace-Up" },
      { label: "Colourway", value: "Black" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/tactical-boots-combat-sheet.png" }],
  },
  {
    id: "olive-green-tactical-boot",
    name: "Olive Green Tactical Boot",
    category: "Tactical Boots",
    description:
      "GORE-TEX waterproof tactical boot with a suede leather and textile upper, high-grip rubber sole and padded ankle support, built for outdoor and defence use.",
    images: ["/products/olive-green-tactical-boot/olive-green-tactical-boot-1.png"],
    specs: [
      { label: "Upper", value: "Suede Leather & Textile" },
      { label: "Waterproofing", value: "GORE-TEX" },
      { label: "Sole", value: "High-Grip Rubber" },
      { label: "Weight", value: "Approx. 600 g" },
      { label: "Colourway", value: "Brown / Green" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/tactical-boots-combat-sheet.png" }],
  },
  {
    id: "tactical-zip-boot",
    name: "Tactical Zip Boot",
    category: "Tactical Boots",
    description:
      "High-ankle tactical boot with a synthetic leather and mesh upper, side-zip lace-up closure and heavy-duty grip sole for tactical, defence and security use.",
    images: ["/products/tactical-zip-boot/tactical-zip-boot-1.png"],
    specs: [
      { label: "Upper", value: "Synthetic Leather & Mesh" },
      { label: "Closure", value: "Lace-Up with Side Zip" },
      { label: "Sole", value: "Heavy-Duty Grip Sole" },
      { label: "Toe", value: "Reinforced Protection" },
      { label: "Colourway", value: "Black / Green / Desert Tan" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/tactical-boots-zip-sheet.png" }],
  },
  {
    id: "light-brown-tactical-boot",
    name: "Light Brown Tactical Boot",
    category: "Tactical Boots",
    description:
      "High-ankle tactical boot in durable suede and textile with a breathable mesh lining and heavy-duty high-grip sole, built for tactical and outdoor use.",
    images: ["/products/light-brown-tactical-boot/light-brown-tactical-boot-1.png"],
    specs: [
      { label: "Upper", value: "Durable Suede & Textile" },
      { label: "Closure", value: "Lace-Up with Side Zip" },
      { label: "Lining", value: "Breathable Mesh" },
      { label: "Sole", value: "Heavy-Duty High-Grip" },
      { label: "Colourway", value: "Coyote / Desert Tan" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/tactical-boots-zip-sheet.png" }],
  },
  {
    id: "side-zipper-tactical-boot",
    name: "Side Zipper Tactical Boot",
    category: "Tactical Boots",
    description:
      "High-ankle tactical boot in durable textile and synthetic material with a side-zip lace-up closure and high-grip rubber sole for tactical and security use.",
    images: ["/products/side-zipper-tactical-boot/side-zipper-tactical-boot-1.png"],
    specs: [
      { label: "Upper", value: "Durable Textile & Synthetic" },
      { label: "Closure", value: "Lace-Up with Side Zip" },
      { label: "Lining", value: "Breathable Mesh" },
      { label: "Sole", value: "High-Grip Rubber" },
      { label: "Colourway", value: "Black" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/tactical-boots-zip-sheet.png" }],
  },
  {
    id: "oscar-gum-boot",
    name: "Oscar Gum Boot",
    category: "Gum Boots",
    description:
      "Engineered for wet conditions with superior protection, strong grip and lasting durability, this 100% waterproof gum boot is built for safety and outdoor use.",
    images: ["/products/oscar-gum-boot/oscar-gum-boot-1.png"],
    specs: [
      { label: "Waterproofing", value: "100% Waterproof" },
      { label: "Construction", value: "Heavy-Duty & Durable" },
      { label: "Grade", value: "Industrial Grade" },
      { label: "Fit", value: "Comfort Fit" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/gum-boots-oscar-delta-sheet.png" }],
  },
  {
    id: "delta-gum-boot",
    name: "Delta Gum Boot",
    category: "Gum Boots",
    description:
      "Engineered for wet conditions with superior protection, strong grip and lasting durability, this 100% waterproof gum boot is built for safety and outdoor use.",
    images: ["/products/delta-gum-boot/delta-gum-boot-1.png"],
    specs: [
      { label: "Waterproofing", value: "100% Waterproof" },
      { label: "Construction", value: "Heavy-Duty & Durable" },
      { label: "Grade", value: "Industrial Grade" },
      { label: "Fit", value: "Comfort Fit" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/gum-boots-oscar-delta-sheet.png" }],
  },
  {
    id: "thor-atlas-gum-boot",
    name: "Thor & Atlas Gum Boot",
    category: "Gum Boots",
    description:
      "Extra-thick PVC gum boot with a steel toe cap rated to 200J impact protection, built for industrial, safety and outdoor use in wet conditions.",
    images: ["/products/thor-atlas-gum-boot/thor-atlas-gum-boot-1.png"],
    specs: [
      { label: "Height", value: "15.5\"" },
      { label: "Upper", value: "Extra-Thick PVC" },
      { label: "Sole", value: "Rubberized PVC, High-Grip, Low Abrasion" },
      { label: "Toe", value: "Steel Toe Cap – 200J" },
      { label: "Fit", value: "Anatomical & Comfortable" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/gum-boots-thor-isi-sheet.png" }],
  },
  {
    id: "isi-steel-toe-gum-boot",
    name: "ISI Steel Toe Series Gum Boot",
    category: "Gum Boots",
    description:
      "Heavy-duty, 100% waterproof PVC gum boot with a steel toe cap and anti-skid, oil-resistant sole, built for industrial and safety use.",
    images: ["/products/isi-steel-toe-gum-boot/isi-steel-toe-gum-boot-1.png"],
    specs: [
      { label: "Height", value: "15 Inches" },
      { label: "Upper", value: "Durable PVC" },
      { label: "Toe", value: "Steel Toe Cap" },
      { label: "Waterproofing", value: "100% Waterproof" },
      { label: "Sole", value: "Anti-Skid & Oil Resistant" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/gum-boots-thor-isi-sheet.png" }],
  },
];
