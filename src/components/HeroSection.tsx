import { motion } from "framer-motion";
import heroImg from "@/assets/hero-textile.jpg";

const HeroSection = () => {
  return (
    <section className="relative h-screen flex items-end overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Military grade textile weave macro detail"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
      </div>

      {/* Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
        <img
          src="/logo_flower.png"
          alt=""
          className="w-[60vw] max-w-[600px] opacity-[0.05] invert brightness-0"
        />
      </div>

      {/* Content */}
      <div className="relative container pb-20 md:pb-32">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
            className="font-display text-xs text-primary mb-4 tabular"
          >
            Trusted by Forces Since 1976
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[0.95] mb-6"
          >
            Built for Duty.
            <br />
            Crafted for
            <br />
            Endurance.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
            className="font-body text-muted-foreground max-w-lg mb-8 text-sm md:text-base"
          >
            Engineering defense-grade apparel and tactical hardware for the armed forces of India and Bhutan since 1976.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="flex gap-4"
          >
            <a
              href="#catalog"
              className="font-display text-xs bg-primary text-primary-foreground px-6 py-3 hover:bg-primary/90 transition-colors duration-300"
            >
              View Collection
            </a>
            <a
              href="#contact"
              className="font-display text-xs border border-border text-foreground px-6 py-3 hover:border-primary hover:text-primary transition-colors duration-300"
            >
              Tender Inquiry
            </a>
          </motion.div>
        </div>
      </div>

      {/* Bottom grid line */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border" />
    </section>
  );
};

export default HeroSection;
