import apparelImg from "@/assets/product-apparel.jpg";
import bagsImg from "@/assets/product-bags.jpg";
import bootsImg from "@/assets/product-boots.jpg";
import tshirtsImg from "@/assets/product-tshirts.jpg";
import { tacticalFootwearProducts } from "@/data/tacticalFootwear";

export interface ProductCategory {
  slug: string;
  title: string;
  description: string;
  image: string;
  available: boolean;
  productCount: number;
}

export const productCategories: ProductCategory[] = [
  {
    slug: "tactical-footwear",
    title: "Tactical Footwear",
    description: "Combat, DMS, jungle and PT footwear engineered for durability in the field.",
    image: bootsImg,
    available: true,
    productCount: tacticalFootwearProducts.length,
  },
  {
    slug: "combat-apparel",
    title: "Combat Apparel",
    description: "Uniforms and combat wear built for extended operational wear.",
    image: apparelImg,
    available: false,
    productCount: 0,
  },
  {
    slug: "load-bearing",
    title: "Load Bearing",
    description: "Rucksacks, pouches, and carrying equipment for field deployment.",
    image: bagsImg,
    available: false,
    productCount: 0,
  },
  {
    slug: "base-layers",
    title: "Base Layers",
    description: "Base layer garments engineered for comfort under any conditions.",
    image: tshirtsImg,
    available: false,
    productCount: 0,
  },
];
