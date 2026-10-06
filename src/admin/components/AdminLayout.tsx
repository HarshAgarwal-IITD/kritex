import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FolderTree, LogOut, Package, Store } from "lucide-react";
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

const NAV = [
  { label: "Products", to: adminPaths.products, icon: Package },
  { label: "Categories", to: adminPaths.categories, icon: FolderTree },
];

export function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const me = useMe();
  const signOut = useSignOut();
  const current = NAV.find((n) => pathname.startsWith(n.to));

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
          <SidebarGroup>
            <SidebarGroupLabel className="font-display">Catalog</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.to)} tooltip={item.label}>
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
