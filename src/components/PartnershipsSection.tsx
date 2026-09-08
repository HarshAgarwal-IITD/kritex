import { useState } from "react";
import { motion } from "framer-motion";
import { Handshake } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const partners = [
  { name: "Liberty", logo: "/logos/partners/liberty_logo.svg" },
  { name: "Goldstar", logo: "/logos/partners/logo-goldstar.png" },
  { name: "Active", isText: true },
  { name: "Cosmo", logo: "/logos/partners/cosmo_logo.jpg" },
  { name: "Sega", logo: "/logos/partners/sega_logo.png" },
  { name: "Fuel", logo: "/logos/partners/fuel_logo.png" },
  { name: "Allen Cooper", logo: "/logos/partners/allen_cooper_logo.png" },
  { name: "Raymond", logo: "/logos/partners/raymond_logo.svg" },
  { name: "Arvind", logo: "/logos/partners/arvind_logo.svg" },
  { name: "Nahar", logo: "/logos/partners/nahar_logo.jpg" },
  { name: "OCM", logo: "/logos/partners/ocm_logo.png" },
  { name: "Alok", logo: "/logos/partners/alok_logo.svg" },
  { name: "Reid & Taylor", logo: "/logos/partners/reid_taylor_logo.png" },
  { name: "S Kumars", logo: "/logos/partners/skumar_logo.svg" },
  { name: "Digjam", logo: "/logos/partners/digjam_logo.svg" },
  { name: "Mayur", logo: "/logos/partners/mayur_logo.png" },
  { name: "Vimal", logo: "/logos/partners/vimal_logo.png" },
  { name: "JCT", logo: "/logos/partners/jct_logo.gif" },
  { name: "Graviera", logo: "/logos/partners/graviera_logo.jpg" },
];

const primaryPartners = partners.slice(0, 8);
const secondaryPartners = partners.slice(8);

// Logos with dark/low-contrast artwork that need a white backdrop to stay legible on dark cards
const needsWhiteBackdrop = new Set(["Sega", "JCT", "Graviera", "Alok", "S Kumars", "Digjam", "OCM"]);

const PartnerTile = ({ partner, i }: { partner: { name: string; logo?: string; isText?: boolean }; i: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
    className="bg-background p-6 md:p-8 flex flex-col items-center justify-center text-center group hover:bg-secondary/20 transition-colors duration-500"
  >
    <div className={`flex items-center justify-center relative rounded-lg mb-3 ${partner.isText ? 'h-16 md:h-20 w-auto' : 'w-16 h-16 md:w-20 md:h-20'}`}>
      {partner.isText ? (
        <div className="h-full px-4 md:px-6 rounded-md bg-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          <span className="text-red-600 font-bold text-lg md:text-xl tracking-widest">ACTIVE</span>
        </div>
      ) : (
        <img
          src={partner.logo}
          alt={`${partner.name} logo`}
          className={`object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-500 w-full h-full ${
            needsWhiteBackdrop.has(partner.name) ? "bg-white p-2 rounded-md" : ""
          }`}
          loading="lazy"
        />
      )}
    </div>
    <p className="font-display text-[10px] md:text-xs text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-wider">
      {partner.name}
    </p>
  </motion.div>
);

const PartnershipsSection = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section id="partnerships" className="py-20 md:py-32 bg-secondary/30 border-t border-border">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Handshake className="text-primary w-6 h-6" />
            </div>
          </div>
          <p className="font-display text-xs text-primary mb-3 uppercase tracking-widest">
            Strategic Alliances
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Partnerships & Authorised Dealers
          </h2>
          <p className="font-body text-muted-foreground text-sm max-w-2xl mx-auto">
            We are proud to be authorized dealers and strategic partners with some of the most trusted brands, bringing premium quality directly to our clients.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
          {primaryPartners.map((partner, i) => (
            <PartnerTile key={partner.name} partner={partner} i={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full"
        >
          <Accordion type="single" collapsible className="w-full" onValueChange={(val) => setIsOpen(val === "other-partners")}>
            <AccordionItem value="other-partners" className="border-b-0">
              <AccordionContent className="pt-0 pb-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border mt-px">
                  {secondaryPartners.map((partner, i) => (
                    <PartnerTile key={partner.name} partner={partner} i={i} />
                  ))}
                  <div className="bg-background" />
                </div>
              </AccordionContent>

              <div className="flex justify-center mt-8">
                <AccordionTrigger className="font-display text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest py-2 px-6 border border-border rounded-full hover:no-underline hover:border-primary/50 [&[data-state=open]>svg]:rotate-180 gap-2">
                  {isOpen ? "View Less" : "View More"}
                </AccordionTrigger>
              </div>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default PartnershipsSection;
