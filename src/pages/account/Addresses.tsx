import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormError } from "@/components/shop/Field";
import { linkButtonClass, primaryButtonClass, secondaryButtonClass } from "@/components/shop/styles";
import QueryError from "@/features/catalog/components/QueryError";
import AccountLayout from "@/features/account/components/AccountLayout";
import { useAddresses, useCreateAddress, useDeleteAddress, useUpdateAddress } from "@/features/account/hooks";
import type { SavedAddress } from "@/features/account/types";
import AddressForm from "@/features/checkout/components/AddressForm";
import { addressLines, toAddressInput, toFormDefaults } from "@/features/checkout/address";
import { formatPhone } from "@/features/checkout/india";

type Editing = { mode: "new" } | { mode: "edit"; address: SavedAddress } | null;

const AddressDialog = ({ editing, onClose, isFirst }: { editing: Editing; onClose: () => void; isFirst: boolean }) => {
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const [makeDefault, setMakeDefault] = useState(false);
  const existing = editing?.mode === "edit" ? editing.address : null;
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-border bg-background sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-base uppercase text-foreground">{existing ? "Edit address" : "New address"}</DialogTitle>
          <DialogDescription className="sr-only">Delivery address details</DialogDescription>
        </DialogHeader>
        {editing && (
          <AddressForm
            idPrefix="addr"
            defaultValues={existing ? toFormDefaults(existing) : undefined}
            onSubmit={(v) => {
              const input = toAddressInput(v);
              const isDefault = existing?.isDefault || makeDefault || isFirst;
              const done = {
                onSuccess: () => {
                  toast.success("Address saved");
                  onClose();
                },
              };
              if (existing) update.mutate({ id: existing.id, body: { ...input, isDefault } }, done);
              else create.mutate({ ...input, isDefault }, done);
            }}
          >
            {!existing?.isDefault && !isFirst && (
              <label className="flex items-center gap-3 font-body text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={makeDefault}
                  onChange={(e) => setMakeDefault(e.target.checked)}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
                Make this my default address
              </label>
            )}
            {error && <FormError>{error.code === "ADDRESS_LIMIT_REACHED" ? "You've saved the maximum number of addresses." : error.message}</FormError>}
            <div className="flex gap-3">
              <button type="submit" className={primaryButtonClass} disabled={pending}>
                {pending && <Loader2 size={14} className="animate-spin" />}
                Save Address
              </button>
              <button type="button" className={secondaryButtonClass} onClick={onClose}>
                Cancel
              </button>
            </div>
          </AddressForm>
        )}
      </DialogContent>
    </Dialog>
  );
};

/** `/account/addresses` — address book CRUD + default. */
const Addresses = () => {
  const { data, isPending, isError, refetch } = useAddresses();
  const update = useUpdateAddress();
  const remove = useDeleteAddress();
  const [editing, setEditing] = useState<Editing>(null);

  return (
    <AccountLayout title="Addresses">
      <div className="mb-6">
        <button type="button" className={secondaryButtonClass} onClick={() => setEditing({ mode: "new" })}>
          <Plus size={14} />
          Add Address
        </button>
      </div>
      {isPending ? (
        <div className="h-32 animate-pulse bg-muted/40" data-skeleton aria-label="Loading addresses" />
      ) : isError ? (
        <QueryError message="Couldn't load your addresses." onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <p className="border border-dashed border-border py-12 text-center font-display text-sm text-muted-foreground">No saved addresses yet.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Saved addresses">
          {data.map((a) => (
            <li key={a.id} className="border border-border p-5" data-testid="saved-address">
              <p className="flex items-center justify-between font-display text-xs uppercase tracking-wider text-foreground">
                {a.name}
                {a.isDefault && <span className="text-[9px] text-primary">Default</span>}
              </p>
              {addressLines(a).map((l) => (
                <p key={l} className="font-body text-xs text-muted-foreground mt-1">
                  {l}
                </p>
              ))}
              <p className="font-body text-xs text-muted-foreground mt-1">{formatPhone(a.phone)}</p>
              <div className="mt-4 flex gap-4">
                <button type="button" className={linkButtonClass} onClick={() => setEditing({ mode: "edit", address: a })} aria-label={`Edit address ${a.name}`}>
                  Edit
                </button>
                {!a.isDefault && (
                  <button
                    type="button"
                    className={linkButtonClass}
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: a.id, body: { country: "IN", isDefault: true } })}
                  >
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  className="font-display text-xs text-muted-foreground hover:text-destructive transition-colors duration-200"
                  disabled={remove.isPending}
                  aria-label={`Delete address ${a.name}`}
                  onClick={() => {
                    if (window.confirm("Delete this address?")) remove.mutate(a.id, { onError: (e) => toast.error(e.message) });
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AddressDialog key={editing?.mode === "edit" ? editing.address.id : (editing?.mode ?? "none")} editing={editing} onClose={() => setEditing(null)} isFirst={(data?.length ?? 0) === 0} />
    </AccountLayout>
  );
};

export default Addresses;
