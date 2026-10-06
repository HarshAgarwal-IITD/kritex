import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImageOff, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAdminCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "../api/categories";
import type { AdminCategory } from "../api/types";
import { SLUG_PATTERN, slugify } from "../lib/slug";
import { ErrorState, PageHeader } from "../components/PageState";
import { FileUploadButton } from "../products/FileUploadButton";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  slug: z.string().trim().min(1, "Required").max(120).regex(SLUG_PATTERN, "Lowercase letters, numbers and dashes only"),
  description: z.string().max(2000),
  image: z.string().max(500),
  sortOrder: z.string().refine((s) => /^-?\d+$/.test(s.trim()), "Whole number"),
  isActive: z.boolean(),
});
type CategoryValues = z.infer<typeof categorySchema>;

const toValues = (c?: AdminCategory, nextSortOrder = 0): CategoryValues => ({
  name: c?.name ?? "",
  slug: c?.slug ?? "",
  description: c?.description ?? "",
  image: c?.image ?? "",
  sortOrder: String(c?.sortOrder ?? nextSortOrder),
  isActive: c?.isActive ?? true,
});

const toPayload = (v: CategoryValues) => ({
  name: v.name.trim(),
  slug: v.slug.trim(),
  description: v.description.trim() || null,
  image: v.image || null,
  sortOrder: Number(v.sortOrder),
  isActive: v.isActive,
});

type EditorState = { mode: "create" } | { mode: "edit"; category: AdminCategory } | null;

export default function CategoriesPage() {
  const categories = useAdminCategories();
  const [editor, setEditor] = useState<EditorState>(null);
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null);
  const del = useDeleteCategory();
  const nextSortOrder = (categories.data?.reduce((m, c) => Math.max(m, c.sortOrder), -1) ?? -1) + 1;

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Storefront navigation groups. Inactive categories are hidden from the store."
        actions={
          <Button className="font-display text-xs" onClick={() => setEditor({ mode: "create" })}>
            <Plus className="h-4 w-4" /> New category
          </Button>
        }
      />

      {categories.isError ? (
        <ErrorState message={categories.error.message} onRetry={() => categories.refetch()} />
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14" />
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Order</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.isPending &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {categories.data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No categories yet.
                  </TableCell>
                </TableRow>
              )}
              {categories.data?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {c.image ? (
                      <img src={c.image} alt="" className="h-10 w-10 object-cover border border-border" />
                    ) : (
                      <div className="h-10 w-10 flex items-center justify-center border border-border text-muted-foreground">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                  <TableCell className="text-right tabular">{c.sortOrder}</TableCell>
                  <TableCell className="text-right tabular">{c.productCount}</TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? "default" : "outline"} className="font-normal">
                      {c.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${c.name}`} onClick={() => setEditor({ mode: "edit", category: c })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${c.name}`} onClick={() => setToDelete(c)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CategoryDialog state={editor} nextSortOrder={nextSortOrder} onClose={() => setEditor(null)} />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-base">Delete {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && toDelete.productCount > 0
                ? `This category has ${toDelete.productCount} product${toDelete.productCount === 1 ? "" : "s"}. Move them to another category first, or mark the category inactive instead.`
                : "Only empty categories can be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!toDelete || del.isPending}
              onClick={() =>
                toDelete &&
                del.mutate(toDelete.id, {
                  onSuccess: () => toast.success(`Deleted ${toDelete.name}.`),
                  onError: (e) =>
                    toast.error(e.code === "CATEGORY_NOT_EMPTY" ? "This category still has products." : e.message),
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryDialog({ state, nextSortOrder, onClose }: { state: EditorState; nextSortOrder: number; onClose: () => void }) {
  const editing = state?.mode === "edit" ? state.category : undefined;
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [slugTouched, setSlugTouched] = useState(false);
  const form = useForm<CategoryValues>({ resolver: zodResolver(categorySchema), defaultValues: toValues() });

  useEffect(() => {
    if (state) {
      form.reset(toValues(editing, nextSortOrder));
      setSlugTouched(!!editing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const name = useWatch({ control: form.control, name: "name" });
  const image = useWatch({ control: form.control, name: "image" });
  useEffect(() => {
    if (state && !slugTouched) form.setValue("slug", slugify(name ?? ""));
  }, [name, slugTouched, state, form]);

  const onError = (e: ApiError) => {
    if (e.status === 409) form.setError("slug", { message: e.message || "This slug is already used" });
    else toast.error(e.message);
  };

  const onSubmit = (v: CategoryValues) => {
    const body = toPayload(v);
    const done = (verb: string) => () => {
      toast.success(`${verb} ${body.name}.`);
      onClose();
    };
    if (editing) update.mutate({ id: editing.id, body }, { onSuccess: done("Saved"), onError });
    else create.mutate(body, { onSuccess: done("Created"), onError });
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle className="font-display text-base">{editing ? `Edit ${editing.name}` : "New category"}</DialogTitle>
          <DialogDescription>Shown in the storefront navigation and category pages.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="category-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                  <FormDescription>/products/{field.value || "…"}</FormDescription>
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
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex items-center gap-3">
                {image ? (
                  <div className="relative">
                    <img src={image} alt="" className="h-16 w-16 object-cover border border-border" />
                    <button
                      type="button"
                      aria-label="Remove image"
                      className="absolute -right-2 -top-2 bg-background border border-border p-0.5"
                      onClick={() => form.setValue("image", "", { shouldDirty: true })}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : null}
                <FileUploadButton
                  purpose="CATEGORY_IMAGE"
                  label={image ? "Replace image" : "Upload image"}
                  onUploaded={(_file, url) => form.setValue("image", url, { shouldDirty: true })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort order</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center gap-2 pb-2">
                    <Switch id="category-active" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="category-active" className="font-normal">
                      Active
                    </Label>
                  </div>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={pending} className="font-display text-xs">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
