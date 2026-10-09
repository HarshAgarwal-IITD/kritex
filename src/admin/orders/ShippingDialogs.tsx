import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateShiprocketShipment, useShipOrder } from "../api/shipping";
import type { AdminOrder } from "../api/types";
import { CheckboxField, FormDialog } from "./OrderActionDialogs";

interface DialogProps {
  order: AdminOrder;
  open: boolean;
  onClose: () => void;
}

/** Optional positive whole number typed into a text box. */
const optionalInt = (label: string) =>
  z
    .string()
    .trim()
    .refine((s) => s === "" || (/^\d+$/.test(s) && Number(s) > 0), `${label} must be a whole number above 0`);
const toInt = (s: string) => (s.trim() === "" ? undefined : Number(s.trim()));

// ---------------------------------------------------------------------------------------------
// Shiprocket: create order → AWB + label → pickup

const shiprocketSchema = z.object({
  weightGrams: optionalInt("Weight"),
  lengthCm: optionalInt("Length"),
  widthCm: optionalInt("Width"),
  heightCm: optionalInt("Height"),
  courierId: optionalInt("Courier id"),
  pickupLocation: z.string().trim().max(100),
  schedulePickup: z.boolean(),
});
type ShiprocketValues = z.infer<typeof shiprocketSchema>;
const shiprocketDefaults: ShiprocketValues = {
  weightGrams: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  courierId: "",
  pickupLocation: "",
  schedulePickup: true,
};

export function ShiprocketDialog({ order, open, onClose }: DialogProps) {
  const create = useCreateShiprocketShipment(order.id);
  const form = useForm<ShiprocketValues>({ resolver: zodResolver(shiprocketSchema), defaultValues: shiprocketDefaults });
  useEffect(() => {
    if (open) form.reset(shiprocketDefaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (v: ShiprocketValues) =>
    create.mutate(
      {
        weightGrams: toInt(v.weightGrams),
        lengthCm: toInt(v.lengthCm),
        widthCm: toInt(v.widthCm),
        heightCm: toInt(v.heightCm),
        courierId: toInt(v.courierId),
        pickupLocation: v.pickupLocation || undefined,
        schedulePickup: v.schedulePickup,
      },
      {
        onSuccess: (s) => {
          toast.success(`Shipment created${s.awb ? ` · AWB ${s.awb}` : ""}${v.schedulePickup ? ". Pickup requested." : "."}`);
          onClose();
        },
        onError: (e) => toast.error(e.code === "SHIPROCKET_ERROR" ? e.message || "Shiprocket rejected the shipment." : e.message),
      },
    );

  const num = (name: "weightGrams" | "lengthCm" | "widthCm" | "heightCm" | "courierId", label: string, placeholder?: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input inputMode="numeric" placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Ship via Shiprocket"
      description="Creates the Shiprocket order, assigns an AWB and generates the label. Leave fields blank to use product weights and Shiprocket's recommended courier."
      formId="shiprocket-form"
      submitLabel="Create shipment"
      pending={create.isPending}
    >
      <Form {...form}>
        <form id="shiprocket-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            {num("weightGrams", "Weight (g)", "Auto")}
            {num("courierId", "Courier id", "Recommended")}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {num("lengthCm", "Length (cm)")}
            {num("widthCm", "Width (cm)")}
            {num("heightCm", "Height (cm)")}
          </div>
          <FormField
            control={form.control}
            name="pickupLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup location</FormLabel>
                <FormControl>
                  <Input placeholder="Primary (Shiprocket nickname)" {...field} />
                </FormControl>
                <FormDescription>The pickup address nickname set up in Shiprocket.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <CheckboxField control={form.control} name="schedulePickup" id="shiprocket-pickup" label="Request pickup now" />
        </form>
      </Form>
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------------------------
// Manual ship (fallback without Shiprocket)

const manualSchema = z.object({
  carrier: z.string().trim().min(1, "Enter the courier").max(100),
  awb: z.string().trim().max(100),
  trackingUrl: z.union([z.literal(""), z.string().trim().url("Enter a full URL starting with https://")]),
  notifyCustomer: z.boolean(),
});
type ManualValues = z.infer<typeof manualSchema>;

export function ManualShipDialog({ order, open, onClose }: DialogProps) {
  const ship = useShipOrder(order.id);
  const existing = order.shipments.find((s) => s.status !== "CANCELLED");
  const defaults = (): ManualValues => ({
    carrier: existing?.carrier ?? "",
    awb: existing?.awb ?? "",
    trackingUrl: existing?.trackingUrl ?? "",
    notifyCustomer: true,
  });
  const form = useForm<ManualValues>({ resolver: zodResolver(manualSchema), defaultValues: defaults() });
  useEffect(() => {
    if (open) form.reset(defaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (v: ManualValues) =>
    ship.mutate(
      { carrier: v.carrier, awb: v.awb || undefined, trackingUrl: v.trackingUrl.trim() || undefined, notifyCustomer: v.notifyCustomer },
      {
        onSuccess: () => {
          toast.success("Order marked shipped.");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Mark shipped"
      description="Record a shipment sent outside Shiprocket. The order moves to Shipped."
      formId="manual-ship-form"
      submitLabel="Mark shipped"
      pending={ship.isPending}
    >
      <Form {...form}>
        <form id="manual-ship-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="carrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Courier</FormLabel>
                  <FormControl>
                    <Input placeholder="Delhivery, Blue Dart, India Post…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="awb"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AWB / tracking number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="trackingUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tracking URL (optional)</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <CheckboxField control={form.control} name="notifyCustomer" id="ship-notify" label="Email the customer" />
        </form>
      </Form>
    </FormDialog>
  );
}
