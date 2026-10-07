import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useEnquiries, useUpdateEnquiry } from "../api/dashboard";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS, type EnquiryStatus } from "../api/types";
import { formatDateTime } from "../lib/format";
import { ErrorState, PageHeader } from "../components/PageState";
import { EnquiryStatusBadge } from "../components/Badges";
import { Skeleton } from "@/components/ui/skeleton";

type Tab = EnquiryStatus | "ALL";

export default function EnquiriesPage() {
  const enquiries = useEnquiries();
  const update = useUpdateEnquiry();
  const [tab, setTab] = useState<Tab>("NEW");
  const rows = enquiries.data?.filter((q) => tab === "ALL" || q.status === tab) ?? [];
  const count = (s: EnquiryStatus) => enquiries.data?.filter((q) => q.status === s).length ?? 0;

  return (
    <div>
      <PageHeader title="Enquiries" description="Messages from the contact and tender forms." />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mb-4">
        <TabsList className="rounded-none">
          {ENQUIRY_STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="rounded-none">
              {ENQUIRY_STATUS_LABELS[s]} ({count(s)})
            </TabsTrigger>
          ))}
          <TabsTrigger value="ALL" className="rounded-none">
            All
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {enquiries.isError ? (
        <ErrorState message={enquiries.error.message} onRetry={() => enquiries.refetch()} />
      ) : enquiries.isPending ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="border border-border p-10 text-center text-sm text-muted-foreground">No enquiries here.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((q) => (
            <li key={q.id} className="border border-border bg-card/50 p-4 space-y-2" aria-label={`Enquiry from ${q.name}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {q.name}
                    {q.organization && <span className="text-muted-foreground font-normal"> · {q.organization}</span>}
                  </p>
                  <a href={`mailto:${q.email}`} className="text-xs text-primary hover:underline break-all">
                    {q.email}
                  </a>
                  <p className="text-xs text-muted-foreground">{formatDateTime(q.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <EnquiryStatusBadge status={q.status} />
                  <Select
                    value={q.status}
                    disabled={update.isPending}
                    onValueChange={(status) =>
                      update.mutate(
                        { id: q.id, status: status as EnquiryStatus },
                        {
                          onSuccess: (u) => toast.success(`Marked ${ENQUIRY_STATUS_LABELS[u.status].toLowerCase()}.`),
                          onError: (e) => toast.error(e.message),
                        },
                      )
                    }
                  >
                    <SelectTrigger className="h-8 w-[140px]" aria-label={`Status for ${q.name}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENQUIRY_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {ENQUIRY_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-sm whitespace-pre-line">{q.requirements}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
