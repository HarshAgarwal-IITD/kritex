import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BadgeCheck, Boxes, ClipboardList, FolderTree, Inbox, LayoutDashboard, LogOut, Package, ShoppingBag, Store, TicketPercent, Users, type LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { asset } from "@/lib/asset";
import { useMe, useSignOut } from "../api/auth";
import { adminPaths } from "../paths";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ label: "Dashboard", to: adminPaths.dashboard, icon: LayoutDashboard, exact: true }] },
  {
    label: "Sales",
    items: [
      { label: "Orders", to: adminPaths.orders, icon: ShoppingBag },
      { label: "Quotes", to: adminPaths.quotes, icon: ClipboardList },
      { label: "Customers", to: adminPaths.customers, icon: Users },
      { label: "B2B approvals", to: adminPaths.b2bApprovals, icon: BadgeCheck },
      { label: "Coupons", to: adminPaths.coupons, icon: TicketPercent },
      { label: "Enquiries", to: adminPaths.enquiries, icon: Inbox },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", to: adminPaths.products, icon: Package },
      { label: "Categories", to: adminPaths.categories, icon: FolderTree },
      { label: "Inventory", to: adminPaths.inventory, icon: Boxes },
    ],
  },
];

const isActive = (item: NavItem, pathname: string) =>
  item.exact ? pathname.replace(/\/$/, "") === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);

export function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const me = useMe();
  const signOut = useSignOut();
  const current = NAV_GROUPS.flatMap((g) => g.items).find((n) => isActive(n, pathname));

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link to={adminPaths.root} className="flex items-center gap-2 px-2 py-1.5">
            <img src={asset("/brand/flower_yellow.png")} alt="" className="h-6 w-6 object-contain shrink-0" />
            <span className="font-display text-sm text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Kritex Admin
            </span>
          </Link>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          {NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="font-display">{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={isActive(item, pathname)} tooltip={item.label}>
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="View store">
                <Link to="/">
                  <Store />
                  <span>View store</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sign out"
                disabled={signOut.isPending}
                onClick={() => signOut.mutate(undefined, { onSettled: () => navigate(adminPaths.login, { replace: true }) })}
              >
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          {me.data && (
            <div className="px-2 pb-1 group-data-[collapsible=icon]:hidden">
              <p className="font-body text-xs text-sidebar-foreground truncate">{me.data.name}</p>
              <p className="font-body text-[11px] text-muted-foreground truncate">
                {me.data.email} · {me.data.role}
              </p>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="font-display text-xs text-muted-foreground">{current?.label ?? "Admin"}</span>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
