import { motion } from "framer-motion";
import { Shirt, Footprints, Backpack, HardHat, ShieldCheck, Award, Crosshair, Package } from "lucide-react";

const capabilities = [
  { icon: Shirt, title: "Combat Uniforms", desc: "BDUs, ACUs, ceremonial dress, and specialized climate-adaptive uniforms for all terrains." },
  { icon: Footprints, title: "Tactical Footwear", desc: "Jungle boots, desert boots, DMS shoes, ankle boots — Vibram & PU sole variants." },
  { icon: Backpack, title: "Load Bearing Equipment", desc: "Rucksacks, patrol packs, webbing systems, MOLLE-compatible pouches and carriers." },
  { icon: HardHat, title: "Headgear & Protection", desc: "Berets, caps, balaclavas, helmet covers, and cold-weather headgear." },
  { icon: Crosshair, title: "Field Accessories", desc: "Belts, gloves, socks, lanyards, rain gear, sleeping bags and ground sheets." },
  { icon: Package, title: "Bulk & Custom Orders", desc: "High-volume production runs with custom specifications, patches, and insignia." },
  { icon: ShieldCheck, title: "Quality Assurance", desc: "Every item tested against MIL-SPEC parameters — tensile strength, colourfastness, GSM." },
  { icon: Award, title: "Export Compliance", desc: "Full documentation for cross-border supply — Bhutan, India, and international tenders." },
];

const CapabilitiesSection = () => {
  return (
    <section id="capabilities" className="py-20 md:py-32 border-t border-border">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="mb-16"
        >
          <p className="font-display text-xs text-primary mb-3">Capabilities</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Full-Spectrum Supply
          </h2>
          <p className="font-body text-muted-foreground text-sm max-w-lg">
            From base layers to field equipment — everything a force needs, engineered to endure.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
                className="bg-background p-6 group"
              >
                <Icon size={20} className="text-muted-foreground group-hover:text-primary transition-colors duration-500 mb-4" />
                <h3 className="font-display text-xs text-foreground mb-2">{cap.title}</h3>
                <p className="font-body text-xs text-muted-foreground leading-relaxed">{cap.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CapabilitiesSection;
