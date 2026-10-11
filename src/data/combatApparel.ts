import type { ProductSpec } from "@/components/ProductCard";
import type { ColorVariant, SpecSheet } from "@/data/tacticalFootwear";
import { asset } from "@/lib/asset";

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
      "A lightweight, breathable combat t-shirt engineered for high performance in extreme conditions, with quick-dry, moisture-wicking fabric and 4-way stretch for full mobility on duty.\n\n## Key Features\n- **Breathable** — High air permeability for all-day comfort.\n- **Moisture Wicking** — Quick absorption and sweat evaporation.\n- **Quick Dry** — Dries fast to keep you cool and dry.\n- **4-Way Stretch** — Enhanced mobility and flexibility.\n- **Durable** — Reinforced stitching for long-lasting performance.\n- **Lightweight** — Designed for comfort without the bulk.\n\n## Available Colours\n- **Olive Green**\n- **Black**\n- **Navy Blue**\n- **Desert Tan**\n- **Steel Grey**\n\n## Sizes\n- S, M, L, XL and XXL.\n\n## Ideal For\n- Defence and paramilitary training\n- Security and law-enforcement duty\n- Outdoor, field and adventure activities",
    images: [asset("/products/combat-performance-tshirt/combat-performance-tshirt-1.png")],
    specs: [
      { label: "Style", value: "Crew Neck, Half Sleeves" },
      { label: "Stretch", value: "4-Way Stretch" },
      { label: "Breathability", value: "High Air Permeability" },
      { label: "Moisture Management", value: "Moisture Wicking, Quick Dry" },
      { label: "Weight", value: "Lightweight" },
      { label: "Construction", value: "Reinforced Stitching" },
      { label: "Colours", value: "Olive Green, Black, Navy Blue, Desert Tan, Steel Grey" },
      { label: "Sizes", value: "S, M, L, XL, XXL" },
    ],
    sizes: APPAREL_SIZES,
    colorVariants: [
      {
        label: "Olive Green",
        swatch: asset("/products/combat-performance-tshirt/combat-performance-tshirt-swatch-olive-green.png"),
        image: asset("/products/combat-performance-tshirt/combat-performance-tshirt-olive-green.png"),
      },
      {
        label: "Black",
        swatch: asset("/products/combat-performance-tshirt/combat-performance-tshirt-swatch-black.png"),
        image: asset("/products/combat-performance-tshirt/combat-performance-tshirt-black.png"),
      },
      {
        label: "Navy Blue",
        swatch: asset("/products/combat-performance-tshirt/combat-performance-tshirt-swatch-navy-blue.png"),
        image: asset("/products/combat-performance-tshirt/combat-performance-tshirt-navy-blue.png"),
      },
      {
        label: "Desert Tan",
        swatch: asset("/products/combat-performance-tshirt/combat-performance-tshirt-swatch-desert-tan.png"),
        image: asset("/products/combat-performance-tshirt/combat-performance-tshirt-desert-tan.png"),
      },
      {
        label: "Steel Grey",
        swatch: asset("/products/combat-performance-tshirt/combat-performance-tshirt-swatch-steel-grey.png"),
        image: asset("/products/combat-performance-tshirt/combat-performance-tshirt-steel-grey.png"),
      },
    ],
    specSheets: [
      { title: "Available Colourways", image: asset("/products/combat-performance-tshirt/details/combat-performance-tshirt-colourways.png") },
      { title: "Feature Highlights", image: asset("/products/combat-performance-tshirt/details/combat-performance-tshirt-feature-highlights.png") },
    ],
  },
  {
    id: "og-polo-tshirt",
    name: "Tactical Combat OG Polo T-Shirt",
    category: "T-Shirts",
    description:
      "A rugged tactical combat polo engineered for extreme conditions — lightweight, breathable and built for durability, with a nylon-spandex torso, ripstop-reinforced sleeves and original YKK® zippers.\n\n## Key Features\n- **Breathable Knit** — Breathable, lightweight knit fabric with mesh ventilation panels.\n- **Moisture Wicking** — Moisture-wicking technology pulls sweat away to keep you dry.\n- **Anti-Odour Treatment** — Stays fresher through long shifts.\n- **Saddle-Shoulder Construction** — Unrestricted movement for the arms and shoulders.\n- **Two Zippered Bicep Pockets** — Secure storage closed with original YKK® zippers.\n- **Velcro ID Panels** — Hook-and-loop panels for patches and identification.\n\n## Fabric\n- **Torso:** 80% Nylon / 20% Spandex\n- **Sleeves:** 70% Cotton / 30% Polyester\n\n## Construction\n- Original YKK® zippers\n- Ripstop shoulder and sleeve reinforcement\n- Flatlock stitching for added comfort\n\n## Camouflage Options\n- OG, Black Python, Cobra, Grey Digital, Multicam, Arid, Woodland, Black Multicam, Super Digital, IA, Desert and RSL.\n- Also available in solid colours, with customisation on bulk orders.\n\n## Sizes\n- S, M, L, XL and XXL.\n\n## Ideal For\n- Military and law enforcement\n- Security personnel\n- Outdoor and tactical training\n- Adventure activities",
    images: [
      asset("/products/og-polo-tshirt/og-polo-tshirt-1.png"),
      asset("/products/og-polo-tshirt/og-polo-tshirt-2.png"),
      asset("/products/og-polo-tshirt/og-polo-tshirt-3.png"),
    ],
    specs: [
      { label: "Torso Fabric", value: "80% Nylon / 20% Spandex" },
      { label: "Sleeve Fabric", value: "70% Cotton / 30% Polyester" },
      { label: "Reinforcement", value: "Ripstop Shoulders & Sleeves" },
      { label: "Stitching", value: "Flatlock" },
      { label: "Zippers", value: "Original YKK®" },
      { label: "Pockets", value: "Two Zippered Bicep Pockets" },
      { label: "Sleeve Design", value: "Saddle Shoulder" },
      { label: "ID Panels", value: "Velcro Patch Panels" },
      { label: "Fabric Features", value: "Moisture Wicking, Anti-Odour, Mesh Ventilation" },
      { label: "Patterns", value: "12 Camouflage Options; Solid Colours on Request" },
      { label: "Best For", value: "Military, Law Enforcement, Security, Outdoor, Tactical Training, Adventure" },
    ],
    sizes: APPAREL_SIZES,
    specSheets: [
      { title: "Camouflage: OG", image: asset("/products/og-polo-tshirt/details/og-polo-tshirt-camo-og.png") },
      { title: "Camouflage: Black Python", image: asset("/products/og-polo-tshirt/details/og-polo-tshirt-camo-black-python.png") },
      { title: "Camouflage: Cobra", image: asset("/products/og-polo-tshirt/details/og-polo-tshirt-camo-cobra.png") },
      { title: "Camouflage: Grey Digital", image: asset("/products/og-polo-tshirt/details/og-polo-tshirt-camo-grey-digital.png") },
      { title: "Camouflage: Multicam", image: asset("/products/og-polo-tshirt/details/og-polo-tshirt-camo-multicam.png") },
      { title: "Camouflage: Arid", image: asset("/products/og-polo-tshirt/details/og-polo-tshirt-camo-arid.png") },
      { title: "Camouflage: Woodland", image: asset("/products/og-polo-tshirt/details/og-polo-tshirt-camo-woodland.png") },
      { title: "Camouflage: Black Multicam", image: asset("/products/og-polo-tshirt/details/og-polo-tshirt-camo-black-multicam.png") },
      { title: "Camouflage: Super Digital", image: asset("/products/og-polo-tshirt/details/og-polo-tshirt-camo-super-digital.png") },
      { title: "Camouflage: IA", image: asset("/products/og-polo-tshirt/details/og-polo-tshirt-camo-ia.png") },
      { title: "Camouflage: Desert", image: asset("/products/og-polo-tshirt/details/og-polo-tshirt-camo-desert.png") },
      { title: "Camouflage: RSL", image: asset("/products/og-polo-tshirt/details/og-polo-tshirt-camo-rsl.png") },
    ],
  },
  {
    id: "full-sleeve-combat-tshirt",
    name: "Tactical Combat Full Sleeve T-Shirt",
    category: "T-Shirts",
    description:
      "A full-sleeve tactical combat shirt engineered for high performance in extreme conditions — lightweight, breathable and built for durability as an everyday base layer.\n\n## Key Features\n- **Breathable Knit** — Lightweight knit fabric with anti-odour treatment.\n- **Moisture Wicking** — Draws sweat away to keep you dry.\n- **Mesh Ventilation** — Special mesh inserts for improved airflow.\n- **Saddle-Shoulder Design** — Unrestricted movement through the arms and shoulders.\n- **Bicep Pockets** — Zippered pockets with patches for insignia.\n- **Velcro ID Panels** — Hook-and-loop panels on the sleeves for patches and IDs.\n\n## Materials & Construction\n- **Sleeves:** 70% Cotton / 30% Polyester\n- **Torso:** 80% Nylon / 20% Spandex\n- **Zippers:** Original YKK®\n- **Reinforcement:** Ripstop fabric on shoulders and sleeves\n- **Seams:** Flatlock throughout for increased comfort\n\n## Camouflage Options\n- RSL C-Type, Arid, British, Black Multicam Range, Super Digital, Multicam C-Type, Woodland WR German, Grey Digital, Black Python, Desert C-Type and Cobra C-Type.\n- Also available in solid colours, with customisation on bulk orders.\n\n## Sizes\n- S, M, L, XL, XXL\n\n## Ideal For\n- A tactical base layer for outdoor, adventure and on-field activities",
    images: [
      asset("/products/full-sleeve-combat-tshirt/full-sleeve-combat-tshirt-1.png"),
      asset("/products/full-sleeve-combat-tshirt/full-sleeve-combat-tshirt-2.png"),
      asset("/products/full-sleeve-combat-tshirt/full-sleeve-combat-tshirt-3.png"),
      asset("/products/full-sleeve-combat-tshirt/full-sleeve-combat-tshirt-4.png"),
      asset("/products/full-sleeve-combat-tshirt/full-sleeve-combat-tshirt-5.png"),
    ],
    specs: [
      { label: "Sleeve Fabric", value: "70% Cotton / 30% Polyester" },
      { label: "Torso Fabric", value: "80% Nylon / 20% Spandex" },
      { label: "Reinforcement", value: "Ripstop Shoulders & Sleeves" },
      { label: "Stitching", value: "Flatlock Seams" },
      { label: "Zippers", value: "Original YKK®" },
      { label: "Pockets", value: "Bicep Pockets with Insignia Patches" },
      { label: "Sleeve Panels", value: "Velcro Panels for Patches & IDs" },
      { label: "Features", value: "Breathable, Moisture Wicking, Anti-Odour, Mesh Ventilation" },
      { label: "Design", value: "Saddle-Shoulder" },
      { label: "Best For", value: "Outdoor, Adventure & On-Field Activities" },
    ],
    sizes: APPAREL_SIZES,
    specSheets: [
      { title: "Camouflage Options — Set 1", image: asset("/products/full-sleeve-combat-tshirt/details/full-sleeve-combat-tshirt-colour-options-1.png") },
      { title: "Camouflage Options — Set 2", image: asset("/products/full-sleeve-combat-tshirt/details/full-sleeve-combat-tshirt-colour-options-2.png") },
    ],
  },
  {
    id: "tactical-cargo-pants",
    name: "Tactical Cargo Pants",
    category: "Combat Trousers",
    description:
      "Ripstop tactical cargo pants engineered for rugged terrain and demanding missions, with reinforced knees, 4-way stretch mobility and a 10-pocket storage system.\n\n## Key Features\n- **Ripstop Fabric** — 65% polyester / 35% cotton, 280 GSM.\n- **10-Pocket Design** — Cargo pockets with Velcro flap closure keep gear secure and within reach.\n- **Reinforced Knees** — Foam pad inserts for impact protection.\n- **4-Way Stretch** — Gusseted crotch for unrestricted movement.\n- **Quick Dry** — Moisture-wicking for extended field operations.\n- **YKK® Zippers** — Durable hardware built to last.\n\n## 6.0 Tactical Pant\nThe 6.0 model delivers structured durability with unrestricted comfort, whether navigating rough landscapes or for daily movement.\n- **Multi-Pocket Design** — Cargo pockets across the front and thighs.\n- **Water Repellent** — Protective coating repels moisture without sacrificing breathability.\n- **Side Waist Adjuster Tabs** — Fine-tune the waist fit with or without a belt.\n\n## Available Patterns — Advanced Range\n- **Arid** — Advanced Ripstop Tactical Pant\n- **Black Multicam** — Advanced WR Ripstop Tactical Pant\n- **British** — Advanced Ripstop Tactical Pant\n- **Cobra** — Advanced Tactical Pant\n- **Black Python** — Advanced Ripstop Tactical Pant\n- **Grey Digital** — Advanced Ripstop Tactical Pant\n\n## Available Patterns — Ripstop Range\n- **Desert** — Ripstop Tactical Pant\n- **RSL** — Ripstop Tactical Pant\n- **Multicam** — Ripstop Tactical Pant\n- **Woodland** — Achiever Tactical Pant\n- **Super Digital** — Ripstop Tactical Pant\n- **IA** — Ripstop Tactical Pant\n\nAlso available in solid colours, with customisation on bulk orders.\n\n## Ideal For\n- Defence and paramilitary field duty\n- Security and law-enforcement operations\n- Rugged terrain, training and outdoor use",
    images: [
      asset("/products/tactical-cargo-pants/tactical-cargo-pants-1.png"),
      asset("/products/tactical-cargo-pants/tactical-cargo-pants-2.png"),
      asset("/products/tactical-cargo-pants/tactical-cargo-pants-3.png"),
      asset("/products/tactical-cargo-pants/tactical-cargo-pants-4.png"),
    ],
    specs: [
      { label: "Fabric", value: "Ripstop, 65% Polyester / 35% Cotton" },
      { label: "Fabric Weight", value: "280 GSM" },
      { label: "Pockets", value: "10 Cargo Pockets with Velcro Flap Closure" },
      { label: "Knees", value: "Reinforced with Foam Pad Inserts" },
      { label: "Stretch", value: "4-Way Stretch, Gusseted Crotch" },
      { label: "Performance", value: "Quick Dry, Moisture-Wicking" },
      { label: "Zippers", value: "YKK®" },
      { label: "Water Resistance", value: "Water-Repellent Coating (6.0 Tactical Pant)" },
      { label: "Waist", value: "Side Waist Adjuster Tabs (6.0 Tactical Pant)" },
      { label: "Patterns", value: "12 Camouflage Patterns (Advanced & Ripstop Ranges)" },
      { label: "Customisation", value: "Solid Colours & Custom Patterns on Bulk Orders" },
      { label: "Sizes", value: "S, M, L, XL, XXL" },
    ],
    sizes: APPAREL_SIZES,
    specSheets: [
      { title: "Feature Highlights", image: asset("/products/tactical-cargo-pants/details/tactical-cargo-pants-feature-highlights.png") },
      { title: "Patterns — Advanced Range", image: asset("/products/tactical-cargo-pants/details/tactical-cargo-pants-patterns-advanced.png") },
      { title: "Patterns — Ripstop Range", image: asset("/products/tactical-cargo-pants/details/tactical-cargo-pants-patterns-ripstop.png") },
      { title: "6.0 Tactical Pant — Python & Multicam", image: asset("/products/tactical-cargo-pants/details/tactical-cargo-pants-6-0-variants.png") },
      { title: "Multi-Pocket Design", image: asset("/products/tactical-cargo-pants/details/tactical-cargo-pants-pockets.png") },
      { title: "Water-Repellent Finish", image: asset("/products/tactical-cargo-pants/details/tactical-cargo-pants-water-repellent.png") },
      { title: "Side Waist Adjuster Tab", image: asset("/products/tactical-cargo-pants/details/tactical-cargo-pants-waist-adjuster.png") },
    ],
  },
  {
    id: "tactical-cargo-shorts",
    name: "Tactical Cargo Shorts",
    category: "Combat Trousers",
    description:
      "Durable 70/30 ripstop tactical cargo shorts built for duty and crafted for endurance, combining reinforced multi-pocket storage with a flexible, semi-elasticated fit.\n\nFrom mountain paths to campsite breaks, these shorts are designed to handle changing conditions with ease. A water-repellent finish helps moisture bead off instead of soaking in, while reinforced materials resist wear during demanding outdoor use.\n\n## Key Features\n- **70/30 Ripstop Fabric** — Durable cotton-polyester blend engineered for rugged performance.\n- **Reinforced Construction** — Double-stitched seams with bar-tacked stress points for maximum durability.\n- **Comfort Fit** — Semi-elasticated waistband provides a flexible, comfortable fit that adapts to your movements.\n- **Multi-Pocket Storage** — Front pockets, rear pockets, cargo thigh pockets, a phone pocket and a YKK® zip pocket.\n- **Stretch Mobility Panels** — Rear elastic stretch panels improve flexibility and allow unrestricted movement.\n- **Premium Fastenings** — YKK® zipper fly, hook-and-loop closure and wide belt loops for a secure fit.\n- **Water-Repellent Finish** — Helps moisture bead off instead of soaking in.\n- **Breathable** — The fabric supports steady airflow that helps reduce heat build-up and keeps you feeling fresh for longer through active days.\n\n## Storage & Pockets\n- Front pockets and rear pockets\n- Cargo thigh pockets\n- Dedicated phone pocket\n- YKK® zip pocket for secure storage\n\n## Materials & Construction\n- **Fabric:** 70/30 ripstop cotton-polyester blend\n- **Seams:** Double-stitched, with bar-tacked stress points\n- **Waistband:** Semi-elasticated, with wide belt loops\n- **Closure:** YKK® zipper fly with hook-and-loop closure\n- **Mobility:** Rear elastic stretch panels\n\n## Available Colours\n- **Solid:** Dark Grey, Khaki, Navy Blue\n- **Camouflage:** Multicam, Super Digital, Woodland\n- Also available in solid colours and with customisation on bulk orders.\n\n## Sizes\n- S, M, L, XL, XXL\n\n## Ideal For\n- Outdoor use, from mountain paths to campsite breaks\n- Hiking, trekking and active days in changing conditions\n- Tactical, security and field duty",
    images: [
      asset("/products/tactical-cargo-shorts/tactical-cargo-shorts-1.png"),
      asset("/products/tactical-cargo-shorts/tactical-cargo-shorts-2.png"),
      asset("/products/tactical-cargo-shorts/tactical-cargo-shorts-3.png"),
      asset("/products/tactical-cargo-shorts/tactical-cargo-shorts-4.png"),
      asset("/products/tactical-cargo-shorts/tactical-cargo-shorts-5.png"),
    ],
    specs: [
      { label: "Fabric", value: "70/30 Ripstop Cotton-Polyester Blend" },
      { label: "Construction", value: "Double-Stitched Seams, Bar-Tacked Stress Points" },
      { label: "Waistband", value: "Semi-Elasticated, Wide Belt Loops" },
      { label: "Closure", value: "YKK® Zipper Fly, Hook-and-Loop Closure" },
      { label: "Pockets", value: "Front, Rear & Cargo Thigh Pockets, Phone Pocket, YKK® Zip Pocket" },
      { label: "Mobility", value: "Rear Elastic Stretch Panels" },
      { label: "Weather Resistance", value: "Water-Repellent Finish" },
      { label: "Breathability", value: "Steady Airflow Reduces Heat Build-Up" },
      { label: "Colours", value: "Dark Grey, Khaki, Navy Blue, Multicam, Super Digital, Woodland" },
      { label: "Customisation", value: "Solid Colours & Custom Options on Bulk Orders" },
      { label: "Sizes", value: "S, M, L, XL, XXL" },
    ],
    sizes: APPAREL_SIZES,
    specSheets: [
      { title: "Available Colourways", image: asset("/products/tactical-cargo-shorts/details/tactical-cargo-shorts-colourways.png") },
      { title: "Feature Highlights", image: asset("/products/tactical-cargo-shorts/details/tactical-cargo-shorts-feature-highlights.png") },
      { title: "Front & Back Views", image: asset("/products/tactical-cargo-shorts/details/tactical-cargo-shorts-front-back-views.png") },
      { title: "Storage Pockets", image: asset("/products/tactical-cargo-shorts/details/tactical-cargo-shorts-storage-pockets.png") },
      { title: "Breathable Fabric", image: asset("/products/tactical-cargo-shorts/details/tactical-cargo-shorts-breathable.png") },
    ],
  },
  {
    id: "field-duty-tactical-jacket",
    name: "Field Duty Tactical Jacket",
    category: "Tactical Outerwear",
    description:
      "A rugged field jacket that reimagines the classic military design with modern tactical features — weather protection, functional storage and durable construction for duty, outdoor and everyday use.\n\n## Overview\nEngineered for professionals who demand durability, functionality and comfort in challenging environments. With a rugged build, practical pockets and weather-resistant fabric, the Field Duty Tactical Jacket keeps you prepared wherever duty takes you.\n\n## Key Features\n- **Water-Repellent Fabric** — High-performance fabric for long-lasting wear, designed to resist light rain and surface moisture so you stay dry and comfortable in unexpected drizzle or damp conditions.\n- **Weather Resistant** — Water-repellent finish protects against light rain and wind, making it reliable in changing weather.\n- **Breathable** — Supports continuous airflow to regulate heat build-up and maintain comfort during extended wear and active movement outdoors.\n- **Detachable Hood** — Adjustable, detachable hood for added protection in harsh conditions.\n- **Multi-Pocket Design** — Four front flap pockets plus two inner pockets for secure storage of essentials.\n- **Adjustable Cuffs** — Hook-and-loop cuff adjusters for a secure and comfortable fit.\n- **Comfort Fit** — Ergonomic design for ease of movement and all-day comfort.\n\n## Materials & Construction\n- **Shell Fabric** — 65% polyester / 35% cotton.\n- **Inner Lining** — 100% polyester.\n- **Closure** — Front YKK® zipper with storm flap.\n- **Hood** — Detachable and adjustable.\n- **Cuffs** — Adjustable hook and loop.\n\n## Available Colours\n- **Olive Green** and **Black** (listed in the jacket range as the Black Ripstop WR Field Jacket).\n- Also available in solid colours, with customisation on bulk orders.\n\n## Sizes\n- S / M / XL / XX / XXXL\n\n## Ideal For\n- Defence, security and field duty\n- Outdoor and trekking use in changing weather\n- Everyday wear that needs weather protection",
    images: [
      asset("/products/field-duty-tactical-jacket/field-duty-tactical-jacket-1.png"),
      asset("/products/field-duty-tactical-jacket/field-duty-tactical-jacket-2.png"),
      asset("/products/field-duty-tactical-jacket/field-duty-tactical-jacket-3.png"),
      asset("/products/field-duty-tactical-jacket/field-duty-tactical-jacket-4.png"),
      asset("/products/field-duty-tactical-jacket/field-duty-tactical-jacket-5.png"),
      asset("/products/field-duty-tactical-jacket/field-duty-tactical-jacket-6.png"),
    ],
    specs: [
      { label: "Fabric", value: "65% Polyester / 35% Cotton" },
      { label: "Lining", value: "100% Polyester (Inner Lining)" },
      { label: "Closure", value: "Front YKK® Zipper with Storm Flap" },
      { label: "Pockets", value: "4 Front Flap Pockets, 2 Inner Pockets" },
      { label: "Hood", value: "Detachable & Adjustable" },
      { label: "Cuffs", value: "Adjustable Hook & Loop" },
      { label: "Weather Resistance", value: "Water-Repellent Finish; Resists Light Rain & Wind" },
      { label: "Breathability", value: "Continuous Airflow to Regulate Heat Build-Up" },
      { label: "Fit", value: "Ergonomic Comfort Fit" },
      { label: "Colours", value: "Olive Green, Black" },
      { label: "Customisation", value: "Solid Colours & Customisation on Bulk Orders" },
      { label: "Sizes", value: "S, M, XL, XX, XXXL" },
    ],
    sizes: ["S", "M", "XL", "XX", "XXXL"],
    specSheets: [
      { title: "Available Colourways", image: asset("/products/field-duty-tactical-jacket/details/field-duty-tactical-jacket-colourways.png") },
      { title: "Key Features", image: asset("/products/field-duty-tactical-jacket/details/field-duty-tactical-jacket-feature-highlights.png") },
      { title: "Water-Repellent Fabric", image: asset("/products/field-duty-tactical-jacket/details/field-duty-tactical-jacket-water-repellent.png") },
      { title: "Breathable Back Panel", image: asset("/products/field-duty-tactical-jacket/details/field-duty-tactical-jacket-breathable-back.png") },
      { title: "In the Field", image: asset("/products/field-duty-tactical-jacket/details/field-duty-tactical-jacket-field-3.png") },
      { title: "Trail Ready", image: asset("/products/field-duty-tactical-jacket/details/field-duty-tactical-jacket-field-2.png") },
      { title: "Everyday Outdoors", image: asset("/products/field-duty-tactical-jacket/details/field-duty-tactical-jacket-field-1.png") },
    ],
  },
];
