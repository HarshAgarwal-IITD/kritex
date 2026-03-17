import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const commitments = [
  {
    title: "Operational Readiness",
    desc: "Every product ships field-ready. No break-in period. Deployed on Day 1.",
  },
  {
    title: "Zero-Defect Manufacturing",
    desc: "Multi-stage quality inspection — raw material, in-process, and final QA before dispatch.",
  },
  {
    title: "Rapid Turnaround",
    desc: "Bulk orders fulfilled within 30–60 days. Emergency requisitions processed on priority.",
  },
  {
    title: "Complete Documentation",
    desc: "Full compliance paperwork — test reports, material certificates, export documentation.",
  },
];

const CommitmentSection = () => {
  return (
    <section className="py-20 md:py-32 border-t border-border bg-secondary/30">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="md:col-span-5"
          >
            <p className="font-display text-xs text-primary mb-3">Our Commitment</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Built for the
              <br />
              Harshest Conditions
            </h2>
            <p className="font-body text-muted-foreground text-sm leading-relaxed max-w-md">
              When lives depend on gear, there's no room for compromise. Every stitch, 
              every buckle, every sole is engineered to perform under extreme operational stress — 
              from the glaciers of Siachen to the jungles of the Northeast.
            </p>
          </motion.div>

          <div className="md:col-span-7 space-y-px">
            {commitments.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
                className="flex gap-4 p-6 bg-background border-b border-border last:border-b-0"
              >
                <CheckCircle2 size={18} className="text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-display text-xs text-foreground mb-1">{item.title}</h3>
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommitmentSection;
