import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, BookOpen, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { loginSchema, type LoginFormData } from "@/schemas/auth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login, loginAsGuest, loading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch {
      // Error handled by store
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen gradient-sage flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-warm-white rounded-3xl shadow-soft p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-serif text-foreground mb-2">
              Welcome to Lendlee
            </h1>
            <p className="text-earth-light">
              Lend freely. Care deeply. Stay connected.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-earth">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={cn(
                  "mt-1.5 bg-cream border-border",
                  errors.email && "border-destructive"
                )}
                {...register("email")}
                onChange={(e) => {
                  register("email").onChange(e);
                  clearError();
                }}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-earth">
                Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn(
                    "bg-cream border-border pr-10",
                    errors.password && "border-destructive"
                  )}
                  {...register("password")}
                  onChange={(e) => {
                    register("password").onChange(e);
                    clearError();
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-light hover:text-earth transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-warm-white text-earth-light">
                  or
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGuestLogin}
              className="w-full mt-4 border-border text-earth hover:bg-cream"
            >
              Continue as Guest
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-earth-light">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
