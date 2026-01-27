import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 py-20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">Professional Services Automation</span>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
          Run your MSP with
          <span className="block gradient-text">one powerful platform</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Unify ticketing, billing, projects, and CRM in a single platform designed for managed service providers.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button variant="hero" size="lg">
            Start Free Trial
            <ArrowRight className="ml-2" />
          </Button>
          <Button variant="glass" size="lg">
            <Play className="mr-2 w-4 h-4" />
            Watch Demo
          </Button>
        </div>

        {/* Dashboard Preview */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl opacity-50" />
          <div className="relative glass-card rounded-2xl p-2 glow-primary">
            <div className="bg-card rounded-xl overflow-hidden">
              {/* Mock dashboard header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-destructive/80" />
                <div className="w-3 h-3 rounded-full bg-accent/80" />
                <div className="w-3 h-3 rounded-full bg-primary/80" />
                <div className="flex-1 flex justify-center">
                  <div className="glass-card rounded px-4 py-1 text-xs text-muted-foreground">
                    halopsa.app/dashboard
                  </div>
                </div>
              </div>
              {/* Mock dashboard content */}
              <div className="p-6 grid grid-cols-4 gap-4">
                {/* Sidebar mock */}
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 bg-muted/50 rounded-lg" style={{ width: `${70 + Math.random() * 30}%` }} />
                  ))}
                </div>
                {/* Main content mock */}
                <div className="col-span-3 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {['147', '23', '98%'].map((stat, i) => (
                      <div key={i} className="glass-card rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold gradient-text">{stat}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {['Open Tickets', 'Due Today', 'SLA Met'][i]}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <div className="h-32 flex items-end gap-2">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-gradient-to-t from-primary to-accent rounded-t opacity-80"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
