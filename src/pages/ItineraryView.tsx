import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Calendar, Wallet, Cloud, Sun, CloudRain, Loader2,
  Download, MessageSquare, Send, Sparkles, Hotel, Utensils, Bus, Ticket,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import TripMap from "@/components/TripMap";
import ReactMarkdown from "react-markdown";

interface DayPlan {
  day: number;
  title: string;
  activities: { time: string; activity: string; location: string; lat?: number; lng?: number; tip?: string }[];
}

interface BudgetSplit {
  stay: number;
  food: number;
  travel: number;
  activities: number;
}

interface Trip {
  id: string;
  destination: string;
  budget: number;
  num_days: number;
  interests: string[];
  itinerary: { days: DayPlan[]; hiddenGems?: { name: string; description: string }[] };
  budget_split: BudgetSplit;
  status: string;
}

interface Weather {
  temp: number;
  description: string;
  icon: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ItineraryView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && user) fetchTrip();
  }, [id, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchTrip = async () => {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Trip not found");
    } else {
      const t = data as any;
      setTrip(t);
      fetchWeather(t.destination);
    }
    setLoading(false);
  };

  const fetchWeather = async (dest: string) => {
    try {
      const res = await supabase.functions.invoke("get-weather", {
        body: { destination: dest },
      });
      if (res.data) setWeather(res.data);
    } catch {
      // Weather is optional
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !trip) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await supabase.functions.invoke("chat-assistant", {
        body: {
          messages: newMessages,
          tripContext: {
            destination: trip.destination,
            budget: trip.budget,
            numDays: trip.num_days,
            interests: trip.interests,
            currentItinerary: trip.itinerary,
          },
        },
      });

      if (res.error) throw res.error;
      setChatMessages([...newMessages, { role: "assistant", content: res.data.reply }]);
    } catch (err: any) {
      toast.error("Chat failed");
    } finally {
      setChatLoading(false);
    }
  };

  const exportPDF = () => {
    if (!trip) return;
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(22);
    doc.text(`Trip to ${trip.destination}`, margin, y);
    y += 10;
    doc.setFontSize(11);
    doc.text(`${trip.num_days} days | Budget: $${trip.budget}`, margin, y);
    y += 10;
    doc.text(`Interests: ${trip.interests.join(", ")}`, margin, y);
    y += 15;

    if (trip.budget_split) {
      doc.setFontSize(14);
      doc.text("Budget Split", margin, y);
      y += 8;
      doc.setFontSize(10);
      const bs = trip.budget_split;
      doc.text(`Stay: $${bs.stay} | Food: $${bs.food} | Travel: $${bs.travel} | Activities: $${bs.activities}`, margin, y);
      y += 15;
    }

    if (trip.itinerary?.days) {
      for (const day of trip.itinerary.days) {
        if (y > 260) { doc.addPage(); y = margin; }
        doc.setFontSize(14);
        doc.text(`Day ${day.day}: ${day.title}`, margin, y);
        y += 8;
        doc.setFontSize(10);
        for (const act of day.activities) {
          if (y > 270) { doc.addPage(); y = margin; }
          doc.text(`${act.time} - ${act.activity} (${act.location})`, margin + 5, y);
          y += 6;
          if (act.tip) {
            doc.setTextColor(100, 100, 100);
            doc.text(`  Tip: ${act.tip}`, margin + 5, y);
            doc.setTextColor(0, 0, 0);
            y += 6;
          }
        }
        y += 5;
      }
    }

    doc.save(`wanderly-${trip.destination.replace(/\s+/g, "-")}.pdf`);
    toast.success("PDF exported!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Trip not found</p>
      </div>
    );
  }

  const budgetSplit = trip.budget_split;
  const budgetItems = budgetSplit ? [
    { label: "Stay", value: budgetSplit.stay, icon: Hotel, color: "text-travel-teal" },
    { label: "Food", value: budgetSplit.food, icon: Utensils, color: "text-travel-orange" },
    { label: "Travel", value: budgetSplit.travel, icon: Bus, color: "text-travel-sky" },
    { label: "Activities", value: budgetSplit.activities, icon: Ticket, color: "text-travel-coral" },
  ] : [];

  const allLocations = trip.itinerary?.days?.flatMap((d) =>
    d.activities.filter((a) => a.lat && a.lng).map((a) => ({ name: a.location, lat: a.lat!, lng: a.lng! }))
  ) || [];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              {trip.destination}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {trip.num_days} days</span>
              <span className="flex items-center gap-1"><Wallet className="h-4 w-4" /> ${trip.budget}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowChat(!showChat)}>
              <MessageSquare className="mr-2 h-4 w-4" /> AI Chat
            </Button>
            <Button className="rounded-xl" onClick={exportPDF}>
              <Download className="mr-2 h-4 w-4" /> Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weather */}
            {weather && (
              <Card className="glass border-border/50">
                <CardContent className="p-4 flex items-center gap-4">
                  {weather.description.toLowerCase().includes("rain") ? (
                    <CloudRain className="h-8 w-8 text-travel-sky" />
                  ) : weather.description.toLowerCase().includes("cloud") ? (
                    <Cloud className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <Sun className="h-8 w-8 text-travel-orange" />
                  )}
                  <div>
                    <p className="font-heading font-semibold">{Math.round(weather.temp)}°C</p>
                    <p className="text-sm text-muted-foreground capitalize">{weather.description}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Budget Split */}
            {budgetSplit && (
              <Card className="glass border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" /> Smart Budget Split
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {budgetItems.map((item) => (
                      <div key={item.label} className="text-center p-3 rounded-xl bg-muted/50">
                        <item.icon className={`h-6 w-6 mx-auto mb-2 ${item.color}`} />
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        <p className="font-heading font-bold text-lg">${item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Itinerary Timeline */}
            {trip.itinerary?.days?.map((day) => (
              <Card key={day.day} className="glass border-border/50 overflow-hidden">
                <div className="h-1 gradient-hero" />
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {day.day}
                    </span>
                    {day.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {day.activities.map((act, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                        {i < day.activities.length - 1 && <div className="w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-4 flex-1">
                        <p className="text-xs font-medium text-primary mb-0.5">{act.time}</p>
                        <p className="font-medium">{act.activity}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {act.location}
                        </p>
                        {act.tip && (
                          <p className="text-xs text-accent mt-1 italic">💡 {act.tip}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Hidden Gems */}
            {trip.itinerary?.hiddenGems && trip.itinerary.hiddenGems.length > 0 && (
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-accent" /> Hidden Gems
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trip.itinerary.hiddenGems.map((gem, i) => (
                    <div key={i} className="p-3 rounded-xl bg-accent/5 border border-accent/10">
                      <p className="font-medium">{gem.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{gem.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Map */}
            {allLocations.length > 0 && (
              <Card className="glass border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 rounded-xl overflow-hidden">
                    <TripMap locations={allLocations} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interests */}
            <Card className="glass border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Interests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {trip.interests.map((i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            {showChat && (
              <Card className="glass border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" /> AI Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 overflow-y-auto space-y-3 mb-3 pr-1">
                    {chatMessages.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        Ask me to modify your plan! e.g. "Make it cheaper" or "Add nightlife"
                      </p>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`text-sm p-2 rounded-lg ${msg.role === "user" ? "bg-primary/10 ml-4" : "bg-muted mr-4"}`}>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <Separator className="mb-3" />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask AI..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleChat()}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={handleChat} disabled={chatLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
