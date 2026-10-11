import type { ProductSpec } from "@/components/ProductCard";
import type { ColorVariant, SpecSheet } from "@/data/tacticalFootwear";
import { asset } from "@/lib/asset";

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
      "A rugged 20 L tactical backpack in premium 600D polyester, built to perform and designed to endure, with MOLLE webbing, heavy-duty YKK zippers and multiple compartments.\n\n## Key Features\n- **MOLLE System** — Webbing across the front panels for modular pouches and attachments.\n- **Heavy-Duty YKK Zippers** — Reliable, durable hardware on every compartment.\n- **Water Resistant & Durable** — Premium 600D polyester shell that stands up to the elements.\n- **Adjustable Compression Straps** — Side straps with quick-release buckles cinch the load to keep it stable and compact.\n- **Lightweight & Comfortable** — Designed for all-day carry without the bulk.\n\n## Storage & Capacity\n- **20 L Capacity** — Sized for day missions, patrols and short trips.\n- **Multiple Compartments** — A zippered top pocket, a MOLLE-faced front compartment and a main compartment keep gear separated and easy to reach.\n\n## Materials & Construction\n- **Shell** — Premium 600D polyester.\n- **Hardware** — Heavy-duty YKK zippers and quick-release side buckles.\n\n## Ideal For\n- Missions and field operations\n- Military, defence and security personnel\n- Trekking, outdoor and adventure use",
    images: [asset("/products/rapid-20-tactical-backpack/rapid-20-tactical-backpack-1.png")],
    specs: [
      { label: "Capacity", value: "20 L" },
      { label: "Material", value: "Premium 600D Polyester" },
      { label: "Zippers", value: "Heavy-Duty YKK" },
      { label: "Attachment System", value: "MOLLE Webbing for Modular Attachments" },
      { label: "Compartments", value: "Multiple" },
      { label: "Compression", value: "Adjustable Compression Straps" },
      { label: "Weather Resistance", value: "Water Resistant" },
      { label: "Comfort", value: "Lightweight & Comfortable" },
      { label: "Use", value: "Mission & Adventure" },
    ],
    specSheets: [
      { title: "Feature Highlights", image: asset("/products/rapid-20-tactical-backpack/details/rapid-20-tactical-backpack-feature-highlights.png") },
      { title: "Top Pocket & YKK Zippers", image: asset("/products/rapid-20-tactical-backpack/details/rapid-20-tactical-backpack-top-pocket-zippers.png") },
      { title: "MOLLE Webbing Panel", image: asset("/products/rapid-20-tactical-backpack/details/rapid-20-tactical-backpack-molle-panel.png") },
      { title: "Side Compression Strap & Buckle", image: asset("/products/rapid-20-tactical-backpack/details/rapid-20-tactical-backpack-side-compression-strap.png") },
      { title: "Rapid 20 Badge", image: asset("/products/rapid-20-tactical-backpack/details/rapid-20-tactical-backpack-rapid-20-badge.png") },
    ],
  },
];
