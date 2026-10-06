import { z } from "zod";
import { RUPEES_PATTERN, normaliseRupees, paiseToRupees, rupeesToPaise } from "../lib/money";
import { SLUG_PATTERN } from "../lib/slug";
import {
  PRODUCT_STATUSES,
  SALE_CHANNELS,
  type AdminProduct,
  type CreateProductInput,
  type ProductStatus,
  type SaleChannel,
} from "../api/types";

/**
 * Editor form model. Numbers are kept as strings while editing (rupees for money) and converted to the
 * contract's types (integer paise, integers, nulls) in `toProductPayload`. The server re-validates everything.
 */

const rupees = (message = "Enter an amount like 1299 or 1299.50") =>
  z.string().refine((s) => {
    const n = normaliseRupees(s);
    return n === "" || RUPEES_PATTERN.test(n);
  }, message);

const requiredRupees = z
  .string()
  .refine((s) => normaliseRupees(s) !== "", "Required")
  .refine((s) => RUPEES_PATTERN.test(normaliseRupees(s)), "Enter an amount like 1299 or 1299.50");

const optionalPositiveInt = z.string().refine((s) => s.trim() === "" || (/^\d+$/.test(s.trim()) && Number(s) > 0), "Whole number above 0");

export const optionSchema = z.object({
  name: z.string().trim().min(1, "Name the option (e.g. Size)").max(50),
  values: z
    .array(z.string().trim().min(1).max(50))
    .min(1, "Add at least one value")
    .max(50)
    .refine((v) => new Set(v.map((x) => x.toLowerCase())).size === v.length, "Values must be unique"),
  swatches: z.record(z.string()).nullable(),
});

export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, "Required").max(200),
    slug: z.string().trim().min(1, "Required").max(120).regex(SLUG_PATTERN, "Lowercase letters, numbers and dashes only"),
    categoryId: z.string().min(1, "Choose a category"),
    subCategory: z.string().max(100),
    description: z.string().max(20000),
    status: z.enum(PRODUCT_STATUSES as [ProductStatus, ...ProductStatus[]]),
    saleChannel: z.enum(SALE_CHANNELS as [SaleChannel, ...SaleChannel[]]),
    basePrice: rupees(),
    compareAtPrice: rupees(),
    gstRate: z.string().refine((s) => s.trim() === "" || (!Number.isNaN(Number(s)) && Number(s) >= 0 && Number(s) <= 28), "0 to 28"),
    hsnCode: z.string().refine((s) => s.trim() === "" || /^\d{4}(\d{2}){0,2}$/.test(s.trim()), "4, 6 or 8 digits"),
    weightGrams: optionalPositiveInt,
    lengthCm: optionalPositiveInt,
    widthCm: optionalPositiveInt,
    heightCm: optionalPositiveInt,
    seoTitle: z.string().max(200),
    seoDescription: z.string().max(500),
    images: z
      .array(z.object({ url: z.string().min(1), alt: z.string().max(200), variantOptionValue: z.string().max(100) }))
      .max(50),
    options: z
      .array(optionSchema)
      .max(5, "At most 5 options")
      .refine((o) => new Set(o.map((x) => x.name.trim().toLowerCase())).size === o.length, "Option names must be unique"),
    specs: z.array(z.object({ label: z.string().trim().min(1, "Required").max(100), value: z.string() })),
    specSheets: z
      .array(z.object({ title: z.string().trim().min(1, "Required").max(200), url: z.string().min(1) }))
      .max(20),
    priceTiers: z
      .array(
        z.object({
          minQty: z.string().refine((s) => /^\d+$/.test(s.trim()) && Number(s) >= 1, "1 or more"),
          unitPrice: requiredRupees,
        }),
      )
      .max(20)
      .refine((t) => new Set(t.map((x) => Number(x.minQty))).size === t.length, "Each tier needs a different minimum quantity"),
    // Only used when creating: defaults for the first variant generation.
    variantDefaults: z.object({
      defaultStock: z.string().refine((s) => /^\d+$/.test(s.trim()), "Whole number"),
      skuPrefix: z.string().refine((s) => s.trim() === "" || /^[A-Z0-9-]{1,24}$/.test(s.trim()), "A-Z, 0-9 and dashes, max 24"),
    }),
  })
  .superRefine((v, ctx) => {
    const base = rupeesToPaiseSafe(v.basePrice);
    const compare = rupeesToPaiseSafe(v.compareAtPrice);
    if (compare != null && (base == null || compare <= base)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["compareAtPrice"], message: "Must be higher than the base price" });
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type OptionValues = z.infer<typeof optionSchema>;

function rupeesToPaiseSafe(s: string): number | null {
  try {
    return rupeesToPaise(s);
  } catch {
    return null;
  }
}

const str = (v: string | null | undefined) => v ?? "";
const num = (v: number | null | undefined) => (v == null ? "" : String(v));
const nullIfBlank = (s: string) => (s.trim() === "" ? null : s.trim());
const intOrNull = (s: string) => (s.trim() === "" ? null : Number(s.trim()));

export const emptyProductForm = (): ProductFormValues => ({
  name: "",
  slug: "",
  categoryId: "",
  subCategory: "",
  description: "",
  status: "DRAFT",
  saleChannel: "ENQUIRY_ONLY",
  basePrice: "",
  compareAtPrice: "",
  gstRate: "12",
  hsnCode: "",
  weightGrams: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  seoTitle: "",
  seoDescription: "",
  images: [],
  options: [],
  specs: [],
  specSheets: [],
  priceTiers: [],
  variantDefaults: { defaultStock: "0", skuPrefix: "" },
});

export function productToForm(p: AdminProduct): ProductFormValues {
  return {
    name: p.name,
    slug: p.slug,
    categoryId: p.category.id,
    subCategory: str(p.subCategory),
    description: str(p.description),
    status: p.status,
    saleChannel: p.saleChannel,
    basePrice: paiseToRupees(p.basePrice),
    compareAtPrice: paiseToRupees(p.compareAtPrice),
    gstRate: num(p.gstRate),
    hsnCode: str(p.hsnCode),
    weightGrams: num(p.weightGrams),
    lengthCm: num(p.lengthCm),
    widthCm: num(p.widthCm),
    heightCm: num(p.heightCm),
    seoTitle: str(p.seoTitle),
    seoDescription: str(p.seoDescription),
    images: [...p.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => ({ url: i.url, alt: str(i.alt), variantOptionValue: str(i.variantOptionValue) })),
    options: p.options.map((o) => ({ name: o.name, values: [...o.values], swatches: o.swatches })),
    specs: p.specs.map((s) => ({ ...s })),
    specSheets: [...p.specSheets].sort((a, b) => a.sortOrder - b.sortOrder).map((s) => ({ title: s.title, url: s.url })),
    priceTiers: [...p.priceTiers]
      .sort((a, b) => a.minQty - b.minQty)
      .map((t) => ({ minQty: String(t.minQty), unitPrice: paiseToRupees(t.unitPrice) })),
    variantDefaults: { defaultStock: "0", skuPrefix: "" },
  };
}

/** Form values -> CreateProductDto (also valid as an UpdateProductDto: every field is sent). */
export function toProductPayload(v: ProductFormValues): CreateProductInput {
  return {
    name: v.name.trim(),
    slug: v.slug.trim(),
    categoryId: v.categoryId,
    subCategory: nullIfBlank(v.subCategory),
    description: nullIfBlank(v.description),
    status: v.status,
    saleChannel: v.saleChannel,
    basePrice: rupeesToPaise(v.basePrice),
    compareAtPrice: rupeesToPaise(v.compareAtPrice),
    gstRate: v.gstRate.trim() === "" ? null : Number(v.gstRate),
    hsnCode: nullIfBlank(v.hsnCode),
    weightGrams: intOrNull(v.weightGrams),
    lengthCm: intOrNull(v.lengthCm),
    widthCm: intOrNull(v.widthCm),
    heightCm: intOrNull(v.heightCm),
    seoTitle: nullIfBlank(v.seoTitle),
    seoDescription: nullIfBlank(v.seoDescription),
    images: v.images.map((img, i) => ({
      url: img.url,
      alt: nullIfBlank(img.alt),
      sortOrder: i,
      variantOptionValue: nullIfBlank(img.variantOptionValue),
    })),
    options: v.options.map((o) => ({ name: o.name.trim(), values: o.values.map((x) => x.trim()), swatches: o.swatches })),
    specs: v.specs.map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
    specSheets: v.specSheets.map((s, i) => ({ title: s.title.trim(), url: s.url, sortOrder: i })),
    priceTiers: v.priceTiers
      .map((t) => ({ minQty: Number(t.minQty), unitPrice: rupeesToPaise(t.unitPrice) ?? 0 }))
      .sort((a, b) => a.minQty - b.minQty),
  };
}

/** Cartesian product of option values, e.g. Size × Colour. */
type OptionLike = { name?: string; values?: string[] };

export function combinations(options: OptionLike[]): Record<string, string>[] {
  const usable = options.filter((o) => o.name?.trim() && o.values?.length);
  if (!usable.length) return [];
  return usable.reduce<Record<string, string>[]>(
    (acc, opt) => acc.flatMap((combo) => (opt.values ?? []).map((val) => ({ ...combo, [(opt.name ?? "").trim()]: val }))),
    [{}],
  );
}

const optionKey = (list: OptionLike[]) => JSON.stringify(list.map((o) => [(o.name ?? "").trim(), o.values ?? []]));
export const sameOptions = (a: OptionLike[], b: OptionLike[]) => optionKey(a) === optionKey(b);
