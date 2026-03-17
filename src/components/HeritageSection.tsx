import { motion } from "framer-motion";

const HeritageSection = () => {
  return (
    <section id="heritage" className="py-20 md:py-32 border-t border-border">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="md:col-span-5"
          >
            <p className="font-display text-xs text-primary mb-3">Heritage</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              From Father
              <br />
              to Force
            </h2>
            <p className="font-body text-muted-foreground text-sm leading-relaxed max-w-md">
              For over three decades, Kritex has been the trusted supply partner for 
              India's armed forces and the Royal Bhutan Army. What began as a family 
              enterprise has evolved into a precision-grade military supply operation, 
              serving procurement officers and defense ministries across two nations.
            </p>
          </motion.div>

          {/* Right - supply details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
            className="md:col-span-7"
          >
            <div className="grid grid-cols-1 gap-px bg-border">
              {[
                {
                  title: "Indian Army & Air Force",
                  desc: "Primary supplier of combat apparel, load-bearing equipment, and tactical footwear across multiple battalions and air force divisions.",
                  status: "Active Supply Contract",
                },
                {
                  title: "Royal Bhutan Army",
                  desc: "Exclusive export partner for standard-issue uniforms and field gear, meeting international compliance standards for cross-border military supply.",
                  status: "Export Ready",
                },
                {
                  title: "Tender & Bulk Procurement",
                  desc: "Equipped to handle high-volume government tenders with rapid turnaround, quality assurance documentation, and MIL-SPEC compliance certification.",
                  status: "ISO Certified",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
                  className="bg-background p-6 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm text-foreground">{item.title}</h3>
                    <span className="font-display text-[10px] text-primary tabular">{item.status}</span>
                  </div>
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeritageSection;
