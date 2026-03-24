const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="font-mono text-xs font-bold text-primary-foreground">D</span>
            </div>
            <span className="font-display font-bold text-foreground">Dentsim</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#platform" className="hover:text-primary transition-colors">Platform</a>
            <a href="#technology" className="hover:text-primary transition-colors">Technology</a>
            <a href="#impact" className="hover:text-primary transition-colors">Impact</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Dentsim. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
