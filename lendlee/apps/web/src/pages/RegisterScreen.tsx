import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, BookOpen, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { registerSchema, type RegisterFormData } from "@/schemas/auth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function RegisterScreen() {
  const navigate = useNavigate();
  const { register: registerUser, loading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.email, data.password, data.name);
      navigate("/dashboard");
    } catch {
      // Error handled by store
    }
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
              Join Lendlee
            </h1>
            <p className="text-earth-light">
              Start sharing with your community.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-earth">
                Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                className={cn(
                  "mt-1.5 bg-cream border-border",
                  errors.name && "border-destructive"
                )}
                {...register("name")}
                onChange={(e) => {
                  register("name").onChange(e);
                  clearError();
                }}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

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
                  placeholder="Min 6 characters"
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

            <div>
              <Label htmlFor="confirmPassword" className="text-earth">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                className={cn(
                  "mt-1.5 bg-cream border-border",
                  errors.confirmPassword && "border-destructive"
                )}
                {...register("confirmPassword")}
                onChange={(e) => {
                  register("confirmPassword").onChange(e);
                  clearError();
                }}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.confirmPassword.message}
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
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-earth-light">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
