import type { ProductSpec } from "@/components/ProductCard";
import { asset } from "@/lib/asset";

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
      "A lightweight, breathable performance training shoe in white, built for daily PT, drill, sports and everyday activity, with a cushioned insole and anti-slip sole for all-day wear.\n\n## Key Features\n- **Lightweight Comfort** — Reduces fatigue for all-day ease.\n- **Breathable Mesh** — Enhanced airflow keeps feet cool and fresh.\n- **All-Day Support** — Cushioned insole for superior comfort.\n- **Durable Build** — Made to last with high-quality materials.\n- **Anti-Slip Sole** — Reliable grip for every step.\n- **Flexible Design** — Lightweight, flexible construction that moves with the foot.\n\n## Materials & Construction\n- **Upper:** Breathable mesh with synthetic overlays.\n- **Sole:** EVA / rubber, with a moulded, cushioned EVA midsole.\n- **Closure:** Lace-up with reinforced eyelets.\n\n## Colours\n- This model: White.\n- The Kritex PT shoe range is available in Black, Brown, Grey and White.\n\n## Ideal For\n- Physical training (PT) and drill\n- Parade and training routines\n- Sports and everyday activity",
    images: [
      asset("/products/kritex-pt-shoes-white/kritex-ptShoes-white-1.png"),
      asset("/products/kritex-pt-shoes-white/kritex-ptShoes-white-2.png"),
      asset("/products/kritex-pt-shoes-white/kritex-ptShoes-white-3.png"),
      asset("/products/kritex-pt-shoes-white/kritex-ptShoes-white-4.png"),
    ],
    specs: [
      { label: "Type", value: "Performance Training (PT) Shoe" },
      { label: "Upper", value: "Breathable Mesh with Synthetic Overlays" },
      { label: "Sole", value: "EVA / Rubber, Anti-Slip" },
      { label: "Midsole", value: "Moulded EVA, Cushioned" },
      { label: "Insole", value: "Cushioned" },
      { label: "Closure", value: "Lace-Up, Reinforced Eyelets" },
      { label: "Design", value: "Lightweight & Flexible" },
      { label: "Colourway", value: "White" },
      { label: "Range Colours", value: "Black, Brown, Grey, White" },
      { label: "Use", value: "PT, Training, Sports, Everyday Activity" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
      { title: "Feature Highlights", image: asset("/products/kritex-pt-shoes-white/details/kritex-pt-shoe-white-feature-highlights.png") },
      { title: "Also in the PT Shoe Range", image: asset("/products/kritex-pt-shoes-white/details/kritex-pt-shoe-white-pt-range.png") },
    ],
  },
  {
    id: "kritex-pt-shoe-black",
    name: "Kritex PT Shoe — Black",
    category: "PT / Training Footwear",
    description:
      "A lightweight, breathable performance training shoe in black, built for daily PT, drill, sports and everyday activity, with a cushioned insole and anti-slip sole for all-day wear.\n\n## Key Features\n- **Lightweight Comfort** — Reduces fatigue for all-day ease.\n- **Breathable Mesh** — Enhanced airflow keeps feet cool and fresh.\n- **All-Day Support** — Cushioned insole for superior comfort.\n- **Durable Build** — Made to last with high-quality materials.\n- **Anti-Slip Sole** — Reliable grip for every step.\n- **Flexible Design** — Lightweight, flexible construction that moves with the foot.\n\n## Materials & Construction\n- **Upper:** Breathable mesh with synthetic overlays.\n- **Sole:** EVA / rubber, with a moulded, cushioned EVA midsole.\n- **Closure:** Lace-up with reinforced eyelets.\n\n## Colours\n- This model: Black.\n- The Kritex PT shoe range is available in Black, Brown, Grey and White.\n\n## Ideal For\n- Physical training (PT) and drill\n- Parade and training routines\n- Sports and everyday activity",
    images: [
      asset("/products/kritex-pt-shoes-black/kritex-ptShoes-black-1.png"),
      asset("/products/kritex-pt-shoes-black/kritex-ptShoes-black-2.png"),
      asset("/products/kritex-pt-shoes-black/kritex-ptShoes-black3.png"),
      asset("/products/kritex-pt-shoes-black/kritex-ptShoes-black4.png"),
    ],
    specs: [
      { label: "Type", value: "Performance Training (PT) Shoe" },
      { label: "Upper", value: "Breathable Mesh with Synthetic Overlays" },
      { label: "Sole", value: "EVA / Rubber, Anti-Slip" },
      { label: "Midsole", value: "Moulded EVA, Cushioned" },
      { label: "Insole", value: "Cushioned" },
      { label: "Closure", value: "Lace-Up, Reinforced Eyelets" },
      { label: "Design", value: "Lightweight & Flexible" },
      { label: "Colourway", value: "Black" },
      { label: "Range Colours", value: "Black, Brown, Grey, White" },
      { label: "Use", value: "PT, Training, Sports, Everyday Activity" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
      { title: "Feature Highlights", image: asset("/products/kritex-pt-shoes-black/details/kritex-pt-shoe-black-feature-highlights.png") },
      { title: "Also in the PT Shoe Range", image: asset("/products/kritex-pt-shoes-black/details/kritex-pt-shoe-black-pt-range.png") },
    ],
  },
  {
    id: "liberty-jungle-boot",
    name: "Liberty Warrior Jungle Boot",
    category: "Combat Footwear",
    description:
      "An olive canvas defence jungle boot from Liberty's Warrior — Multi Terrain Professional line, with a hard toe and a rugged multi-terrain lug outsole for wet and uneven ground.\n\n## Key Features\n- **Hard Toe** — Black reinforced toe cap that protects against knocks and abrasion in the field.\n- **Multi-Terrain Lug Outsole** — Deep, aggressive lugs for grip on wet, muddy and rugged terrain.\n- **Durable Canvas Upper** — Olive canvas upper with camouflage trim along the seams and collar.\n- **Secure Lace-Up Fit** — Full-length lacing for a firm, adjustable hold around the foot and ankle.\n- **Reinforced Heel** — Moulded heel counter for added rear support and protection.\n\n## Materials & Construction\n- **Upper:** Olive canvas with camouflage trim\n- **Toe:** Hard toe with black reinforced cap\n- **Outsole:** Rugged multi-terrain lug outsole\n\n## Ideal For\n- Defence and jungle duty\n- Field operations in wet and rugged terrain\n- Security and outdoor use",
    images: [
      asset("/products/liberty-jungle-boot/liberty-jungle-boot-1.jpg"),
      asset("/products/liberty-jungle-boot/liberty-jungle-boot-2.jpg"),
      asset("/products/liberty-jungle-boot/liberty-jungle-boot-3.jpg"),
      asset("/products/liberty-jungle-boot/liberty-jungle-boot-4.jpg"),
    ],
    specs: [
      { label: "Brand Line", value: "Liberty Warrior — Multi Terrain Professional" },
      { label: "Upper", value: "Canvas" },
      { label: "Toe", value: "Hard Toe" },
      { label: "Sole", value: "Rugged Multi-Terrain Lug Outsole" },
      { label: "Closure", value: "Lace-Up" },
      { label: "Shaft", value: "High-Ankle" },
      { label: "Colourway", value: "Olive/Black with Camo Trim" },
      { label: "Sizes", value: "6–11 (UK)" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "sega-dms-boot",
    name: "Sega DMS Boot",
    category: "Combat Footwear",
    description:
      "A standard-issue DMS boot from Sega's Armed Forces line, with a genuine leather upper and a side zip for quick on and off during general duty.\n\n## Key Features\n- **Side Zip Entry** — Inside zipper alongside the laces for fast on and off without re-lacing.\n- **Genuine Leather Upper** — Smooth black leather for durability and a clean, service-ready finish.\n- **Cushioned Midsole** — Phylon midsole for lightweight cushioning through long shifts.\n- **Lugged Rubber Outsole** — Multi-directional rubber lugs for grip on varied surfaces.\n- **Padded Collar** — Cushioned top line for ankle comfort.\n\n## Materials & Construction\n- **Upper:** Genuine leather\n- **Midsole:** Phylon\n- **Outsole:** Lugged rubber\n- **Closure:** Lace-up with side zipper\n\n## Ideal For\n- Armed forces and general duty wear\n- Security and law-enforcement personnel\n- Daily uniform wear",
    images: [
      asset("/products/sega-dms-boot/sega-dms-boot-1.png"),
      asset("/products/sega-dms-boot/sega-dms-boot-2.png"),
      asset("/products/sega-dms-boot/sega-dms-boot-3.png"),
    ],
    specs: [
      { label: "Brand Line", value: "Sega Armed Forces" },
      { label: "Upper", value: "Genuine Leather" },
      { label: "Midsole", value: "Phylon" },
      { label: "Outsole", value: "Lugged Rubber" },
      { label: "Closure", value: "Lace-Up with Side Zipper" },
      { label: "Shaft", value: "High-Ankle" },
      { label: "Colourway", value: "Black" },
      { label: "Sizes", value: "6–11 (UK)" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "cosmo-dms-boot",
    name: "Cosmo DMS Boot",
    category: "Combat Footwear",
    description:
      "A Direct Moulded Sole (DMS) ankle boot from Cosmo — \"The Soldier Choice\" — with a genuine leather upper and extra cushioning, built for standard-issue duty wear.\n\n## Key Features\n- **Genuine Leather Upper** — Pebble-grain leather quarters with a high-gloss toe cap and heel for a parade-ready finish.\n- **Direct Moulded Sole** — Sole moulded directly to the upper for a strong, durable bond.\n- **Light Weight Rubber Sole** — Lugged rubber outsole that keeps the boot light underfoot.\n- **Extra Cushioning** — Extra cushion on the tongue and on the collar for all-day comfort.\n- **Spare Laces Included** — Comes with one extra pair of laces.\n\n## Materials & Construction\n- **Upper:** Genuine leather (pebble grain with high-gloss toe cap and heel)\n- **Sole:** Direct moulded, light weight rubber\n- **Comfort:** Extra cushion on tongue and collar\n\n## In the Box\n- One pair of boots\n- One extra pair of laces\n\n## Ideal For\n- Armed forces and paramilitary standard-issue wear\n- Security and uniformed services\n- Ceremonial and daily duty",
    images: [
      asset("/products/cosmo-dms-boot/cosmo-dms-boot-1.jpeg"),
      asset("/products/cosmo-dms-boot/cosmo-dms-boot-2.jpeg"),
      asset("/products/cosmo-dms-boot/cosmo-dms-boot-3.jpeg"),
      asset("/products/cosmo-dms-boot/cosmo-dms-boot-4.jpeg"),
    ],
    specs: [
      { label: "Brand", value: "Cosmo — \"The Soldier Choice\"" },
      { label: "Construction", value: "Direct Moulded Sole (DMS)" },
      { label: "Upper", value: "Genuine Leather" },
      { label: "Finish", value: "Pebble Grain with High-Gloss Toe Cap & Heel" },
      { label: "Sole", value: "Light Weight Rubber" },
      { label: "Comfort", value: "Extra Cushion on Tongue & Collar" },
      { label: "Closure", value: "Lace-Up" },
      { label: "Extras", value: "One Extra Pair of Laces" },
      { label: "Colourway", value: "Black" },
      { label: "Sizes", value: "6–11 (UK)" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "olive-green-jungle-boot",
    name: "Olive Green Jungle Boot",
    category: "Jungle Boots",
    description:
      "A high-ankle olive green jungle boot with a durable textile upper, reinforced protective toe and heavy-duty grip sole, engineered for mission-ready performance.\n\nBuilt for the harshest missions and extreme conditions, this jungle boot delivers durability, grip and comfort where it matters.\n\n## Key Features\n- **Durable Textile Upper** — Hard-wearing olive green textile built to withstand demanding terrain.\n- **High-Ankle Construction** — Tall shaft for added coverage and stability over uneven ground.\n- **Reinforced Protective Toe** — Strengthened toe area guards against knocks and impact.\n- **Heavy-Duty Grip Sole** — Rugged outsole for sure footing on mud, rock and wet surfaces.\n- **Secure Lace-Up System** — Full lacing for a firm, adjustable fit.\n- **Padded Ankle Support** — Cushioned collar for comfort and support through long hours on duty.\n\n## Available Colours\n- Olive Green / Black finish as standard.\n- Also available in various colours, patterns and prints.\n\n## Sizes\n- 6 to 11.\n\n## Ideal For\n- Tactical operations\n- Outdoor and field use\n- Industrial applications",
    images: [asset("/products/olive-green-jungle-boot/olive-green-jungle-boot-1.png")],
    specs: [
      { label: "Upper", value: "Durable Olive Green Textile" },
      { label: "Design", value: "High-Ankle Construction" },
      { label: "Toe", value: "Reinforced Protective Toe" },
      { label: "Sole", value: "Heavy-Duty Grip Sole" },
      { label: "Closure", value: "Secure Lace-Up System" },
      { label: "Support", value: "Padded Ankle Support" },
      { label: "Finish", value: "Olive Green / Black" },
      { label: "Application", value: "Tactical, Outdoor, Industrial" },
      { label: "Sizes", value: "6 to 11" },
      { label: "Customisation", value: "Available in Various Colours, Patterns & Prints" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "liberty-warrior-dms-boot",
    name: "Liberty Warrior DMS Boot",
    category: "Jungle Boots",
    description:
      "A genuine black leather defence jungle boot with hard toe protection, built for the daily demands of defence, security and tactical duty.\n\n## Key Features\n- **Genuine Leather Construction** — Upper and body in genuine leather for durability and a smart, service-ready finish.\n- **Hard Toe Protection** — Reinforced round toe guards against knocks and impact in the field.\n- **Secure Lace-Up Fit** — Full-length lacing for a firm, adjustable hold around the foot and ankle.\n- **Flat, Stable Heel** — Low flat heel for steady footing through long hours on duty.\n- **Clean, Solid Finish** — Solid classic black for uniform and service wear.\n\n## Materials & Construction\n- **Material** — Genuine leather.\n- **Upper** — Genuine leather.\n- **Toe** — Hard toe protection, round toe shape.\n- **Heel** — Flat.\n- **Closure** — Lace-up.\n\n## Colours & Customisation\n- Shown in Classic Black. Also available in various colours, patterns and prints — contact us for bulk and custom requirements.\n\n## Sizes\n- 6, 7, 8, 9, 10 and 11.\n\n## Ideal For\n- Defence personnel\n- Security services\n- Tactical duty",
    images: [asset("/products/liberty-warrior-dms-boot/liberty-warrior-dms-boot-1.png")],
    specs: [
      { label: "Colour", value: "Classic Black" },
      { label: "Material", value: "Genuine Leather" },
      { label: "Upper", value: "Genuine Leather" },
      { label: "Closure", value: "Lace-Up" },
      { label: "Toe", value: "Hard Toe Protection" },
      { label: "Toe Shape", value: "Round" },
      { label: "Heel", value: "Flat" },
      { label: "Pattern", value: "Solid" },
      { label: "Gender", value: "Men" },
      { label: "Application", value: "Defence, Security, Tactical" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "freedom-jungle-boot",
    name: "Freedom Olive Green Casual Lacing Defence Jungle Boot",
    category: "Jungle Boots",
    description:
      "A lightweight olive green canvas jungle boot with a cushioned EVA sole and mid heel, made for defence and everyday field use.\n\n## Key Features\n- **Durable Canvas Upper** — Hard-wearing canvas that stays light and breathable in the field.\n- **EVA Sole** — Lightweight, cushioning EVA sole for comfort over long distances.\n- **Fabric Lining** — Soft fabric lining for comfortable all-day wear.\n- **Casual Lacing** — Classic lace-up closure for a quick, adjustable fit.\n- **Mid Heel** — Mid-height heel for a balanced, stable stride.\n\n## Materials & Construction\n- **Upper** — Durable canvas.\n- **Lining** — Fabric.\n- **Sole** — EVA.\n- **Heel** — Mid heel.\n- **Closure** — Lace-up.\n\n## Colours & Customisation\n- Shown in Olive Green. Also available in various colours, patterns and prints — contact us for bulk and custom requirements.\n\n## Sizes\n- 6, 7, 8, 9, 10 and 11.\n\n## Ideal For\n- Defence personnel\n- Field and outdoor use",
    images: [asset("/products/freedom-jungle-boot/freedom-jungle-boot-1.png")],
    specs: [
      { label: "Colour", value: "Olive Green" },
      { label: "Upper", value: "Durable Canvas" },
      { label: "Lining", value: "Fabric" },
      { label: "Sole", value: "EVA" },
      { label: "Closure", value: "Lace-Up" },
      { label: "Heel", value: "Mid Heel" },
      { label: "Pattern", value: "Solid" },
      { label: "Gender", value: "Men" },
      { label: "Application", value: "Defence & Field Use" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "side-zip-jungle-boot",
    name: "Side Zip Jungle Boot",
    category: "Jungle Boots",
    description:
      "An ankle-height canvas jungle boot with a side zip, reinforced round toe and polyurethane sole, built for defence, security and outdoor duty.\n\n## Key Features\n- **Side Zip Entry** — Side zip alongside the laces for quick on and off.\n- **Reinforced Round Toe** — Added toe protection for rough ground and daily wear.\n- **Polyurethane (PU) Sole** — Durable PU sole with a rugged tread for dependable grip.\n- **Durable Canvas Upper** — Tough canvas construction at ankle height for support and mobility.\n- **Flat Heel** — Flat heel for stable, all-day footing.\n\n## Materials & Construction\n- **Upper** — Durable canvas.\n- **Shaft** — Ankle height.\n- **Toe** — Round, reinforced.\n- **Sole** — Polyurethane (PU).\n- **Heel** — Flat.\n- **Closure** — Lace-up with side zip.\n\n## Good to Know\n- This boot is not water resistant.\n\n## Colours & Customisation\n- Available in various colours, patterns and prints — contact us for bulk and custom requirements.\n\n## Sizes\n- 6, 7, 8, 9, 10 and 11.\n\n## Ideal For\n- Defence personnel\n- Security services\n- Outdoor use",
    images: [asset("/products/side-zip-jungle-boot/side-zip-jungle-boot-1.png")],
    specs: [
      { label: "Upper", value: "Durable Canvas" },
      { label: "Shaft", value: "Ankle Height" },
      { label: "Closure", value: "Lace-Up with Side Zip" },
      { label: "Toe", value: "Round, Reinforced" },
      { label: "Heel", value: "Flat" },
      { label: "Sole", value: "Polyurethane (PU)" },
      { label: "Water Resistance", value: "Not Water Resistant" },
      { label: "Application", value: "Defence, Security, Outdoor" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "tactical-combat-boot",
    name: "Tactical Combat Boot",
    category: "Tactical Boots",
    description:
      "A desert tan high-ankle tactical boot with a waterproof suede leather and textile upper, built for superior durability, grip and comfort on demanding operations and rugged terrain.\n\n## Key Features\n- **Waterproof Upper** — Suede leather and textile construction that stands up to wet, rough conditions.\n- **Breathable Lining** — Recycled mesh lining helps keep feet cool and dry.\n- **Cushioned Comfort** — Removable EVA foam footbed, shock-absorbing midsole and air-cushion heel support reduce fatigue over long hours.\n- **High-Traction Outsole** — Rubber outsole for secure grip across rugged terrain.\n- **High-Ankle Support** — High-ankle fit with a secure lace-up closure for stability on uneven ground.\n\n## Materials & Construction\n- **Upper** — Waterproof suede leather and textile.\n- **Lining** — Breathable recycled mesh.\n- **Footbed** — Removable EVA foam.\n- **Midsole** — Shock-absorbing compound.\n- **Heel** — Air cushion support.\n- **Outsole** — High-traction rubber.\n- **Closure** — Lace-up.\n\n## Colours & Customisation\n- Available in various colours, patterns and prints on request.\n\n## Ideal For\n- Tactical operations\n- Defence personnel\n- Outdoor and rugged-terrain use",
    images: [asset("/products/tactical-combat-boot/tactical-combat-boot-1.png")],
    specs: [
      { label: "Colour", value: "Desert Tan" },
      { label: "Upper", value: "Waterproof Suede Leather & Textile" },
      { label: "Lining", value: "Breathable Recycled Mesh" },
      { label: "Closure", value: "Lace-Up" },
      { label: "Footbed", value: "Removable EVA Foam" },
      { label: "Midsole", value: "Shock-Absorbing Compound" },
      { label: "Heel", value: "Air Cushion Support" },
      { label: "Outsole", value: "High-Traction Rubber" },
      { label: "Design", value: "High-Ankle Support" },
      { label: "Application", value: "Tactical, Defence, Outdoor" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "black-high-ankle-tactical-boot",
    name: "Black High Ankle Tactical Boot",
    category: "Tactical Boots",
    description:
      "A black high-ankle tactical boot with a leather and breathable mesh upper, reinforced toe and heavy-duty anti-slip sole, built for durability, grip and comfort on demanding duty.\n\n## Key Features\n- **Leather & Mesh Upper** — Durable leather combined with breathable mesh for strength and ventilation.\n- **Reinforced Toe** — Added protection at the toe for demanding environments.\n- **Heavy-Duty Anti-Slip Sole** — Secure footing on slippery and uneven surfaces.\n- **Padded Ankle Support** — High-ankle design with padding for stability and comfort.\n- **Breathable Lining** — Mesh lining helps keep feet cool through long shifts.\n\n## Materials & Construction\n- **Upper** — Leather and breathable mesh.\n- **Lining** — Breathable mesh.\n- **Toe** — Reinforced.\n- **Sole** — Heavy-duty anti-slip.\n- **Closure** — Lace-up.\n\n## Colours & Customisation\n- Available in various colours, patterns and prints on request.\n\n## Ideal For\n- Tactical operations\n- Defence personnel\n- Security services",
    images: [asset("/products/black-high-ankle-tactical-boot/black-high-ankle-tactical-boot-1.png")],
    specs: [
      { label: "Colour", value: "Black" },
      { label: "Upper", value: "Leather & Breathable Mesh" },
      { label: "Lining", value: "Breathable Mesh" },
      { label: "Closure", value: "Lace-Up" },
      { label: "Toe", value: "Reinforced" },
      { label: "Sole", value: "Heavy-Duty Anti-Slip" },
      { label: "Design", value: "High-Ankle" },
      { label: "Ankle Support", value: "Padded Ankle" },
      { label: "Application", value: "Tactical, Defence, Security" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "olive-green-tactical-boot",
    name: "Olive Green Tactical Boot",
    category: "Tactical Boots",
    description:
      "A waterproof tactical boot with a suede leather and textile upper, GORE-TEX waterproofing and a high-grip rubber sole, weighing approx. 600 g for agile outdoor and defence use.\n\n## Key Features\n- **GORE-TEX Waterproofing** — Keeps feet dry in wet conditions.\n- **Suede Leather & Textile Upper** — Durable yet flexible construction.\n- **Quick Lacing** — Fast, secure fastening when time matters.\n- **High-Grip Rubber Sole** — Reliable traction on rugged terrain.\n- **Padded Ankle Support** — Cushioned support for stability and comfort.\n- **Lightweight** — Approx. 600 g, reducing fatigue on the move.\n\n## Materials & Construction\n- **Upper** — Suede leather and textile.\n- **Waterproofing** — GORE-TEX.\n- **Sole** — High-grip rubber.\n- **Closure** — Quick lacing.\n\n## Colours & Customisation\n- Available in various colours, patterns and prints on request.\n\n## Ideal For\n- Tactical operations\n- Defence personnel\n- Outdoor use",
    images: [asset("/products/olive-green-tactical-boot/olive-green-tactical-boot-1.png")],
    specs: [
      { label: "Colour", value: "Brown / Green" },
      { label: "Upper", value: "Suede Leather & Textile" },
      { label: "Waterproofing", value: "GORE-TEX" },
      { label: "Closure", value: "Quick Lacing" },
      { label: "Sole", value: "High-Grip Rubber" },
      { label: "Ankle Support", value: "Padded Ankle" },
      { label: "Weight", value: "Approx. 600 g" },
      { label: "Application", value: "Tactical, Defence, Outdoor" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "tactical-zip-boot",
    name: "Tactical Zip Boot",
    category: "Tactical Boots",
    description:
      "A high-ankle tactical boot with a synthetic leather and mesh upper, side-zip lace-up closure and heavy-duty grip sole, built for tactical, defence and security duty.\n\n## Key Features\n- **Side-Zip Entry** — Lace-up closure with a side zip for quick on and off without re-lacing.\n- **High-Ankle Tactical Design** — Tall shaft with a padded ankle for support and stability.\n- **Reinforced Toe** — Reinforced toe protection against knocks and impact.\n- **Heavy-Duty Grip Sole** — Aggressive outsole for sure footing across varied terrain.\n- **Breathable Upper** — Synthetic leather combined with mesh panels.\n\n## Materials & Construction\n- **Upper:** Synthetic leather & mesh\n- **Sole:** Heavy-duty grip sole\n- **Toe:** Reinforced protection\n- **Support:** Padded ankle\n\n## Available Colours\n- Black, Green and Desert Tan.\n- Also available in various colours, patterns and prints on request.\n\n## Ideal For\n- Tactical operations\n- Defence personnel\n- Security services",
    images: [asset("/products/tactical-zip-boot/tactical-zip-boot-1.png")],
    specs: [
      { label: "Upper", value: "Synthetic Leather & Mesh" },
      { label: "Design", value: "High-Ankle Tactical" },
      { label: "Closure", value: "Lace-Up with Side Zip" },
      { label: "Sole", value: "Heavy-Duty Grip Sole" },
      { label: "Toe", value: "Reinforced Protection" },
      { label: "Support", value: "Padded Ankle" },
      { label: "Colour", value: "Black / Green / Desert Tan" },
      { label: "Application", value: "Tactical, Defence, Security" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "light-brown-tactical-boot",
    name: "Light Brown Tactical Boot",
    category: "Tactical Boots",
    description:
      "A high-ankle tactical boot in durable coyote suede and textile, with a breathable mesh lining, side-zip lace-up closure and heavy-duty high-grip sole for tactical, defence and outdoor use.\n\n## Key Features\n- **Side-Zip Entry** — Lace-up closure with a side zip for fast on and off.\n- **High-Ankle Tactical Design** — Tall shaft with a padded ankle for support on uneven ground.\n- **Breathable Mesh Lining** — Keeps feet ventilated through long hours of wear.\n- **Reinforced Toe** — Reinforced toe protection against knocks and impact.\n- **Heavy-Duty High-Grip Sole** — Dependable traction across varied terrain.\n\n## Materials & Construction\n- **Upper:** Durable suede & textile\n- **Lining:** Breathable mesh\n- **Sole:** Heavy-duty high-grip\n- **Toe:** Reinforced protection\n- **Support:** Padded ankle\n\n## Available Colours\n- Coyote / Desert Tan.\n- Also available in various colours, patterns and prints on request.\n\n## Ideal For\n- Tactical operations\n- Defence personnel\n- Outdoor and desert terrain use",
    images: [asset("/products/light-brown-tactical-boot/light-brown-tactical-boot-1.png")],
    specs: [
      { label: "Upper", value: "Durable Suede & Textile" },
      { label: "Design", value: "High-Ankle Tactical" },
      { label: "Closure", value: "Lace-Up with Side Zip" },
      { label: "Lining", value: "Breathable Mesh" },
      { label: "Sole", value: "Heavy-Duty High-Grip" },
      { label: "Toe", value: "Reinforced Protection" },
      { label: "Support", value: "Padded Ankle" },
      { label: "Colour", value: "Coyote / Desert Tan" },
      { label: "Application", value: "Tactical, Defence, Outdoor" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "side-zipper-tactical-boot",
    name: "Side Zipper Tactical Boot",
    category: "Tactical Boots",
    description:
      "A high-ankle black tactical boot in durable textile and synthetic, with a breathable mesh lining, side-zip lace-up closure and high-grip rubber sole for tactical, defence and security duty.\n\n## Key Features\n- **Side-Zip Entry** — Lace-up closure with a side zip for quick on and off.\n- **High-Ankle Tactical Design** — Tall shaft with a padded ankle for support and stability.\n- **Breathable Mesh Lining** — Keeps feet ventilated on long shifts.\n- **Reinforced Toe** — Reinforced toe protection against knocks and impact.\n- **High-Grip Rubber Sole** — Secure traction on wet and dry surfaces.\n\n## Materials & Construction\n- **Upper:** Durable textile & synthetic\n- **Lining:** Breathable mesh\n- **Sole:** High-grip rubber\n- **Toe:** Reinforced protection\n- **Support:** Padded ankle\n\n## Available Colours\n- Black.\n- Also available in various colours, patterns and prints on request.\n\n## Ideal For\n- Tactical operations\n- Defence personnel\n- Security services",
    images: [asset("/products/side-zipper-tactical-boot/side-zipper-tactical-boot-1.png")],
    specs: [
      { label: "Upper", value: "Durable Textile & Synthetic" },
      { label: "Design", value: "High-Ankle Tactical" },
      { label: "Closure", value: "Lace-Up with Side Zip" },
      { label: "Lining", value: "Breathable Mesh" },
      { label: "Sole", value: "High-Grip Rubber" },
      { label: "Toe", value: "Reinforced Protection" },
      { label: "Support", value: "Padded Ankle" },
      { label: "Colour", value: "Black" },
      { label: "Application", value: "Tactical, Defence, Security" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "oscar-gum-boot",
    name: "Oscar Gum Boot",
    category: "Gum Boots",
    description:
      "An industrial-grade, 100% waterproof gum boot engineered for wet conditions, combining superior protection, strong grip and lasting durability for safety and outdoor use.\n\n## Key Features\n- **100% Waterproof** — Keeps feet dry in water, mud and wet working conditions.\n- **Heavy-Duty & Durable** — Rugged construction built for lasting durability.\n- **Industrial Grade** — Made to industrial standards for safety-focused work.\n- **Strong Grip** — Secure footing on wet surfaces.\n- **Comfort Fit** — Designed for comfortable all-day wear.\n\n## Colours & Customisation\n- Available in various colours, patterns and prints.\n\n## Sizes\n- All sizes available.\n\n## Ideal For\n- Safety and industrial applications\n- Outdoor use in wet and muddy conditions",
    images: [asset("/products/oscar-gum-boot/oscar-gum-boot-1.png")],
    specs: [
      { label: "Waterproofing", value: "100% Waterproof" },
      { label: "Construction", value: "Heavy-Duty & Durable" },
      { label: "Grade", value: "Industrial Grade" },
      { label: "Fit", value: "Comfort Fit" },
      { label: "Grip", value: "Strong Grip" },
      { label: "Colourway", value: "Black with Grey Sole (as shown)" },
      { label: "Customisation", value: "Various Colours, Patterns & Prints" },
      { label: "Application", value: "Safety & Outdoor Use" },
      { label: "Sizes", value: "All Sizes Available" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "delta-gum-boot",
    name: "Delta Gum Boot",
    category: "Gum Boots",
    description:
      "A 100% waterproof, industrial-grade gum boot in a bold camouflage print, engineered for wet conditions with superior protection, strong grip and lasting durability.\n\n## Key Features\n- **100% Waterproof** — Keeps feet dry in water, mud and wet working conditions.\n- **Heavy-Duty & Durable** — Rugged construction built for lasting durability.\n- **Industrial Grade** — Made to industrial standards for safety-focused work.\n- **Strong Grip** — Secure footing on wet surfaces.\n- **Comfort Fit** — Designed for comfortable all-day wear.\n\n## Colours & Customisation\n- Available in various colours, patterns and prints.\n\n## Sizes\n- All sizes available.\n\n## Ideal For\n- Safety and industrial applications\n- Outdoor use in wet and muddy conditions",
    images: [asset("/products/delta-gum-boot/delta-gum-boot-1.png")],
    specs: [
      { label: "Waterproofing", value: "100% Waterproof" },
      { label: "Construction", value: "Heavy-Duty & Durable" },
      { label: "Grade", value: "Industrial Grade" },
      { label: "Fit", value: "Comfort Fit" },
      { label: "Grip", value: "Strong Grip" },
      { label: "Design", value: "Camouflage Print (as shown)" },
      { label: "Customisation", value: "Various Colours, Patterns & Prints" },
      { label: "Application", value: "Safety & Outdoor Use" },
      { label: "Sizes", value: "All Sizes Available" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "thor-atlas-gum-boot",
    name: "Thor & Atlas Gum Boot",
    category: "Gum Boots",
    description:
      "A 15.5\" extra-thick PVC gum boot with a 200J steel toe cap and high-grip, low-abrasion rubberized sole, engineered for wet industrial, safety and outdoor work.\n\n## Key Features\n- **Steel Toe Cap (200J)** — Steel toe protection rated to 200 joules of impact.\n- **Extra-Thick PVC Upper** — Heavy, protective PVC shell for demanding wet conditions.\n- **High-Grip Sole** — Rubberized PVC sole for a strong grip with low abrasion.\n- **15.5\" Height** — Tall shaft for added coverage in water and mud.\n- **Anatomical Fit** — Anatomically shaped for comfortable all-day wear.\n\n## Materials & Construction\n- **Upper:** Extra-thick PVC\n- **Sole:** Rubberized PVC — high-grip, low abrasion\n- **Toe:** Steel toe cap, 200J\n\n## Colours & Customisation\n- Available in various colours, patterns and prints.\n\n## Sizes\n- All sizes available.\n\n## Ideal For\n- Industrial sites\n- Safety-critical work\n- Outdoor use in wet conditions",
    images: [asset("/products/thor-atlas-gum-boot/thor-atlas-gum-boot-1.png")],
    specs: [
      { label: "Height", value: "15.5\"" },
      { label: "Upper", value: "Extra-Thick PVC" },
      { label: "Sole", value: "Rubberized PVC" },
      { label: "Sole Performance", value: "High-Grip, Low Abrasion" },
      { label: "Toe", value: "Steel Toe Cap – 200J" },
      { label: "Fit", value: "Anatomical & Comfortable" },
      { label: "Colourway", value: "Black with Red Sole (as shown)" },
      { label: "Customisation", value: "Various Colours, Patterns & Prints" },
      { label: "Use", value: "Industrial, Safety, Outdoor" },
      { label: "Sizes", value: "All Sizes Available" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
  {
    id: "isi-steel-toe-gum-boot",
    name: "ISI Steel Toe Series Gum Boot",
    category: "Gum Boots",
    description:
      "A heavy-duty, 100% waterproof PVC gum boot with a steel toe cap and anti-skid, oil-resistant sole, built for industrial, safety and outdoor work in wet conditions.\n\n## Key Features\n- **Steel Toe Cap** — Steel toe protection against impact on the job.\n- **100% Waterproof** — Keeps feet dry in water, mud and wet working conditions.\n- **Anti-Skid & Oil-Resistant Sole** — Sure footing on wet and oily surfaces.\n- **Heavy-Duty Construction** — Durable PVC build for demanding daily use.\n- **15\" Height** — Tall shaft for added coverage.\n\n## Materials & Construction\n- **Upper:** Durable PVC\n- **Sole:** Anti-skid, oil resistant\n- **Toe:** Steel toe cap\n\n## Colours & Customisation\n- Available in various colours, patterns and prints.\n\n## Sizes\n- All sizes available.\n\n## Ideal For\n- Industrial sites\n- Safety-critical work\n- Outdoor use in wet conditions",
    images: [asset("/products/isi-steel-toe-gum-boot/isi-steel-toe-gum-boot-1.png")],
    specs: [
      { label: "Height", value: "15\"" },
      { label: "Upper", value: "Durable PVC" },
      { label: "Toe", value: "Steel Toe Cap" },
      { label: "Waterproofing", value: "100% Waterproof" },
      { label: "Sole", value: "Anti-Skid & Oil Resistant" },
      { label: "Construction", value: "Heavy-Duty" },
      { label: "Colourway", value: "Black with Grey Sole (as shown)" },
      { label: "Customisation", value: "Various Colours, Patterns & Prints" },
      { label: "Use", value: "Industrial, Safety, Outdoor" },
      { label: "Sizes", value: "All Sizes Available" },
    ],
    sizes: FOOTWEAR_SIZES,
    specSheets: [
    ],
  },
];
