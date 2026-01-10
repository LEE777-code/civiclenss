import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { SignInButton, useUser, useSignIn } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { setAuthState } from "@/services/authService";

const Login = () => {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const checkProfile = async () => {
      if (isSignedIn && user) {
        try {
          // Set auth state in localStorage
          setAuthState(user.id);

          const { data, error } = await supabase
            .from('users')
            .select('profile_completed')
            .eq('clerk_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error("Error checking profile:", error);
          }

          if (data?.profile_completed) {
            navigate("/home");
          } else {
            navigate("/edit-profile");
          }
        } catch (error) {
          console.error("Error in profile check:", error);
          navigate("/edit-profile");
        }
      }
    };

    checkProfile();
  }, [isSignedIn, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        // The useEffect will handle the redirect based on profile completion
      } else {
        console.error(JSON.stringify(result, null, 2));
        toast.error("Login failed");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      const errorMsg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Invalid email or password";
      toast.error(errorMsg);
    }
  };

  const handleGuestLogin = () => {
    navigate("/home");
  };

  return (
    <div className="mobile-container min-h-screen bg-background px-6 py-12 relative">

      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
          <Shield size={32} className="text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-primary">CivicLens</h1>
        <p className="text-muted-foreground mt-2">Your Community, Protected.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field pl-12"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field pl-12 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="text-right">
          <button type="button" className="text-primary text-sm font-medium">
            Forgot Password?
          </button>
        </div>

        <button type="submit" className="btn-primary">
          Login
        </button>


      </form>

      <div className="mt-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm">Or sign in with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <SignInButton mode="modal">
          <button type="button" className="w-full h-12 bg-card border border-input rounded-xl flex items-center justify-center gap-3 hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="font-medium">Continue with Google</span>
          </button>
        </SignInButton>
      </div>

      <p className="text-center mt-8 text-muted-foreground">
        Don't have an account?{" "}
        <button
          onClick={() => navigate("/signup")}
          className="text-primary font-semibold"
        >
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default Login;
