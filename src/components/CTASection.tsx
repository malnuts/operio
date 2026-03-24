import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section id="contact" className="relative py-32">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />

      <div className="container relative z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="font-mono text-xs text-primary tracking-widest uppercase">
            Join the Revolution
          </span>
          <h2 className="font-display text-4xl md:text-6xl font-bold mt-4 mb-6">
            Ready to transform{" "}
            <span className="gradient-text">dental education</span>?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            We're partnering with forward-thinking dental schools and institutions 
            to pilot Dentsim. Limited spots available for early access.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:hello@dentsim.ai"
              className="group flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-lg font-semibold text-primary-foreground transition-all hover:shadow-[0_0_40px_hsl(175_80%_50%/0.4)]"
            >
              Request a Demo
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="mailto:partnerships@dentsim.ai"
              className="flex items-center gap-2 rounded-lg border border-border px-8 py-3.5 text-lg font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-secondary"
            >
              Partner With Us
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
