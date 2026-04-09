import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, MapPin, Calendar, Wallet, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

const INTEREST_OPTIONS = [
  "Adventure", "Food", "Culture", "Nightlife", "Nature", "History",
  "Shopping", "Relaxation", "Photography", "Architecture", "Wildlife", "Beach",
];

export default function TripPlanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [numDays, setNumDays] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (interests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }

    setLoading(true);
    try {
      const res = await supabase.functions.invoke("generate-itinerary", {
        body: { destination, budget: Number(budget), numDays: Number(numDays), interests },
      });

      if (res.error) throw res.error;

      const { itinerary, budgetSplit } = res.data;

      const { data: trip, error: insertErr } = await supabase.from("trips").insert({
        user_id: user.id,
        destination,
        budget: Number(budget),
        num_days: Number(numDays),
        interests,
        itinerary,
        budget_split: budgetSplit,
        status: "planned",
      }).select().single();

      if (insertErr) throw insertErr;

      toast.success("Itinerary generated!");
      navigate(`/trip/${trip.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate itinerary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">Plan Your Trip</h1>
          <p className="text-muted-foreground">Fill in the details and let AI craft your perfect itinerary</p>
        </div>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="destination" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Destination
                </Label>
                <Input id="destination" placeholder="e.g., Tokyo, Japan" value={destination} onChange={(e) => setDestination(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" /> Budget (USD)
                  </Label>
                  <Input id="budget" type="number" min="100" placeholder="2000" value={budget} onChange={(e) => setBudget(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" /> Number of Days
                  </Label>
                  <Input id="days" type="number" min="1" max="30" placeholder="5" value={numDays} onChange={(e) => setNumDays(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <Badge
                      key={interest}
                      variant={interests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer transition-all hover:scale-105 px-3 py-1.5"
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-lg rounded-xl" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating with AI...
                  </>
                ) : (
                  <>
                    <Plane className="mr-2 h-5 w-5" /> Generate Itinerary
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
