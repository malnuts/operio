const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-primary/10 ring-1 ring-primary/20">
              <img src="/favicon.svg" alt="Operio brand mark" className="h-5 w-5" />
            </div>
            <span className="font-display font-bold text-foreground">Operio</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#platform" className="hover:text-primary transition-colors">Procedures</a>
            <a href="#route-map" className="hover:text-primary transition-colors">Route Map</a>
            <a href="#terminology" className="hover:text-primary transition-colors">Terminology</a>
            <a href="#technology" className="hover:text-primary transition-colors">Technology</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Operio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
