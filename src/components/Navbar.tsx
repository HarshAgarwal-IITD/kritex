import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { productCategories } from "@/data/productCategories";

const navLinks = [
  { label: "Achievements", href: "#achievements" },
  { label: "Clients", href: "#clients" },
  { label: "Timeline", href: "#timeline" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSectionLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (location.pathname !== "/") {
      e.preventDefault();
      navigate(`/${href}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#3a3f2f]/30 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-display text-lg tracking-tight text-foreground -ml-2">

            <img src="/brand/yellow_full.png" alt="Logo" className="h-[44px] object-contain drop-shadow-sm"/>

        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {/* Products dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <Link
              to="/products"
              className="font-display text-xs text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-1"
            >
              Products
              <ChevronDown size={12} className={`transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`} />
            </Link>

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
                          className="block px-4 py-3 font-display text-xs text-muted-foreground hover:text-primary hover:bg-white/5 transition-colors duration-200"
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
                      )
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleSectionLink(e, link.href)}
              className="font-display text-xs text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={(e) => handleSectionLink(e, "#contact")}
            className="font-display text-xs bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 transition-colors duration-300"
          >
            Contact Us
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-foreground"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
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
              {/* Products expandable section */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
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
                      <Link
                        to="/products"
                        onClick={() => setOpen(false)}
                        className="font-display text-xs text-primary"
                      >
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
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    setOpen(false);
                    handleSectionLink(e, link.href);
                  }}
                  className="font-display text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
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
