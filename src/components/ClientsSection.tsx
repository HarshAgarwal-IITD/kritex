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
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Indian_Army_Insignia.svg" 
  },
  { 
    name: "Indian Air Force", 
    abbr: "IAF", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Indian_Air_Force_Emblem.svg" 
  },
  { 
    name: "Sashastra Seema Bal", 
    abbr: "SSB", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/10/Sashastra_Seema_Bal_Logo.svg"
  },
  { 
    name: "Border Security Force", 
    abbr: "BSF", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/ae/BSF_Logo.svg" 
  },
  { 
    name: "Central Reserve Police Force", 
    abbr: "CRPF", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Central_Reserve_Police_Force_Logo.svg"
  },
  { 
    name: "Indo-Tibetan Border Police", 
    abbr: "ITBP", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b3/ITBP_Logo.svg"
  },
  { 
    name: "Assam Rifles", 
    abbr: "AR", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/23/Assam_Rifles_LOGO.svg"
  },
  { 
    name: "Royal Bhutan Army", 
    abbr: "RBA", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/87/Flag_of_the_Royal_Bhutan_Army.svg"
  },
];

const secondaryClients = [
  { name: "West Bengal Police", abbr: "WBP", logo: "https://upload.wikimedia.org/wikipedia/en/e/e0/West_Bengal_Police_Logo.png" },
  { name: "Bihar Police", abbr: "BP", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Bihar_Police_Logo.svg" },
  { name: "Royal Bodyguards (Bhutan)", abbr: "RBG", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Flag_of_Royal_Bodyguard_of_Bhutan.svg" },
  { name: "Royal Bhutan Police", abbr: "RBP", logo: "https://upload.wikimedia.org/wikipedia/commons/5/52/Emblem_of_the_Royal_Bhutan_Police.svg" },
  { name: "DeSuung (Guardians of Peace)", abbr: "DeSuung", logo: "https://upload.wikimedia.org/wikipedia/commons/8/83/Logo_DESU.png" },
  { name: "Gyalsung", abbr: "Gyalsung" },
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
                  {secondaryClients.map((client, i) => (
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
                  ))}
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
