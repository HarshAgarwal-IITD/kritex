import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, toApiError, type ApiError } from "@/lib/api/client";
import { useCurrentUser } from "@/features/account/hooks";
import { quoteErrorMessage, quoteKeys } from "@/features/quote/hooks";
import { quoteCart } from "@/features/quote/store";
import { clearPendingEnquiry, loadPendingEnquiry, type PendingEnquiry } from "./pending";

async function send(enquiry: PendingEnquiry): Promise<string | null> {
  if (enquiry.kind === "contact") {
    const { error, response } = await api.POST("/api/v1/queries", { body: enquiry.body });
    if (error || !response.ok) throw toApiError(error, response);
    return null;
  }
  const { data, error, response } = await api.POST("/api/v1/quotes", { body: enquiry.body });
  if (error || !data) throw toApiError(error, response);
  return data.number;
}

/**
 * Sends the enquiry a guest filled in before logging in, once a verified session exists (ADR-018).
 * Mounted once for the whole storefront, so it works wherever the sign-in flow lands.
 */
const PendingEnquirySender = () => {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const sending = useRef(false);

  useEffect(() => {
    if (!user?.emailVerified || sending.current) return;
    const enquiry = loadPendingEnquiry();
    if (!enquiry) return;
    sending.current = true;
    send(enquiry)
      .then((quoteNumber) => {
        clearPendingEnquiry();
        if (enquiry.kind === "quote") {
          quoteCart.clear();
          void qc.invalidateQueries({ queryKey: quoteKeys.mine });
          toast.success(`Quote request ${quoteNumber} sent. We'll email the quote to ${user.email}.`, {
            action: { label: "View", onClick: () => navigate(`/account/quotes/${encodeURIComponent(quoteNumber!)}`) },
          });
        } else {
          toast.success(`Your enquiry has been sent. Our team will reply to ${user.email}.`);
        }
      })
      .catch((err: ApiError) => {
        // Keep the draft when the session or network was the problem; otherwise it can't succeed.
        if (err.status !== 401 && err.code !== "NETWORK_ERROR") clearPendingEnquiry();
        const detail = enquiry.kind === "quote" ? quoteErrorMessage(err) : "Please try again or email procurement@kritex.in.";
        toast.error(`Couldn't send your ${enquiry.kind === "quote" ? "quote request" : "enquiry"}. ${detail}`);
      })
      .finally(() => {
        sending.current = false;
      });
  }, [user, navigate, qc]);

  return null;
};

export default PendingEnquirySender;
