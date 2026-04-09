import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plane, MapPin, Sparkles, Calendar, Wallet, Cloud } from "lucide-react";
import { useAuth } from "@/lib/auth";

const features = [
  { icon: Sparkles, title: "AI-Powered Itineraries", desc: "Get personalized day-wise plans tailored to your interests and budget" },
  { icon: Wallet, title: "Smart Budget Split", desc: "Auto-divide your budget across stay, food, travel, and activities" },
  { icon: Cloud, title: "Real-time Weather", desc: "See weather forecasts for your destination before you travel" },
  { icon: MapPin, title: "Interactive Maps", desc: "Visualize your itinerary on beautiful interactive maps" },
  { icon: Calendar, title: "Day-wise Planning", desc: "Detailed timeline view for each day of your trip" },
  { icon: Plane, title: "Hidden Gems", desc: "Discover off-the-beaten-path locations only locals know" },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" /> AI-Powered Travel Planning
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight mb-6">
            Plan Your Dream Trip<br />
            <span className="text-gradient">In Seconds</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Tell us your destination, budget, and interests. Our AI creates a personalized, day-by-day itinerary with smart budget splits, weather forecasts, and hidden gems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={user ? "/planner" : "/auth"}>
              <Button size="lg" className="text-lg px-8 h-14 rounded-xl shadow-lg shadow-primary/25">
                <Plane className="mr-2 h-5 w-5" /> Start Planning
              </Button>
            </Link>
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-xl">
                View My Trips
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Powerful features to make your travel planning effortless</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="gradient-hero rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-foreground/20" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mb-4">
                Ready to Explore?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto">
                Join thousands of travelers planning smarter trips with AI
              </p>
              <Link to={user ? "/planner" : "/auth"}>
                <Button size="lg" variant="secondary" className="text-lg px-8 h-14 rounded-xl font-semibold">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2026 Wanderly. AI-powered travel planning.</p>
        </div>
      </footer>
    </div>
  );
}
