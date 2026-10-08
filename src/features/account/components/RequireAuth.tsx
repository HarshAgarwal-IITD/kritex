import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import ShopPage from "@/components/shop/ShopPage";
import QueryError from "@/features/catalog/components/QueryError";
import { useCurrentUser } from "../hooks";

/** Signed-in customers only; guests go to `/login?next=<here>`. */
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { isSignedIn, isPending, isError, user, refetch } = useCurrentUser();

  if (isPending) {
    return (
      <ShopPage title="Your Account" eyebrow="Account">
        <p className="font-display text-xs text-muted-foreground" data-skeleton aria-label="Loading account">
          Loading…
        </p>
      </ShopPage>
    );
  }
  if (isError) {
    return (
      <ShopPage title="Your Account" eyebrow="Account">
        <QueryError message="Couldn't check your session." onRetry={refetch} />
      </ShopPage>
    );
  }
  if (!isSignedIn || !user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
};

export default RequireAuth;
