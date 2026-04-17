import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Image, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const itemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.enum(["book", "tool", "game", "gear", "other"]),
});

type ItemFormData = z.infer<typeof itemSchema>;

const categories = [
  { value: "book", label: "Book", icon: "📚" },
  { value: "tool", label: "Tool", icon: "🔧" },
  { value: "game", label: "Game", icon: "🎮" },
  { value: "gear", label: "Gear", icon: "🎒" },
  { value: "other", label: "Other", icon: "📦" },
] as const;

export default function AddItem() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      category: "book",
    },
  });

  const selectedCategory = watch("category");

  const handlePhotoCapture = () => {
    // TODO: Implement camera capture
    // For now, use a placeholder
    setPhoto("https://picsum.photos/400/300");
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
  };

  const onSubmit = async (data: ItemFormData) => {
    setLoading(true);
    try {
      // TODO: Save to backend
      console.log("Item data:", { ...data, photo });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate("/select-contact", {
        state: { item: { ...data, photo } },
      });
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white">
      <header className="bg-cream border-b border-border">
        <div className="container px-6 py-4">
          <h1 className="text-xl font-serif text-foreground">Add an Item</h1>
        </div>
      </header>

      <main className="container px-6 py-8 max-w-lg mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label className="text-earth mb-3 block">Photo</Label>
            {photo ? (
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={photo}
                  alt="Item"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handlePhotoCapture}
                  className="flex-1 h-32 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-earth-light hover:border-primary hover:text-primary transition-colors"
                >
                  <Camera className="w-8 h-8" />
                  <span className="text-sm">Take Photo</span>
                </button>
                <button
                  type="button"
                  onClick={handlePhotoCapture}
                  className="flex-1 h-32 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-earth-light hover:border-primary hover:text-primary transition-colors"
                >
                  <Image className="w-8 h-8" />
                  <span className="text-sm">Choose from Library</span>
                </button>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="title" className="text-earth">
              Title
            </Label>
            <Input
              id="title"
              placeholder="What are you lending?"
              className={cn(
                "mt-1.5 bg-cream border-border",
                errors.title && "border-destructive"
              )}
              {...register("title")}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label className="text-earth mb-3 block">Category</Label>
            <div className="grid grid-cols-5 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setValue("category", cat.value)}
                  className={cn(
                    "p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all",
                    selectedCategory === cat.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs text-earth-light">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
