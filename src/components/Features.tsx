import { Ticket, Users, Clock, BarChart3, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: Ticket,
    title: "Smart Ticketing",
    description: "AI-powered ticket routing and SLA management that keeps your team efficient and clients happy."
  },
  {
    icon: Users,
    title: "CRM & Contracts",
    description: "Manage client relationships, track assets, and handle contracts all in one unified view."
  },
  {
    icon: Clock,
    title: "Time Tracking",
    description: "Automatic time capture and approval workflows that ensure accurate billing every time."
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Real-time dashboards and custom reports to make data-driven decisions for your business."
  },
  {
    icon: Zap,
    title: "Automations",
    description: "Build powerful workflows without code. Automate repetitive tasks and focus on what matters."
  },
  {
    icon: Shield,
    title: "Security First",
    description: "Enterprise-grade security with SSO, 2FA, and granular permissions for complete control."
  }
];

const Features = () => {
  return (
    <section className="relative py-32 px-6">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <p className="text-accent font-semibold mb-4 tracking-wide uppercase text-sm">Features</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything you need to
            <span className="gradient-text"> scale your MSP</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Purpose-built tools that work together seamlessly, so your team can deliver exceptional service.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group glass-card rounded-2xl p-8 hover:bg-muted/30 transition-all duration-500 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
