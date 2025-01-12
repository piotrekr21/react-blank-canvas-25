import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { AuthError } from "@supabase/supabase-js";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        // Verify profile exists
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session?.user.id)
          .maybeSingle();

        if (profileError) {
          toast({
            title: "Error",
            description: "There was an issue with your profile. Please contact support.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          return;
        }

        if (!profile) {
          // If profile doesn't exist, create it
          const { error: insertError } = await supabase
            .from("profiles")
            .insert([{ id: session.user.id, role: 'user' }]);

          if (insertError) {
            toast({
              title: "Error",
              description: "Failed to create user profile. Please contact support.",
              variant: "destructive",
            });
            await supabase.auth.signOut();
            return;
          }
        }

        navigate("/");
      } else if (event === "SIGNED_OUT") {
        navigate("/login");
      } else if (event === "USER_UPDATED" && !session) {
        setErrorMessage("Invalid login credentials. Please check your email and password.");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const getErrorMessage = (error: AuthError) => {
    switch (error.message) {
      case "Invalid login credentials":
        return "Invalid email or password. Please check your credentials and try again.";
      case "Email not confirmed":
        return "Please verify your email address before signing in.";
      default:
        return error.message;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or create a new account if you don't have one
          </p>
        </div>
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="light"
          providers={[]}
        />
      </div>
    </div>
  );
};

export default Login;