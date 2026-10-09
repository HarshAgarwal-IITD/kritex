import { ExternalLink, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/features/account/orders";
import { SHIPMENT_STATUS_LABEL } from "../status";
import type { TrackedShipment } from "../types";

/** One shipment: carrier, AWB, status and the carrier's scan history (newest first). */
const ShipmentCard = ({ shipment: s }: { shipment: TrackedShipment }) => {
  const events = [...s.events].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <article className="border border-border p-5" aria-label={`Shipment ${s.awb ?? s.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Truck size={16} className="text-primary" />
          <div>
            <p className="font-display text-xs uppercase tracking-wider text-foreground">
              {s.carrier ?? "Courier"}
              {s.awb ? ` · AWB ${s.awb}` : ""}
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              {s.shippedAt ? `Shipped ${formatDate(s.shippedAt)}` : "Not shipped yet"}
              {s.deliveredAt ? ` · delivered ${formatDate(s.deliveredAt)}` : ""}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-block border px-2 py-1 font-display text-[9px] uppercase tracking-wider",
            s.status === "DELIVERED" ? "border-primary/50 text-primary" : s.status === "RTO" || s.status === "CANCELLED" ? "border-destructive/50 text-destructive" : "border-accent/50 text-accent",
          )}
          data-testid="shipment-status"
        >
          {SHIPMENT_STATUS_LABEL[s.status]}
        </span>
      </div>

      {events.length > 0 && (
        <ol className="relative ml-1 mt-5 border-l border-border" aria-label="Tracking history">
          {events.map((e, i) => (
            <li key={`${e.at}-${i}`} className="relative pb-5 pl-6 last:pb-0">
              <span
                className={cn("absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border border-background", i === 0 ? "bg-primary" : "bg-muted-foreground/50")}
                aria-hidden
              />
              <p className="font-body text-sm text-foreground">{e.description ?? e.status}</p>
              <p className="font-display text-[10px] text-muted-foreground mt-1">
                {formatDateTime(e.at)}
                {e.location ? ` · ${e.location}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}

      {s.trackingUrl && (
        <a
          href={s.trackingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 font-display text-xs text-primary hover:text-primary/80"
        >
          Track on {s.carrier ?? "the courier's"} website <ExternalLink size={12} />
        </a>
      )}
    </article>
  );
};

export default ShipmentCard;
