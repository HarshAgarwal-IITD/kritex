import type { ProductSpec } from "@/components/ProductCard";
import type { ColorVariant, SpecSheet } from "@/data/tacticalFootwear";

export interface ApparelProduct {
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

const APPAREL_SIZES = ["S", "M", "L", "XL", "XXL"];

export const combatApparelProducts: ApparelProduct[] = [
  {
    id: "combat-performance-tshirt",
    name: "Combat Performance T-Shirt",
    category: "T-Shirts",
    description:
      "Engineered for high performance in extreme conditions, this combat t-shirt combines moisture-wicking, quick-dry fabric with 4-way stretch for enhanced mobility. Lightweight, breathable and reinforced for long-lasting durability on duty.",
    images: ["/products/combat-performance-tshirt/combat-performance-tshirt-1.png"],
    specs: [
      { label: "Fit", value: "4-Way Stretch for enhanced mobility & flexibility" },
      { label: "Feature", value: "Quick Dry, Breathable, Moisture Wicking, Durable" },
    ],
    sizes: APPAREL_SIZES,
    colorVariants: [
      {
        label: "Olive Green",
        swatch: "/products/combat-performance-tshirt/combat-performance-tshirt-swatch-olive-green.png",
        image: "/products/combat-performance-tshirt/combat-performance-tshirt-olive-green.png",
      },
      {
        label: "Black",
        swatch: "/products/combat-performance-tshirt/combat-performance-tshirt-swatch-black.png",
        image: "/products/combat-performance-tshirt/combat-performance-tshirt-black.png",
      },
      {
        label: "Navy Blue",
        swatch: "/products/combat-performance-tshirt/combat-performance-tshirt-swatch-navy-blue.png",
        image: "/products/combat-performance-tshirt/combat-performance-tshirt-navy-blue.png",
      },
      {
        label: "Desert Tan",
        swatch: "/products/combat-performance-tshirt/combat-performance-tshirt-swatch-desert-tan.png",
        image: "/products/combat-performance-tshirt/combat-performance-tshirt-desert-tan.png",
      },
      {
        label: "Steel Grey",
        swatch: "/products/combat-performance-tshirt/combat-performance-tshirt-swatch-steel-grey.png",
        image: "/products/combat-performance-tshirt/combat-performance-tshirt-steel-grey.png",
      },
    ],
    specSheets: [
      { title: "Official Product Data Sheet", image: "/products/_spec-sheets/combat-performance-tshirt-sheet.png" },
      { title: "Available Colourways — Page 1", image: "/products/_spec-sheets/colours-tshirt-half-sleeve-1.png" },
      { title: "Available Colourways — Page 2", image: "/products/_spec-sheets/colours-tshirt-half-sleeve-2.png" },
    ],
  },
  {
    id: "og-polo-tshirt",
    name: "Tactical Combat OG Polo T-Shirt",
    category: "T-Shirts",
    description:
      "A rugged combat polo engineered for extreme conditions, combining breathable moisture-wicking fabric with reinforced construction for unrestricted movement in the field.",
    images: [
      "/products/og-polo-tshirt/og-polo-tshirt-1.png",
      "/products/og-polo-tshirt/og-polo-tshirt-2.png",
      "/products/og-polo-tshirt/og-polo-tshirt-3.png",
    ],
    specs: [
      { label: "Sleeve Fabric", value: "70% Cotton / 30% Polyester" },
      { label: "Torso Fabric", value: "80% Nylon / 20% Spandex" },
      { label: "Closure", value: "Original YKK® zippers" },
      { label: "Design", value: "Saddle-shoulder, two zippered bicep pockets, Velcro ID panels" },
      { label: "Best For", value: "Military, Law Enforcement, Security, Outdoor, Tactical Training" },
    ],
    sizes: APPAREL_SIZES,
    specSheets: [{ title: "Official Product Data Sheet", image: "/products/_spec-sheets/og-polo-tshirt-sheet.png" }],
  },
  {
    id: "full-sleeve-combat-tshirt",
    name: "Tactical Combat Full Sleeve T-Shirt",
    category: "T-Shirts",
    description:
      "A rugged tactical base layer built for outdoor, adventure, and on-field duty, combining breathable moisture-wicking fabric with ripstop reinforcement and functional combat detailing.",
    images: [
      "/products/full-sleeve-combat-tshirt/full-sleeve-combat-tshirt-1.png",
      "/products/full-sleeve-combat-tshirt/full-sleeve-combat-tshirt-2.png",
      "/products/full-sleeve-combat-tshirt/full-sleeve-combat-tshirt-3.png",
      "/products/full-sleeve-combat-tshirt/full-sleeve-combat-tshirt-4.png",
      "/products/full-sleeve-combat-tshirt/full-sleeve-combat-tshirt-5.png",
    ],
    specs: [
      { label: "Sleeve Fabric", value: "70% Cotton / 30% Polyester" },
      { label: "Torso Fabric", value: "80% Nylon / 20% Spandex" },
      { label: "Closure", value: "Original YKK® zippers" },
      { label: "Design", value: "Saddle-shoulder, bicep pockets, Velcro ID panels" },
      { label: "Best For", value: "Outdoor, adventure & on-field tactical base layer" },
    ],
    sizes: APPAREL_SIZES,
    specSheets: [
      { title: "Official Product Data Sheet", image: "/products/_spec-sheets/full-sleeve-combat-tshirt-sheet.png" },
      { title: "Available Colourways — Page 1", image: "/products/_spec-sheets/colours-tshirt-full-sleeve-1.png" },
      { title: "Available Colourways — Page 2", image: "/products/_spec-sheets/colours-tshirt-full-sleeve-2.png" },
    ],
  },
  {
    id: "tactical-cargo-pants",
    name: "Tactical Cargo Pants",
    category: "Combat Trousers",
    description:
      "Rugged cargo pants engineered for demanding field operations, featuring a 4-way stretch ripstop fabric, reinforced knees, and a 10-pocket storage system.",
    images: [
      "/products/tactical-cargo-pants/tactical-cargo-pants-1.png",
      "/products/tactical-cargo-pants/tactical-cargo-pants-2.png",
      "/products/tactical-cargo-pants/tactical-cargo-pants-3.png",
      "/products/tactical-cargo-pants/tactical-cargo-pants-4.png",
    ],
    specs: [
      { label: "Fabric", value: "65% Polyester / 35% Cotton, 280 GSM Ripstop" },
      { label: "Closure", value: "YKK Zippers" },
      { label: "Fit", value: "4-Way Stretch, gusseted crotch, side waist adjuster tabs" },
      { label: "Storage", value: "10-Pocket design with Velcro flap closure" },
      { label: "Reinforcement", value: "Foam pad inserts at knees" },
      { label: "Weather Resistance", value: "Water-repellent coating resists moisture without sacrificing breathability" },
    ],
    sizes: APPAREL_SIZES,
    specSheets: [
      { title: "Official Product Data Sheet", image: "/products/_spec-sheets/tactical-cargo-pants-sheet.png" },
      { title: "6.0 Tactical Pant — Feature Sheet", image: "/products/_spec-sheets/6-0-tactical-pant-sheet.png" },
      { title: "Available Colourways — Page 1", image: "/products/_spec-sheets/colours-tactical-pants-1.png" },
      { title: "Available Colourways — Page 2", image: "/products/_spec-sheets/colours-tactical-pants-2.png" },
    ],
  },
  {
    id: "tactical-cargo-shorts",
    name: "Tactical Cargo Shorts",
    category: "Combat Trousers",
    description:
      "Durable 70/30 ripstop tactical cargo shorts built for duty and crafted for endurance, with reinforced multi-pocket storage and a comfortable semi-elasticated fit.",
    images: [
      "/products/tactical-cargo-shorts/tactical-cargo-shorts-1.png",
      "/products/tactical-cargo-shorts/tactical-cargo-shorts-2.png",
      "/products/tactical-cargo-shorts/tactical-cargo-shorts-3.png",
      "/products/tactical-cargo-shorts/tactical-cargo-shorts-4.png",
      "/products/tactical-cargo-shorts/tactical-cargo-shorts-5.png",
    ],
    specs: [
      { label: "Fabric", value: "70/30 Ripstop cotton-polyester blend" },
      { label: "Waistband", value: "Semi-elasticated for a comfortable, flexible fit" },
      { label: "Storage", value: "Front, rear & cargo thigh pockets, phone pocket, YKK® zip pocket" },
      { label: "Fastenings", value: "YKK® zipper fly, hook-and-loop closure, wide belt loops" },
      { label: "Construction", value: "Double-stitched, bar-tacked stress points" },
      { label: "Weather Resistance", value: "Water-repellent finish resists moisture" },
      { label: "Breathability", value: "Steady airflow reduces heat build-up" },
      { label: "Available Colours", value: "Dark Grey, Khaki, Navy Blue, Multicam, Woodland, Super Digital" },
    ],
    sizes: APPAREL_SIZES,
    specSheets: [
      { title: "Official Product Data Sheet", image: "/products/_spec-sheets/tactical-cargo-shorts-sheet.png" },
      { title: "Explorer Tactical Shorts — Feature Sheet", image: "/products/_spec-sheets/explorer-tactical-shorts-sheet.png" },
      { title: "Available Colourways", image: "/products/_spec-sheets/colours-tactical-shorts.png" },
    ],
  },
  {
    id: "field-duty-tactical-jacket",
    name: "Field Duty Tactical Jacket",
    category: "Tactical Outerwear",
    description:
      "Engineered for professionals who demand durability, functionality, and comfort in challenging environments, this rugged jacket combines practical pockets and weather-resistant fabric to keep you prepared wherever duty takes you.",
    images: [
      "/products/field-duty-tactical-jacket/field-duty-tactical-jacket-1.png",
      "/products/field-duty-tactical-jacket/field-duty-tactical-jacket-2.png",
      "/products/field-duty-tactical-jacket/field-duty-tactical-jacket-3.png",
      "/products/field-duty-tactical-jacket/field-duty-tactical-jacket-4.png",
      "/products/field-duty-tactical-jacket/field-duty-tactical-jacket-5.png",
    ],
    specs: [
      { label: "Fabric", value: "65% Polyester / 35% Cotton" },
      { label: "Lining", value: "100% Polyester (Inner Lining)" },
      { label: "Closure", value: "Front YKK Zipper with Storm Flap" },
      { label: "Pockets", value: "4 Front Flap Pockets, 2 Inner Pockets" },
      { label: "Hood", value: "Detachable & Adjustable" },
      { label: "Weather Resistance", value: "Water repellent fabric resists light rain and surface moisture" },
      { label: "Breathability", value: "Continuous airflow regulates heat build-up" },
      { label: "Colourway", value: "Black / Olive Green" },
    ],
    sizes: ["S", "M", "XL", "XX", "XXXL"],
    specSheets: [
      { title: "Official Product Data Sheet", image: "/products/_spec-sheets/field-duty-tactical-jacket-sheet.png" },
      { title: "M-65 Field Jacket — Feature Sheet", image: "/products/_spec-sheets/m65-field-jacket-sheet.png" },
      { title: "Available Colourways — Page 1", image: "/products/_spec-sheets/colours-tactical-jackets-1.png" },
      { title: "Available Colourways — Page 2", image: "/products/_spec-sheets/colours-tactical-jackets-2.png" },
    ],
  },
];
