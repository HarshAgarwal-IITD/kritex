import { Link } from "react-router-dom";
import { productCategories } from "@/data/productCategories";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container flex flex-col items-center gap-10">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          <Link
            to="/products"
            className="font-display text-xs uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            All Products
          </Link>
          {productCategories
            .filter((cat) => cat.available)
            .map((cat) => (
              <Link
                key={cat.slug}
                to={`/products/${cat.slug}`}
                className="font-display text-xs uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                {cat.title}
              </Link>
            ))}
          <a
            href="/#contact"
            className="font-display text-xs uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            Contact Us
          </a>
        </div>

        <div className="flex flex-col items-center justify-center gap-6">
          <img src="/brand/yellow_full.png" alt="Kritex Logo" className="h-[80px] md:h-[100px] object-contain drop-shadow-sm" />
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="font-display text-sm tracking-wide text-muted-foreground">
              Defense & Industrial Supply
            </span>
            <p className="font-display text-xs text-muted-foreground">
              © {new Date().getFullYear()} Kritex. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
