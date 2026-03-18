import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Clients", href: "#clients" },
  { label: "Equipment", href: "#catalog" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Timeline", href: "#timeline" },
  { label: "Heritage", href: "#heritage" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#3a3f2f]/30 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <a href="#" className="font-display text-lg tracking-tight text-foreground -ml-2">
         
            <img src="/yellow_full.png" alt="Logo" className="h-[44px] object-contain drop-shadow-sm"/>
         
        </a>
        
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-display text-xs text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            className="font-display text-xs bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 transition-colors duration-300"
          >
            Procurement Inquiry
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
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="font-display text-sm bg-primary text-primary-foreground px-4 py-2 w-fit"
              >
                Procurement Inquiry
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
