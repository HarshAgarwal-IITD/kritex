import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import ShopPage from "@/components/shop/ShopPage";
import type { Crumb } from "@/components/Breadcrumbs";
import { useCurrentUser, useLogout } from "../hooks";

const LINKS = [
  { to: "/account", label: "Profile", end: true },
  { to: "/account/orders", label: "Orders" },
  { to: "/account/quotes", label: "Quotes" },
  { to: "/account/addresses", label: "Addresses" },
  { to: "/account/business", label: "Business account" },
];

/** Account pages: side nav (top tabs on mobile) + content. */
const AccountLayout = ({ title, crumbs, children }: { title: string; crumbs?: Crumb[]; children: ReactNode }) => {
  const { user } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <ShopPage
      title={title}
      eyebrow={user ? `Signed in as ${user.email}` : "Account"}
      crumbs={crumbs ?? [{ label: "Home", to: "/" }, { label: "Account", to: "/account" }, { label: title }]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 items-start">
        <nav aria-label="Account" className="flex lg:flex-col gap-1 overflow-x-auto border-b border-border lg:border-b-0 lg:border-r lg:pr-6">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap px-3 py-2 font-display text-[11px] uppercase tracking-wider transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              // Leave the guarded page first, or the guard would bounce to /login once the session clears.
              navigate("/", { replace: true });
              logout.mutate();
            }}
            disabled={logout.isPending}
            className="flex items-center gap-2 whitespace-nowrap px-3 py-2 font-display text-[11px] uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors duration-200 lg:mt-6"
          >
            <LogOut size={12} />
            Log out
          </button>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </ShopPage>
  );
};

export default AccountLayout;
