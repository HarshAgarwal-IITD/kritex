import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FormProvider, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ApiError } from "@/lib/api/client";
import { generateVariants, useAdminProduct, useCreateProduct, useDeleteProduct, useUpdateProduct } from "../api/products";
import { useAdminCategories } from "../api/categories";
import { adminKeys } from "../api/keys";
import {
  PRODUCT_STATUSES,
  SALE_CHANNELS,
  SALE_CHANNEL_LABELS,
  STATUS_LABELS,
  type AdminProduct,
} from "../api/types";
import { slugify } from "../lib/slug";
import { adminPaths } from "../paths";
import { ErrorState, PageHeader } from "../components/PageState";
import { Section } from "../components/Section";
import { StatusBadge } from "../components/StatusBadge";
import {
  combinations,
  emptyProductForm,
  productFormSchema,
  productToForm,
  sameOptions,
  toProductPayload,
  type ProductFormValues,
} from "../products/form";
import { OptionsField } from "../products/OptionsField";
import { ImagesField } from "../products/ImagesField";
import { SpecsField } from "../products/SpecsField";
import { SpecSheetsField } from "../products/SpecSheetsField";
import { PriceTiersField } from "../products/PriceTiersField";
import { VariantsTable } from "../products/VariantsTable";

const SALE_CHANNEL_HELP: Record<string, string> = {
  RETAIL: "Anyone can buy online.",
  B2B_ONLY: "Only approved B2B customers can buy; others can request a quote.",
  ENQUIRY_ONLY: "No price shown; customers send an enquiry.",
};

export default function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const product = useAdminProduct(id);

  if (!id) return <ProductEditor />;
  if (product.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (product.isError) {
    return (
      <ErrorState
        message={product.error.status === 404 ? "Product not found." : product.error.message}
        onRetry={product.error.status === 404 ? undefined : () => product.refetch()}
      />
    );
  }
  return <ProductEditor key={product.data.id} product={product.data} />;
}

function ProductEditor({ product }: { product?: AdminProduct }) {
  const isNew = !product;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const categories = useAdminCategories();
  const create = useCreateProduct();
  const update = useUpdateProduct(product?.id ?? "");
  const remove = useDeleteProduct();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [generating, setGenerating] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? productToForm(product) : emptyProductForm(),
  });

  // Re-sync after the server returns a saved product (keeps the form pristine).
  useEffect(() => {
    if (product) form.reset(productToForm(product));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.updatedAt]);

  const name = useWatch({ control: form.control, name: "name" });
  const options = useWatch({ control: form.control, name: "options" });
  const saleChannel = useWatch({ control: form.control, name: "saleChannel" });
  useEffect(() => {
    if (!slugTouched) form.setValue("slug", slugify(name ?? ""), { shouldValidate: form.formState.isSubmitted });
  }, [name, slugTouched, form]);

  const optionsDirty = !!product && !sameOptions(options ?? [], product.options);
  const comboCount = Math.max(1, combinations(options ?? []).length);

  const handleApiError = (e: ApiError) => {
    if (e.status === 409) form.setError("slug", { message: e.message || "This slug is already used" });
    toast.error(e.message || "Couldn't save the product");
  };

  const onSubmit = async (values: ProductFormValues) => {
    const payload = toProductPayload(values);
    if (product) {
      update.mutate(payload, { onSuccess: () => toast.success("Product saved."), onError: handleApiError });
      return;
    }
    create.mutate(payload, {
      onError: handleApiError,
      onSuccess: async (created) => {
        // First variant generation: one per option combination (or a single default variant).
        setGenerating(true);
        try {
          const skuPrefix = values.variantDefaults.skuPrefix.trim();
          await generateVariants(created.id, {
            deactivateMissing: true,
            defaultPrice: null,
            defaultStock: Number(values.variantDefaults.defaultStock),
            ...(skuPrefix ? { skuPrefix } : {}),
          });
          toast.success("Product created. Set variant prices and stock below.");
        } catch (e) {
          toast.error(`Product created, but generating variants failed: ${(e as Error).message}`);
        } finally {
          setGenerating(false);
        }
        await qc.invalidateQueries({ queryKey: adminKeys.product(created.id) });
        navigate(adminPaths.product(created.id), { replace: true });
      },
    });
  };

  const onInvalid = (errors: FieldErrors<ProductFormValues>) => {
    const count = Object.keys(errors).length;
    toast.error(`Check ${count} field${count === 1 ? "" : "s"} before saving.`);
  };

  const saving = create.isPending || update.isPending || generating;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} noValidate aria-label={isNew ? "New product" : "Edit product"}>
        <Link
          to={adminPaths.products}
          className="inline-flex items-center gap-1 mb-4 font-display text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" /> Products
        </Link>
        <PageHeader
          title={isNew ? "New product" : product.name}
          description={isNew ? undefined : `/${product.category.slug}/${product.slug}`}
          actions={
            <>
              {product && <StatusBadge status={product.status} />}
              {product && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              )}
              <Button type="submit" className="font-display text-xs" disabled={saving || (!isNew && !form.formState.isDirty)}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isNew ? "Create product" : "Save"}
              </Button>
            </>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6 min-w-0">
            <Section title="Details">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          setSlugTouched(true);
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormDescription>Used in the product URL. Changing it breaks existing links.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <Section title="Images" description="Upload JPG, PNG, WebP or AVIF (max 20 MB). Tag colour-specific images with an option value.">
              <ImagesField />
            </Section>

            <Section title="Options" description="E.g. Size and Colour. Each combination becomes a variant with its own SKU, price and stock.">
              <OptionsField />
              {isNew && (
                <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="variantDefaults.defaultStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Starting stock per variant</FormLabel>
                        <FormControl>
                          <Input inputMode="numeric" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="variantDefaults.skuPrefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU prefix</FormLabel>
                        <FormControl>
                          <Input
                            className="uppercase"
                            placeholder="Derived from the slug"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    {comboCount} variant{comboCount === 1 ? "" : "s"} will be generated when you create the product. Each starts at
                    the base price; set per-variant prices on the next screen.
                  </p>
                </div>
              )}
            </Section>

            {product && (
              <Section title="Variants" description="Per-variant SKU, price override, stock on hand and availability.">
                <VariantsTable product={product} optionsDirty={optionsDirty} />
              </Section>
            )}

            <Section title="Specifications">
              <SpecsField />
            </Section>

            <Section title="Spec sheets" description="PDF or image data sheets shown on the product page.">
              <SpecSheetsField />
            </Section>

            <Section title="B2B price tiers" description="Unit prices for approved B2B customers by minimum order quantity.">
              <PriceTiersField />
            </Section>

            <Section title="Search engine listing">
              <FormField
                control={form.control}
                name="seoTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO title</FormLabel>
                    <FormControl>
                      <Input placeholder={name || undefined} {...field} />
                    </FormControl>
                    <FormDescription>{field.value.length}/200. Defaults to the product name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="seoDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormDescription>{field.value.length}/500</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Status">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRODUCT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="saleChannel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale channel</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SALE_CHANNELS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {SALE_CHANNEL_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{SALE_CHANNEL_HELP[saleChannel]}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <Section title="Organisation">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange} disabled={categories.isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={categories.isPending ? "Loading…" : "Choose a category"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.data?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                            {!c.isActive && " (inactive)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. T-Shirts" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <Section title="Pricing" description="Rupees, GST-inclusive.">
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base price (₹)</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" placeholder="e.g. 1299" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="compareAtPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compare-at price (₹)</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" {...field} />
                    </FormControl>
                    <FormDescription>Optional strike-through price.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <Section title="Tax & shipping">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gstRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST %</FormLabel>
                      <FormControl>
                        <Input inputMode="decimal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hsnCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HSN code</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {(
                  [
                    ["weightGrams", "Weight (g)"],
                    ["lengthCm", "Length (cm)"],
                    ["widthCm", "Width (cm)"],
                    ["heightCm", "Height (cm)"],
                  ] as const
                ).map(([key, label]) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name={key}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input inputMode="numeric" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </Section>
          </div>
        </div>
      </form>

      {product && (
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent className="rounded-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-base">Delete {product.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Products that appear on orders are archived instead of deleted. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() =>
                  remove.mutate(product.id, {
                    onSuccess: () => {
                      toast.success("Product deleted.");
                      navigate(adminPaths.products, { replace: true });
                    },
                    onError: (e) => toast.error(e.message),
                  })
                }
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </FormProvider>
  );
}
