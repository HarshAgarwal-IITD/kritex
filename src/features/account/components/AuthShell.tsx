import type { ReactNode } from "react";
import ShopPage from "@/components/shop/ShopPage";
import { panelClass } from "@/components/shop/styles";

interface AuthShellProps {
  title: string;
  eyebrow?: string;
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Narrow card layout for login / signup / password pages, inside the normal storefront shell. */
const AuthShell = ({ title, eyebrow = "Account", intro, children, footer }: AuthShellProps) => (
  <ShopPage title={title} crumbs={[{ label: "Home", to: "/" }, { label: title }]} hideHeading>
    <div className="mx-auto max-w-md">
      <p className="font-display text-xs text-primary mb-3">{eyebrow}</p>
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{title}</h1>
      {intro && <div className="font-body text-sm text-muted-foreground mb-8">{intro}</div>}
      <div className={panelClass}>{children}</div>
      {footer && <div className="mt-6 font-body text-sm text-muted-foreground">{footer}</div>}
    </div>
  </ShopPage>
);

export default AuthShell;
