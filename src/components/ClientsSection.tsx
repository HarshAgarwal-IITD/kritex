import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const clients = [
  { name: "Indian Army", abbr: "IA", detail: "Ground Forces" },
  { name: "Indian Air Force", abbr: "IAF", detail: "Air Operations" },
  { name: "Border Security Force", abbr: "BSF", detail: "Border Defence" },
  { name: "Sashastra Seema Bal", abbr: "SSB", detail: "Border Guarding" },
  { name: "CISF", abbr: "CISF", detail: "Industrial Security" },
  { name: "Assam Rifles", abbr: "AR", detail: "Counter Insurgency" },
  { name: "Royal Bhutan Army", abbr: "RBA", detail: "Defence Forces" },
  { name: "Royal Bhutan Police", abbr: "RBP", detail: "Law Enforcement" },
];

const ClientsSection = () => {
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
            Forces We Serve
          </h2>
          <p className="font-body text-muted-foreground text-sm max-w-lg mx-auto">
            Proud supplier to India and Bhutan's premier defence and paramilitary 
            organizations for over five decades.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
          {clients.map((client, i) => (
            <motion.div
              key={client.abbr}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
              className="bg-background p-6 md:p-8 flex flex-col items-center text-center group hover:bg-secondary/50 transition-colors duration-500"
            >
              <div className="w-12 h-12 mb-4 border border-border flex items-center justify-center group-hover:border-primary transition-colors duration-500">
                <Shield size={20} className="text-muted-foreground group-hover:text-primary transition-colors duration-500" />
              </div>
              <p className="font-display text-lg text-foreground mb-1">{client.abbr}</p>
              <p className="font-display text-[10px] text-muted-foreground mb-1">{client.name}</p>
              <p className="font-display text-[9px] text-muted-foreground/60">{client.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientsSection;
