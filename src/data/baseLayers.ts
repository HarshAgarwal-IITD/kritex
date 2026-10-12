import { asset } from "@/lib/asset";
import { type ApparelProduct, APPAREL_SIZES } from "@/data/combatApparel";

export const baseLayersProducts: ApparelProduct[] = [
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
];
