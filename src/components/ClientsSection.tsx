import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const primaryClients = [
  {
    name: "Indian Army",
    abbr: "IA",
    logo: "/ia_logo.svg"
  },
  {
    name: "Indian Air Force",
    abbr: "IAF",
    logo: "/iaf_logo.png"
  },
  {
    name: "Sashastra Seema Bal",
    abbr: "SSB",
    logo: "/ssb_logo.svg"
  },
  {
    name: "Border Security Force",
    abbr: "BSF",
    logo: "/bsf_logo.png"
  },
  {
    name: "Royal Bodyguards (Bhutan)",
    abbr: "RBG",
    logo: "/royal_bodyguards.png"
  },
  {
    name: "Royal Bhutan Police",
    abbr: "RBP",
    logo: "/rbp.png"
  },
  {
    name: "Gyalsung",
    abbr: "Gyalsung",
    logo: "/gyalsung_logo.png"
  },
  {
    name: "Royal Bhutan Army",
    abbr: "RBA",
    logo: "/rba_logo.png"
  },
];

const secondaryClients = [
  { name: "West Bengal Police", abbr: "WBP", logo: "/wbp.png" },
  { name: "Bihar Police", abbr: "BP", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Bihar_Police_Logo.svg" },
  { name: "Central Reserve Police Force", abbr: "CRPF", logo: "/CRPF_Logo.svg" },
  { name: "Indo-Tibetan Border Police", abbr: "ITBP", logo: "/ITBP_Logo.svg.png" },
  { name: "DeSuung (Guardians of Peace)", abbr: "DeSuung", logo: "/desunng_logo.jpeg" },
  { name: "Assam Rifles", abbr: "AR", logo: "/Assam_Rifles_LOGO.svg.png" },
  { name: "Penden Cement", abbr: "Penden" },
  { name: "Lhaki Cement", abbr: "Lhaki" },
  { name: "BCCL", abbr: "BCCL" },
  { name: "Druk Adventure Gear", abbr: "DAG" },
];

const ClientsSection = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section id="clients" className="py-20 md:py-32 border-t border-border">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="text-center mb-16"
        >
          <p className="font-display text-xs text-primary mb-3">Trusted By</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Forces & Organizations We Serve
          </h2>
          <p className="font-body text-muted-foreground text-sm max-w-lg mx-auto">
            Proud supplier to India and Bhutan's premier defence, paramilitary,
            and industrial organizations.
          </p>
        </motion.div>

        {/* Primary Clients */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border mb-8">
          {primaryClients.map((client, i) => (
            <motion.div
              key={client.abbr}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
              className="bg-background p-6 md:p-8 flex flex-col items-center text-center group hover:bg-secondary/20 transition-colors duration-500"
            >
              <div className="w-16 h-16 mb-4 flex items-center justify-center relative">
                {client.logo ? (
                  <img
                    src={client.logo}
                    alt={`${client.name} logo`}
                    className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <Shield size={28} className={`text-muted-foreground/30 absolute transition-colors duration-500 group-hover:text-primary ${client.logo ? 'hidden' : ''}`} />
              </div>
              <p className="font-display text-sm md:text-base text-foreground mb-1 group-hover:text-primary transition-colors">{client.abbr}</p>
              <p className="font-display text-[9px] md:text-[10px] text-muted-foreground">{client.name}</p>
            </motion.div>
          ))}
        </div>

        {/* Other Clients Dropdown */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full"
        >
          <Accordion type="single" collapsible className="w-full" onValueChange={(val) => setIsOpen(val === "other-clients")}>
            <AccordionItem value="other-clients" className="border-b-0">

              <AccordionContent className="pt-0 pb-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border mt-px">
                  {secondaryClients.flatMap((client, i) => {
                    const isTwoElementLastRow = secondaryClients.length % 4 === 2 && i === secondaryClients.length - 2;
                    const isLastElement = i === secondaryClients.length - 1;
                    const needsFillers = secondaryClients.length % 4 === 2;

                    const clientNode = (
                      <motion.div
                        key={client.name}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
                        className="bg-background p-6 md:p-8 flex flex-col items-center text-center group hover:bg-secondary/20 transition-colors duration-500"
                      >
                        <div className="w-16 h-16 mb-4 flex items-center justify-center relative">
                          {client.logo ? (
                            <img
                              src={client.logo}
                              alt={`${client.name} logo`}
                              className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <Shield size={28} className={`text-muted-foreground/30 absolute transition-colors duration-500 group-hover:text-primary ${client.logo ? 'hidden' : ''}`} />
                        </div>
                        <p className="font-display text-sm md:text-base text-foreground mb-1 group-hover:text-primary transition-colors">{client.abbr}</p>
                        <p className="font-display text-[9px] md:text-[10px] text-muted-foreground">{client.name}</p>
                      </motion.div>
                    );

                    const result = [];
                    if (isTwoElementLastRow) {
                      result.push(<div key={`empty-left`} className="hidden md:block bg-background" />);
                    }
                    result.push(clientNode);
                    if (isLastElement && needsFillers) {
                      result.push(<div key={`empty-right`} className="hidden md:block bg-background" />);
                    }
                    return result;
                  })}
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

export default ClientsSection;
