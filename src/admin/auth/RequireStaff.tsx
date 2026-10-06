import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isStaff, useMe, useSession } from "../api/auth";
import { adminPaths } from "../paths";
import { ErrorState, FullPageSpinner } from "../components/PageState";

/**
 * Lets STAFF/ADMIN through. No session -> /admin/login?next=<here>. Signed in without a staff role -> storefront home.
 */
export function RequireStaff({ children }: { children: ReactNode }) {
  const location = useLocation();
  const session = useSession();
  const hasSession = !!session.data;
  const me = useMe(hasSession);

  if (session.isPending || (hasSession && me.isPending)) return <FullPageSpinner />;

  if (session.isError || me.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <ErrorState
          message="Couldn't check your session. Is the server reachable?"
          onRetry={() => {
            session.refetch();
            if (hasSession) me.refetch();
          }}
        />
      </div>
    );
  }

  if (!hasSession || !me.data) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${adminPaths.login}?next=${next}`} replace />;
  }

  if (!isStaff(me.data)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
