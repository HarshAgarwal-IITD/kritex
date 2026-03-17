import { motion } from "framer-motion";

const milestones = [
  { year: "1976", event: "Founded by Mr. Puranmal Agarwal as a dedicated supply store, outfitting local cantonments and regiments with essential gear." },
  { year: "1994", event: "Under the leadership of Mr. Hanuman Agarwal, operations expanded to become a premier wholesale supplier of tactical apparel and accessories." },
  { year: "2018", event: "Aditya Agarwal spearheaded modernization efforts, scaling the business to serve international defense forces, beginning with Bhutan." },
  { year: "2026", event: "Rebranded as Kritex. Delivering next-generation, precision-grade military supply engineered for global deployment." },
];

const TimelineSection = () => {
  return (
    <section id="timeline" className="py-20 md:py-32 border-t border-border">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="mb-16"
        >
          <p className="font-display text-xs text-primary mb-3">50 Years of Service</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Operational Timeline
          </h2>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-px" />

          <div className="space-y-8 md:space-y-0">
            {milestones.map((m, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
                  className={`relative md:flex md:items-start md:py-6 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  {/* Dot */}
                  <div className="absolute left-4 md:left-1/2 w-2 h-2 bg-primary -translate-x-1/2 top-1 md:top-8 z-10" />

                  {/* Content */}
                  <div className={`pl-10 md:pl-0 md:w-1/2 ${isLeft ? "md:pr-12 md:text-right" : "md:pl-12 md:text-left"}`}>
                    <p className="font-display text-2xl text-foreground tabular mb-1">{m.year}</p>
                    <p className="font-body text-sm text-muted-foreground leading-relaxed">{m.event}</p>
                  </div>

                  {/* Spacer for other side */}
                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
