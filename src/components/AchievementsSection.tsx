import { motion, AnimatePresence } from "framer-motion";
import { Award, FileCheck2, Shield, MapPin, CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useCallback } from "react";

/* ─── data ─────────────────────────────────────────────────────────────────── */
const achievements = [
  {
    id: "01",
    image: "/achievements/achievement01.jpeg",
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
    image: "/achievements/achievement02.jpeg",
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
  { value: "50+",   label: "Years of Operations" },
  { value: "2",     label: "Nations Served" },
  { value: "100K+", label: "Units Supplied" },
];

/* ─── slide variants ────────────────────────────────────────────────────────── */
const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

/* ─── component ────────────────────────────────────────────────────────────── */
const AchievementsSection = () => {
  const [[page, dir], setPage] = useState([0, 0]);
  const total = achievements.length;
  const active = ((page % total) + total) % total;
  const item = achievements[active];

  const paginate = useCallback((newDir: number) => {
    setPage(([p]) => [p + newDir, newDir]);
  }, []);

  return (
    <section
      id="achievements"
      className="py-16 md:py-32 border-t border-border bg-secondary/20 overflow-hidden"
    >
      <div className="container">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
          className="mb-10 md:mb-14"
        >
          <div className="flex items-center gap-3 mb-4">
            <Award size={13} className="text-primary" />
            <p className="font-display text-[10px] text-primary tracking-widest">
              Milestones &amp; Recognition
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-none">
              Landmark
              <br />
              <span className="text-primary">Achievements</span>
            </h2>

            {/* Dots + counter — top right */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {achievements.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage([i, i > active ? 1 : -1])}
                    className={`transition-all duration-300 rounded-full focus:outline-none ${
                      i === active
                        ? "w-6 h-1.5 bg-primary"
                        : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
              <span className="font-display text-[10px] text-muted-foreground tabular">
                {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Carousel ── */}
        <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
          className="border border-border w-full"
        >
          {/* ── Image ── */}
          <div className="relative w-full h-[90vw] min-h-[360px] max-h-[640px] sm:h-[600px] md:h-[700px] lg:h-[780px] overflow-hidden bg-background">
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.img
                key={`img-${page}`}
                src={item.image}
                alt={item.title}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
                style={{ objectPosition: item.objectPosition }}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            </AnimatePresence>

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/10 to-transparent pointer-events-none" />
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.035]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.8) 2px, rgba(255,255,255,0.8) 3px)",
              }}
            />

            {/* ID watermark */}
            <div className="absolute top-4 right-5 sm:top-8 sm:right-10 pointer-events-none select-none">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`id-${page}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="font-display text-7xl sm:text-9xl font-bold text-foreground/[0.06] tabular leading-none block"
                >
                  {item.id}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Tag badge */}
            <div className="absolute top-4 left-4 sm:top-7 sm:left-7">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`tag-${page}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.3 }}
                  className="inline-block font-display text-[9px] text-primary tracking-widest border border-primary/30 bg-primary/10 px-2.5 py-1 backdrop-blur-sm"
                >
                  {item.tag}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* ── Arrow buttons — bottom ends of the image ── */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex items-center justify-between pointer-events-none z-20">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => paginate(-1)}
                className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center
                           bg-background/80 backdrop-blur-md border border-white/10
                           hover:bg-background hover:border-primary/50 hover:text-primary
                           text-foreground transition-colors duration-200 focus:outline-none shadow-lg"
                aria-label="Previous slide"
              >
                <ChevronLeft size={18} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => paginate(1)}
                className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center
                           bg-background/80 backdrop-blur-md border border-white/10
                           hover:bg-background hover:border-primary/50 hover:text-primary
                           text-foreground transition-colors duration-200 focus:outline-none shadow-lg"
                aria-label="Next slide"
              >
                <ChevronRight size={18} />
              </motion.button>
            </div>

          </div>

          {/* ── Content strip ── */}
          <div className="bg-background border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-border">

              {/* Title + desc */}
              <div className="md:col-span-7 bg-background p-5 sm:p-6 md:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`content-${page}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
                  >
                    <h3 className="font-display text-sm sm:text-base md:text-lg text-foreground mb-1 leading-snug">
                      {item.title}
                    </h3>
                    <p className="font-display text-[10px] text-primary tabular mb-3">
                      {item.subtitle}
                    </p>
                    <p className="font-body text-xs text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Meta + stats */}
              <div className="md:col-span-5 bg-background p-5 sm:p-6 md:p-8 flex flex-col justify-between gap-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`meta-${page}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-wrap gap-x-5 gap-y-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin size={10} className="text-primary shrink-0" />
                      <span className="font-display text-[10px] text-muted-foreground tabular">
                        {item.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarCheck size={10} className="text-primary shrink-0" />
                      <span className="font-display text-[10px] text-muted-foreground tabular">
                        {item.year}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-px bg-border border border-border">
                  {stats.map((s, i) => (
                    <div key={i} className="bg-background px-3 py-3 flex flex-col gap-0.5">
                      <p className="font-display text-sm sm:text-base font-bold text-foreground tabular">
                        {s.value}
                      </p>
                      <p className="font-display text-[8px] text-muted-foreground tracking-widest leading-tight">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        </div>{/* end max-w-3xl */}

        {/* ── Gyalsung partner strip ── */}
        <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
          className="mt-px"
        >
          <div className="flex flex-row items-stretch gap-px bg-border border border-border border-t-0">
            <div className="flex-1 bg-background p-4 sm:p-6 flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-md scale-150" />
                <img
                  src="/logos/clients/gyalsung_logo.png"
                  alt="Gyalsung Logo"
                  className="relative h-9 w-9 sm:h-11 sm:w-11 object-contain drop-shadow-md"
                />
              </div>
              <div className="min-w-0">
                <p className="font-display text-[9px] text-muted-foreground tracking-widest mb-0.5">
                  Authorised Distributor
                </p>
                <p className="font-display text-[10px] sm:text-xs text-foreground truncate">
                  Gyalsung National Service — Kingdom of Bhutan
                </p>
              </div>
            </div>

            <div className="w-px bg-border" />

            <div className="bg-background px-4 sm:px-6 flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <div>
                <p className="font-display text-[9px] text-muted-foreground tracking-widest uppercase">
                  Active
                </p>
                <p className="font-display text-[9px] text-muted-foreground/50 tabular">
                  Since 2026
                </p>
              </div>
            </div>
          </div>
        </motion.div>
        </div>{/* end max-w-3xl */}

      </div>
    </section>
  );
};

export default AchievementsSection;
