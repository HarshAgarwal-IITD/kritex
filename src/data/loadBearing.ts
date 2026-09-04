import type { ProductSpec } from "@/components/ProductCard";
import type { ColorVariant, SpecSheet } from "@/data/tacticalFootwear";

export interface LoadBearingProduct {
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

export const loadBearingProducts: LoadBearingProduct[] = [
  {
    id: "rapid-20-tactical-backpack",
    name: "Rapid 20 Tactical Backpack",
    category: "Backpacks",
    description:
      "A rugged 20L tactical backpack built for mission and adventure, featuring a MOLLE system for modular attachments and multiple compartments for organized gear storage.",
    images: ["/products/rapid-20-tactical-backpack/rapid-20-tactical-backpack-1.png"],
    specs: [
      { label: "Material", value: "Premium 600D Polyester" },
      { label: "Hardware", value: "Heavy Duty YKK Zippers" },
      { label: "Capacity", value: "20 L" },
      { label: "Attachment", value: "MOLLE system for modular attachments" },
      { label: "Weather Resistance", value: "Water resistant & durable" },
      { label: "Straps", value: "Adjustable compression straps" },
    ],
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/rapid-20-backpack-sheet.png" }],
  },
];
