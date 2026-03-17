import { motion } from "framer-motion";

const ContactSection = () => {
  return (
    <section id="contact" className="py-20 md:py-32 border-t border-border">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="md:col-span-5"
          >
            <p className="font-display text-xs text-primary mb-3">Contact</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Initiate Tender
              <br />
              Inquiry
            </h2>
            <p className="font-body text-muted-foreground text-sm leading-relaxed max-w-md mb-8">
              For procurement inquiries, technical datasheets, or bulk order quotations, 
              reach out to our defense supply team.
            </p>
            <div className="space-y-4">
              <div>
                <p className="font-display text-[10px] text-muted-foreground mb-1">Email</p>
                <p className="font-display text-sm text-foreground">procurement@kritex.in</p>
              </div>
              <div>
                <p className="font-display text-[10px] text-muted-foreground mb-1">Operations</p>
                <p className="font-display text-sm text-foreground">India · Bhutan</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
            className="md:col-span-7"
          >
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-display text-[10px] text-muted-foreground block mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full bg-secondary border border-border px-4 py-3 text-sm text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="font-display text-[10px] text-muted-foreground block mb-2">Organization</label>
                  <input
                    type="text"
                    className="w-full bg-secondary border border-border px-4 py-3 text-sm text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="Ministry / Unit"
                  />
                </div>
              </div>
              <div>
                <label className="font-display text-[10px] text-muted-foreground block mb-2">Email</label>
                <input
                  type="email"
                  className="w-full bg-secondary border border-border px-4 py-3 text-sm text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="official@gov.in"
                />
              </div>
              <div>
                <label className="font-display text-[10px] text-muted-foreground block mb-2">Requirements</label>
                <textarea
                  rows={4}
                  className="w-full bg-secondary border border-border px-4 py-3 text-sm text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Describe your procurement requirements, quantities, and timeline..."
                />
              </div>
              <button
                type="submit"
                className="font-display text-xs bg-primary text-primary-foreground px-8 py-3 hover:bg-primary/90 transition-colors duration-300 active:translate-y-px"
              >
                Submit Inquiry
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
