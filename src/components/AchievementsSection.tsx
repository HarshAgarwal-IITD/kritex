import { motion, useInView } from "framer-motion";
import { Award, FileCheck2, Shield, MapPin, CalendarCheck } from "lucide-react";
import { useRef, useEffect, useState } from "react";

/* ─── data ─────────────────────────────────────────────────────────────────── */
const achievements = [
  {
    id: "01",
    image: "/achievement01.jpeg",
    objectPosition: "center 20%",
    title: "Gyalsung Contract Signing",
    subtitle: "Exclusive Distributor — Gyalsung, Bhutan",
    desc: "Kritex sealed a landmark contract with Gyalsung HQ, Bhutan, formalising our role as the exclusive authorised distributor for the Gyalsung National Service Programme. This milestone cements five decades of trusted cross-border supply partnerships.",
    tag: "Official Distributor",
    icon: FileCheck2,
    location: "Gyalsung HQ, Thimphu",
    year: "2026",
  },
  {
    id: "02",
    image: "/achievement02.jpeg",
    objectPosition: "center center",
    title: "Contract Review & Finalisation",
    subtitle: "Partnership Ratified — Gyalsung HQ, Thimphu",
    desc: "Senior representatives from both Kritex and Gyalsung HQ conducted a thorough review and final ratification of the distribution agreement, reinforcing Kritex's commitment to quality standards and long-term supply reliability for Bhutan's national service infrastructure.",
    tag: "Bilateral Agreement",
    icon: Shield,
    location: "Gyalsung HQ, Thimphu",
    year: "2026",
  },
];

const stats = [
  { value: 50, suffix: "+", label: "Years of Operations" },
  { value: 2, suffix: "", label: "Nations Served" },
  { value: 100, suffix: "K+", label: "Units Supplied" },
];

/* ─── animated counter ─────────────────────────────────────────────────────── */
function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1600;
    const step = 16;
    const increment = value / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular">
      {display}
      {suffix}
    </span>
  );
}

/* ─── component ────────────────────────────────────────────────────────────── */
const AchievementsSection = () => {
  const [active, setActive] = useState(0);

  return (
    <section id="achievements" className="py-20 md:py-32 border-t border-border bg-secondary/20 overflow-hidden">
      <div className="container">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-5">
            <Award size={13} className="text-primary" />
            <p className="font-display text-[10px] text-primary tracking-widest">
              Milestones &amp; Recognition
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-none">
                Landmark
                <br />
                <span className="text-primary">Achievements</span>
              </h2>
            </div>
            <div className="md:col-span-6">
              <p className="font-body text-muted-foreground text-sm leading-relaxed">
                Recognised partnerships that mark significant milestones in our
                cross-border defence supply operations. Kritex is a proud and
                authorised distributor for{" "}
                <span className="text-primary font-medium">Gyalsung, Bhutan</span>{" "}
                — supplying critical gear and apparel to Bhutan's National Service Programme.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
          className="grid grid-cols-3 gap-px bg-border mb-px"
        >
          {stats.map((s, i) => (
            <div key={i} className="bg-background px-6 py-5 flex flex-col gap-1">
              <p className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </p>
              <p className="font-display text-[9px] text-muted-foreground tracking-widest">
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* ── Main achievement viewer ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-border">

          {/* Left: tab selector */}
          <div className="lg:col-span-4 bg-background flex flex-col">
            {achievements.map((item, i) => (
              <motion.button
                key={item.id}
                onClick={() => setActive(i)}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.19, 1, 0.22, 1] }}
                className={`relative text-left p-6 md:p-8 border-b border-border transition-colors duration-300 group focus:outline-none ${
                  active === i ? "bg-secondary/40" : "hover:bg-secondary/20"
                }`}
              >
                {/* Active indicator bar */}
                <span
                  className={`absolute left-0 top-0 h-full w-0.5 bg-primary transition-all duration-300 ${
                    active === i ? "opacity-100" : "opacity-0"
                  }`}
                />

                <div className="flex items-start gap-4">
                  <span
                    className={`font-display text-[10px] tabular mt-0.5 transition-colors duration-300 ${
                      active === i ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {item.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`font-display text-[9px] tracking-widest tabular px-2 py-0.5 border transition-colors duration-300 ${
                          active === i
                            ? "text-primary border-primary/40 bg-primary/10"
                            : "text-muted-foreground border-border"
                        }`}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <h3
                      className={`font-display text-xs leading-snug mb-2 transition-colors duration-300 ${
                        active === i ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <MapPin size={9} className="text-muted-foreground" />
                        <span className="font-display text-[9px] text-muted-foreground tabular">
                          {item.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarCheck size={9} className="text-muted-foreground" />
                        <span className="font-display text-[9px] text-muted-foreground tabular">
                          {item.year}
                        </span>
                      </div>
                    </div>
                  </div>
                  <item.icon
                    size={14}
                    className={`shrink-0 mt-0.5 transition-colors duration-300 ${
                      active === i ? "text-primary" : "text-muted-foreground/40"
                    }`}
                  />
                </div>
              </motion.button>
            ))}

            {/* Bottom filler */}
            <div className="flex-1 p-6 md:p-8 flex items-end">
              <p className="font-display text-[9px] text-muted-foreground/40 tracking-widest leading-relaxed">
                CROSS-BORDER DEFENCE SUPPLY
                <br />
                OPERATIONS — EST. 1976
              </p>
            </div>
          </div>

          {/* Right: image panel */}
          <div className="lg:col-span-8 bg-background relative">
            {achievements.map((item, i) => (
              <motion.div
                key={item.id}
                animate={{ opacity: active === i ? 1 : 0, scale: active === i ? 1 : 1.02 }}
                transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
                className={`absolute inset-0 ${active === i ? "z-10 pointer-events-auto" : "z-0 pointer-events-none"}`}
              >
                {/* Image */}
                <div className="relative w-full h-80 sm:h-96 lg:h-full min-h-[380px] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{ objectPosition: item.objectPosition }}
                    className="w-full h-full object-cover"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/20 to-transparent" />

                  {/* Scanline texture */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.8) 2px, rgba(255,255,255,0.8) 3px)",
                    }}
                  />

                  {/* Large ID watermark */}
                  <div className="absolute top-4 right-5 sm:top-6 sm:right-8">
                    <span className="font-display text-7xl sm:text-8xl font-bold text-foreground/[0.06] tabular select-none leading-none">
                      {item.id}
                    </span>
                  </div>

                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <span className="inline-block font-display text-[9px] text-primary tracking-widest mb-3 border border-primary/30 bg-primary/10 px-2.5 py-1 backdrop-blur-sm">
                      {item.tag}
                    </span>
                    <h3 className="font-display text-lg sm:text-xl md:text-2xl text-foreground mb-2 leading-snug">
                      {item.title}
                    </h3>
                    <p className="font-display text-[10px] text-primary mb-4 tabular">
                      {item.subtitle}
                    </p>
                    <p className="font-body text-xs text-muted-foreground leading-relaxed max-w-lg">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Static height placeholder for the panel on mobile */}
            <div className="w-full h-80 sm:h-96 lg:h-[600px] xl:h-[680px] relative pointer-events-none" />
          </div>
        </div>

        {/* ── Gyalsung partner strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.19, 1, 0.22, 1] }}
          className="mt-px bg-background border-t border-border"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-px bg-border">

            {/* Logo + name block */}
            <div className="flex-1 bg-background p-6 md:p-8 flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-lg scale-150" />
                <img
                  src="/gyalsung_logo.png"
                  alt="Gyalsung Logo"
                  className="relative h-12 w-12 object-contain drop-shadow-md"
                />
              </div>
              <div>
                <p className="font-display text-[9px] text-muted-foreground tracking-widest mb-1">
                  Authorised Distributor
                </p>
                <p className="font-display text-xs text-foreground mb-0.5">
                  Gyalsung National Service
                </p>
                <p className="font-display text-[10px] text-primary tabular">
                  Kingdom of Bhutan
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px bg-border" />

            {/* Status block */}
            <div className="bg-background p-6 md:p-8 flex flex-col items-start sm:items-center justify-center gap-2 min-w-[180px]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <p className="font-display text-[9px] text-muted-foreground tracking-widest uppercase">
                  Active Partnership
                </p>
              </div>
              <p className="font-display text-[9px] text-muted-foreground/50 tabular tracking-widest">
                Since 2026
              </p>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default AchievementsSection;
