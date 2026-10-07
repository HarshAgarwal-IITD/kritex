import { http, HttpResponse } from "msw";
import type { components } from "@/lib/api/schema";
import { createAdminCommerceHandlers, resetAdminCommerceDb } from "./admin-commerce";

/**
 * MSW handlers for the admin app: Better Auth (`/api/v1/auth/*`, not in the OpenAPI spec), `GET /me`,
 * and the admin catalog routes (categories, products, variants, stock, uploads). Orders, inventory, coupons,
 * customers, B2B approvals, dashboard and enquiries live in admin-commerce.ts and are spread in below.
 * Registered from handlers.ts. Tests reset state with `resetAdminMockDb()`.
 *
 * Mock accounts (password for all: "password123"):
 *   admin@kritex.in (ADMIN), staff@kritex.in (STAFF), customer@example.com (CUSTOMER)
 */

type S = components["schemas"];
type Me = S["MeDto_Output"];
type Category = S["AdminCategoryDto_Output"];
type Product = S["AdminProductDto_Output"];
type Variant = Product["variants"][number];
type ListItem = S["AdminProductListDto_Output"]["items"][number];
type CreateProduct = S["CreateProductDto"];
type UpdateProduct = S["UpdateProductDto"];
type ErrorBody = S["ErrorResponseDto"];

// Local copy (not imported from handlers.ts) to avoid a circular import.
const apiPath = (path: string) => `*${path}`;

export const MOCK_PASSWORD = "password123";
const SESSION_STORAGE_KEY = "kritex.mock.session";

const now = () => new Date().toISOString();
let seq = 0;
const cuid = (prefix: string) => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;

// Typed as plain Response so handlers can return either an error or a typed success body.
const err = (status: number, code: string, message: string): Response =>
  HttpResponse.json<ErrorBody>({ error: { code, message } }, { status });

// ---------------------------------------------------------------------------------------------
// Seed data

const seedUsers = (): Me[] => [
  mkUser("usr_admin", "admin@kritex.in", "Asha Admin", "ADMIN"),
  mkUser("usr_staff", "staff@kritex.in", "Sam Staff", "STAFF"),
  mkUser("usr_customer", "customer@example.com", "Chris Customer", "CUSTOMER"),
];

function mkUser(id: string, email: string, name: string, role: Me["role"]): Me {
  return { id, email, name, role, emailVerified: true, phone: null, businessProfile: null, createdAt: "2026-01-01T00:00:00.000Z" };
}

const seedCategories = (): Category[] => [
  { id: "cat_footwear", slug: "tactical-footwear", name: "Tactical Footwear", description: "Boots and shoes built for duty.", image: null, isActive: true, sortOrder: 0, productCount: 0 },
  { id: "cat_apparel", slug: "combat-apparel", name: "Combat Apparel", description: "Shirts, trousers and base layers.", image: null, isActive: true, sortOrder: 1, productCount: 0 },
  { id: "cat_loadbearing", slug: "load-bearing", name: "Load Bearing", description: "Backpacks, belts and pouches.", image: null, isActive: true, sortOrder: 2, productCount: 0 },
];

function emptyProduct(id: string): Product {
  return {
    id,
    slug: "",
    name: "",
    description: null,
    category: { id: "", name: "", slug: "" },
    subCategory: null,
    status: "DRAFT",
    saleChannel: "ENQUIRY_ONLY",
    basePrice: null,
    compareAtPrice: null,
    gstRate: null,
    hsnCode: null,
    weightGrams: null,
    lengthCm: null,
    widthCm: null,
    heightCm: null,
    seoTitle: null,
    seoDescription: null,
    images: [],
    options: [],
    specs: [],
    specSheets: [],
    priceTiers: [],
    variants: [],
    createdAt: now(),
    updatedAt: now(),
  };
}

function seedProducts(categories: Category[]): Product[] {
  const cat = (id: string) => {
    const c = categories.find((x) => x.id === id)!;
    return { id: c.id, name: c.name, slug: c.slug };
  };
  const shirt: Product = {
    ...emptyProduct("prd_shirt"),
    slug: "combat-performance-tshirt",
    name: "Combat Performance T-Shirt",
    description: "Moisture-wicking, quick-dry combat t-shirt with 4-way stretch.",
    category: cat("cat_apparel"),
    subCategory: "T-Shirts",
    status: "ACTIVE",
    saleChannel: "RETAIL",
    basePrice: 129900,
    compareAtPrice: 149900,
    gstRate: 12,
    hsnCode: "6109",
    images: [
      { id: "img_shirt_1", url: "/products/combat-performance-tshirt/combat-performance-tshirt-1.png", alt: "Combat Performance T-Shirt", sortOrder: 0, variantOptionValue: null },
    ],
    options: [
      { name: "Size", values: ["M", "L"], swatches: null },
      { name: "Colour", values: ["Olive Green", "Black"], swatches: null },
    ],
    specs: [{ label: "Fit", value: "4-Way Stretch" }],
    priceTiers: [{ minQty: 50, unitPrice: 109900 }],
    updatedAt: "2026-10-01T10:00:00.000Z",
  };
  shirt.variants = cartesian(shirt.options).map((combo, i) => mkVariant(shirt, combo, `KTX-CPT-${i + 1}`, null, 10));
  const boot: Product = {
    ...emptyProduct("prd_boot"),
    slug: "desert-assault-boot",
    name: "Desert Assault Boot",
    category: cat("cat_footwear"),
    status: "DRAFT",
    saleChannel: "B2B_ONLY",
    basePrice: 459900,
    gstRate: 18,
    updatedAt: "2026-09-28T10:00:00.000Z",
  };
  const pack: Product = {
    ...emptyProduct("prd_pack"),
    slug: "rapid-20-tactical-backpack",
    name: "Rapid 20 Tactical Backpack",
    category: cat("cat_loadbearing"),
    subCategory: "Backpacks",
    status: "ARCHIVED",
    saleChannel: "ENQUIRY_ONLY",
    updatedAt: "2026-09-20T10:00:00.000Z",
  };
  return [shirt, boot, pack];
}

function cartesian(options: Product["options"]): Record<string, string>[] {
  return options.reduce<Record<string, string>[]>(
    (acc, opt) => acc.flatMap((combo) => opt.values.map((v) => ({ ...combo, [opt.name]: v }))),
    [{}], // no options -> one default variant
  );
}

function mkVariant(product: Product, options: Record<string, string>, sku: string, price: number | null, stock: number): Variant {
  return {
    id: cuid("var_"),
    productId: product.id,
    sku,
    title: Object.values(options).join(" / ") || product.name,
    options,
    price,
    effectivePrice: price ?? product.basePrice,
    stock,
    reserved: 0,
    available: stock,
    isActive: true,
  };
}

// ---------------------------------------------------------------------------------------------
// State

let users: Me[] = seedUsers();
let categories: Category[] = seedCategories();
let products: Product[] = seedProducts(categories);
let sessionUserId: string | null = null;
const uploads = new Map<string, { contentType: string; body: ArrayBuffer }>();

/** Persist the mocked session across reloads in the browser (dev). Harmless in jsdom. */
function readStoredSession(): string | null {
  try {
    return globalThis.localStorage?.getItem(SESSION_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}
function writeStoredSession(id: string | null) {
  try {
    if (id) globalThis.localStorage?.setItem(SESSION_STORAGE_KEY, id);
    else globalThis.localStorage?.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // storage unavailable
  }
}
sessionUserId = readStoredSession();

export function resetAdminMockDb() {
  users = seedUsers();
  categories = seedCategories();
  products = seedProducts(categories);
  uploads.clear();
  resetAdminCommerceDb();
  sessionUserId = null;
  writeStoredSession(null);
}

/** Test helper: start a session as the given mock user (by email). */
export function setMockSession(email: string | null) {
  sessionUserId = email ? (users.find((u) => u.email === email)?.id ?? null) : null;
  writeStoredSession(sessionUserId);
}

export const getAdminMockDb = () => ({ users, categories, products });

const currentUser = () => users.find((u) => u.id === sessionUserId) ?? null;

/** Returns an error response unless the session user is STAFF/ADMIN. */
function requireStaff(): Response | null {
  const user = currentUser();
  if (!user) return err(401, "UNAUTHORIZED", "Not signed in");
  if (user.role !== "STAFF" && user.role !== "ADMIN") return err(403, "FORBIDDEN", "Staff only");
  return null;
}

function withCounts(c: Category): Category {
  return { ...c, productCount: products.filter((p) => p.category.id === c.id).length };
}

function recompute(p: Product): Product {
  p.variants = p.variants.map((v) => ({ ...v, effectivePrice: v.price ?? p.basePrice, available: v.stock - v.reserved }));
  return p;
}

function toListItem(p: Product): ListItem {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    status: p.status,
    saleChannel: p.saleChannel,
    basePrice: p.basePrice,
    image: [...p.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url ?? null,
    variantCount: p.variants.length,
    totalAvailable: p.variants.filter((v) => v.isActive).reduce((n, v) => n + v.available, 0),
    updatedAt: p.updatedAt,
  };
}

function applyProductInput(p: Product, body: UpdateProduct | CreateProduct): Product | Response {
  if (body.categoryId !== undefined) {
    const c = categories.find((x) => x.id === body.categoryId);
    if (!c) return err(404, "NOT_FOUND", "Category not found");
    p.category = { id: c.id, name: c.name, slug: c.slug };
  }
  if (body.slug !== undefined && products.some((x) => x.slug === body.slug && x.id !== p.id)) {
    return err(409, "SLUG_TAKEN", `Slug "${body.slug}" is already used`);
  }
  const { categoryId: _c, images, specSheets, ...rest } = body;
  Object.assign(p, rest);
  if (images) p.images = images.map((img) => ({ id: cuid("img_"), alt: img.alt ?? null, sortOrder: img.sortOrder ?? 0, url: img.url, variantOptionValue: img.variantOptionValue ?? null }));
  if (specSheets) p.specSheets = specSheets.map((s) => ({ id: cuid("sps_"), title: s.title, url: s.url, sortOrder: s.sortOrder ?? 0 }));
  if (body.options) p.options = body.options.map((o) => ({ name: o.name, values: o.values, swatches: o.swatches ?? null }));
  p.updatedAt = now();
  return recompute(p);
}

const findProduct = (id: string) => products.find((p) => p.id === id);
const findVariant = (id: string) => {
  for (const p of products) {
    const v = p.variants.find((x) => x.id === id);
    if (v) return { product: p, variant: v };
  }
  return null;
};

// ---------------------------------------------------------------------------------------------
// Handlers

export const adminHandlers = [
  // ---- Better Auth ----
  http.post(apiPath("/api/v1/auth/sign-in/email"), async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    const user = users.find((u) => u.email.toLowerCase() === body.email?.trim().toLowerCase());
    if (!user || body.password !== MOCK_PASSWORD) {
      return HttpResponse.json({ code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password" }, { status: 401 });
    }
    sessionUserId = user.id;
    writeStoredSession(user.id);
    return HttpResponse.json(
      { redirect: false, token: `tok_${user.id}`, user: { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified } },
      { headers: { "Set-Cookie": `better-auth.session_token=tok_${user.id}; Path=/; SameSite=Lax` } },
    );
  }),

  http.get(apiPath("/api/v1/auth/get-session"), () => {
    const user = currentUser();
    if (!user) return HttpResponse.json(null);
    return HttpResponse.json({
      session: { id: `ses_${user.id}`, userId: user.id, expiresAt: new Date(Date.now() + 7 * 86400_000).toISOString() },
      user: { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified },
    });
  }),

  http.post(apiPath("/api/v1/auth/sign-out"), () => {
    sessionUserId = null;
    writeStoredSession(null);
    return HttpResponse.json(
      { success: true },
      { headers: { "Set-Cookie": "better-auth.session_token=; Path=/; Max-Age=0" } },
    );
  }),

  http.get(apiPath("/api/v1/me"), () => {
    const user = currentUser();
    if (!user) return err(401, "UNAUTHORIZED", "Not signed in");
    return HttpResponse.json<Me>(user);
  }),

  // ---- Categories ----
  http.get(apiPath("/api/v1/admin/categories"), () => {
    const denied = requireStaff();
    if (denied) return denied;
    return HttpResponse.json<S["AdminCategoryListDto_Output"]>({ items: categories.map(withCounts) });
  }),

  http.post(apiPath("/api/v1/admin/categories"), async ({ request }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const body = (await request.json()) as S["CreateCategoryDto"];
    if (!body.name || !body.slug) return err(400, "VALIDATION_ERROR", "name and slug are required");
    if (categories.some((c) => c.slug === body.slug)) return err(409, "SLUG_TAKEN", `Slug "${body.slug}" is already used`);
    const category: Category = {
      id: cuid("cat_"),
      name: body.name,
      slug: body.slug,
      description: body.description ?? null,
      image: body.image ?? null,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
      productCount: 0,
    };
    categories.push(category);
    return HttpResponse.json<Category>(category, { status: 201 });
  }),

  http.patch(apiPath("/api/v1/admin/categories/:id"), async ({ request, params }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const category = categories.find((c) => c.id === params.id);
    if (!category) return err(404, "NOT_FOUND", "Category not found");
    const body = (await request.json()) as S["UpdateCategoryDto"];
    if (body.slug && categories.some((c) => c.slug === body.slug && c.id !== category.id)) {
      return err(409, "SLUG_TAKEN", `Slug "${body.slug}" is already used`);
    }
    Object.assign(category, body);
    for (const p of products) {
      if (p.category.id === category.id) p.category = { id: category.id, name: category.name, slug: category.slug };
    }
    return HttpResponse.json<Category>(withCounts(category));
  }),

  http.delete(apiPath("/api/v1/admin/categories/:id"), ({ params }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const category = categories.find((c) => c.id === params.id);
    if (!category) return err(404, "NOT_FOUND", "Category not found");
    if (products.some((p) => p.category.id === category.id)) {
      return err(409, "CATEGORY_NOT_EMPTY", "Move or delete this category's products first");
    }
    categories = categories.filter((c) => c.id !== category.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Products ----
  http.get(apiPath("/api/v1/admin/products"), ({ request }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim().toLowerCase();
    const status = url.searchParams.get("status");
    const saleChannel = url.searchParams.get("saleChannel");
    const category = url.searchParams.get("category");
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
    const filtered = products
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.slug.includes(q) || p.variants.some((v) => v.sku.toLowerCase().includes(q)))
      .filter((p) => !status || p.status === status)
      .filter((p) => !saleChannel || p.saleChannel === saleChannel)
      .filter((p) => !category || p.category.slug === category || p.category.id === category)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return HttpResponse.json<S["AdminProductListDto_Output"]>({
      items: filtered.slice((page - 1) * limit, page * limit).map(toListItem),
      page,
      limit,
      total: filtered.length,
    });
  }),

  http.post(apiPath("/api/v1/admin/products"), async ({ request }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const body = (await request.json()) as CreateProduct;
    if (!body.name || !body.slug || !body.categoryId) {
      return err(400, "VALIDATION_ERROR", "name, slug and categoryId are required");
    }
    const product = applyProductInput(emptyProduct(cuid("prd_")), body);
    if (product instanceof Response) return product;
    products.push(product);
    return HttpResponse.json<Product>(product, { status: 201 });
  }),

  http.get(apiPath("/api/v1/admin/products/:id"), ({ params }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const product = findProduct(String(params.id));
    if (!product) return err(404, "NOT_FOUND", "Product not found");
    return HttpResponse.json<Product>(product);
  }),

  http.patch(apiPath("/api/v1/admin/products/:id"), async ({ request, params }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const product = findProduct(String(params.id));
    if (!product) return err(404, "NOT_FOUND", "Product not found");
    const result = applyProductInput(product, (await request.json()) as UpdateProduct);
    if (result instanceof Response) return result;
    return HttpResponse.json<Product>(result);
  }),

  http.delete(apiPath("/api/v1/admin/products/:id"), ({ params }) => {
    const denied = requireStaff();
    if (denied) return denied;
    if (!findProduct(String(params.id))) return err(404, "NOT_FOUND", "Product not found");
    products = products.filter((p) => p.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(apiPath("/api/v1/admin/products/:id/variants"), ({ params }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const product = findProduct(String(params.id));
    if (!product) return err(404, "NOT_FOUND", "Product not found");
    return HttpResponse.json<S["AdminVariantListDto_Output"]>({ items: product.variants });
  }),

  http.post(apiPath("/api/v1/admin/products/:id/variants"), async ({ request, params }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const product = findProduct(String(params.id));
    if (!product) return err(404, "NOT_FOUND", "Product not found");
    const body = (await request.json()) as Partial<S["GenerateVariantsDto"]>;
    const prefix =
      body.skuPrefix ??
      product.slug
        .split("-")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 12);
    const key = (o: Record<string, string>) => JSON.stringify(Object.entries(o).sort());
    const combos = cartesian(product.options);
    const wanted = new Set(combos.map(key));
    for (const combo of combos) {
      const existing = product.variants.find((v) => key(v.options) === key(combo));
      if (existing) {
        existing.isActive = true;
        continue;
      }
      const suffix = Object.values(combo)
        .map((v) => v.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase())
        .join("-");
      const sku = suffix ? `${prefix}-${suffix}` : prefix;
      if (products.some((p) => p.variants.some((v) => v.sku === sku))) return err(409, "SKU_TAKEN", `SKU ${sku} is already used`);
      product.variants.push(mkVariant(product, combo, sku, body.defaultPrice ?? null, body.defaultStock ?? 0));
    }
    if (body.deactivateMissing ?? true) {
      for (const v of product.variants) if (!wanted.has(key(v.options))) v.isActive = false;
    }
    product.updatedAt = now();
    recompute(product);
    return HttpResponse.json<S["AdminVariantListDto_Output"]>({ items: product.variants }, { status: 201 });
  }),

  http.patch(apiPath("/api/v1/admin/variants/:id"), async ({ request, params }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const found = findVariant(String(params.id));
    if (!found) return err(404, "NOT_FOUND", "Variant not found");
    const body = (await request.json()) as S["UpdateVariantDto"];
    if (body.sku && products.some((p) => p.variants.some((v) => v.sku === body.sku && v.id !== found.variant.id))) {
      return err(409, "SKU_TAKEN", `SKU ${body.sku} is already used`);
    }
    Object.assign(found.variant, body);
    recompute(found.product);
    return HttpResponse.json(found.product.variants.find((v) => v.id === found.variant.id)!);
  }),

  http.patch(apiPath("/api/v1/admin/variants/:id/stock"), async ({ request, params }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const found = findVariant(String(params.id));
    if (!found) return err(404, "NOT_FOUND", "Variant not found");
    const body = (await request.json()) as S["AdjustStockDto"];
    if (!Number.isInteger(body.delta) || body.delta === 0) return err(400, "VALIDATION_ERROR", "delta must be a non-zero integer");
    if (found.variant.stock + body.delta < found.variant.reserved) {
      return err(409, "INSUFFICIENT_STOCK", "Stock would drop below reserved units");
    }
    found.variant.stock += body.delta;
    recompute(found.product);
    return HttpResponse.json(found.product.variants.find((v) => v.id === found.variant.id)!);
  }),

  // ---- Uploads (presigned PUT, served back by the mock) ----
  http.post(apiPath("/api/v1/admin/uploads"), async ({ request }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const body = (await request.json()) as S["CreateUploadDto"];
    if (!body.filename || !body.contentType || !(body.size > 0)) return err(400, "VALIDATION_ERROR", "Invalid upload");
    const origin = new URL(request.url).origin;
    const key = `${body.purpose.toLowerCase()}/${cuid("")}-${body.filename.replace(/[^A-Za-z0-9._-]/g, "_")}`;
    return HttpResponse.json<S["UploadTicketDto_Output"]>(
      {
        key,
        uploadUrl: `${origin}/__mock-uploads/${key}?signature=mock`,
        method: "PUT",
        headers: { "Content-Type": body.contentType },
        publicUrl: `${origin}/__mock-uploads/${key}`,
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      },
      { status: 201 },
    );
  }),

  http.put("*/__mock-uploads/*", async ({ request }) => {
    const key = new URL(request.url).pathname.replace(/^\/__mock-uploads\//, "");
    uploads.set(key, { contentType: request.headers.get("content-type") ?? "application/octet-stream", body: await request.arrayBuffer() });
    return new HttpResponse(null, { status: 200 });
  }),

  http.get("*/__mock-uploads/*", ({ request }) => {
    const key = new URL(request.url).pathname.replace(/^\/__mock-uploads\//, "");
    const file = uploads.get(key);
    if (!file) return new HttpResponse(null, { status: 404 });
    return new HttpResponse(file.body, { headers: { "Content-Type": file.contentType } });
  }),

  // ---- Stage 3: orders, inventory, coupons, customers, B2B, dashboard, enquiries ----
  ...createAdminCommerceHandlers({ requireStaff, currentUser, products: () => products }),
];
