import { motion } from "framer-motion";
import { Cpu, Database, Shield, Layers } from "lucide-react";

const techItems = [
  {
    icon: Cpu,
    title: "Neural Simulation Core",
    description: "Proprietary AI models trained on 500K+ dental procedures with real-time physics simulation.",
  },
  {
    icon: Database,
    title: "Adaptive Learning Engine",
    description: "ML-driven curriculum that identifies skill gaps and dynamically adjusts difficulty and case complexity.",
  },
  {
    icon: Shield,
    title: "Clinical Validation",
    description: "Peer-reviewed accuracy metrics validated against outcomes from 12 leading dental schools.",
  },
  {
    icon: Layers,
    title: "Multi-Modal Feedback",
    description: "Synchronized visual, haptic, and auditory feedback loops for complete procedural immersion.",
  },
];

const TechnologySection = () => {
  return (
    <section id="technology" className="relative py-32">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="font-mono text-xs text-primary tracking-widest uppercase">
              Under the Hood
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-6">
              Built on <span className="gradient-text">breakthrough</span> infrastructure
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Dentsim's architecture is purpose-built for medical-grade simulation — 
              combining real-time ray tracing, physics-based tissue modeling, and 
              reinforcement learning into a unified training OS.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {techItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:glow-box"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon size={18} />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1.5">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
