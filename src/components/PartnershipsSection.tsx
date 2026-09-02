import { motion } from "framer-motion";
import { Handshake } from "lucide-react";

const partners = [
  { name: "Liberty", logo: "/liberty_logo.svg" },
  { name: "Goldstar", logo: "/logo-goldstar.png" },
  { name: "Active", isText: true },
  { name: "Cosmo", logo: "/cosmo_logo.jpg" },
  { name: "Sega", logo: "/sega_logo.png" },
];

const PartnershipsSection = () => {
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
            We are proud to be authorized dealers and strategic partners with some of the most trusted footwear brands, bringing premium quality directly to our clients.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border">
          {partners.map((partner, i) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
              className="bg-background p-6 md:p-8 flex flex-col items-center justify-center text-center group hover:bg-secondary/20 transition-colors duration-500"
            >
              <div className={`flex items-center justify-center relative rounded-lg ${partner.isText ? 'h-16 md:h-20 w-auto' : 'w-16 h-16 md:w-20 md:h-20'}`}>
                {partner.isText ? (
                  <div className="h-full px-4 md:px-6 rounded-md bg-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <span className="text-red-600 font-bold text-lg md:text-xl tracking-widest">ACTIVE</span>
                  </div>
                ) : (
                  <img
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    className={`object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-500 w-full h-full ${
                      partner.name === "Sega" ? "bg-white p-2 rounded-md" : ""
                    }`}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnershipsSection;
