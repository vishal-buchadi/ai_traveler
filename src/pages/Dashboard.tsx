import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, MapPin, Calendar, Wallet, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Trip {
  id: string;
  destination: string;
  budget: number;
  num_days: number;
  interests: string[];
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchTrips();
  }, [user]);

  const fetchTrips = async () => {
    const { data, error } = await supabase
      .from("trips")
      .select("id, destination, budget, num_days, interests, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load trips");
    } else {
      setTrips(data || []);
    }
    setLoading(false);
  };

  const deleteTrip = async (id: string) => {
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete trip");
    } else {
      setTrips((prev) => prev.filter((t) => t.id !== id));
      toast.success("Trip deleted");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold">My Trips</h1>
            <p className="text-muted-foreground mt-1">Manage your travel plans</p>
          </div>
          <Link to="/planner">
            <Button className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" /> New Trip
            </Button>
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-20 w-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Plane className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-heading font-semibold mb-2">No trips yet</h2>
            <p className="text-muted-foreground mb-6">Plan your first AI-powered trip!</p>
            <Link to="/planner">
              <Button className="rounded-xl">Create Your First Trip</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card key={trip.id} className="glass border-border/50 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 overflow-hidden">
                <div className="h-2 gradient-hero" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {trip.destination}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(trip.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={trip.status === "planned" ? "default" : "secondary"} className="text-xs">
                      {trip.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {trip.num_days} days</span>
                    <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> ${trip.budget}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {trip.interests.slice(0, 3).map((i) => (
                      <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
                    ))}
                    {trip.interests.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{trip.interests.length - 3}</Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/trip/${trip.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full rounded-lg">View</Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => deleteTrip(trip.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
