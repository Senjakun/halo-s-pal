import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <section className="relative py-32 px-6">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-8">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm text-muted-foreground">Start your 14-day free trial</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          Ready to transform
          <span className="block gradient-text">your service delivery?</span>
        </h2>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Join thousands of MSPs who've streamlined their operations and grown their business with HaloPSA.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="hero" size="lg">
            Get Started Free
            <ArrowRight className="ml-2" />
          </Button>
          <Button variant="outline" size="lg">
            Talk to Sales
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          No credit card required • Free migration assistance • Cancel anytime
        </p>
      </div>
    </section>
  );
};

export default CTA;
