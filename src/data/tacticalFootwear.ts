import type { ProductSpec } from "@/components/ProductCard";

export interface FootwearProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  images: string[];
  specs: ProductSpec[];
}

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
  },
];
