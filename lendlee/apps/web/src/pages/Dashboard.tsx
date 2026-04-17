import { motion } from "framer-motion";
import { BookOpen, Plus, ArrowRight, Package, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-warm-white">
      <header className="bg-cream border-b border-border">
        <div className="container px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <span className="font-serif text-xl text-foreground">Lendlee</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-earth-light">
              Hello, {user?.name || "Friend"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-earth-light hover:text-destructive"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-12">
            <h1 className="text-3xl font-serif text-foreground mb-3">
              Your Lending Circle
            </h1>
            <p className="text-earth-light">
              Track what you share. Remember what matters.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <motion.div
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-cream border border-border cursor-pointer"
              onClick={() => navigate("/add-item")}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg text-foreground mb-2">Add an Item</h3>
              <p className="text-sm text-earth-light mb-4">
                Add a book or item you want to lend to someone.
              </p>
              <span className="inline-flex items-center text-primary text-sm font-medium">
                Get started <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-cream border border-border"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-serif text-lg text-foreground mb-2">My Items</h3>
              <p className="text-sm text-earth-light mb-4">
                View all your items and their lending status.
              </p>
              <span className="text-earth-light text-sm">Coming soon</span>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-cream border border-border"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg text-foreground mb-2">Active Loans</h3>
              <p className="text-sm text-earth-light mb-4">
                Items currently lent out to others.
              </p>
              <span className="text-earth-light text-sm">Coming soon</span>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-cream border border-border"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-serif text-lg text-foreground mb-2">History</h3>
              <p className="text-sm text-earth-light mb-4">
                Past loans and returns.
              </p>
              <span className="text-earth-light text-sm">Coming soon</span>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
