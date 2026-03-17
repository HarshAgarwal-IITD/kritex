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
            <p className="font-display text-xs text-primary mb-3">Our Legacy</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Three Generations
              <br />
              of Reliability
            </h2>
            <p className="font-body text-muted-foreground text-sm leading-relaxed max-w-md">
              For 50 years, Kritex has stood as an unwavering partner to the tactical 
              frontlines of India and Bhutan. What began as a single supply store in 1976 has 
              been forged across three generations into a highly specialized manufacturing 
              and procurement operation, dedicated to outfitting the modern soldier without compromise.
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
                  desc: "A trusted supplier outfitting multiple battalions and air force divisions with resilient combat apparel, load-bearing equipment, and essential gear.",
                  status: "Wholesale & Retail",
                },
                {
                  title: "Royal Bhutan Army",
                  desc: "Dedicated export partner providing standard-issue uniforms and tactical field gear designed to endure challenging border environments.",
                  status: "Export Operations",
                },
                {
                  title: "Tender & Bulk Procurement",
                  desc: "Fully equipped to execute high-volume government and institutional tenders with stringent quality control and rapid manufacturing turnaround.",
                  status: "Bulk Capacity",
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
