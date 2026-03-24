import { motion } from "framer-motion";
import { Brain, Hand, Eye, BarChart3 } from "lucide-react";
import hapticImage from "@/assets/haptic-device.jpg";
import xrImage from "@/assets/xr-training.jpg";
import aiImage from "@/assets/ai-assessment.jpg";

const features = [
  {
    icon: Brain,
    title: "AI-Driven Simulation Engine",
    description:
      "Our neural engine generates patient cases with infinite variation — anatomical anomalies, tissue responses, and real-time complications that adapt to each learner.",
    image: aiImage,
  },
  {
    icon: Hand,
    title: "Haptic Feedback System",
    description:
      "Feel the resistance of enamel, the give of dentin, the precision of canal navigation. Our haptic interface delivers sub-millimeter tactile accuracy.",
    image: hapticImage,
  },
  {
    icon: Eye,
    title: "Immersive XR Training",
    description:
      "Step into a fully realized operatory. Our mixed-reality environment provides spatial awareness and depth perception identical to clinical settings.",
    image: xrImage,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15 },
  }),
};

const FeaturesSection = () => {
  return (
    <section id="platform" className="relative py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="font-mono text-xs text-primary tracking-widest uppercase">
            Core Technology
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-6">
            Three pillars of{" "}
            <span className="gradient-text">next-gen training</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Each module works independently or in concert — creating the most advanced dental 
            simulation platform ever built.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              className="group relative rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30 hover:glow-box"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon size={20} />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
