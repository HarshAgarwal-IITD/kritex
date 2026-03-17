import { motion } from "framer-motion";

const stats = [
  { value: "50+", label: "Years of Service" },
  { value: "100%", label: "Tender Compliance" },
  { value: "Tier 1", label: "Supplier Status" },
  { value: "8+", label: "Forces Served" },
];

const StatsBar = () => {
  return (
    <section id="stats" className="border-b border-border">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
              className="py-8 md:py-12 px-6 border-r border-border last:border-r-0 text-center md:text-left"
            >
              <p className="font-display text-2xl md:text-3xl text-foreground tabular mb-1">
                {stat.value}
              </p>
              <p className="font-display text-[10px] text-muted-foreground">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
