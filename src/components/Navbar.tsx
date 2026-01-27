import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-card border-b border-border/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-xl">HaloPSA</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Resources</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Company</a>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost">Sign In</Button>
            <Button variant="default">Start Free Trial</Button>
          </div>

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
