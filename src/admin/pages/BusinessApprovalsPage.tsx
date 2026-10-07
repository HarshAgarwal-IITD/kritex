import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useBusinessProfiles, useReviewBusinessProfile, type BusinessProfileFilters } from "../api/customers";
import type { BusinessProfile, BusinessStatus } from "../api/types";
import { formatDate } from "../lib/format";
import { useUrlFilters } from "../lib/hooks";
import { adminPaths } from "../paths";
import { ErrorState, PageHeader } from "../components/PageState";
import { BusinessStatusBadge } from "../components/Badges";
import { Pager } from "../components/Pager";
import { TableStates } from "../components/TableStates";

const PAGE_SIZE = 20;
const TABS: { value: string; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "all", label: "All" },
];

export default function BusinessApprovalsPage() {
  const { get, setParam, page, search, setSearch } = useUrlFilters();
  const tab = get("status") ?? "PENDING";
  const filters: BusinessProfileFilters = {
    status: tab === "all" ? undefined : (tab as BusinessStatus),
    q: get("q"),
    page,
    limit: PAGE_SIZE,
  };
  const profiles = useBusinessProfiles(filters);
  const [approving, setApproving] = useState<BusinessProfile | null>(null);
  const [rejecting, setRejecting] = useState<BusinessProfile | null>(null);
  const review = useReviewBusinessProfile();

  return (
    <div>
      <PageHeader
        title="B2B approvals"
        description="Approved businesses get tier pricing, B2B-only products and bank transfer checkout."
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Tabs value={tab} onValueChange={(v) => setParam("status", v === "PENDING" ? undefined : v)}>
          <TabsList className="rounded-none">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="rounded-none">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search applications"
            placeholder="Legal name, GSTIN or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {profiles.isError ? (
        <ErrorState message={profiles.error.message} onRetry={() => profiles.refetch()} />
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-48" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableStates
                loading={profiles.isPending}
                empty={profiles.data?.items.length === 0}
                colSpan={6}
                message={tab === "PENDING" ? "No applications waiting for review." : "No applications."}
              />
              {profiles.data?.items.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.legalName}</TableCell>
                  <TableCell className="text-xs tabular">{b.gstin}</TableCell>
                  <TableCell>
                    <Link to={adminPaths.customer(b.user.id)} className="hover:text-primary">
                      {b.user.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{b.user.email}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular">{formatDate(b.createdAt)}</TableCell>
                  <TableCell>
                    <BusinessStatusBadge status={b.status} />
                    {b.reviewedBy && (
                      <div className="text-xs text-muted-foreground mt-1">
                        by {b.reviewedBy.name}, {formatDate(b.reviewedAt)}
                      </div>
                    )}
                    {b.rejectionReason && <div className="text-xs text-muted-foreground mt-1">{b.rejectionReason}</div>}
                  </TableCell>
                  <TableCell>
                    {b.status === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" className="font-display text-xs" aria-label={`Approve ${b.legalName}`} onClick={() => setApproving(b)}>
                          <Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="font-display text-xs" aria-label={`Reject ${b.legalName}`} onClick={() => setRejecting(b)}>
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pager
        total={profiles.data?.total ?? 0}
        page={profiles.data?.page ?? page}
        limit={profiles.data?.limit ?? PAGE_SIZE}
        noun={["application", "applications"]}
        loaded={!!profiles.data}
        onPage={(p) => setParam("page", String(p))}
      />

      <AlertDialog open={!!approving} onOpenChange={(o) => !o && setApproving(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-base">Approve {approving?.legalName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {approving?.user.name} ({approving?.user.email}) becomes a B2B customer and sees tier prices straight away. Check
              GSTIN {approving?.gstin} on the GST portal first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={review.isPending}
              onClick={() =>
                approving &&
                review.mutate(
                  { id: approving.id, decision: "approve" },
                  { onSuccess: (b) => toast.success(`${b.legalName} approved.`), onError: (e) => toast.error(e.message) },
                )
              }
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RejectDialog profile={rejecting} onClose={() => setRejecting(null)} />
    </div>
  );
}

const rejectSchema = z.object({ reason: z.string().trim().min(5, "Tell the customer why (at least 5 characters)").max(500) });
type RejectValues = z.infer<typeof rejectSchema>;

function RejectDialog({ profile, onClose }: { profile: BusinessProfile | null; onClose: () => void }) {
  const review = useReviewBusinessProfile();
  const form = useForm<RejectValues>({ resolver: zodResolver(rejectSchema), defaultValues: { reason: "" } });
  useEffect(() => {
    if (profile) form.reset({ reason: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const onSubmit = (v: RejectValues) =>
    profile &&
    review.mutate(
      { id: profile.id, decision: "reject", reason: v.reason.trim() },
      {
        onSuccess: (b) => {
          toast.success(`${b.legalName} rejected.`);
          onClose();
        },
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <Dialog open={!!profile} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle className="font-display text-base">Reject {profile?.legalName}?</DialogTitle>
          <DialogDescription>The customer can fix the details and apply again.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="reject-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormDescription>Shown to the customer.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="reject-form" variant="destructive" disabled={review.isPending} className="font-display text-xs">
            {review.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
