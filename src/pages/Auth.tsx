import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plane, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Auth Page: Current auth state:", { hasUser: !!user, loading, initialized });
    
    if (user && initialized && !loading) {
      console.log("Auth Page: User detected and auth initialized, navigating to /dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, initialized, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submissions
    
    // Don't do anything if user is already logged in
    if (user) {
      navigate("/dashboard");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Welcome back!");
        // Redirection is handled by the useEffect watching the 'user' object
      } else {
        const { error } = await signUp(email, password, name);
        if (error) throw error;
        
        // Wait for session to appear (if auto-confirmed)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          toast.success("Account created! Redirecting...");
          // Redirection is handled by the useEffect watching the 'user' object
        } else {
          // Stay on signup page but show clear message
          toast.success("Account created! Please check your email for a verification link.");
          // Don't setIsLogin(true) to avoid "going back"
          // Maybe reset form?
          setEmail("");
          setPassword("");
          setName("");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0 gradient-hero opacity-10" />
      <Card className="w-full max-w-md glass border-border/50 relative z-10 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
            <Plane className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading">{isLogin ? "Welcome Back" : "Join Wanderly"}</CardTitle>
          <CardDescription>{isLogin ? "Sign in to access your trips" : "Create your account to start planning"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} className="pl-10" required />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" required minLength={6} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
