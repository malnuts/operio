import { motion } from "framer-motion";
import { BookOpenText, FileText, ClipboardCheck } from "lucide-react";
import hapticImage from "@/assets/haptic-device.jpg";
import xrImage from "@/assets/xr-training.jpg";
import aiImage from "@/assets/ai-assessment.jpg";

const features = [
  {
    icon: BookOpenText,
    title: "Procedure-Based Learning",
    description:
      "Break down clinical work into chapters, explanations, visual references, and linked decision points so learners can revisit the full flow of a procedure.",
    image: aiImage,
  },
  {
    icon: FileText,
    title: "Clinical Posts And Cases",
    description:
      "Publish educational posts, case reflections, and practical writeups that extend learning beyond one procedure without losing clinical context.",
    image: hapticImage,
  },
  {
    icon: ClipboardCheck,
    title: "Contextual Assessment",
    description:
      "Use assessments as reinforcement inside the learning flow, with review routes that help learners revisit weak spots across procedures and posts.",
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
            Product Pillars
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-6">
            Three pillars of{" "}
            <span className="gradient-text">contextual clinical learning</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Operio starts with procedures, posts, and assessments so the platform can support one
            launch vertical now without hardwiring the product to a single specialty forever.
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
