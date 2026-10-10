import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ClipboardList, LogOut, Menu, Package, ShoppingBag, User, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCategories } from "@/features/catalog/hooks";
import { useCartCount } from "@/features/cart/hooks";
import { useQuoteCount } from "@/features/quote/store";
import { useCurrentUser, useLogout } from "@/features/account/hooks";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";

/** Plain links after the Products menu. `#…` targets are sections of the home page. */
const navLinks = [
  { label: "Clients", href: "#clients" },
  { label: "Track Order", to: "/track" },
];

const countBadge =
  "absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-display text-[9px] text-primary-foreground tabular";
const iconLink = "relative text-muted-foreground hover:text-primary transition-colors duration-300";
const navText = "font-display text-xs transition-colors duration-300";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "K";

/** Account menu: "Log In" for guests; initials + a dropdown (account, orders, quotes, log out) when signed in. */
const AccountMenu = () => {
  const { user } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Link
        to="/login"
        aria-label="Account"
        className={cn(navText, "flex items-center gap-1.5 text-muted-foreground hover:text-primary")}
      >
        <User size={16} />
        <span className="hidden lg:inline">Log In</span>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/60 font-display text-[10px] text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        {initials(user.name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-none border-border bg-[#1c1f16]">
        <DropdownMenuLabel className="font-body font-normal">
          <p className="truncate text-sm text-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="font-display text-xs">
          <Link to="/account">
            <User size={14} /> My Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="font-display text-xs">
          <Link to="/account/orders">
            <Package size={14} /> Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="font-display text-xs">
          <Link to="/account/quotes">
            <ClipboardList size={14} /> Quotes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="font-display text-xs"
          onSelect={() => logout.mutate(undefined, { onSettled: () => navigate("/") })}
        >
          <LogOut size={14} /> Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/** Quote request (once it has items) + cart icons with count badges. */
export const CartLinks = ({ cartCount = 0, quoteCount = 0 }: { cartCount?: number; quoteCount?: number }) => (
  <div className="flex items-center gap-5">
    {quoteCount > 0 && (
      <Link to="/quote" aria-label={`Quote request (${quoteCount} items)`} className={iconLink}>
        <ClipboardList size={16} />
        <span className={countBadge}>{quoteCount}</span>
      </Link>
    )}
    <Link to="/cart" aria-label={cartCount > 0 ? `Cart (${cartCount} items)` : "Cart"} className={iconLink}>
      <ShoppingBag size={16} />
      {cartCount > 0 && <span className={countBadge}>{cartCount}</span>}
    </Link>
  </div>
);

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const logout = useLogout();
  const { data: categoryData } = useCategories();
  const cartCount = useCartCount();
  const quoteCount = useQuoteCount();
  const productCategories = (categoryData?.items ?? []).map((c) => ({
    slug: c.slug,
    title: c.name,
    available: c.productCount > 0,
  }));
  const onProducts = location.pathname.startsWith("/product");

  // Transparent over the hero, solid once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation.
  useEffect(() => {
    setOpen(false);
    setProductsOpen(false);
  }, [location.pathname]);

  const handleSectionLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (location.pathname !== "/") {
      e.preventDefault();
      navigate(`/${href}`);
    }
  };

  const desktopLinkClass = (active: boolean) =>
    cn(navText, active ? "text-primary" : "text-muted-foreground hover:text-primary");

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-lg transition-colors duration-300",
        scrolled || open ? "border-border bg-[#1c1f16]/95 shadow-lg shadow-black/20" : "border-white/10 bg-[#3a3f2f]/30",
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-6">
        <Link to="/" className="font-display text-lg tracking-tight text-foreground -ml-2 shrink-0" aria-label="Kritex home">
          <img src={asset("/brand/yellow_full.png")} alt="Kritex" className="h-[44px] object-contain drop-shadow-sm" />
        </Link>

        {/* Desktop: navigation */}
        <div className="hidden md:flex flex-1 items-center gap-8">
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setProductsOpen(false)}
          >
            <div className="flex items-center gap-1">
              <Link to="/products" className={desktopLinkClass(onProducts)}>
                Products
              </Link>
              <button
                type="button"
                aria-label="Product categories"
                aria-expanded={productsOpen}
                onClick={() => setProductsOpen((v) => !v)}
                className={desktopLinkClass(onProducts)}
              >
                <ChevronDown size={12} className={`transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            <AnimatePresence>
              {productsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15, ease: [0.19, 1, 0.22, 1] }}
                  className="absolute left-0 top-full pt-3 w-64"
                >
                  <div className="border border-border bg-[#1c1f16] shadow-xl">
                    <Link
                      to="/products"
                      className="block px-4 py-3 font-display text-xs text-primary border-b border-border hover:bg-white/5 transition-colors duration-200"
                    >
                      View All Products →
                    </Link>
                    {productCategories.map((cat) =>
                      cat.available ? (
                        <Link
                          key={cat.slug}
                          to={`/products/${cat.slug}`}
                          className={cn(
                            "block px-4 py-3 font-display text-xs hover:text-primary hover:bg-white/5 transition-colors duration-200",
                            location.pathname === `/products/${cat.slug}` ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {cat.title}
                        </Link>
                      ) : (
                        <div
                          key={cat.slug}
                          className="flex items-center justify-between px-4 py-3 font-display text-xs text-muted-foreground/40 cursor-default"
                        >
                          <span>{cat.title}</span>
                          <span className="text-[9px] uppercase tracking-wider">Soon</span>
                        </div>
                      ),
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navLinks.map((link) =>
            link.to ? (
              <Link key={link.label} to={link.to} className={desktopLinkClass(location.pathname.startsWith(link.to))}>
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleSectionLink(e, link.href!)}
                className={desktopLinkClass(false)}
              >
                {link.label}
              </a>
            ),
          )}
        </div>

        {/* Desktop: actions */}
        <div className="hidden md:flex items-center gap-6">
          <CartLinks cartCount={cartCount} quoteCount={quoteCount} />
          <AccountMenu />
          <a
            href="#contact"
            onClick={(e) => handleSectionLink(e, "#contact")}
            className="font-display text-xs bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 transition-colors duration-300"
          >
            Contact Us
          </a>
        </div>

        {/* Mobile: cart + menu toggle */}
        <div className="md:hidden flex items-center gap-5">
          <CartLinks cartCount={cartCount} quoteCount={quoteCount} />
          <button onClick={() => setOpen(!open)} className="text-foreground" aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="md:hidden overflow-hidden border-t border-border bg-background"
          >
            <div className="container py-6 flex flex-col gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                  aria-expanded={mobileProductsOpen}
                  className="flex items-center justify-between w-full font-display text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Products
                  <ChevronDown size={14} className={`transition-transform duration-200 ${mobileProductsOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {mobileProductsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-4 flex flex-col gap-3 mt-3"
                    >
                      <Link to="/products" onClick={() => setOpen(false)} className="font-display text-xs text-primary">
                        View All Products →
                      </Link>
                      {productCategories.map((cat) =>
                        cat.available ? (
                          <Link
                            key={cat.slug}
                            to={`/products/${cat.slug}`}
                            onClick={() => setOpen(false)}
                            className="font-display text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            {cat.title}
                          </Link>
                        ) : (
                          <span key={cat.slug} className="font-display text-xs text-muted-foreground/40">
                            {cat.title} (Soon)
                          </span>
                        ),
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {navLinks.map((link) =>
                link.to ? (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="font-display text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => {
                      setOpen(false);
                      handleSectionLink(e, link.href!);
                    }}
                    className="font-display text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                ),
              )}

              <div className="border-t border-border pt-4 flex flex-col gap-4">
                {user ? (
                  <>
                    <div className="font-body">
                      <p className="text-sm text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Link to="/account" onClick={() => setOpen(false)} className="font-display text-sm text-muted-foreground hover:text-primary">
                      My Account
                    </Link>
                    <Link to="/account/orders" onClick={() => setOpen(false)} className="font-display text-sm text-muted-foreground hover:text-primary">
                      Orders
                    </Link>
                    <Link to="/account/quotes" onClick={() => setOpen(false)} className="font-display text-sm text-muted-foreground hover:text-primary">
                      Quotes
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        logout.mutate(undefined, { onSettled: () => navigate("/") });
                      }}
                      className="w-fit font-display text-sm text-muted-foreground hover:text-primary"
                    >
                      Log Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-6">
                    <Link to="/login" onClick={() => setOpen(false)} className="font-display text-sm text-foreground hover:text-primary">
                      Log In
                    </Link>
                    <Link to="/signup" onClick={() => setOpen(false)} className="font-display text-sm text-muted-foreground hover:text-primary">
                      Create Account
                    </Link>
                  </div>
                )}
              </div>

              <a
                href="#contact"
                onClick={(e) => {
                  setOpen(false);
                  handleSectionLink(e, "#contact");
                }}
                className="font-display text-sm bg-primary text-primary-foreground px-4 py-2 w-fit"
              >
                Contact Us
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
